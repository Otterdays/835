# api/_lib/
**Purpose:** Shared account, profile, forum, database, session, password, and rate-limit helpers. The underscore prefix prevents helper files from becoming Vercel functions.
**Keywords:** forum validation, request parsing, JSON, username, category, rate limit, thread, reply, Mongo, session, password, JWT

## Files
| File | What it does | Key symbols |
|---|---|---|
| `accounts.js` | Session user, profile initialization, safe account/profile response shaping | `requireUser()`, `accountOut()` |
| `profile-schema.js` | Fixed profile option lists and validation | `cleanProfileUpdate()`, `options()` |
| `forum.js` | Parses bounded JSON, validates names/text/categories, applies forum rate limits, and formats API responses | `readJson()`, `validateUsername()`, `cleanText()`, `consumeRateLimit()` |
| `mongo.js` | Connects to MongoDB and creates indexes | `getDb()`, `ensureIndexes()` |
| `rate-limit.js` | Tracks failed login attempts | `assertNotRateLimited()`, `recordFailedAttempt()` |
| `session.js` | Signs/verifies JWTs and formats session cookies | `createSessionToken()`, `verifySessionToken()` |
| `password.js` | Hashes and verifies passwords | `hashPassword()`, `verifyPassword()` |

## Connects to
- Account/profile helpers are used by `../auth/`, `../profile/`, and `../forum/` routes.
- `forum.js` is used by `../forum/` and account/profile routes.
- Persists rate counters using `./mongo.js` collections.
