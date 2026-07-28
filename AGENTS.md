# AGENTS.md

Agent entrypoint for **Operating Engineers Local 835** State Road member portal.

## Before coding

Read in order: `DOCS/SUMMARY.md` → `DOCS/SBOM.md` → `DOCS/SCRATCHPAD.md` → `DOCS/STYLE_GUIDE.md`.

Update `DOCS/SCRATCHPAD.md` (and SBOM on dep changes) during work. Never delete DOCS content — append or annotate only. Every DOCS file keeps the preservation header.

## Stack

Vanilla HTML / CSS / JS front end. Production target: **private** Vercel deploy + MongoDB auth. Local static serve (`npm run dev` / `launch.bat`) uses gitignored `local.auth.json` fallback only.

## Folder map

| Path | Role |
|------|------|
| `index.html` | Login landing |
| `home.html` | State Road gateway |
| `member-action.html` | Grievance prep / issue→article / steward prep |
| `evidence-log.html` | In-memory evidence export (V/R/A/Q/L) |
| `bargaining.html` | Factual bargaining checklists |
| `member-documents.html` | Summaries only — **no** `source/` downloads |
| `api/auth/*` | login / logout / me |
| `middleware.js` | Protects HTML + `data.js` + `images/` on Vercel |
| `source/` | Offline drafts — **excluded from deploy** |
| `scripts/seed-user.js` | Create Mongo users |
| `tests/smoke.js` | Smoke checks |

## Auth

- Prefer `/api/auth/*` + HttpOnly cookie (`jose` HS256) + Mongo `users` / `login_attempts`
- Local fallback: `local.auth.json` (gitignored) on localhost only
- Env: see `.env.example` (`MONGODB_URI`, `MONGODB_DB`, `AUTH_SECRET`)
- Checklist: `DOCS/debugs/debug_2026-07-28_security-checklist.md`

## Conventions

- Conventional Commits: `feat|fix|docs|refactor|chore|test`
- Trace comments: `// [TRACE: filename.md]` when linking code to docs
- Fail fast at I/O / async boundaries; no silent catches
- Accountability content: document decisions/impacts; label V/R/A/Q/L; no personal attacks
