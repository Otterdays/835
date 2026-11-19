# api/auth/
**Purpose:** HTTP handlers for sign-in, sign-out, session status, registration, and password changes.
**Keywords:** auth, authentication, login, logout, session, sign in, cookie, credentials, user

## Files
| File | What it does | Key symbols |
|---|---|---|
| `register.js` | GET sign-up config / POST create member account | `handler()` |
| `password.js` | Changes an authenticated account password | `handler()` |
| `login.js` | POST auth login route; checks user credentials, sets cookie, applies failed-login limits | `handler()`, `clientKey()` |
| `logout.js` | POST auth logout route; expires the session cookie | `handler()` |
| `me.js` | GET session status route; validates the cookie and returns the session user | `handler()` |

## Connects to
- `../_lib/mongo.js` and `../_lib/rate-limit.js` for login verification and attempt tracking.
- `../_lib/session.js` for JWT and cookie behavior.
- `../_lib/password.js` hashes and verifies member passwords.
- Browser login entry and auth state: `../../js/auth.js`, `../../js/signin-app.js`.
