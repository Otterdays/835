#!/usr/bin/env node
// [TRACE: LLM_INTEGRATION.md]
// Pure and mocked tests for the admin AI assistant. No live OpenRouter calls and
// no key is needed. Run `npm run build:ai-context` first when data.js changes.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
let failed = 0;

function ok(cond, msg) {
    try {
        assert.ok(cond, msg);
        console.log(`PASS  ${msg}`);
    } catch (err) {
        failed += 1;
        console.error(`FAIL  ${msg}`);
    }
}

function rejectsWith(fn, code, msg) {
    try {
        fn();
    } catch (err) {
        ok(err.code === code, `${msg} (got ${err.code || err.status || 'unknown'})`);
        return;
    }
    ok(false, msg);
}

async function rejectsWithAsync(fn, code, msg) {
    try {
        await fn();
    } catch (err) {
        ok(err.code === code, `${msg} (got ${err.code || err.status || 'unknown'})`);
        return;
    }
    ok(false, msg);
}

const catalogLib = require(path.join(root, 'api/_lib/ai-catalog.js'));
const ai = require(path.join(root, 'api/_lib/ai.js'));
const context = require(path.join(root, 'api/_lib/ai-context.js'));
const adminAi = require(path.join(root, 'api/_lib/admin-ai.js'));
const siteData = require(path.join(root, 'api/_lib/ai-site-data.json'));
const builder = require(path.join(root, 'scripts/build-ai-context.js'));

const baseModel = {
    id: 'test/model:free',
    name: 'Test Model (free)',
    pricing: { prompt: '0', completion: '0' },
    architecture: { input_modalities: ['text'], output_modalities: ['text'] },
    context_length: 131072,
    supported_parameters: ['max_tokens', 'temperature']
};

const baseZdr = {
    model_id: 'test/model:free',
    provider_name: 'Test Provider',
    tag: 'test-provider/fp8',
    context_length: 131072,
    pricing: { prompt: '0', completion: '0' },
    safety_retention: false
};

/* ---------- catalog filter ---------- */

ok(catalogLib.isFreeChatModel(baseModel), 'catalog: accepts a zero-price :free text model');
ok(!catalogLib.isFreeChatModel({ ...baseModel, id: 'test/model' }), 'catalog: rejects a zero-price model without :free');
ok(!catalogLib.isFreeChatModel({ ...baseModel, pricing: { prompt: '0.001', completion: '0' } }), 'catalog: rejects paid prompt pricing');
ok(!catalogLib.isFreeChatModel({ ...baseModel, pricing: { completion: '0' } }), 'catalog: rejects missing prompt pricing');
ok(!catalogLib.isFreeChatModel({ ...baseModel, id: 'google/gemma:free' }), 'catalog: rejects Google models');
ok(!catalogLib.isFreeChatModel({ ...baseModel, context_length: 4096 }), 'catalog: rejects a context window that cannot hold the prompt');
ok(!catalogLib.isFreeChatModel({ ...baseModel, architecture: { input_modalities: ['image'], output_modalities: ['text'] } }), 'catalog: rejects image-only input');
ok(!catalogLib.isFreeChatModel({ ...baseModel, architecture: { input_modalities: ['text'], output_modalities: ['audio'] } }), 'catalog: rejects non-text output');
ok(!catalogLib.isFreeChatModel({ ...baseModel, supported_parameters: ['temperature'] }), 'catalog: rejects a model without a token limit parameter');
ok(!catalogLib.isFreeChatModel({ ...baseModel, supported_parameters: undefined }), 'catalog: rejects a model with no capability list');
{
    const originalFlag = process.env.LLM_ALLOW_NON_ZDR;
    delete process.env.LLM_ALLOW_NON_ZDR;
    ok(catalogLib.allowNonZdr(), 'catalog: other free models are enabled by default per owner approval');
    process.env.LLM_ALLOW_NON_ZDR = '0';
    ok(!catalogLib.allowNonZdr(), 'catalog: server can disable non-ZDR models explicitly');
    if (originalFlag === undefined) delete process.env.LLM_ALLOW_NON_ZDR;
    else process.env.LLM_ALLOW_NON_ZDR = originalFlag;
}

