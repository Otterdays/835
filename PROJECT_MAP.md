# Project Map: Operating Engineers Local 835
Last mapped: 2026-11-18 · by Codex (GPT-6)

## What this is
This is a private, static HTML/CSS/JavaScript member portal for Operating Engineers Local 835 State Road members. It includes contract and scan search, member tools, rosters, a community forum, and Vercel API routes backed by MongoDB. Shared browser behavior lives in `js/`; the server routes and Mongo helpers live in `api/`.

## How to run
- `npm run dev` — static local preview on port 3000.
- `launch.bat` — Windows static preview.
- `npm run vercel:dev` — local Vercel runtime with API routes.
- `npm run seed:user` — seed an API user; requires Mongo settings.
- `npm run test:smoke` — page, asset, search, and forum checks.
- `npm run test:llm` — AI assistant unit/mocked-provider checks.
- `npm run build:ai-context` — regenerate `api/_lib/ai-site-data.json` after editing `data.js` or portal pages.
- `npm run check:deploy` — deploy-exclusion and auth wiring checks.

## Layout
| Folder | What lives there | Map |
|---|---|---|
| `DOCS/` | Project overview, workflow, architecture, and audits | `DOCS/_MAP.md` |
| `api/` | Vercel auth, profile, and community-forum endpoints | `api/_MAP.md` |
| `js/` | Browser auth, profiles, shared shell/search, and page behavior | `js/_MAP.md` |
| `images/` | 30 CBA page scans, 3 tentative-agreement scans, DOC Hospital side-letter scan, `images/admin/` (admin-only roster report scans), app icons, and tool-policy scans/icons; individual images omitted | — |
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
| how home-screen app installation is configured and prompted | `manifest.webmanifest`, page manifest links, install icon assets in `images/`, and `js/shell.js` |
| where light/dark appearance is set and styled | `js/theme.js`, dark tokens at the end of `style.css`/`forum.css`/`profile.css`, generated `dark.css` (`npm run build:dark`) |
| how to add a new navigation destination | `js/nav-config.js` → `SITE_NAV`, `SITE_PAGE_IDS` |
| how sitewide search builds and routes results | `js/site-search.js` |
| how to add a page to sitewide search | Add a curated entry in `js/site-search.js` and verify its destination |
| where contract text and scan metadata are stored | `data.js` → `contractData`, `cbaScannedPages`, `toolProgramScans` |
| how to add a CBA scan and transcription | Follow `DOCS/CONTRACT_PAGE_INGESTION.md`; update `images/`, `data.js`, search, and dated update links |
| where the agreement-first reading flow and CBA article search live | `contract.html` + `js/contract-app.js`; guided 2026–27 summary first, searchable 2022–26 source text in `data.js` |
| where CBA page images are browsed | `scans.html` + `js/scans-app.js` + `js/paneled-archive.js` |
| how to add a tool-policy scan | Add the image and `toolProgramScans` entry in `data.js`; see `tool-program.html` |
| where tool-policy archive behavior lives | `tool-program.html` + `js/tool-app.js` + `js/paneled-archive.js` |
| where union leadership and shop steward contacts are maintained | `data.js` → `shopStewards`; display/filter in `js/stewards-app.js` |
| where employee roster data and site filters are maintained | `data.js` → `employeesData`; display/filter in `js/employees-app.js` (includes temporary DOC Hospital project assignments) |
| how to add a steward or roster entry | Add it to `shopStewards` or `employeesData` in `data.js` (`alsoAt` for regular secondary sites; `temporaryAt` for temporary assignments) |
| where member grievance preparation lives | `member-action.html` + `js/member-action-app.js` |
| where evidence entries are stored and exported | `evidence-log.html` + `js/evidence-log-app.js` (in memory only) |
| where bargaining checklists and copy language live | `bargaining.html` + `js/bargaining-app.js` |
| where member suggestions are saved/shared | `suggestions.html` + `js/suggestions-app.js` (browser storage/share/copy) |
| where accounts, profiles and member roles are handled | `api/auth/`, `api/profile/`, `api/_lib/accounts.js`, and `scripts/manage-user.js` (see `DOCS/ACCOUNTS.md`) |
| where forum threads and replies are handled | `api/forum/` (see `api/forum/_MAP.md`) and `js/forum-app.js` |
| how to add a forum endpoint | Add a Vercel route under `api/forum/`, reuse `api/_lib/forum.js`, and update `tests/smoke.js` when behavior changes |
| how to add an API endpoint | Add a route under `api/`; keep shared helpers in `api/_lib/` and stay within the 12-function Vercel Hobby limit (see `AGENTS.md`) |
| where Mongo connection and indexes are configured | `api/_lib/mongo.js` → `getDb()`, `ensureIndexes()` |
| where session cookies and JWT behavior live | `api/_lib/session.js` |
| where login, logout, and session lookup routes live | `api/auth/` (see `api/auth/_MAP.md`) |
| where Vercel request routing is configured | `vercel.json` and `middleware.js` |
| where the admin panel lives and how it is locked | `admin.html`, `js/admin-app.js`, `api/admin/index.js`, `middleware.js` (see `DOCS/ACCOUNTS.md`) |
| where admin-only documents and future content sections are reserved | `admin.html` → `#adm-documents` (roster report scans in `images/admin/`, served only to admins) and `#adm-future-section` (page is gated by `middleware.js`) |
| where the admin-only AI assistant (free OpenRouter models only) is built | `admin.html`, `js/admin-ai.js`, `api/admin/index.js` (`?ai=1`, `action:"ask"`), `api/_lib/ai-catalog.js`, `api/_lib/ai-context.js`, `api/_lib/ai.js`, `api/_lib/admin-ai.js`; curated public roster/steward context, sensitive status/account data excluded, current-key daily usage and structured rate feedback; see `DOCS/LLM_INTEGRATION.md` |
| where production setup and deploy safety are documented | `live-setup.md`, `.env.example`, `DOCS/debugs/` |
| how to add a runtime environment setting | Document its name in `.env.example` and update the deploy/setup docs |
| where smoke and deploy checks are defined | `tests/smoke.js`, `scripts/check-deploy.js` |
| how to add a user to MongoDB | `scripts/seed-user.js` (see `package.json` script `seed:user`) |
| how to manage member roles, badges, passwords, and account status | `scripts/manage-user.js` (see `DOCS/ACCOUNTS.md`) |
| where page-level and shared visual styles live | `style.css`, `forum.css` |
| which local drafts are excluded from deployment | `source/` and `.vercelignore` |

