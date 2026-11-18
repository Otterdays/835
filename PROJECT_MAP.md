# Project Map: Operating Engineers Local 835
Last mapped: 2026-11-17 · commit 94c31bc · by Codex (GPT-6)

## What this is
This is a private, static HTML/CSS/JavaScript member portal for Operating Engineers Local 835 State Road members. It includes contract and scan search, member tools, rosters, a community forum, and Vercel API routes backed by MongoDB. Shared browser behavior lives in `js/`; the server routes and Mongo helpers live in `api/`.

## How to run
- `npm run dev` — static local preview on port 3000.
- `launch.bat` — Windows static preview.
- `npm run vercel:dev` — local Vercel runtime with API routes.
- `npm run seed:user` — seed an API user; requires Mongo settings.
- `npm run test:smoke` — page, asset, search, and forum checks.
- `npm run check:deploy` — deploy-exclusion and auth wiring checks.

## Layout
| Folder | What lives there | Map |
|---|---|---|
| `DOCS/` | Project overview, workflow, architecture, and audits | `DOCS/_MAP.md` |
| `api/` | Vercel auth and community-forum endpoints | `api/_MAP.md` |
| `js/` | Browser auth, shared shell/search, and page behavior | `js/_MAP.md` |
| `images/` | 19 CBA and tool-policy scans/icons; individual images omitted | — |
| `scripts/` | User seeding and deployment checks; see Files below | — |
| `source/` | Offline Word/Markdown working drafts, excluded from deploy | — |
| `tests/` | Smoke checks; see Files below | — |

## Quick lookup
| Looking for… | Go to |
|---|---|
| where the main member pages and resources are | `home.html`, `index.html`, and the page files below |
| how to add a new member page | Add a root HTML page, then connect shared nav in `js/nav-config.js` and search in `js/site-search.js` as needed |
| where shared navigation groups and page IDs live | `js/nav-config.js` → `SITE_NAV`, `SITE_PAGE_IDS` |
| where the slide-out menu and breadcrumbs render | `js/shell.js` |
| how to add a new navigation destination | `js/nav-config.js` → `SITE_NAV`, `SITE_PAGE_IDS` |
| how sitewide search builds and routes results | `js/site-search.js` |
| how to add a page to sitewide search | Add a curated entry in `js/site-search.js` and verify its destination |
| where contract text and scan metadata are stored | `data.js` → `contractData`, `cbaScannedPages`, `toolProgramScans` |
| how to add a CBA scan and transcription | Follow `DOCS/CONTRACT_PAGE_INGESTION.md`; update `images/`, `data.js`, search, and dated update links |
| where CBA article display and filtering work | `contract.html` + `js/contract-app.js`; source text is in `data.js` |
| where CBA page images are browsed | `scans.html` + `js/scans-app.js` + `js/paneled-archive.js` |
| how to add a tool-policy scan | Add the image and `toolProgramScans` entry in `data.js`; see `tool-program.html` |
| where tool-policy archive behavior lives | `tool-program.html` + `js/tool-app.js` + `js/paneled-archive.js` |
| where shop steward contacts are maintained | `data.js` → `shopStewards`; display/filter in `js/stewards-app.js` |
| where employee roster data is maintained | `data.js` → `employeesData`; display/filter in `js/employees-app.js` |
| how to add a steward or roster entry | Add it to `shopStewards` or `employeesData` in `data.js` |
| where member grievance preparation lives | `member-action.html` + `js/member-action-app.js` |
| where evidence entries are stored and exported | `evidence-log.html` + `js/evidence-log-app.js` (in memory only) |
| where bargaining checklists and copy language live | `bargaining.html` + `js/bargaining-app.js` |
| where member suggestions are saved/shared | `suggestions.html` + `js/suggestions-app.js` (browser storage/share/copy) |
| where forum threads and replies are handled | `api/forum/` (see `api/forum/_MAP.md`) and `js/forum-app.js` |
| how to add a forum endpoint | Add a Vercel route under `api/forum/`, reuse `api/_lib/forum.js`, and update `tests/smoke.js` when behavior changes |
| how to add an API endpoint | Add a route under `api/`; shared database/session helpers are in `api/lib/` |
| where Mongo connection and indexes are configured | `api/lib/mongo.js` → `getDb()`, `ensureIndexes()` |
| where session cookies and JWT behavior live | `api/lib/session.js` |
| where login, logout, and session lookup routes live | `api/auth/` (see `api/auth/_MAP.md`) |
| where Vercel request routing is configured | `vercel.json` and `middleware.js` |
| where production setup and deploy safety are documented | `live-setup.md`, `.env.example`, `DOCS/debugs/` |
| how to add a runtime environment setting | Document its name in `.env.example` and update the deploy/setup docs |
| where smoke and deploy checks are defined | `tests/smoke.js`, `scripts/check-deploy.js` |
| how to add a user to MongoDB | `scripts/seed-user.js` (see `package.json` script `seed:user`) |
| where page-level and shared visual styles live | `style.css`, `forum.css` |
| which local drafts are excluded from deployment | `source/` and `.vercelignore` |

