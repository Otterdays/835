# api/
**Purpose:** Vercel Node routes for auth and the community forum, with shared MongoDB, session, account, profile, and validation helpers.
**Keywords:** API, endpoint, serverless, Vercel, backend, login, auth, forum, thread, reply, Mongo, database

## Files
| File | What it does | Key symbols |
|---|---|---|
| `auth/login.js` | Verifies credentials, rate limits attempts, sets a session cookie | `handler()` |
| `auth/logout.js` | Clears the session cookie | `handler()` |
| `auth/me.js` | Reports session status and safe account summary | `handler()` |
| `auth/register.js` | Reports signup availability and creates member accounts | `handler()` |
| `auth/password.js` | Changes the signed-in member password | `handler()` |
| `profile/index.js` | Serves fixed profile options, profile reads/edits, and member directory | `handler()` |
| `profile/comments.js` | Lists, creates, and deletes profile comments | `handler()` |
| `admin/index.js` | Admin-only account management (roles, titles, disable, password reset, audit log); 404 for everyone else | `handler()`, `requireAdmin()` |
| `forum/threads.js` | Lists/searches threads and creates account-authored threads | `handler()` |
| `forum/thread.js` | Loads a thread and replies, adds a signed-in reply, or deletes a post (author or admin) | `handler()` |
| `_lib/accounts.js` | Resolves sessions and shapes safe account/profile responses | `requireUser()`, `accountOut()` |
| `_lib/profile-schema.js` | Fixed profile options and validation | `cleanProfileUpdate()`, `options()` |
| `_lib/forum.js` | Request parsing, forum validation, rate limits, and response shaping | `readJson()`, `cleanText()`, `consumeRateLimit()` |
| `_lib/mongo.js` | Connects to MongoDB and creates indexes | `getDb()`, `ensureIndexes()` |
| `_lib/rate-limit.js` | Tracks failed login attempts | `assertNotRateLimited()`, `recordFailedAttempt()` |
| `_lib/session.js` | Signs/verifies JWTs and formats session cookies | `createSessionToken()`, `verifySessionToken()` |
| `_lib/password.js` | Hashes and verifies passwords | `hashPassword()`, `verifyPassword()` |

## Subfolders
- `auth/`: Login/session endpoints (see `auth/_MAP.md`).
- `forum/`: Thread and reply endpoints (see `forum/_MAP.md`).
- `profile/`: Member directory, profile, and comments endpoints (see `profile/_MAP.md`).
- `_lib/`: Shared account, forum, Mongo, session, password, and login-rate helpers; underscore prefix keeps them out of the serverless route count (see `_lib/_MAP.md`).

## Connects to
- Account/profile behavior is described in `../DOCS/ACCOUNTS.md`; management commands are in `../scripts/manage-user.js`.
- Runtime values are named in `../.env.example`; the database uses `MONGODB_URI` and `MONGODB_DB`, session signing uses `AUTH_SECRET`.
- Routes use the `mongodb` and `jose` packages from `../package.json`.
- Forum browser client: `../js/forum-app.js`.

## Vercel Hobby function cap
- Hobby deployments are limited to 12 Serverless Functions. Keep shared `.js` helpers under `_lib/`; do not add helper files under `api/` or ordinary subfolders where Vercel can count them as functions.
- Current endpoint count is 10 across `auth/`, `forum/`, `profile/`, and `admin/`; recount before adding a route.
