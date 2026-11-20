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
    return forum.json(res, 200, {
        ok: true,
        configured: catalogLib.isConfigured(),
        allowNonZdr: catalogLib.allowNonZdr(),
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
    const started = Date.now();
    let result;
    try {
        result = await ai.askOpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY.trim(),
            model,
            messages: [{ role: 'system', content: context.system }, ...context.messages]
        });
    } catch (err) {
        await logUsage(admin.db, admin, {
            status: 'error',
            code: err.code || 'ai_unknown',
            httpStatus: err.status || 500,
            requestedModel: model.id,
            strict: model.strict,
            turns: messages.length,
            inputChars: messages.reduce((total, message) => total + message.content.length, 0),
            retrievedSources: context.sources.length,
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
        usage: result.usage,
        durationMs: result.durationMs
    });

    return forum.json(res, 200, {
        ok: true,
        answer: result.answer,
        model: result.model,
        sources: context.sources,
        sourceLinks: context.sourceLinks,
        articleLinks: context.articleLinks,
        usage: result.usage
    });
}

module.exports = {
    MAX_MESSAGES,
    MAX_USER_CHARS,
    MAX_ASSISTANT_CHARS,
    MAX_TOTAL_CHARS,
    normalizeMessages,
    resolveModel,
    status,
    ask
};
