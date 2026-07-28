<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# Changelog

## [1.2.0] - 2026-07-28
- **Mobile:** Sitewide responsive polish — safe-area insets, home/login stacking, full-width touch CTAs, 360–480px and landscape tweaks; home place label no longer overlaps the menu button.
- **Security:** Private-host roadmap Phase 0–1 — deploy exclusions for `source/`, removed public demo/sample-password surfaces, Vercel `api/auth/*` + Edge `middleware.js`, Mongo user seeding + login rate limits (`mongodb`, `jose`).
- **Member Action Center:** `member-action.html` — Article IV grievance prep, issue→article links, steward prep export, PICC coverage notice.
- **Evidence / bargaining:** Client-only evidence log export; factual bargaining checklists and meeting language.
- **Suggestions:** Structured workplace fields + privacy warning (still share/copy only).
- **Content:** Article XIX marked pending digitization beyond page 13 heading.
- **Ops:** `npm run test:smoke`, `npm run check:deploy`, security checklist under `DOCS/debugs/`.

## [1.1.1] - 2026-07-28
- **Login:** Rebuilt `index.html` to match the State Road homepage—Local 835 cover, U.S. Facilities context, CFCF / RCF / PICC, and responsive split-screen sign-in.
- **Compatibility:** Kept `login-form`, field, and submit IDs unchanged; temporary `admin` / `sample` hint remains visible for the current verification stage.

## [1.1.0] - 2026-07-28
- **Homepage:** Rebuilt `home.html` around Operating Engineers Local 835’s State Road work sites. Hero names U.S. Facilities and CFCF / RCF / PICC, with direct CBA and site-search actions.
- **Facility access:** Added plain CFCF / RCF / PICC links to filtered shop-steward pages.
- **Resources:** Replaced three portal-card grids and disabled prior-CBA placeholder with one compact six-link member-resource list.
- **Visual:** Added scoped responsive `.home-*` styling, hero/CTA motion, and `prefers-reduced-motion` support.

## [1.0.1] - 2026-07-28
- **Audit:** Full site audit documented in `DOCS/debugs/debug_2026-07-28_site-audit.md` (structure pass; static assets bypass client gate — expected until server auth).
- **Fix:** `js/auth.js` loaded in `<head>` on all pages (reduces unauthenticated content flash).
- **Fix:** `launch.bat` now `cd /d "%~dp0"` before `npx serve`.

## [1.0.0] - 2026-07-28
- **Login gate:** `index.html` branded sign-in; hardcoded sample account `admin` / `sample` in `js/auth.js` (sessionStorage). Protected pages redirect when unsigned; signed-in users hitting login go to `home.html`.
- **Gateway rename:** Former document portal is `home.html`; nav Home + breadcrumbs updated.
- **Organize:** Scans and steward photos → `images/`; petition/packet drafts → `source/`. `data.js` image paths updated.
- **Shell:** Sign out control in the side panel.
- **Docs:** `AGENTS.md` added; README / ARCHITECTURE / SUMMARY updated for gate + folders.

## [0.9.0] - 2026-06-26
- **Sitewide search:** `js/site-search.js` — modal on every page; indexes CBA articles, `cbaScannedPages`, `toolProgramScans`, `shopStewards`, and `employeesData`. Lazy-loads `data.js` when needed. Open via search button (top-right), Ctrl+K, or `/` (non-contract pages). Arrow keys + Enter in results.
- **Deep links from search results:** `contract.html?q=…&article=…`, `scans.html?item=…`, `tool-program.html?item=…`, `stewards.html?site=…`, `employees.html?q=…`.
- **Navigation:** `js/nav-config.js` — single source for grouped sidebar; `js/shell.js` renders nav and breadcrumbs.
- **Home (`index.html`):** Portal cards grouped (Documents / Members / Feedback); quick-action row including sitewide search.
- **Roster (`employees.html`):** Live search + facility filter chips; URL `?q=` pre-fills filter.
- **Stewards (`stewards.html`):** Site filter chips; URL `?site=` pre-selects facility.
- **Suggestions (`suggestions.html`):** Working client-side form — Share API on mobile, copy-to-clipboard fallback; topic/name/message fields.
- **Archive panels:** `paneled-archive.js` honors `?item=` and hash for initial scan selection.

## [0.8.1] - 2026-04-26
- **Separate contract document:** The former “article 20 / 21” content is not part of the master CBA (I–XIX). It is modeled as a second, two-section tool paper (`separate-paper-tool-control`, `separate-paper-lost-tool`) with `separatePapersIntro`, a list banner, distinct card styling, and copy/stats that count CBA articles vs. separate-paper parts.
- [AMENDED] Repaired `data.js` parse error (extra `}` after Article XIX) that dropped the two separate-paper entries and prevented `toolProgramScans` from loading.

## [0.8.0] - 2026-04-26
- **Gateway architecture:** `index.html` is a lightweight home with portal cards; contract / scans / tool / stewards / employees each have dedicated HTML and load only `js/*-app.js` + shared `js/shell.js`, `js/paneled-archive.js`, `js/image-modal.js` as needed. Removed monolithic `script.js`.

## [0.7.1] - 2026-04-26
- Nav and header: “Scanned Pages” without year suffix; gallery copy framed as the general full-page scan library. Stat label “Scanned pages”; rail/accessibility labels generalized.

## [0.7.0] - 2026-04-26
- UI labels current CBA and scans as 2022–2026 term (`contractData.termLabel`); Scanned section rail: “2022–2026 CBA (scanned — in progress, pages 1–13+)”.
- Nav: “Contract Viewer” / “Scanned Pages” relabeled (2022–26); disabled placeholder row for 2018–2022 (with “soon” tag).

## [0.6.0] - 2026-04-26
- Scanned Pages: two-column paneled layout (filter + scrollable list + description + image); data split into `cbaScannedPages` and `toolProgramScans` with per-page `description` fields.
- Navigation: "Tool Program" item opens facility tool-policy panel; hero stats add "CBA scans" and "Tool program" counts; wider layout on archive views.

## [0.5.0] - 2026-04-26
- Scanned Pages: added contract pages 9–13, Tool Control Program (2009) cover/TOC, and Lost Tool Disciplinary Steps reference (1998).
- Gallery groups policy scans with section headings; updated archive view description.

## [0.1.0] - 2026-03-27
- Initialized Project Files
- Created project documentation set
