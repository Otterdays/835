// [TRACE: LLM_INTEGRATION.md]
// The only code that talks to OpenRouter. The URL is fixed: no environment
// variable can redirect prompts or the API key to another host.
//
// One request, no streaming, no tools, no automatic retries, no model fallback.
// A free model is required; max_price of zero is defense in depth on top of the
// catalog check in ai-catalog.js.
const CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';
const KEY_URL = 'https://openrouter.ai/api/v1/key';
const AI_TIMEOUT_MS = 50000;
const KEY_TIMEOUT_MS = 8000;
const MAX_OUTPUT_TOKENS = 1000;
const MAX_ANSWER_CHARS = 8000;
const GOOGLE_PROVIDERS = ['google-vertex', 'google-ai-studio'];

function aiError(status, code, message) {
    const err = new Error(message);
    err.status = status;
    err.code = code;
    return err;
}

function boundedCount(value) {
    const number = Number(value);
    return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

function freeModelDailyRequestsOut(value) {
    const source = value && typeof value === 'object' ? value : {};
    const limit = boundedCount(source.limit);
    const used = boundedCount(source.used);
    const remaining = boundedCount(source.remaining);
    if (limit === null || used === null || remaining === null || remaining > limit) {
        return null;
    }
    return { limit, used, remaining };
}

/** Read only the current key's free-model daily counter; never return key metadata. */
async function getFreeModelDailyRequests(apiKey) {
    if (typeof apiKey !== 'string' || !apiKey.trim()) {
        return null;
    }
    try {
        const res = await fetch(KEY_URL, {
            headers: { Authorization: `Bearer ${apiKey.trim()}`, Accept: 'application/json' },
            signal: AbortSignal.timeout(KEY_TIMEOUT_MS)
        });
        if (!res.ok) {
            console.error('OpenRouter key usage lookup failed with HTTP', res.status);
            return null;
        }
        const payload = await res.json();
        return freeModelDailyRequestsOut(payload && payload.data && payload.data.free_model_daily_requests);
    } catch (err) {
        console.error('OpenRouter key usage lookup failed', err && err.name === 'TimeoutError' ? 'timeout' : 'network');
        return null;
    }
}

const RATE_LIMIT_SOURCES = new Set([
    'openrouter_free_tier_per_minute',
    'openrouter_free_tier_daily',
    'upstream_provider_shared_pool',
    'openrouter_in_flight_budget',
    'openrouter_key_limit',
    'openrouter_credits'
]);

function headerValue(headers, name) {
    if (headers && typeof headers.get === 'function') {
        return headers.get(name);
    }
    if (headers && typeof headers === 'object') {
        const key = Object.keys(headers).find((entry) => entry.toLowerCase() === name.toLowerCase());
        return key ? headers[key] : null;
    }
    return null;
}

function finiteNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
}

function resetDate(value) {
    const number = finiteNumber(value);
    if (number === null) return null;
    const timestamp = number < 100000000000 ? number * 1000 : number;
    return Number.isFinite(timestamp) && timestamp <= Date.now() + 366 * 24 * 60 * 60 * 1000 ? new Date(timestamp).toISOString() : null;
}

function retryAfterSeconds(value) {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    if (Number.isFinite(number) && number >= 0) return Math.min(Math.ceil(number), 86400);
    const timestamp = Date.parse(String(value));
    return Number.isFinite(timestamp) ? Math.min(Math.max(0, Math.ceil((timestamp - Date.now()) / 1000)), 86400) : null;
}

/** Extract only documented, non-sensitive rate diagnostics from an error response. */
function rateLimitInfo(status, raw, headers) {
    if (status !== 429 && status !== 402) return null;
    let payload = {};
    try { payload = JSON.parse(raw); } catch (_) { /* provider body is untrusted */ }
    const error = payload && payload.error && typeof payload.error === 'object' ? payload.error : {};
    const metadata = error.metadata && typeof error.metadata === 'object' ? error.metadata : {};
    const metaHeaders = metadata.headers && typeof metadata.headers === 'object' ? metadata.headers : {};
    const rawSource = typeof metadata.limit_source === 'string' ? metadata.limit_source : '';
    const info = {};
    if (RATE_LIMIT_SOURCES.has(rawSource)) info.source = rawSource;
    if (typeof metadata.provider_name === 'string') {
        const provider = metadata.provider_name.replace(/[^\w .()/-]/g, '').trim().slice(0, 80);
        if (provider) info.provider = provider;
    }
    const limit = finiteNumber(headerValue(headers, 'x-ratelimit-limit') ?? headerValue(metaHeaders, 'x-ratelimit-limit'));
    const remaining = finiteNumber(headerValue(headers, 'x-ratelimit-remaining') ?? headerValue(metaHeaders, 'x-ratelimit-remaining'));
    const reset = resetDate(headerValue(headers, 'x-ratelimit-reset') ?? headerValue(metaHeaders, 'x-ratelimit-reset'));
    const retry = retryAfterSeconds(headerValue(headers, 'retry-after') ?? headerValue(metaHeaders, 'retry-after'));
    if (limit !== null) info.limit = limit;
    if (remaining !== null) info.remaining = remaining;
    if (reset) info.resetAt = reset;
    if (retry !== null) info.retryAfterSeconds = retry;
    return Object.keys(info).length ? info : null;
}

