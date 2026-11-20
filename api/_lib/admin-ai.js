// [TRACE: LLM_INTEGRATION.md]
// Admin-only AI status and ask handlers, called from api/admin/index.js.
// The admin role and Origin check already ran before this module. Here we apply
// the AI-specific allowlist, single-shot provider call and metadata-only usage log.
const forum = require('./forum');
const catalogLib = require('./ai-catalog');
const contextLib = require('./ai-context');
const ai = require('./ai');

const MAX_MESSAGES = 8;
const MAX_USER_CHARS = 2000;
const MAX_ASSISTANT_CHARS = 4000;
// Keep the JSON body well under readJson's 20,000-byte cap even with heavy quoting.
const MAX_TOTAL_CHARS = 8000;
const LOG_RETENTION_DAYS = 365;
// Retry/fallback budget. Every attempt counts toward OpenRouter's free daily
// request quota, so stay small. The deadline stays under vercel.json maxDuration.
const MAX_ATTEMPTS = 3;
const ASK_DEADLINE_MS = 100000;
const MIN_ATTEMPT_MS = 8000;
const MAX_WAIT_SECONDS = 5;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Backup models for when the chosen one is busy, empty, or has no route.
 * Never widens privacy: a zero-retention pick falls back only to zero-retention
 * models. A non-ZDR pick (already confirmed by the admin) tries ZDR models first.
 * Larger context and reasoning-capable output caps are preferred.
 */
function fallbackCandidates(catalog, chosen, needChars) {
    const minContext = Math.ceil(needChars / 3) + 8000;
    return catalog.models
        .filter((entry) => entry.id !== chosen.id)
        .filter((entry) => (chosen.strict ? entry.strict : true))
        .filter((entry) => !(entry.contextLength < minContext))
        .filter((entry) => !(entry.maxCompletion && entry.maxCompletion < 4000))
        .sort((a, b) => (a.strict !== b.strict ? (a.strict ? -1 : 1) : b.contextLength - a.contextLength));
}

/** Try the chosen model, then backups, the way a resilient client would. */
async function askWithFallback({ apiKey, catalog, chosen, messages, needChars, allowFallback }) {
    const started = Date.now();
    const backups = allowFallback ? fallbackCandidates(catalog, chosen, needChars) : [];
    const attempts = [];
    let model = chosen;
    let maxTokens;
    let lastError = null;
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
        const left = ASK_DEADLINE_MS - (Date.now() - started);
        if (left < MIN_ATTEMPT_MS) break;
        try {
            const result = await ai.askOpenRouter({ apiKey, model, messages, maxTokens, timeoutMs: left });
            attempts.push({ model: model.id, outcome: 'ok' });
            return { ...result, attempts, answeredBy: model };
        } catch (err) {
            lastError = err;
            attempts.push({ model: model.id, outcome: err.code || 'error' });
            if (err.retry === 'bigger') {
                maxTokens = ai.RETRY_OUTPUT_TOKENS;
                continue;
            }
            if (err.retry === 'wait') {
                const wait = err.rateLimit && err.rateLimit.retryAfterSeconds;
                if (!(Number.isFinite(wait) && wait <= MAX_WAIT_SECONDS)) break;
                await sleep(Math.max(1, wait) * 1000);
                continue;
            }
            if (err.retry === 'next' && backups.length) {
                model = backups.shift();
                maxTokens = undefined;
                continue;
            }
            break;
        }
    }
    const err = lastError || ai.aiError(504, 'ai_timeout', 'The assistant ran out of time. Try again.');
    err.attempts = attempts;
    if (attempts.length > 1) {
        err.message = `${err.message} (Tried ${attempts.length} times${attempts.some((entry) => entry.model !== chosen.id) ? ' across free models' : ''}.)`;
    }
    throw err;
}

function cleanTurn(text) {
    return String(text)
        .replace(/\r\n?/g, '\n')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .trim();
}

/** Validate the browser-supplied conversation. Only user/assistant turns, bounded in size. */
function normalizeMessages(raw) {
    if (!Array.isArray(raw) || raw.length < 1) {
        throw forum.httpError(400, 'A question is required.', 'ai_messages');
    }
    if (raw.length > MAX_MESSAGES) {
        throw forum.httpError(400, 'The conversation is too long. Clear it and start again.', 'ai_turns');
    }
    const messages = [];
    let total = 0;
    for (const item of raw) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            throw forum.httpError(400, 'Invalid conversation turn.', 'ai_messages');
        }
        if (item.role !== 'user' && item.role !== 'assistant') {
            throw forum.httpError(400, 'Only user and assistant turns are allowed.', 'ai_messages');
        }
        if (typeof item.content !== 'string') {
            throw forum.httpError(400, 'Invalid conversation turn.', 'ai_messages');
        }
        const content = cleanTurn(item.content);
        if (!content) {
            throw forum.httpError(400, 'The question is empty.', 'ai_messages');
        }
        const max = item.role === 'user' ? MAX_USER_CHARS : MAX_ASSISTANT_CHARS;
        if (content.length > max) {
            throw forum.httpError(
                400,
                item.role === 'user'
                    ? `Questions must be ${MAX_USER_CHARS} characters or fewer.`
                    : 'The stored assistant reply is too long to resend. Clear the conversation and try again.',
                'ai_message_length'
            );
        }
        if (messages.length && messages[messages.length - 1].role === item.role) {
            throw forum.httpError(400, 'Conversation turns must alternate between user and assistant.', 'ai_messages');
        }
        total += content.length;
        if (total > MAX_TOTAL_CHARS) {
            throw forum.httpError(400, 'The conversation is too long. Clear it and start again.', 'ai_context');
        }
        messages.push({ role: item.role, content });
    }
    if (messages[messages.length - 1].role !== 'user') {
        throw forum.httpError(400, 'The last turn must be a question.', 'ai_messages');
    }
    return messages;
}

