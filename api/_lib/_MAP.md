# api/_lib/
**Purpose:** Shared account, profile, and forum helpers; underscore prefix prevents this directory from becoming a separate Vercel function.
**Keywords:** forum validation, request parsing, JSON, username, category, rate limit, thread, reply

## Files
| File | What it does | Key symbols |
|---|---|---|
| `accounts.js` | Session user, profile initialization, safe account/profile response shaping | `requireUser()`, `accountOut()` |
| `profile-schema.js` | Fixed profile option lists and validation | `cleanProfileUpdate()`, `options()` |
| `forum.js` | Parses bounded JSON, validates names/text/categories, applies forum rate limits, and formats API responses | `readJson()`, `validateUsername()`, `cleanText()`, `consumeRateLimit()` |

## Connects to
- Account/profile helpers are used by `../auth/`, `../profile/`, and `../forum/` routes.
- `forum.js` is used by `../forum/` and account/profile routes.
- Persists rate counters using `../lib/mongo.js` collections.