## Files (root and folders without their own map)
| File | What it does |
|---|---|
| `.env.example` | Environment variable names and local auth-mode example; contains placeholders only |
| `.gitignore` | Excludes local credentials, dependencies, and generated files from Git |
| `.vercelignore` | Keeps offline drafts, docs, setup files, and local config out of deployment |
| `AGENTS.md` | Shared agent rules and project workflow |
| `CLAUDE.md` | Imports `AGENTS.md` for Claude Code |
| `README.md` | Project description, features, and local run instructions |
| `package.json` | Dependencies and `npm` scripts |
| `package-lock.json` | Locked npm dependency tree |
| `vercel.json` | Vercel API rewrite configuration |
| `middleware.js` | Current Vercel middleware; blocks requests for the source folder |
| `launch.bat` | Windows static server launcher |
| `live-setup.md` | MongoDB, Vercel, environment, and deploy setup steps |
| `local.auth.example.json` | Example local user configuration; values are placeholders |
| `data.js` | Contract text, scan entries, shop steward contacts, and roster data |
| `style.css` | Shared portal styles and responsive layout |
| `forum.css` | Community forum page styles |
| `index.html` | Sign-in/entry page |
| `home.html` | Member gateway and resource links |
| `updates.html` | Dated portal change log for members |
| `contract-updates.html` | Member-facing contract and employment notices |
| `calendar.html` | Upcoming member meetings and events |
| `member-action.html` | Grievance preparation and issue-to-article links |
| `evidence-log.html` | In-memory evidence worksheet and export UI |
| `bargaining.html` | Factual bargaining checklists and meeting language |
| `member-documents.html` | Member summaries and tool links |
| `contract.html` | Searchable CBA and separate-paper viewer |
| `scans.html` | CBA scan archive |
| `tool-program.html` | Facility tool-policy archive |
| `stewards.html` | Shop steward directory |
| `employees.html` | Facility employee roster |
| `suggestions.html` | Structured member feedback form |
| `forum.html` | Community forum page |
| `scripts/check-deploy.js` | Checks deploy exclusions and expected auth wiring |
| `scripts/seed-user.js` | Creates or updates a Mongo user from command-line input |
| `tests/smoke.js` | Checks page wiring, local assets, search data, and forum validation |
| `source/IUOE_Local_835_Petition_and_Motion.docx` | Offline Word draft (not opened) |
| `source/IUOE_Local_835_Petition_and_Motion.md` | Offline Markdown draft (not opened) |
| `source/IUOE_Local_835_Working_Packet.docx` | Offline Word draft (not opened) |
| `source/IUOE_Local_835_Working_Packet.md` | Offline Markdown draft (not opened) |

## Not mapped
`images/` is summarized above; `.git/` and ignored/generated/dependency folders are omitted. `api/lib/password.js` exists, not opened.

## Known oddities
- `README.md`, `DOCS/ARCHITECTURE.md`, and `live-setup.md` describe gated production pages, but current `js/auth.js` sets `AUTH_DISABLED = true` and `middleware.js` allows all traffic except requests for the source folder.
- `README.md`, `DOCS/ARCHITECTURE.md`, navigation, and page links refer to `agreement-2026-27.html`; that file is absent from the tracked file list.
- `DOCS/ARCHITECTURE.md` contains older page and auth descriptions alongside newer amendments; read current code when the details matter.
