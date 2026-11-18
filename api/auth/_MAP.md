# api/auth/
**Purpose:** HTTP handlers for sign-in, sign-out, and session status.
**Keywords:** auth, authentication, login, logout, session, sign in, cookie, credentials, user

## Files
| File | What it does | Key symbols |
|---|---|---|
| `login.js` | POST auth login route; checks user credentials, sets cookie, applies failed-login limits | `handler()`, `clientKey()` |
| `logout.js` | POST auth logout route; expires the session cookie | `handler()` |
| `me.js` | GET session status route; validates the cookie and returns the session user | `handler()` |

## Connects to
- `../lib/mongo.js` and `../lib/rate-limit.js` for login verification and attempt tracking.
- `../lib/session.js` for JWT and cookie behavior.
- `../lib/password.js` exists, not opened.
- Browser login entry and auth state: `../../js/auth.js`, `../../js/login-app.js`.