const catalog = catalogLib.buildCatalog(
    [
        baseModel,
        { ...baseModel, id: 'other/model:free', name: 'Other Model (free)' },
        { ...baseModel, id: 'paid/model', pricing: { prompt: '1', completion: '1' } }
    ],
    [baseZdr]
);
const strictCatalogModel = catalog.models.find((model) => model.strict);
const otherCatalogModel = catalog.models.find((model) => !model.strict);
ok(Boolean(strictCatalogModel) && Boolean(otherCatalogModel), 'catalog: intersects models with verified ZDR endpoints');
ok(strictCatalogModel.zdrProviders[0].slug === 'test-provider', 'catalog: uses the provider tag as the routing slug');
ok(catalog.counts.strict === 1 && catalog.counts.nonZdr === 1, 'catalog: counts strict and non-ZDR models');

const noRetention = catalogLib.buildCatalog(
    [baseModel],
    [{ ...baseZdr, safety_retention: true }]
);
ok(noRetention.models[0].strict === false, 'catalog: safety-retention endpoints are not strict ZDR');

const googleProvider = catalogLib.buildCatalog([baseModel], [{ ...baseZdr, tag: 'google-vertex' }]);
ok(googleProvider.models[0].strict === false, 'catalog: Google providers are never ZDR candidates');

const duplicateProviders = catalogLib.buildCatalog(
    [baseModel],
    [baseZdr, { ...baseZdr, tag: 'test-provider/fp16', provider_name: 'Test Provider Two' }]
);
ok(duplicateProviders.models[0].zdrProviders.length === 1, 'catalog: deduplicates provider slugs');

/* ---------- request builder ---------- */

const strictModel = strictCatalogModel;
const otherModel = otherCatalogModel;
const strictBody = ai.buildRequestBody(strictModel, [{ role: 'user', content: 'hello' }]);
ok(strictBody.model === 'test/model:free' && strictBody.stream === false, 'request: pins the selected free model and disables streaming');
ok(strictBody.max_tokens === ai.MAX_OUTPUT_TOKENS && strictBody.max_tokens <= 1000, 'request: caps output tokens');
ok(strictBody.provider.zdr === true && strictBody.provider.allow_fallbacks === false, 'request: strict models require ZDR with no fallback');
ok(JSON.stringify(strictBody.provider.only) === JSON.stringify(['test-provider']), 'request: strict models use a provider allowlist');
ok(
    strictBody.provider.max_price.prompt === '0' &&
        strictBody.provider.max_price.completion === '0' &&
        strictBody.provider.max_price.request === '0',
    'request: enforces a zero maximum price'
);
ok(strictBody.provider.data_collection === 'deny', 'request: denies provider data collection');
ok(
    strictBody.provider.ignore.includes('google-vertex') && strictBody.provider.ignore.includes('google-ai-studio'),
    'request: ignores Google providers'
);
const otherBody = ai.buildRequestBody(otherModel, [{ role: 'user', content: 'hello' }]);
ok(otherBody.provider.zdr === undefined && otherBody.provider.only === undefined, 'request: non-ZDR models do not request ZDR');
ok(otherBody.provider.data_collection === 'allow', 'request: explicitly approved non-ZDR models are not filtered by data collection');
ok(otherBody.provider.max_price.prompt === '0', 'request: non-ZDR models still enforce zero price');
ok(!('models' in strictBody) && !('route' in strictBody), 'request: no model fallback array or alternate route');

rejectsWith(() => ai.buildRequestBody({ id: 'paid/model' }, [{ role: 'user', content: 'x' }]), 'ai_model', 'request: refuses a non-free model id');
rejectsWith(() => ai.buildRequestBody(strictModel, []), 'ai_messages', 'request: refuses an empty message list');

