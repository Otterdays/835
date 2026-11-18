# api/lib/
**Purpose:** Shared MongoDB, login-attempt, and signed-session helpers for API routes.
**Keywords:** database, Mongo, connection, index, login attempts, rate limiting, JWT, cookie, session

## Files
| File | What it does | Key symbols |
|---|---|---|
| `mongo.js` | Reuses a Mongo connection and ensures indexes for users, login attempts, and forum data | `getDb()`, `ensureIndexes()` |
| `rate-limit.js` | Counts failed login attempts and clears successful attempts | `assertNotRateLimited()`, `recordFailedAttempt()`, `clearAttempts()` |
| `session.js` | Creates/verifies JWT session tokens and reads/sets/clears cookies | `createSessionToken()`, `verifySessionToken()`, `readCookie()` |
| `password.js` | Exists, not opened | — |

## Connects to
- Used by `../auth/` and `../forum/` routes.
- Runtime configuration names are listed in `../../.env.example`.
