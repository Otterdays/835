<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->

[AMENDED 2026-11-19]: Added Bryant Barr to union leadership contacts and the site roster; broadened the leadership directory labels to cover union leadership and shop stewards. Added a member-facing notice for the 835–USF covered crew currently working at Philadelphia Detention Center, with contract terms and names explicitly pending receipt.
[AMENDED 2026-11-19]: Added Home page links for Local 835 leadership and the Philadelphia Detention Center. The site roster now offers a DC filter with a notice that crew names are pending.
[AMENDED 2026-11-19]: Admin AI can retrieve published roster and steward directory fields; it excludes sensitive status notes and account/contact data. Other eligible free models are enabled with a per-model privacy warning and confirmation.

## [Unreleased] - 2026-11-18
- **Accounts mobile UX:** Grouped profile fields, enlarged touch controls and text, added safe-area-aware save actions, simplified directory cards, and collapsed password change until requested.
- **PICC roster:** Checked the supplied 21-person list against `employeesData`; completed names, aligned trade titles and spellings, and removed two incomplete/conflicting PICC entries. Preserved steward designations.
- **PICC roster correction (superseded 2026-11-19):** An earlier correction abbreviated Patrick Martin as Pat Martin. The user clarified the full name is Patrick Martin; PICC remains his location, and the CFCF duplicate was removed.
- **Accounts:** Added sign-in, optional-code registration, password change, member directory, profile editor/viewer, comments wall, and officer-managed roles/badges.
- **Forum:** Replaced temporary browser names with signed-in author identity for new threads/replies; retained older guest posts and added profile/badge links.
- **Navigation:** Added account/profile pages to Home, shared navigation, sitewide search, and the side-panel account block.