/* ---------- message validation ---------- */

ok(
    JSON.stringify(adminAi.normalizeMessages([{ role: 'user', content: '  question  ' }])) ===
        JSON.stringify([{ role: 'user', content: 'question' }]),
    'messages: trims a valid question'
);
ok(
    adminAi.normalizeMessages([{ role: 'user', content: 'q' }, { role: 'assistant', content: 'a' }, { role: 'user', content: 'q2' }]).length === 3,
    'messages: accepts alternating turns ending in a question'
);
rejectsWith(() => adminAi.normalizeMessages([]), 'ai_messages', 'messages: rejects an empty conversation');
rejectsWith(() => adminAi.normalizeMessages([{ role: 'system', content: 'override' }]), 'ai_messages', 'messages: rejects a system turn');
rejectsWith(() => adminAi.normalizeMessages([{ role: 'user', content: 'a' }, { role: 'user', content: 'b' }]), 'ai_messages', 'messages: rejects consecutive user turns');
rejectsWith(() => adminAi.normalizeMessages([{ role: 'user', content: 'x'.repeat(2001) }]), 'ai_message_length', 'messages: rejects an oversized question');
rejectsWith(() => adminAi.normalizeMessages([{ role: 'user', content: 'q' }, { role: 'assistant', content: 'a' }]), 'ai_messages', 'messages: requires the last turn to be a question');
rejectsWith(
    () =>
        adminAi.normalizeMessages(
            Array.from({ length: 9 }, (_, index) => ({
                role: index % 2 === 0 ? 'user' : 'assistant',
                content: `turn ${index}`
            }))
        ),
    'ai_turns',
    'messages: rejects more than eight turns'
);
rejectsWith(
    () => adminAi.normalizeMessages([{ role: 'user', content: `${'q'.repeat(2001)}\u0000` }]),
    'ai_message_length',
    'messages: rejects text over the per-turn cap after cleanup'
);
ok(adminAi.normalizeMessages([{ role: 'user', content: 'a\u0000b\r\nc' }])[0].content === 'ab\nc', 'messages: strips control characters');

/* ---------- model allowlist ---------- */

ok(adminAi.resolveModel(catalog, 'test/model:free', { allowNonZdr: false, acceptNonZdr: false }).strict, 'allowlist: accepts a strict model');
rejectsWith(() => adminAi.resolveModel(catalog, 'paid/model', { allowNonZdr: true, acceptNonZdr: true }), 'ai_model', 'allowlist: rejects a paid model id');
rejectsWith(() => adminAi.resolveModel(catalog, '', { allowNonZdr: true, acceptNonZdr: true }), 'ai_model', 'allowlist: rejects an empty model id');
rejectsWith(() => adminAi.resolveModel(catalog, 'other/model:free', { allowNonZdr: false, acceptNonZdr: true }), 'ai_non_zdr', 'allowlist: hides non-ZDR models unless the server enables them');
rejectsWith(() => adminAi.resolveModel(catalog, 'other/model:free', { allowNonZdr: true, acceptNonZdr: false }), 'ai_non_zdr_notice', 'allowlist: requires explicit non-ZDR consent');
ok(
    adminAi.resolveModel(catalog, 'other/model:free', { allowNonZdr: true, acceptNonZdr: true }).strict === false,
    'allowlist: accepts a non-ZDR model only with server permission and consent'
);
rejectsWith(() => adminAi.resolveModel({ models: [] }, 'test/model:free', {}), 'ai_catalog', 'allowlist: fails closed with an empty catalog');

/* ---------- provider responses ---------- */

const originalFetch = global.fetch;
let fetchCount = 0;
function mockFetch(response) {
    fetchCount = 0;
    global.fetch = async () => {
        fetchCount += 1;
        if (response instanceof Error) {
            throw response;
        }
        return {
            ok: response.ok,
            status: response.status,
            headers: { get: (name) => {
                const key = Object.keys(response.headers || {}).find((header) => header.toLowerCase() === name.toLowerCase());
                return key ? response.headers[key] : null;
            } },
            text: async () => response.body
        };
    };
}

