# api/forum/
**Purpose:** Public Vercel endpoints for browsing, searching, creating, and replying to community threads.
**Keywords:** forum, board, discussion, thread, reply, post, search, category, username

## Files
| File | What it does | Key symbols |
|---|---|---|
| `threads.js` | GET lists/searches threads; POST creates a thread | `handler()` |
| `thread.js` | GET loads a thread and replies; POST adds a reply | `handler()` |

## Connects to
- Both routes use `../_lib/forum.js` for input checks, response helpers, and limits.
- Both routes use `../_lib/mongo.js` for forum collections.
- Browser UI: `../../js/forum-app.js`; collection/index notes: `../../DOCS/ARCHITECTURE.md`.