## Files (root and folders without their own map)
| File | What it does |
|---|---|
| `.env.example` | Environment variable names and local auth-mode example; contains placeholders only (`OPENROUTER_API_KEY` stays blank) |
| `.gitignore` | Excludes local credentials, dependencies, and generated files from Git |
| `.vercelignore` | Keeps offline drafts, docs, setup files, and local config out of deployment |
| `AGENTS.md` | Shared agent rules and project workflow |
| `CLAUDE.md` | Imports `AGENTS.md` for Claude Code |
| `README.md` | Project description, features, and local run instructions |
| `package.json` | Dependencies and `npm` scripts |
| `manifest.webmanifest` | Installable Local 835 web app name, icons, launch page and standalone display mode |
| `package-lock.json` | Locked npm dependency tree |
| `vercel.json` | Vercel API rewrite configuration |
| `middleware.js` | Vercel middleware; blocks the source folder and serves `/admin*` and `/api/admin` only to a verified admin session |
| `admin.html` | Admin panel page (admins only; gated by `middleware.js`); includes the AI assistant, admin document placeholder, and future-content section |
| `launch.bat` | Windows static server launcher |
| `live-setup.md` | MongoDB, Vercel, environment, and deploy setup steps |
| `local.auth.example.json` | Example local user configuration; values are placeholders |
| `data.js` | Contract text, scan entries, shop steward contacts, and roster data |
| `style.css` | Shared portal styles and responsive layout |
| `forum.css` | Community forum page styles |
| `index.html` | Open portal entrance |
| `signin.html` | Account sign-in and registration |
| `profile.html` | Member profile with Top 8 and comments |
| `profile-edit.html` | Member profile editor |
| `members.html` | Signed-in member directory |
| `profile.css` | Account and profile styling |
| `home.html` | Member gateway and resource links |
| `updates.html` | Dated portal change log for members |
| `contract-updates.html` | Member-facing contract and employment notices |
| `calendar.html` | Upcoming member meetings and events |
| `member-action.html` | Grievance preparation and issue-to-article links |
| `evidence-log.html` | Case Notebook (formerly Evidence Log): in-memory notes worksheet and download UI |
| `bargaining.html` | Factual bargaining checklists and meeting language |
| `member-documents.html` | Member summaries and tool links |
| `contract.html` | Agreement-first reader: guided 2026–27 terms, then searchable 2022–26 CBA and separate papers |
| `scans.html` | CBA scan archive |
| `tool-program.html` | Facility tool-policy archive |
| `stewards.html` | Shop steward directory |
| `employees.html` | Facility employee roster |
| `suggestions.html` | Structured member feedback form |
| `forum.html` | Community forum page |
| `scripts/check-deploy.js` | Checks deploy exclusions, expected auth wiring, and secret-shaped key scans (`OPENROUTER_API_KEY`) |
| `scripts/build-ai-context.js` | Generates `api/_lib/ai-site-data.json` from `data.js` + selected HTML pages; fails if roster/steward names leak (`npm run build:ai-context`) |
| `scripts/gen-dark-css.js` | Generates `dark.css` from hard-coded colors in `style.css`, `forum.css`, `profile.css` |
| `scripts/seed-user.js` | Creates or updates a Mongo user from command-line input |
| `tests/smoke.js` | Checks page wiring, local assets, search data, forum validation, and the admin AI wiring/privacy block |
| `tests/llm.js` | Pure and mocked OpenRouter AI tests: catalog filter, request builder, allowlist, mocked provider responses and rate metadata, context retrieval, curated public-roster privacy, site-data freshness and key scans (`npm run test:llm`) |
| `api/_lib/ai-site-data.json` | Generated AI context export: page directory + contract article index + curated public roster/steward fields and excerpts; excludes sensitive status notes, private contacts, and `updates.html` body text |
| `source/IUOE_Local_835_Petition_and_Motion.docx` | Offline Word draft (not opened) |
| `source/IUOE_Local_835_Petition_and_Motion.md` | Offline Markdown draft (not opened) |
| `source/IUOE_Local_835_Working_Packet.docx` | Offline Word draft (not opened) |
| `source/IUOE_Local_835_Working_Packet.md` | Offline Markdown draft (not opened) |

## Not mapped
`images/` is summarized above; `.git/` and ignored/generated/dependency folders are omitted.

## Known oddities
- `README.md`, `DOCS/ARCHITECTURE.md`, and `live-setup.md` describe gated production pages, but current `js/auth.js` sets `AUTH_DISABLED = true` and `middleware.js` allows all traffic except requests for the source folder.
- `DOCS/ARCHITECTURE.md` contains older page and auth descriptions alongside newer amendments; read current code when the details matter.