async function providerTests() {
    const messages = [{ role: 'user', content: 'hello' }];

    mockFetch({ ok: true, status: 200, body: JSON.stringify({ model: 'test/model:free', choices: [{ message: { content: '  Answer.  ' } }], usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } }) });
    const success = await ai.askOpenRouter({ apiKey: 'sk-test', model: strictModel, messages });
    ok(success.answer === 'Answer.' && success.usage.total_tokens === 15, 'provider: returns the answer and usage');
    ok(fetchCount === 1, 'provider: sends exactly one request on success');

    mockFetch({ ok: false, status: 429, body: '{"error":"rate limited"}' });
    await rejectsWithAsync(() => ai.askOpenRouter({ apiKey: 'sk-test', model: strictModel, messages }), 'ai_rate_limit', 'provider: maps 429 to a visible quota error');
    ok(fetchCount === 1, 'provider: does not retry after 429');

    mockFetch({
        ok: false,
        status: 429,
        body: JSON.stringify({ error: { metadata: { limit_source: 'upstream_provider_shared_pool', provider_name: 'Test Provider' } } }),
        headers: { 'Retry-After': '12' }
    });
    let rateError;
    try {
        await ai.askOpenRouter({ apiKey: 'sk-test', model: strictModel, messages });
    } catch (err) {
        rateError = err;
    }
    ok(rateError && rateError.rateLimit.source === 'upstream_provider_shared_pool' && rateError.rateLimit.provider === 'Test Provider', 'provider: identifies upstream shared capacity separately');
    ok(rateError && rateError.rateLimit.retryAfterSeconds === 12, 'provider: parses Retry-After seconds');

    const originalForKey = global.fetch;
    global.fetch = async (url) => url === ai.KEY_URL
        ? { ok: true, status: 200, json: async () => ({ data: { free_model_daily_requests: { limit: 50, used: 4, remaining: 46 }, hash: 'private-hash' } }) }
        : { ok: false, status: 500 };
    const keyUsage = await ai.getFreeModelDailyRequests('sk-test');
    ok(keyUsage.used === 4 && keyUsage.remaining === 46 && !JSON.stringify(keyUsage).includes('private-hash'), 'key usage: returns only the validated daily free-request counter');
    ok(ai.freeModelDailyRequestsOut({ limit: 50, used: 4, remaining: 51 }) === null, 'key usage: rejects inconsistent counter values');
    global.fetch = originalForKey;

    mockFetch({ ok: false, status: 404, body: '{"error":"No endpoints found"}' });
    await rejectsWithAsync(() => ai.askOpenRouter({ apiKey: 'sk-test', model: otherModel, messages }), 'ai_model_unavailable', 'provider: maps missing routes to a clear unavailable message');

    mockFetch({ ok: false, status: 503, body: '{"error":"down"}' });
    await rejectsWithAsync(() => ai.askOpenRouter({ apiKey: 'sk-test', model: strictModel, messages }), 'ai_provider', 'provider: maps 5xx to unavailable');
    ok(fetchCount === 1, 'provider: does not retry after 5xx');

    mockFetch({ ok: false, status: 400, body: '{"error":{"message":"maximum context length exceeded"}}' });
    await rejectsWithAsync(() => ai.askOpenRouter({ apiKey: 'sk-test', model: strictModel, messages }), 'ai_context', 'provider: maps context overflow');

    mockFetch({ ok: true, status: 200, body: 'not json' });
    await rejectsWithAsync(() => ai.askOpenRouter({ apiKey: 'sk-test', model: strictModel, messages }), 'ai_bad_response', 'provider: rejects malformed JSON');

    mockFetch({ ok: true, status: 200, body: JSON.stringify({ choices: [{ message: { content: '' } }] }) });
    await rejectsWithAsync(() => ai.askOpenRouter({ apiKey: 'sk-test', model: strictModel, messages }), 'ai_empty', 'provider: rejects an empty answer');

    mockFetch(Object.assign(new Error('timed out'), { name: 'TimeoutError' }));
    await rejectsWithAsync(() => ai.askOpenRouter({ apiKey: 'sk-test', model: strictModel, messages }), 'ai_timeout', 'provider: maps a timeout');
    ok(fetchCount === 1, 'provider: does not retry after a timeout');

    global.fetch = originalFetch;
}

