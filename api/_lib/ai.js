// [TRACE: LLM_INTEGRATION.md]
// The only code that talks to OpenRouter. The URL is fixed: no environment
// variable can redirect prompts or the API key to another host.
//
// One request, no streaming, no tools, no automatic retries, no model fallback.
// A free model is required; max_price of zero is defense in depth on top of the
// catalog check in ai-catalog.js.
const CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';
const AI_TIMEOUT_MS = 50000;
const MAX_OUTPUT_TOKENS = 1000;
const MAX_ANSWER_CHARS = 8000;
const GOOGLE_PROVIDERS = ['google-vertex', 'google-ai-studio'];

function aiError(status, code, message) {
    const err = new Error(message);
    err.status = status;
    err.code = code;
    return err;
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

function httpErrorFor(status, raw) {
    if (status === 401 || status === 403) {
        return aiError(502, 'ai_auth', 'The AI service rejected the server credentials. Ask the site owner to check the OpenRouter key.');
    }
    if (status === 402) {
        return aiError(503, 'ai_budget', 'The AI service reports no available free capacity. Try again later.');
    }
    if (status === 404) {
        return aiError(503, 'ai_model_unavailable', 'OpenRouter has no available provider route for this model right now. Refresh the free model list or choose another model.');
    }
    if (status === 429) {
        return aiError(429, 'ai_rate_limit', 'The free model is rate limited or its daily quota is exhausted. Try again later or choose another model.');
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
        throw httpErrorFor(res.status, raw);
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
    MAX_OUTPUT_TOKENS,
    MAX_ANSWER_CHARS,
    aiError,
    providerPreferences,
    buildRequestBody,
    cleanAnswer,
    usageOf,
    askOpenRouter
};