function providerPreferences(model) {
    const prefs = {
        // Keep a paid provider from ever answering, even if a model were mislabeled.
        max_price: { prompt: '0', completion: '0', request: '0' },
        // Non-ZDR models are offered only after the UI's per-model warning and
        // the server's acceptNonZdr check. Let those providers serve the request;
        // otherwise OpenRouter can return 404 when every eligible endpoint is
        // filtered out by data_collection=deny.
        data_collection: model.strict ? 'deny' : 'allow',
        ignore: [...GOOGLE_PROVIDERS]
    };
    if (model.strict) {
        prefs.zdr = true;
        prefs.allow_fallbacks = false;
        prefs.only = model.zdrProviders.map((provider) => provider.slug);
    }
    return prefs;
}

/** Pure request builder (tested without a network call). */
function buildRequestBody(model, messages) {
    if (!model || typeof model.id !== 'string' || !model.id.endsWith(':free')) {
        throw aiError(400, 'ai_model', 'Only verified free models are allowed.');
    }
    if (!Array.isArray(messages) || !messages.length) {
        throw aiError(400, 'ai_messages', 'A question is required.');
    }
    return {
        model: model.id,
        messages: messages.map((message) => ({ role: message.role, content: message.content })),
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.2,
        stream: false,
        provider: providerPreferences(model)
    };
}

function textOf(content) {
    if (typeof content === 'string') {
        return content;
    }
    if (Array.isArray(content)) {
        return content
            .map((part) => (typeof part === 'string' ? part : part && typeof part.text === 'string' ? part.text : ''))
            .join('');
    }
    return '';
}

function cleanAnswer(text) {
    return String(text)
        .replace(/\r\n?/g, '\n')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .trim()
        .slice(0, MAX_ANSWER_CHARS);
}

function usageOf(value) {
    const usage = value && typeof value === 'object' ? value : {};
    const num = (input) => (Number.isFinite(Number(input)) && Number(input) >= 0 ? Number(input) : 0);
    return {
        prompt_tokens: num(usage.prompt_tokens),
        completion_tokens: num(usage.completion_tokens),
        total_tokens: num(usage.total_tokens)
    };
}

function httpErrorFor(status, raw, headers) {
    if (status === 401 || status === 403) {
        return aiError(502, 'ai_auth', 'The AI service rejected the server credentials. Ask the site owner to check the OpenRouter key.');
    }
    if (status === 402) {
        const err = aiError(503, 'ai_budget', 'OpenRouter reports no available free capacity or a key limit. Check the rate details below, then try again later.');
        err.rateLimit = rateLimitInfo(status, raw, headers);
        return err;
    }
    if (status === 404) {
        return aiError(503, 'ai_model_unavailable', 'OpenRouter has no available provider route for this model right now. Refresh the free model list or choose another model.');
    }
    if (status === 429) {
        const err = aiError(429, 'ai_rate_limit', 'OpenRouter rate limited this request. Check whether the limit is on your key or the selected provider below.');
        err.rateLimit = rateLimitInfo(status, raw, headers);
        return err;
    }
    if (status === 400 && /context|token|length|too large/i.test(String(raw))) {
        return aiError(400, 'ai_context', 'The conversation is too long for the selected model. Clear the conversation or shorten the question.');
    }
    if (status === 400) {
        return aiError(400, 'ai_request', 'The AI provider rejected the request. Shorten the conversation and try again.');
    }
    return aiError(502, 'ai_provider', 'The AI provider is unavailable right now. Try again shortly.');
}

async function askOpenRouter({ apiKey, model, messages }) {
    const body = buildRequestBody(model, messages);
    const started = Date.now();
    let res;
    try {
        res = await fetch(CHAT_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(AI_TIMEOUT_MS)
        });
    } catch (err) {
        if (err && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
            throw aiError(504, 'ai_timeout', 'The model took too long to answer. Try again.');
        }
        console.error('OpenRouter network failure', err && err.message);
        throw aiError(502, 'ai_network', 'Could not reach the AI service. Try again shortly.');
    }

    const raw = await res.text();
    if (!res.ok) {
        // Status only: never log or return a provider body that might echo a prompt.
        console.error('OpenRouter request failed with HTTP', res.status);
        throw httpErrorFor(res.status, raw, res.headers);
    }

    let data;
    try {
        data = JSON.parse(raw);
    } catch (err) {
        console.error('OpenRouter returned invalid JSON');
        throw aiError(502, 'ai_bad_response', 'The AI service returned an unreadable answer. Try again.');
    }

    const choice = data && Array.isArray(data.choices) ? data.choices[0] : null;
    const answer = cleanAnswer(textOf(choice && choice.message ? choice.message.content : choice && choice.text));
    if (!answer) {
        console.error('OpenRouter returned an empty answer');
        throw aiError(502, 'ai_empty', 'The model returned an empty answer. Try again or choose another model.');
    }

    return {
        answer,
        model: typeof data.model === 'string' && data.model.trim() ? data.model.trim().slice(0, 160) : model.id,
        usage: usageOf(data.usage),
        durationMs: Date.now() - started
    };
}

module.exports = {
    CHAT_URL,
    AI_TIMEOUT_MS,
    KEY_URL,
    KEY_TIMEOUT_MS,
    MAX_OUTPUT_TOKENS,
    MAX_ANSWER_CHARS,
    aiError,
    providerPreferences,
    buildRequestBody,
    cleanAnswer,
    usageOf,
    freeModelDailyRequestsOut,
    getFreeModelDailyRequests,
    rateLimitInfo,
    askOpenRouter
};