/* ---------- ask() integration with a fake DB and mocked catalog/provider ---------- */

async function askIntegrationTests() {
    const rows = new Map();
    const logRows = [];
    const fakeDb = {
        collection(name) {
            if (name === 'forum_rate') {
                return {
                    async deleteOne() {},
                    async findOneAndUpdate(filter) {
                        const prev = rows.get(filter.key) || 0;
                        const count = prev + 1;
                        rows.set(filter.key, count);
                        return { key: filter.key, count };
                    },
                    async findOne(filter) {
                        if (!rows.has(filter.key)) {
                            return null;
                        }
                        return { key: filter.key, count: rows.get(filter.key), expiresAt: new Date(Date.now() + 3600e3) };
                    }
                };
            }
            if (name === 'admin_ai_log') {
                return {
                    async insertOne(doc) {
                        logRows.push(doc);
                        return { acknowledged: true };
                    }
                };
            }
            return {};
        }
    };

    const makeRes = () => ({
        headers: {},
        statusCode: 0,
        setHeader(key, value) {
            this.headers[key] = value;
        },
        end(body) {
            this.body = body;
        }
    });

    const originalFetch = global.fetch;
    const originalKey = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = 'sk-or-v1-test';
    const catalogModels = [{ ...baseModel, id: 'integ/model:free', name: 'Integration Model (free)' }];
    const catalogZdr = [{ ...baseZdr, model_id: 'integ/model:free', tag: 'integ-provider', safety_retention: false }];
    let providerBody = null;
    const dailyCounter = { limit: 50, used: 3, remaining: 47 };
    catalogLib.resetCache();
    global.fetch = async (url, options) => {
        if (url === catalogLib.MODELS_URL) {
            return { ok: true, status: 200, json: async () => ({ data: catalogModels }) };
        }
        if (url === catalogLib.ZDR_URL) {
            return { ok: true, status: 200, json: async () => ({ data: catalogZdr }) };
        }
        if (url === ai.KEY_URL) {
            return { ok: true, status: 200, json: async () => ({ data: { free_model_daily_requests: dailyCounter, hash: 'must-not-leak', label: 'private' } }) };
        }
        providerBody = JSON.parse(options.body);
        return { ok: true, status: 200, text: async () => JSON.stringify({ model: 'integ/model:free', choices: [{ message: { content: 'Time bank rules apply.' } }] }) };
    };

    try {
        const admin = { username: 'testadmin', db: fakeDb };

        // status()
        const statusRes = makeRes();
        await adminAi.status(admin, new URLSearchParams('ai=1'), statusRes);
        const statusOut = JSON.parse(statusRes.body);
        ok(statusOut.ok && statusOut.catalog.ok, 'ask: status endpoint returns the catalog');
        ok(statusOut.catalog.models[0].id === 'integ/model:free' && statusOut.catalog.models[0].strict, 'ask: status catalog surfaces the strict free model');
        ok(statusOut.freeModelDailyRequests.remaining === 47 && !JSON.stringify(statusOut).includes('must-not-leak'), 'ask: status exposes only the current key daily request counter');
        ok(!('limits' in statusOut), 'ask: status does not report portal-level question caps');

        // ask()
        const askRes = makeRes();
        await adminAi.ask(admin, { model: 'integ/model:free', messages: [{ role: 'user', content: 'How do I get sick time?' }] }, askRes);
        const askOut = JSON.parse(askRes.body);
        ok(askOut.ok && askOut.answer === 'Time bank rules apply.', 'ask: returns the provider answer as text');
        ok(askOut.freeModelDailyRequests.remaining === 47, 'ask: refreshes OpenRouter daily counter after success');
        ok(providerBody && providerBody.provider.max_price.prompt === '0' && providerBody.provider.max_price.completion === '0', 'ask: outbound request enforces $0 price');
        ok(providerBody.provider.data_collection === 'deny', 'ask: outbound request denies data collection');
        ok(providerBody.provider.zdr === true && providerBody.provider.only[0] === 'integ-provider', 'ask: strict model routed through verified ZDR provider only');
        ok(providerBody.provider.ignore.includes('google-vertex') && providerBody.provider.ignore.includes('google-ai-studio'), 'ask: outbound request ignores Google providers');
        ok(Array.isArray(askOut.sources), 'ask: response includes source citations');
        ok(Array.isArray(askOut.sourceLinks) && askOut.sourceLinks.every((source) => source.href), 'ask: source citations include page links');
        ok(Array.isArray(askOut.articleLinks) && askOut.articleLinks.some((article) => article.href.startsWith('contract.html?article=')), 'ask: article index includes deep links');
        ok(rows.size === 0, 'ask: does not consume a portal-level question quota');
        ok(logRows.length === 1, 'ask: writes one usage row');
        ok(logRows[0].admin === 'testadmin' && logRows[0].status === 'ok' && logRows[0].actualModel === 'integ/model:free', 'ask: usage log records who/status/model');
        ok(!logRows[0].question && !logRows[0].answer && !logRows[0].apiKey, 'ask: usage log has no prompt, answer or key');
        ok(new Date(logRows[0].expiresAt).getTime() > Date.now(), 'ask: usage log row is TTL-dated');
    } finally {
        global.fetch = originalFetch;
        catalogLib.resetCache();
        if (originalKey === undefined) {
            delete process.env.OPENROUTER_API_KEY;
        } else {
            process.env.OPENROUTER_API_KEY = originalKey;
        }
    }
}