/** Server-side allowlist check. The browser cannot choose a paid or non-ZDR model by itself. */
function resolveModel(catalog, modelId, { allowNonZdr, acceptNonZdr }) {
    if (!catalog || !Array.isArray(catalog.models) || !catalog.models.length) {
        throw forum.httpError(503, 'The free model catalog is unavailable right now. Try again shortly.', 'ai_catalog');
    }
    const id = typeof modelId === 'string' ? modelId.trim() : '';
    if (!id || id.length > 160) {
        throw forum.httpError(400, 'Choose a free model first.', 'ai_model');
    }
    const model = catalog.models.find((entry) => entry.id === id);
    if (!model) {
        throw forum.httpError(400, 'That model is not in the current free-model list. Refresh the list and try again.', 'ai_model');
    }
    if (!model.strict) {
        if (!allowNonZdr) {
            throw forum.httpError(
                403,
                'That model is not verified for zero data retention. The server has not enabled other free models.',
                'ai_non_zdr'
            );
        }
        if (acceptNonZdr !== true) {
            throw forum.httpError(
                400,
                'Confirm the privacy notice for a model that may retain prompts before sending.',
                'ai_non_zdr_notice'
            );
        }
    }
    return model;
}

async function logUsage(db, admin, row) {
    try {
        await db.collection('admin_ai_log').insertOne({
            at: new Date(),
            admin: admin.username,
            expiresAt: new Date(Date.now() + LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000),
            ...row
        });
    } catch (err) {
        // Usage logging must never hide the real answer or the real error.
        console.error('AI usage log failed', err.message);
    }
}

async function status(admin, params, res) {
    const force = params.get('refresh') === '1';
    let catalog = null;
    let catalogError = null;
    try {
        catalog = await catalogLib.getCatalog({ force });
    } catch (err) {
        catalogError = err.message;
    }
    const freeModelDailyRequests = await ai.getFreeModelDailyRequests(process.env.OPENROUTER_API_KEY);
    return forum.json(res, 200, {
        ok: true,
        configured: catalogLib.isConfigured(),
        allowNonZdr: catalogLib.allowNonZdr(),
        freeModelDailyRequests,
        catalog: catalog ? catalogLib.catalogOut(catalog) : { ok: false, error: catalogError || 'The free model catalog is unavailable right now.' }
    });
}

async function ask(admin, body, res) {
    if (!catalogLib.isConfigured()) {
        throw forum.httpError(503, 'The AI assistant is not configured on the server.', 'ai_not_configured');
    }
    const messages = normalizeMessages(body.messages);
    const catalog = await catalogLib.getCatalog();
    const model = resolveModel(catalog, body.model, {
        allowNonZdr: catalogLib.allowNonZdr(),
        acceptNonZdr: body.acceptNonZdr
    });

    const context = contextLib.buildContext(messages);
    const outgoing = [{ role: 'system', content: context.system }, ...context.messages];
    const started = Date.now();
    let result;
    try {
        result = await askWithFallback({
            apiKey: process.env.OPENROUTER_API_KEY.trim(),
            catalog,
            chosen: model,
            messages: outgoing,
            needChars: outgoing.reduce((total, message) => total + message.content.length, 0),
            allowFallback: body.allowFallback !== false
        });
    } catch (err) {
        if (err && (err.status === 429 || err.status === 503 && err.code === 'ai_budget')) {
            err.freeModelDailyRequests = await ai.getFreeModelDailyRequests(process.env.OPENROUTER_API_KEY);
        }
        await logUsage(admin.db, admin, {
            status: 'error',
            code: err.code || 'ai_unknown',
            httpStatus: err.status || 500,
            requestedModel: model.id,
            strict: model.strict,
            turns: messages.length,
            inputChars: messages.reduce((total, message) => total + message.content.length, 0),
            retrievedSources: context.sources.length,
            attempts: err.attempts || [],
            durationMs: Date.now() - started
        });
        throw err;
    }

    await logUsage(admin.db, admin, {
        status: 'ok',
        requestedModel: model.id,
        actualModel: result.model,
        strict: model.strict,
        turns: messages.length,
        inputChars: messages.reduce((total, message) => total + message.content.length, 0),
        retrievedSources: context.sources.length,
        attempts: result.attempts,
        usage: result.usage,
        durationMs: Date.now() - started
    });

    return forum.json(res, 200, {
        ok: true,
        answer: result.answer,
        model: result.model,
        answeredBy: { id: result.answeredBy.id, name: result.answeredBy.name, strict: result.answeredBy.strict },
        fellBack: result.answeredBy.id !== model.id,
        attempts: result.attempts.length,
        sources: context.sources,
        sourceLinks: context.sourceLinks,
        articleLinks: context.articleLinks,
        usage: result.usage,
        freeModelDailyRequests: await ai.getFreeModelDailyRequests(process.env.OPENROUTER_API_KEY)
    });
}

module.exports = {
    MAX_MESSAGES,
    MAX_USER_CHARS,
    MAX_ASSISTANT_CHARS,
    MAX_TOTAL_CHARS,
    MAX_ATTEMPTS,
    fallbackCandidates,
    askWithFallback,
    normalizeMessages,
    resolveModel,
    status,
    ask
};
