# api/lib/
**Purpose:** Shared MongoDB, login-attempt, password-hash, and signed-session helpers for API routes.
**Keywords:** database, Mongo, connection, index, login attempts, rate limiting, JWT, cookie, session

## Files
| File | What it does | Key symbols |
|---|---|---|
| `password.js` | Hashes and verifies member passwords | `hashPassword()`, `verifyPassword()` |
| `mongo.js` | Reuses a Mongo connection and ensures indexes for users, login attempts, profiles, comments, and forum data | `getDb()`, `ensureIndexes()` |
| `rate-limit.js` | Counts failed login attempts and clears successful attempts | `assertNotRateLimited()`, `recordFailedAttempt()`, `clearAttempts()` |
| `session.js` | Creates/verifies JWT session tokens and reads/sets/clears cookies | `createSessionToken()`, `verifySessionToken()`, `readCookie()` |

## Connects to
- Used by `../auth/` and `../forum/` routes.
- Runtime configuration names are listed in `../../.env.example`.
