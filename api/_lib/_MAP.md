# api/_lib/
**Purpose:** Shared helpers used by forum API routes; underscore prefix prevents this directory from becoming a separate Vercel function.
**Keywords:** forum validation, request parsing, JSON, username, category, rate limit, thread, reply

## Files
| File | What it does | Key symbols |
|---|---|---|
| `forum.js` | Parses bounded JSON, validates names/text/categories, applies forum rate limits, and formats API responses | `readJson()`, `validateUsername()`, `cleanText()`, `consumeRateLimit()` |

## Connects to
- Used by `../forum/threads.js` and `../forum/thread.js`.
- Persists rate counters using `../lib/mongo.js` collections.
