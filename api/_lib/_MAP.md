# api/_lib/
**Purpose:** Shared account, profile, forum, database, session, password, and rate-limit helpers. The underscore prefix prevents helper files from becoming Vercel functions.
**Keywords:** forum validation, request parsing, JSON, username, category, rate limit, thread, reply, Mongo, session, password, JWT

## Files
| File | What it does | Key symbols |
|---|---|---|
| `accounts.js` | Session user, profile initialization, safe account/profile response shaping | `requireUser()`, `accountOut()` |
| `profile-schema.js` | Fixed profile option lists and validation | `cleanProfileUpdate()`, `options()` |
| `forum.js` | Parses bounded JSON, validates names/text/categories, applies forum rate limits, attaches machine-readable error `code`s, and formats API responses | `readJson()`, `validateUsername()`, `cleanText()`, `consumeRateLimit()`, `peekRateLimit()` |
| `mongo.js` | Connects to MongoDB and creates indexes, including `admin_ai_log` (TTL) | `getDb()`, `ensureIndexes()` |
| `rate-limit.js` | Tracks failed login attempts | `assertNotRateLimited()`, `recordFailedAttempt()` |
| `session.js` | Signs/verifies JWTs and formats session cookies | `createSessionToken()`, `verifySessionToken()` |
| `password.js` | Hashes and verifies passwords | `hashPassword()`, `verifyPassword()` |
| `ai-catalog.js` | Free-only OpenRouter model catalog (`/models` + `/endpoints/zdr`) with strict-ZDR detection and caching | `getCatalog()`, `isFreeChatModel()`, `zdrProvidersByModel()`, `buildCatalog()`, `catalogOut()` |
| `ai-context.js` | Retrieval over `ai-site-data.json`: page directory + contract article index + top excerpts | `retrieve()`, `buildContext()` |
| `ai.js` | Single-shot OpenRouter chat-completions client (fixed URL, timeout, error mapping) | `askOpenRouter()`, `buildRequestBody()`, `providerPreferences()`, `cleanAnswer()` |
| `admin-ai.js` | AI assistant status + ask (quotas, server-side allowlist, metadata-only log) | `status()`, `ask()`, `normalizeMessages()`, `resolveModel()` |
| `ai-site-data.json` | Generated site knowledge export (no rosters/stewards/updates text); regenerate with `npm run build:ai-context` | — |

## Connects to
- Account/profile helpers are used by `../auth/`, `../profile/`, and `../forum/` routes.
- `forum.js` is used by `../forum/` and account/profile routes.
- `ai-*.js`/`admin-ai.js` are used by `../admin/index.js` only.
- The site export is built from `../../data.js` and the selected HTML pages by `../../scripts/build-ai-context.js`.
- Persists rate counters and `admin_ai_log` using `./mongo.js` collections.
