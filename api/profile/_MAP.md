# api/profile/
**Purpose:** Authenticated member profile, directory, and comments wall endpoints.
**Keywords:** profile, member, directory, Top 8, comments, avatar, theme

## Files
| File | What it does | Key symbols |
|---|---|---|
| `index.js` | Returns profile options, reads/edits profiles, and searches visible directory entries | `handler()` |
| `comments.js` | Lists, creates, and deletes comments for visible profiles | `handler()` |

## Connects to
- Shared profile validation and account shaping: `../_lib/profile-schema.js`, `../_lib/accounts.js`.
- Account boundaries and data model: `../../DOCS/ACCOUNTS.md`.
- Browser pages: `../../profile.html`, `../../profile-edit.html`, `../../members.html`.
