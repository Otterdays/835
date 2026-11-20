// [TRACE: LLM_INTEGRATION.md]
// Free-only OpenRouter catalog. The browser never decides what is free: every ask
// re-resolves the submitted model ID against this server-side list.
//
// Rules (fail closed):
//   - IDs must end in ":free" and both prompt and completion prices must be exactly zero.
//   - The model must accept text and return text, with a usable context window.
//   - Google models and Google providers are excluded.
//   - A model is "strict" only when OpenRouter's ZDR endpoint list has a zero-price,
//     text-capable endpoint with no safety retention. Strict models are routed with
//     provider.zdr + provider.only so no other provider can receive the prompt.
const forum = require('./forum');

const MODELS_URL = 'https://openrouter.ai/api/v1/models';
const ZDR_URL = 'https://openrouter.ai/api/v1/endpoints/zdr';
const CATALOG_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 15000;
const MIN_CONTEXT = 32768;
const GOOGLE_PROVIDERS = new Set(['google-vertex', 'google-ai-studio']);
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,40}$/;

let cache = null;
let pending = null;

function isConfigured() {
    const key = process.env.OPENROUTER_API_KEY;
    return Boolean(key && key.trim());
}

function allowNonZdr() {
    return process.env.LLM_ALLOW_NON_ZDR === '1';
}

function priceIsZero(value) {
    return (
        (typeof value === 'string' || typeof value === 'number') &&
        String(value).trim() !== '' &&
        Number(value) === 0
    );
}

function isFreeChatModel(model) {
    if (!model || typeof model.id !== 'string') {
        return false;
    }
    const id = model.id.trim();
    if (!id.endsWith(':free') || id.length > 160) {
        return false;
    }
    if (/^google\//i.test(id) || /embed|whisper/i.test(id)) {
        return false;
    }
    if (!priceIsZero(model.pricing && model.pricing.prompt) || !priceIsZero(model.pricing && model.pricing.completion)) {
        return false;
    }
    const architecture = model.architecture || {};
    const output = architecture.output_modalities;
    const input = architecture.input_modalities;
    if (!Array.isArray(output) || !output.includes('text')) {
        return false;
    }
    if (Array.isArray(input) && !input.includes('text')) {
        return false;
    }
    if (!(Number(model.context_length) >= MIN_CONTEXT)) {
        return false;
    }
    const params = Array.isArray(model.supported_parameters) ? model.supported_parameters : [];
    if (!params.includes('max_tokens') && !params.includes('max_completion_tokens')) {
        return false;
    }
    return true;
}

/** Map model_id -> verified ZDR provider slugs for that exact free variant. */
function zdrProvidersByModel(rows) {
    const map = new Map();
    for (const row of Array.isArray(rows) ? rows : []) {
        if (!row || typeof row.model_id !== 'string') {
            continue;
        }
        if (!priceIsZero(row.pricing && row.pricing.prompt) || !priceIsZero(row.pricing && row.pricing.completion)) {
            continue;
        }
        if (!(Number(row.context_length) >= MIN_CONTEXT) || row.safety_retention === true) {
            continue;
        }
        const slug = String(row.tag || '')
            .split('/')[0]
            .trim()
            .toLowerCase();
        if (!SLUG_PATTERN.test(slug) || GOOGLE_PROVIDERS.has(slug)) {
            continue;
        }
        const list = map.get(row.model_id) || [];
        if (!list.some((provider) => provider.slug === slug)) {
            list.push({ slug, label: String(row.provider_name || slug).trim().slice(0, 80) || slug });
        }
        map.set(row.model_id, list);
    }
    return map;
}

/** Pure catalog builder used by the live fetch and by tests. */
function buildCatalog(modelsData, zdrData) {
    const zdr = zdrProvidersByModel(zdrData);
    const models = (Array.isArray(modelsData) ? modelsData : [])
        .filter(isFreeChatModel)
        .map((model) => {
            const providers = zdr.get(model.id.trim()) || [];
            return {
                id: model.id.trim(),
                name: String(model.name || model.id).trim().slice(0, 120),
                contextLength: Number(model.context_length),
                strict: providers.length > 0,
                zdrProviders: providers
            };
        })
        .filter((model) => model.id && model.name)
        .sort((a, b) => {
            if (a.strict !== b.strict) {
                return a.strict ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });

    return {
        fetchedAt: Date.now(),
        models,
        counts: {
            free: models.length,
            strict: models.filter((model) => model.strict).length,
            nonZdr: models.filter((model) => !model.strict).length
        }
    };
}

async function fetchJson(url) {
    const headers = { Accept: 'application/json' };
    if (isConfigured()) {
        headers.Authorization = `Bearer ${process.env.OPENROUTER_API_KEY.trim()}`;
    }
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) {
        throw new Error(`OpenRouter catalog returned HTTP ${res.status}`);
    }
    const data = await res.json();
    if (!data || !Array.isArray(data.data)) {
        throw new Error('OpenRouter catalog response was not a list');
    }
    return data.data;
}

async function loadCatalog() {
    const [modelsData, zdrData] = await Promise.all([fetchJson(MODELS_URL), fetchJson(ZDR_URL)]);
    const catalog = buildCatalog(modelsData, zdrData);
    if (!catalog.models.length) {
        throw new Error('OpenRouter returned no eligible free chat models');
    }
    return catalog;
}

async function getCatalog({ force = false } = {}) {
    if (!force && cache && Date.now() - cache.fetchedAt < CATALOG_TTL_MS) {
        return cache;
    }
    if (pending) {
        return pending;
    }
    pending = loadCatalog()
        .then((catalog) => {
            cache = catalog;
            return catalog;
        })
        .catch((err) => {
            // Fail closed: never keep serving a stale allowlist after a failed refresh.
            cache = null;
            console.error('AI catalog unavailable', err.message);
            throw forum.httpError(503, 'The free model catalog is unavailable right now. Try again shortly.', 'ai_catalog');
        })
        .finally(() => {
            pending = null;
        });
    return pending;
}

function publicModel(model) {
    return {
        id: model.id,
        name: model.name,
        contextLength: model.contextLength,
        strict: model.strict,
        providers: model.strict ? model.zdrProviders.map((provider) => provider.label) : []
    };
}

/** Shape sent to the admin page. Never includes the key, raw catalog or paid entries. */
function catalogOut(catalog) {
    return {
        ok: true,
        fetchedAt: new Date(catalog.fetchedAt).toISOString(),
        counts: catalog.counts,
        models: catalog.models.map(publicModel)
    };
}

function resetCache() {
    cache = null;
    pending = null;
}

module.exports = {
    MODELS_URL,
    ZDR_URL,
    CATALOG_TTL_MS,
    MIN_CONTEXT,
    isConfigured,
    allowNonZdr,
    priceIsZero,
    isFreeChatModel,
    zdrProvidersByModel,
    buildCatalog,
    getCatalog,
    catalogOut,
    resetCache
};