/* ---------- site context ---------- */

async function contextTests() {
    ok(builder.sourceHash() === siteData.sourceHash, 'context: ai-site-data.json is current (run npm run build:ai-context)');
    ok(siteData.chunks.every((chunk) => chunk.id && chunk.citation && chunk.href && chunk.text), 'context: every chunk has an id, citation, href and text');
    ok(siteData.chunks.every((chunk) => chunk.href !== 'updates.html'), 'context: no updates.html body chunks');
    ok(!JSON.stringify(siteData).includes('Roster: added facility trades'), 'context: excluded updates.html roster text is absent');
    const text = siteData.chunks.map((chunk) => chunk.text.toLowerCase()).join('\n');
    const directory = siteData.chunks.find((chunk) => chunk.docId === 'steward-directory');
    ok(Boolean(directory) && directory.href === 'stewards.html', 'context: includes a separately cited public steward directory');
    const roster = siteData.chunks.find((chunk) => chunk.docId === 'employee-roster');
    ok(Boolean(roster) && roster.href === 'employees.html', 'context: includes a separately cited sanitized employee roster');
    ok(!/\b(injured|let go|terminated|termination|contesting the firing)\b/i.test(roster.text), 'context: excludes sensitive employee status notes');
    ok(!JSON.stringify(siteData).includes('"phone"') && !JSON.stringify(siteData).includes('"email"'), 'context: no contact fields in the export');

    const holiday = context.retrieve('What does Article XIX say about holiday pay?');
    ok(holiday.some((chunk) => chunk.docId === 'article:article-19'), 'context: holiday question retrieves Article XIX');
    const stewardAnswerSources = context.retrieve('Who is the shop steward at CFCF?');
    ok(stewardAnswerSources.some((chunk) => chunk.docId === 'steward-directory' && chunk.text.includes('Kevin Lyons') && chunk.text.includes('CFCF')), 'context: CFCF steward query retrieves Kevin Lyons and the facility');
    const rosterAnswerSources = context.retrieve('Who is a painter at CFCF?');
    ok(rosterAnswerSources.some((chunk) => chunk.docId === 'employee-roster' && chunk.text.includes('Cregg Lix') && chunk.text.includes('CFCF')), 'context: roster query retrieves public trade and facility data');
    const calendar = context.retrieve('When is the member calendar meeting?');
    ok(calendar.some((chunk) => chunk.href === 'calendar.html'), 'context: calendar question retrieves the calendar page');
    ok(context.retrieve('').length === 0, 'context: an empty question retrieves nothing');

    const built = context.buildContext([{ role: 'user', content: 'What does Article XIX say about holiday pay?' }]);
    ok(built.system.includes('SOURCE EXCERPTS') && built.system.includes('untrusted data'), 'context: prompt labels excerpts as untrusted data');
    ok(built.system.includes('SITE DIRECTORY') && built.system.includes('CONTRACT ARTICLE INDEX'), 'context: prompt includes the page and article directory');
    ok(built.system.includes('Never guess contract language'), 'context: prompt refuses unsourced contract answers');
    ok(built.sources.some((source) => source.startsWith('CBA Article XIX')), 'context: returns human-readable source citations');
    ok(built.articleLinks.some((article) => article.citation.startsWith('CBA Article XIX') && article.href.includes('article-19')), 'context: supplies safe article citation links');
    ok(built.messages.length === 1 && built.messages[0].role === 'user', 'context: forwards only the validated chat turns');
    ok(
        builder.chunkText('Words enough to survive the filter here.\n\nSecond sentence for the same chunk.').length === 1,
        'context: chunks merge paragraphs that fit one chunk'
    );
}