## [Unreleased] - 2026-11-19
- **Admin AI (built):** Added the Free-only OpenRouter admin chat assistant: `api/_lib/ai-catalog.js` (free-only `:free` filter + strict ZDR from `/endpoints/zdr`), `api/_lib/ai-context.js` (retrieval over generated `api/_lib/ai-site-data.json`; no roster/steward/`updates.html` text), `api/_lib/ai.js` (hardcoded OpenRouter URL, `max_price` 0/0/0, `data_collection:"deny"`, provider-only routing for strict models, 50 s timeout, no streaming/retries), `api/_lib/admin-ai.js` (`GET /api/admin?ai=1`, `POST /api/admin action:"ask"`, 10/h per admin + 30/day site, `admin_ai_log` metadata), admin panel AI section (`admin.html` + `js/admin-ai.js`), styles, `tests/llm.js`, deploy-check key scan, `.env.example` entries, and the `npm run build:ai-context`/`test:llm` scripts. Function count remains 10.
- **Admin AI plan:** Updated `DOCS/LLM_INTEGRATION.md` for the owner's FREE ONLY requirement: dynamic free-model selection, server-side zero-price enforcement, no paid fallback/credits, provider privacy limits, interface behavior, and TDD acceptance coverage. Planning only; no AI code built.
- **Docs:** Added `DOCS/LLM_INTEGRATION.md`, a plan for an admin-only AI assistant (OpenRouter, OpenCode Zen alternative). Planning only; no code changes.
- **Roster:** Added the supplied PICC and CFCF trades and part-time Warehouse Crew member; Roman Solecki (#4) now also appears under Warehouse while remaining in Management.
- **Roster:** Moved John Carroll III (3 · Supervisor) and Roman Solecki (4 · Warehouse Supervisor) into the Management group while keeping their ranks and titles.
- **Sign-in usability:** Added accessible show/hide password controls to sign-in and account creation forms.
- **Agent guidance:** Documented Vercel Hobby's 12-function cap, `api/_lib/` helper convention, function recount, and post-push deployment/Node 26 verification.
- **Vercel Hobby deployment:** Moved Mongo, session, password, and login-rate helpers from `api/lib/` into `api/_lib/` so Vercel treats them as helpers, reducing generated functions below the 12-function Hobby cap. Kept Node.js pinned to `26.x`.
- **Runtime:** Pinned Vercel builds to Node.js 26.x in `package.json` and lockfile so the deployment runtime cannot float to a different major.
- **Roster tooltip:** Added the user-requested “BEST IN CLASS ASSHOLES” native tooltip to the Management group heading.
- **Roster tooltip behavior:** Superseded the native heading-only tooltip with an immediate hover/focus tooltip on the Management heading and each management card.
- **PICC roster correction:** Confirmed Patrick Martin is assigned to PICC, not CFCF; updated the roster and member-facing update.

## [Unreleased] - 2026-11-17
- **Contract reader:** Put a guided, source-linked 2026–27 tentative agreement overview first, with the searchable 2022–26 CBA reader below and a tighter mobile layout.
- **Contract:** Added CBA page 27 to Exhibit C, Article XXIII, and the scanned-page/search archive. The visible investigation questionnaire ends at question 11.
- **Contract:** Added CBA pages 24–26 to Exhibit C, Article XXIII, and the scanned-page/search archive. Page 26's procedure remains partial at the page edge.
- **Docs:** Added a project navigation index and folder maps for project docs, browser code, and API routes; linked the index from agent instructions.
- **Contract:** Added the October 2, 2026 Memorandum of Tentative Agreement as a searchable, clearly tentative 2026–27 companion to the existing CBA. Preserved the source PDF and three full-page images, and linked its terms from the contract viewer, Home, navigation, and Scanned Pages.
- **Member calendar:** Added the third-Wednesday union-wide meeting and clarified that the December 8 meeting is for assistant shop stewards and the chief shop steward only.

## [1.3.2] - 2026-11-17
- **Home:** Reorganized the member home page with a restrained compact hero, clear primary actions, grouped resources, and mobile sized facility/resource rows for easier scanning.

## [1.3.1] - 2026-11-17
- **Search:** Community Forum page + live forum threads appear in sitewide search (Ctrl+K).
- **Home:** "Community Forum" callout and a floating Forum button (mobile-safe) so members can find the board.
- **Fix:** `api/lib/mongo.js` no longer caches a failed connection (was causing null-db errors after bad auth).

## [1.3.0] - 2026-11-17
- **Community forum:** `forum.html` — threads + replies, category filter, temporary usernames saved in the browser (no login), Account options to change/forget the name.
- **API:** `GET/POST /api/forum/threads`, `GET/POST /api/forum/thread` on Vercel + Mongo (`forum_threads`, `forum_replies`, `forum_rate`).
- **Abuse controls:** server validation, reserved name prefixes, per-IP rate limits, honeypot, size caps.
- **Tests:** smoke checks for forum validation + wiring.

[AMENDED 2026-11-17]: Page 14 added to the CBA scan archive and sitewide search. Article XIX holiday text is transcribed; Article XX pension Section 1 is included as partial text pending continuation scans. The older page 13 holiday placeholder note below in the 1.2.0 history is superseded.

[AMENDED 2026-11-17 8:26 p.m. EST]: Added the member-facing Updates page and connected it to Home, shared navigation, and sitewide search. It records the day’s work with EST timestamps and identifies page 15+ / later information as upcoming.

[AMENDED 2026-11-17]: Added the future CBA scan ingestion handbook; aligned Codex/OpenAI and Claude Code entrypoints through canonical `AGENTS.md` plus a `CLAUDE.md` import; updated README, architecture, and style guidance. Recorded the owner's standing authorization to push the full project and subsequent project commits.

[AMENDED 2026-11-17]: Added a separate Contract & Employment Updates member page, linked from Home/navigation/sitewide search. Initial notice records the weekly-pay transition after negotiations, quotes management's statement that the timeline is pending processing of union increases, and leaves the effective date unspecified.
# Changelog

[AMENDED 2026-11-18]: **Search:** Hid the keyboard shortcut chips in the mobile search dialog to reduce clutter; retained them on desktop.

[AMENDED 2026-11-17]: **Home:** Removed the Bargaining Tools link from the main page resources list.

[AMENDED 2026-11-17]: **Roster:** Added the supplied facility employees and trade roles, corrected Kevin Lyons, and listed management contacts in the supplied order from Project Manager through Assistant APM.

[AMENDED 2026-11-17]: **Roster:** Corrected employee names, facilities, job roles, and supplied employment statuses; removed Anthony and duplicate Vetter, added Robert Korcheck and Ian Roonen at CFCF, and synced Charles and Orlando's PICC steward roles.

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

[2026-11-17 8:42 p.m. EST] Documentation and continuity: established shared `AGENTS.md` rules with a Claude Code `CLAUDE.md` import, added a detailed scan-to-transcription-to-search guide for future CBA pages, and added smoke checks for update pages, scan assets, search destinations, and instruction wiring. Smoke and deploy checks passed.

[2026-11-17 8:50 p.m. EST] CBA page 15 added to the scan archive and search. Completed Article XX Pension Sections 1–4; transcribed Article XXI Wages Sections 1–2 and the opening of Article XXII Health Care Insurance. Articles XXI and XXII remain partial. Updated the scan range to pages 1–15+ and corrected member-facing Article XX status.

[2026-11-17 8:53 p.m. EST] Mobile and edge-case audit: fixed the narrow-screen sidebar width declaration, escaped evidence-log Markdown table delimiters and multiline cells, delayed Blob URL cleanup for mobile downloads, and improved site-search dialog focus handling.

[2026-11-17 9:12 p.m. EST] Search: added numbered, highlighted and count-aware sitewide results; accessible dialog close/status and keyboard feedback; delayed forum requests until a query is entered; normalized and highlighted contract search. Made mobile Document Tools collapsible and non-sticky.

[2026-11-17 9:36 p.m. EST] Search audit verification: smoke, deploy, JavaScript syntax, and diff checks passed. Cached normalized search text to keep incremental typing responsive. Local preview unavailable because sandbox networking denied the local server.

[2026-11-17 9:38 p.m. EST] Final validation after keyboard/dialog race handling and ordered-list accessibility updates: smoke, deploy, syntax, and diff checks passed.

[AMENDED 2026-11-17 11:04 p.m. EST]: CBA page 16 added to the scan archive and search. Completed the visible Article XXII Sections 1–3 across pages 15–16 and added Article XXIII Sections 1–3; Article XXIII continues beyond the supplied scan. Updated current scan range to pages 1–16+.

[AMENDED 2026-11-17]: **Roster:** Added the additional locksmith, warehouse, kitchen, and facility staff supplied by the user.

[AMENDED 2026-11-17 11:12 p.m. EST]: CBA page 17 added to the scan archive and search. Completed Article XXIII Sections 1–9 across pages 16–17; added Article XXIV Section 1 and the visible opening of Section 2, marked partial beyond page 17. Updated current scan range to pages 1–17+.

[AMENDED 2026-11-17 11:14 p.m. EST]: CBA page 18 added to the scan archive and search. Completed Article XXIV Term of Agreement Sections 1–2 across pages 17–18; preserved signature blocks and transcribed printed signatory information and visible dates. Updated the current scan range to pages 1–18+.

[AMENDED 2026-11-17 11:28 p.m. EST]: CBA pages 19–20 added to the scan archive and search. Transcribed Exhibit A contributions into Article XXII and all Exhibit B wage rates into Article XXI. Updated current scan range to pages 1–20+ and refreshed the bargaining snapshot.

[AMENDED 2026-11-17 11:39 p.m. EST]: CBA pages 21–23 added to the scan archive and search. Transcribed the supplied pages of Exhibit C Substance Abuse Policy and connected it to Article XXIII, Section 9. Updated the archive range to pages 1–23+ and the bargaining snapshot.

[AMENDED 2026-11-18 12:02 a.m. EST]: CBA pages 24–26 added to the scan archive and search, and transcribed into Article XXIII's Exhibit C text. Page 26 ends mid-sentence; the procedure remains partial pending continuation.

[AMENDED 2026-11-18 9:59 a.m. EST]: CBA page 27 added to the scan archive and search. Continued Article XXIII's Exhibit C investigation questions; the page ends after question 11.
[AMENDED 2026-11-19]: Refined `signin.html`, `js/signin-app.js`, and `profile.css` — clearer sign-in/create-account layout, field help text, loading/error states, password change shown only when signed in, and mobile spacing so the floating menu button no longer covers the breadcrumb.
[AMENDED 2026-11-19]: Forum member names are clearer links with larger touch targets; thread rows use a stretched title link so names inside them are valid separate links; pre-account guest posts are tagged "guest".
[AMENDED 2026-11-19]: Forum shows all categories by default with a Board (kanban-style, columns per topic) and List toggle; profile, editor and directory pages now load their shared helper script.
[AMENDED 2026-11-19]: Profile job title changed from free text to a dropdown of the roster's trades, enforced by the API and guarded by a smoke check.
[AMENDED 2026-11-19]: Added a Lead Admin title and an automatic Site Admin marker for admin accounts, shown on profiles, directory, forum and comments.
[AMENDED 2026-11-19]: Edit Profile page rebuilt with back/cancel, unsaved-changes warning, live preview, pickers and a reorderable Top 8; fixed blank "none" dropdowns that broke saving.
[AMENDED 2026-11-19]: Admin panel added, locked to admins at the edge and in the API, with an audit log.
[AMENDED 2026-11-19]: Forum posts can be deleted by their author or an admin; admin deletions are logged.
[AMENDED 2026-11-19]: Split the combined job titles (kitchen supervisor and mechanic; stationary and building engineer) into separate choices.
[AMENDED 2026-11-19]: Profile links (up to 5, validated http/https, safe new-tab opening, shown with the real site name) and four dark plus five light profile themes with a swatch picker; admins can remove a member's links.
[AMENDED 2026-11-19]: Site Roster: added Mike Brown (Plumber, CFCF) and Lauren Battilana (Data Clerk, CFCF); Mike Henry now shows at both RCF and CFCF through a new optional `alsoAt` field (one person, counted once, shown under each site with an "Also works at" note; search shows both sites).
[AMENDED 2026-11-19]: Site Roster: Electronic Security staff Eric Levin, Kent Koung and Kyle Lloyd (no single site) are listed under RCF, CFCF and PICC.
[AMENDED 2026-11-19]: Site Roster: choosing a facility filter (e.g. PICC) now shows only that site's crew section; Electronic Security staff no longer pull in the other sites' sections. "All sites" still lists them under each site.
[AMENDED 2026-11-19]: Site Roster: every crew section is sorted A-Z by first name (Management keeps its 1/2/3 rank order), and the roster entries in `data.js` are kept in the same order. New staff should be added in alphabetical position.
[AMENDED 2026-11-19]: Site Roster on phones: a slim A-Z rail on the right edge (touch or drag to jump to the first name with that letter; shows only letters that exist, hidden until the list is on screen). Jumps stay in the section being read when possible.
[AMENDED 2026-11-19]: Site Roster: added Ochel Alexis (CFCF Electrician) and filled in full names for Trevor Anderson and Paul Avarachan (CFCF Electricians). Electricians and Laborers checked against the supplied list.
[AMENDED 2026-11-19]: Site Roster: removed the duplicate "Tim" (CFCF Electrician); he is Tim Neri, already listed at PICC.
[AMENDED 2026-11-19]: Site Roster phone A-Z rail now lists only the letters in the crew section on screen (RCF, CFCF, PICC...), updating as you scroll between crews; every letter tap lands inside that crew.
[AMENDED 2026-11-19]: Site Roster: new "Sort by" control (Name A-Z or Role). Role view keeps the site sections and groups people under their main role inside each site (roles A-Z with a count, names A-Z inside each role; Management stays in rank order). The phone letter rail jumps to role headings in that view.
[AMENDED 2026-11-19]: Site Roster By role view: shop steward titles no longer form their own group. Stewards are grouped under their trade and keep the steward title on their card; anyone with no trade listed goes last under "Trade not listed". Ryan Lorenz is now listed as Plumber · Assistant Shop Steward.
[AMENDED 2026-11-19]: Slide-out menu refined: gold section headings with a rule, one account footer (name, profile, edit, password, admin links, Sign out; guests get a Sign in button) styled in `style.css` so every page shows it correctly. Removed the "Sign in / account" list item, which bounced signed-in members to Home.
[AMENDED 2026-11-19]: Forum board shows left/right arrow tabs (with an edge fade and a short nudge) whenever topics scroll sideways, so members know to swipe; hidden when everything fits.
[AMENDED 2026-11-19]: Floating "Community Forum" speech bubble in the bottom-right corner of member pages (added by `js/shell.js`; hidden on the forum, sign-in, admin, profile editor and login pages; sits above the split-view button on the contract page). Replaces the old home-only forum button. Home callout text updated: the forum now needs an account.
[AMENDED 2026-11-19]: Site-wide light/dark appearance. `js/theme.js` (loaded in every page `<head>`) stores Auto/Light/Dark in `localStorage` (`oe835_theme`) and sets `data-theme` on `<html>`; the menu has an Appearance switch (`js/shell.js`). Dark tokens live at the end of `style.css`, `forum.css` and `profile.css`; hard-coded colors are covered by generated `dark.css` (`npm run build:dark`, `scripts/gen-dark-css.js`). A member's own profile theme is never restyled. Checked with a WCAG contrast pass on the main pages in dark; preference is per device (not saved to the account).
[AMENDED 2026-11-19]: Appearance switch on phones: label sits above three equal full-width Auto/Light/Dark buttons (44px tall, no wrapping); on wider screens it stays on one row.
[AMENDED 2026-11-19]: Appearance now defaults to Dark for everyone who has not chosen; buttons are ordered Dark, Light, Auto. Auto is now stored explicitly (previously 'no saved choice'), so anyone who had been on Auto starts on Dark until they pick Auto again.
[AMENDED 2026-11-19]: Site Roster: Derrick Smith (PICC) is a Building Engineer.
[AMENDED 2026-11-19]: Site Roster: added Luong Trinh, Mathew-George, William Bates, Baris Kaya, Justin Lowe, Ho Song; Adrian Molina now Welder, Michael Jones now CFCF Painter, Sabu now Sabu Gokul (Building Engineer, RCF). New "Supervisors" group (John Carroll III 3, Roman Solecki 4, shift supervisors 5) and "Security" group: electronic security techs are one entry under Security, no longer repeated under every building. JOB_TITLES: Welder replaces Maintenance Mechanic.
[AMENDED 2026-11-19]: Added CBA printed pages 28–30, finishing the supplied Exhibit C transcription in Article XXIII and the searchable scan archive. Updated current CBA range, bargaining reference, project map, and member updates.
