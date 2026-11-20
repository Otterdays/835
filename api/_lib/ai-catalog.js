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
const ENDPOINTS_URL = (id) => `https://openrouter.ai/api/v1/models/${id.split('/').map(encodeURIComponent).join('/')}/endpoints`;
const HEALTH_TIMEOUT_MS = 6000;
const MAX_HEALTH_LOOKUPS = 40;
const ID_PATTERN = /^[\w.-]+\/[\w.:-]+$/;
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
    // Owner explicitly enabled all free-model choices; the UI requires a fresh
    // per-model warning confirmation before sending to a provider without ZDR.
    return process.env.LLM_ALLOW_NON_ZDR !== '0';
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
            const params = Array.isArray(model.supported_parameters) ? model.supported_parameters : [];
            const maxCompletion = Number(model.top_provider && model.top_provider.max_completion_tokens);
            return {
                id: model.id.trim(),
                name: String(model.name || model.id).trim().slice(0, 120),
                contextLength: Number(model.context_length),
                reasoning: params.includes('reasoning') || params.includes('include_reasoning'),
                maxCompletion: Number.isSafeInteger(maxCompletion) && maxCompletion > 0 ? maxCompletion : null,
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

function percent(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 && number <= 100 ? Math.round(number * 10) / 10 : null;
}

/** Pure: best live health among a model's free, non-Google endpoints. */
function healthFromEndpoints(endpoints) {
    const free = (Array.isArray(endpoints) ? endpoints : []).filter((endpoint) => {
        const slug = String((endpoint && endpoint.tag) || '').split('/')[0].toLowerCase();
        return endpoint
            && priceIsZero(endpoint.pricing && endpoint.pricing.prompt)
            && priceIsZero(endpoint.pricing && endpoint.pricing.completion)
            && !GOOGLE_PROVIDERS.has(slug);
    });
    if (!free.length) {
        return null;
    }
    const rows = free.map((endpoint) => ({
        status: Number.isFinite(Number(endpoint.status)) ? Number(endpoint.status) : 0,
        uptime5m: percent(endpoint.uptime_last_5m),
        uptime30m: percent(endpoint.uptime_last_30m),
        uptime1d: percent(endpoint.uptime_last_1d)
    }));
    const key = (row) => (row.uptime30m ?? row.uptime1d ?? -1);
    rows.sort((a, b) => key(b) - key(a));
    return rows[0];
}

/** Live uptime per free model, fail-soft: a missing value just means "unknown". */
async function attachHealth(catalog) {
    const targets = catalog.models.filter((model) => ID_PATTERN.test(model.id)).slice(0, MAX_HEALTH_LOOKUPS);
    await Promise.all(targets.map(async (model) => {
        try {
            const res = await fetch(ENDPOINTS_URL(model.id), {
                headers: { Accept: 'application/json' },
                signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS)
            });
            if (!res.ok) {
                return;
            }
            const data = await res.json();
            model.health = healthFromEndpoints(data && data.data && data.data.endpoints);
        } catch (err) {
            // Health is a ranking hint only; never fail the catalog over it.
        }
    }));
    return catalog;
}

async function loadCatalog() {
    const [modelsData, zdrData] = await Promise.all([fetchJson(MODELS_URL), fetchJson(ZDR_URL)]);
    const catalog = await attachHealth(buildCatalog(modelsData, zdrData));
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
        providers: model.strict ? model.zdrProviders.map((provider) => provider.label) : [],
        uptime30m: model.health ? model.health.uptime30m : null
    };
}

/** Shape sent to the admin page. Never includes the key, raw catalog or paid entries. */
function catalogOut(catalog, extra) {
    const add = typeof extra === 'function' ? extra : () => ({});
    return {
        ok: true,
        fetchedAt: new Date(catalog.fetchedAt).toISOString(),
        counts: catalog.counts,
        models: catalog.models.map((model) => ({ ...publicModel(model), ...add(model) }))
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
    healthFromEndpoints,
    getCatalog,
    catalogOut,
    resetCache
};