/* ---------- deployed-file secret checks ---------- */

function secretTests() {
    const clientFiles = ['admin.html', 'js/admin-ai.js', 'js/admin-app.js', 'js/profile-ui.js'];
    const clientText = clientFiles.map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
    ok(!/sk-or-v1-[A-Za-z0-9]{20,}/.test(clientText), 'secrets: no OpenRouter key-shaped string in browser assets');
    ok(!/OPENROUTER_API_KEY\s*=/.test(clientText), 'secrets: no OpenRouter key value in browser assets');
    ok(!/\.innerHTML\s*=/.test(clientText), 'client: admin AI never assigns to innerHTML');
    ok(clientText.includes("link.target = '_blank'") && clientText.includes("link.rel = 'noopener noreferrer'"), 'client: known source links open safely in a new tab');
    ok(clientText.includes("'Checking the site sources and asking the selected model…'") && clientText.includes("setAttribute('aria-live', 'polite')"), 'client: shows accessible progress while a question is running');
    const adminHtml = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
    ok(adminHtml.includes('js/admin-ai.js') && adminHtml.includes('id="adm-ai"'), 'client: admin page loads the AI panel');
    const adminApi = fs.readFileSync(path.join(root, 'api/admin/index.js'), 'utf8');
    ok(adminApi.includes('adminAi.status') && adminApi.includes('adminAi.ask'), 'api: admin function wires AI status and ask');
    const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
    ok(vercel.functions && vercel.functions['api/admin/index.js'] && vercel.functions['api/admin/index.js'].maxDuration === 60, 'deploy: admin function allows the AI timeout');
    ok(JSON.stringify(vercel.headers).includes('js/admin-ai.js'), 'deploy: AI client is served uncached and noindex');
    const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
    ok(/^OPENROUTER_API_KEY=\s*$/m.test(envExample), 'deploy: .env.example documents a blank OpenRouter key');
}

(async () => {
    await providerTests();
    await askIntegrationTests();
    await contextTests();
    secretTests();
    console.log(failed ? `\n${failed} AI check(s) failed` : '\nAll AI checks passed');
    process.exit(failed ? 1 : 0);
})().catch((err) => {
    console.error('AI test suite crashed', err);
    process.exit(1);
});
