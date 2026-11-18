# api/
**Purpose:** Vercel Node routes for auth and the community forum, with shared MongoDB, session, and validation helpers.
**Keywords:** API, endpoint, serverless, Vercel, backend, login, auth, forum, thread, reply, Mongo, database

## Files
| File | What it does | Key symbols |
|---|---|---|
| `auth/login.js` | Accepts credentials, checks rate limits, verifies a user, and sets a session cookie | `handler()` |
| `auth/logout.js` | Clears the session cookie | `handler()` |
| `auth/me.js` | Reports whether the session cookie is valid | `handler()` |
| `forum/threads.js` | Lists/searches threads and creates new threads | `handler()` |
| `forum/thread.js` | Loads one thread with replies or adds a reply | `handler()` |
| `_lib/forum.js` | Shared forum request parsing, validation, rate limiting, and response shaping | `validateUsername()`, `cleanText()`, `consumeRateLimit()` |
| `lib/mongo.js` | Connects to MongoDB and creates collection indexes | `getDb()`, `ensureIndexes()` |
| `lib/rate-limit.js` | Tracks failed login attempts in MongoDB | `assertNotRateLimited()`, `recordFailedAttempt()`, `clearAttempts()` |
| `lib/session.js` | Signs/verifies JWTs and formats session cookies | `createSessionToken()`, `verifySessionToken()` |

## Subfolders
- `auth/`: Login/session endpoints (see `auth/_MAP.md`).
- `forum/`: Thread and reply endpoints (see `forum/_MAP.md`).
- `_lib/`: Shared forum route helpers (see `_lib/_MAP.md`).
- `lib/`: Mongo, session, and login-rate helpers (see `lib/_MAP.md`).

## Connects to
- Runtime values are named in `../.env.example`; the database uses `MONGODB_URI` and `MONGODB_DB`, session signing uses `AUTH_SECRET`.
- Routes use the `mongodb` and `jose` packages from `../package.json`.
- Forum browser client: `../js/forum-app.js`.
