<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
[AMENDED 2026-11-19]: Added accessible click-to-show/hide controls for the sign-in and create-account password fields; password-change fields remain untouched per requested scope.
[AMENDED 2026-11-19]: Added the Vercel Hobby 12-function cap and helper-placement rule to `AGENTS.md`, API maps, and architecture docs; required function recounts and checking deployment status/runtime after API pushes.
[AMENDED 2026-11-19]: Fixed Hobby deployment function-count failure by moving shared API helpers from `api/lib/` to `api/_lib/`, updating imports/tests/maps, and keeping nine endpoint files in deployable route directories. Node 26 pin remains in effect.
[AMENDED 2026-11-19]: Pinned `engines.node` to `26.x` in `package.json` and `package-lock.json` so Vercel cannot auto-upgrade the project to a different major Node.js version.
[AMENDED 2026-11-19]: Added the user-requested “BEST IN CLASS ASSHOLES” native tooltip to the Management roster heading in `js/employees-app.js`.
[AMENDED 2026-11-19]: Expanded the roster tooltip to appear immediately over each Management card and the Management heading, with keyboard focus support; replaced the delayed native tooltip.
[AMENDED 2026-11-18]: Compared supplied PICC roster image against `employeesData`; reconciled all 21 listed employee/trade records, completed names and job titles, corrected visible spellings, retained Charles Worrell and Orlando Rivera's steward designations, and added a Project Updates entry. User requested committing all workspace changes and pushing to origin; inspect complete status/diff, preserve existing in-progress account work, and exclude secrets/local-only files as instructed in `AGENTS.md`.
[AMENDED 2026-11-18; superseded 2026-11-19]: An earlier correction abbreviated Patrick Martin as Pat Martin. The user clarified the full name is Patrick Martin and confirmed his PICC assignment; the duplicate CFCF entry has been removed.
[AMENDED 2026-11-19]: User confirmed Patrick Martin belongs at PICC, not CFCF. Restored his full name at PICC and recorded the correction in Project Updates.

[AMENDED 2026-11-17]:
## Current Task:
Add the supplied tentative CBA extension memorandum as a 2026–27 companion and preserve every page image.

## Actions Log:
- [2026-11-17] Added `agreement-2026-27.html`; preserved the source PDF and all three rendered pages under `images/2026-27/`; added page-level transcription records to the scanned archive and sitewide search.
- [2026-11-17] Linked the tentative terms from the 2022–2026 contract viewer, Home, shared navigation, and Project Updates. Clearly marked ratification/signature status as unconfirmed based on the supplied copy.

[AMENDED 2026-11-17]:
## Current Task:
Create a member-facing place for contract negotiations and employment notices; publish management's current weekly-pay transition update without implying a start date.

## Actions Log:
- [2026-11-17] Added `contract-updates.html` with the reported move from bi-weekly to weekly pay and attributed Susan Laramore-Johnson (USF / USF HR)'s statement that management has not established a timeline while it processes union increases.
- [2026-11-17] Linked the page from Home, shared navigation, and sitewide search; kept it distinct from the portal's Project Updates log.
- [2026-11-17] Forum is live on Vercel + Atlas (verified by user). Added forum to sitewide search (`js/site-search.js` fetches `/api/forum/threads` each time the dialog opens; thread title/body/author indexed; replies are not). Home now promotes the forum: callout section + floating `.forum-fab` button (z-index 900, safe-area aware, mobile-checked).

[AMENDED 2026-11-17]:
- [2026-11-17] Vercel runtime logs showed `bad auth` (password misread from screenshot: 2nd char is capital O, not zero — verified against Atlas) and a null-`db` cascade. Fixed `api/lib/mongo.js` so a failed connect no longer caches a null db.

[AMENDED 2026-11-17]:
## Current Task:
Community forum (`forum.html`) with temporary local usernames; threads/replies stored in Mongo Atlas via Vercel `api/forum/*`.

## Next Steps:
- Set `MONGODB_URI` (Atlas SRV string for the `835` cluster) + `MONGODB_DB` in Vercel env and local `.env`; rotate the Atlas DB user password (it was visible in a screenshot).
- Atlas Network Access: allow Vercel (`0.0.0.0/0` — Vercel has no fixed egress IPs on Hobby/Pro) or the connection will time out.
- Deploy, post a test thread, confirm indexes were created (`forum_threads`, `forum_replies`, `forum_rate`).
- Moderation (delete/lock) is not built — remove bad posts in Atlas Data Explorer until a mod tool exists.
- Later: real accounts (reuse `users` collection / `api/auth/*`) and name reservation.

## Actions Log:
- [2026-11-17] Added `forum.html`, `js/forum-app.js`, `api/forum/threads.js`, `api/forum/thread.js`, `api/_lib/forum.js`; nav + home link; Mongo indexes in `api/lib/mongo.js`; forum CSS appended to `style.css`.
- [2026-11-17] Username = localStorage `oe835_forum_username` (3–20 chars, reserved-prefix block for admin/steward/etc). Account options panel: change / suggest / forget. No password; names are not unique or claimed.
- [2026-11-17] Safety: server-side validation, per-IP fixed-window rate limit (5 threads/h, 20 replies/h, `forum_rate` TTL), honeypot field, request size cap, client renders with textContent only.
- [2026-11-17] Atlas cluster is MongoDB 8.0.37 (no 9.0 exists); `mongodb` driver ^6.17 is compatible. `api/_lib` underscore prefix keeps helper from counting as a Vercel function.
- [2026-11-17] Verified with in-memory fake DB (API + full UI flow, XSS strings render as text); not yet verified against real Atlas.

[AMENDED 2026-10-27]:
## Current Task:
Disable sign-in service across the application and convert landing page into an open "Click to enter" entrance.

## Next Steps:
- Update `js/auth.js` to enable open access mode and bypass blocking redirects.
- Redesign `index.html` panel into a direct "Click to enter" portal entrance.
- Update `js/login-app.js` to handle click-to-enter transition directly.
- Update `middleware.js` to allow open traffic while preserving sensitive file protection.
- Run tests (`npm run test:smoke`, `npm run check:deploy`).

## Actions Log:
- [2026-10-27] Began disabling sign-in service requirement per user request ("desable the signin service, just like click to enter").
- [2026-10-27] Fixed Vercel 500 on every page: `middleware.js` used `request.nextUrl` (Next.js-only; undefined in plain static project) → TypeError on each request. Now `new URL(request.url)`. Root cause was not `AUTH_SECRET`; `/api/auth/*` (outside matcher) returned 401 while all matched paths 500'd.

[AMENDED 2026-07-28]:
## Current Task:
Secure Member Action Center roadmap implemented through Phase 6 scaffolding — exposure containment, Vercel/Mongo auth APIs, Action Center, evidence/bargaining tools, structured suggestions, smoke/deploy checks.

## Next Steps:
- Make GitHub repo private; disable public Pages.
- Configure Vercel env (`MONGODB_URI`, `AUTH_SECRET`); `npm run seed:user`.
- Digitize remaining Article XIX holiday pages when scans arrive.
- Member-verify facility naming / PICC recognition documents.

## Actions Log:
- [2026-07-28] Mobile polish pass: safe-area insets, home/login/action/suggestions stacking, touch targets, 360–480px and landscape tweaks; `viewport-fit=cover` on all HTML.
- [2026-07-28] Suggestions board: posts display on-page; name optional (defaults Anonymous); localStorage only.
- [2026-07-28] Phase 0: `.gitignore` / `.vercelignore`; stripped sample creds; unlinked `source/` downloads.
- [2026-07-28] Phase 1: `api/auth/*`, `middleware.js`, Mongo users + rate limit, client `js/auth.js` API mode.
- [2026-07-28] Phases 2–3: `member-action.html`, `evidence-log.html`, `bargaining.html` + nav/home links.
- [2026-07-28] Phases 4–5: Article XIX pending-OCR note; structured suggestions + privacy warning.
- [2026-07-28] Phase 6: `tests/smoke.js`, `scripts/check-deploy.js`, security checklist doc.

[AMENDED 2026-07-28]:
## Current Task:
Login redesign complete — State Road / Local 835 visual identity matches the homepage.

## Next Steps:
- Verify facility naming and U.S. Facilities wording with members before public launch.
- Private repo + Vercel/Mongo (or host auth) before treating content as confidential.
- Exclude `source/` from public deploy; strip on-page sample credentials before public URL.

## Actions Log:
- [2026-07-28] Rebuilt `index.html` sign-in as a Local 835 State Road layout; retained auth form IDs and visible temporary sample credentials.
- [2026-07-28] Added responsive login cover/panel styling with reduced-motion support.

[AMENDED 2026-07-28]:
## Current Task:
Homepage redesign complete — State Road / Local 835 identity, facility links, and compact resource list.

## Next Steps:
- Verify facility naming and U.S. Facilities wording with members before public launch.
- Private repo + Vercel/Mongo (or host auth) before treating content as confidential.
- Exclude `source/` from public deploy; strip on-page sample credentials before public URL.

## Actions Log:
- [2026-07-28] Rebuilt `home.html`: Local 835 hero, U.S. Facilities State Road context, CFCF/RCF/PICC steward deep links, and six resource destinations.
- [2026-07-28] Added scoped responsive `.home-*` styling and reduced-motion support.

[AMENDED 2026-07-28]:
## Current Task:
Site audit complete — structure OK; gate is deterrent-only. Fixed auth-in-head flash + `launch.bat` cwd.

## Next Steps:
- Private repo + Vercel/Mongo (or host auth) before treating content as confidential.
- Exclude `source/` from public deploy; strip on-page sample credentials before public URL.
- Later: replace `js/auth.js` credential check with Vercel API + Mongo.

## Actions Log:
- [2026-07-28] Full site audit → `DOCS/debugs/debug_2026-07-28_site-audit.md` (security + functional).
- [2026-07-28] Moved `auth.js` to `<head>` on protected pages; `launch.bat` uses `cd /d "%~dp0"`.
- [2026-07-28] Moved scans/photos to `images/`, petition docs to `source/`; updated `data.js` paths.
- [2026-07-28] Gateway → `home.html`; `index.html` is branded login; `js/auth.js` + `js/login-app.js`; shell Sign out.
- [2026-07-28] Docs: SUMMARY, CHANGELOG [1.0.0], ARCHITECTURE, README, AGENTS.md.

[AMENDED 2026-06-26]:
## Current Task:
Docs updated for sitewide search + June UX pass (nav, portal, filters, suggestions, deep links).

## Next Steps:
- (none)

## Actions Log:
- [2026-06-26] Updated `SUMMARY.md`, `CHANGELOG.md` [0.9.0], `ARCHITECTURE.md`, `STYLE_GUIDE.md`, `My_Thoughts.md`, `README.md`.

[AMENDED 2026-06-26]: Sitewide search (`js/site-search.js`) — contract, scans, tool program, stewards, roster; Ctrl+K / `/`; deep links to target pages.

[AMENDED 2026-06-26]:
## Current Task:
UX organization + interactivity: grouped nav, portal sections, roster search, steward filters, suggestions share/copy form, breadcrumbs.

## Actions Log:
- [2026-06-26] Sitewide search modal + index over `data.js`; deep links (`?q`, `?article`, `?item`, `?site`).

[AMENDED 2026-04-26]:
## Current Task:
Integrated Tool Control Program text: removed tool-related "separate papers" from the main contract viewer and moved their transcriptions directly into the Tool Control Program page (`toolProgramScans` data + `paneled-archive.js` renderer).

## Next Steps:
- Verify that transcriptions show up under Tool Program images.
- Ensure search on Tool Program page includes transcribed text.

## Actions Log:
- [2026-04-27] Added `suggestions.html` (barebones preview); updated all sidebar navigation links across HTML files.
- [2026-04-26] Reorganized `employeesData`: sorted alphabetically and grouped by location (RCF, CFCF, PICC); updated `employees-app.js` with location headings and wider grid layout.
- [2026-04-26] Integrated Tool Control Program text: removed tool docs from main viewer; added `transcription` support to `paneled-archive.js` and `data.js`.
- [2026-04-26] Reframed old “article 20/21” as a second contract paper; stat shows 19 CBA articles; intro paragraph + in-section copy + nav labels make the distinction explicit.

[AMENDED 2026-04-26]:
## Current Task:
Multi-page document center: gateway `index.html`, `contract.html`, `scans.html`, `tool-program.html`, `stewards.html`, `employees.html`; `js/*` split; `script.js` removed.

[AMENDED 2026-04-26]:
## Current Task:
Scanned Pages nav label generic (no year in link); gallery `viewMeta` describes general scan library; stat/rail strings updated.

[AMENDED 2026-04-26]:
## Current Task:
CBA term labeling: 2022–2026 on contract + scans, disabled 2018–2022 nav placeholder; `termLabel` on `contractData`.

## Next Steps:
- (none)

## Actions Log:
- [2026-04-26] Added `termLabel: "2022–2026"`, relabeled nav and viewMeta; disabled 2018–2022 side nav row.

[AMENDED 2026-04-26]:
## Current Task:
Paneled Scanned Pages + dedicated Tool Program nav: `cbaScannedPages` / `toolProgramScans` in `data.js`, `renderPaneledArchive`, wider container on archive views.

## Next Steps:
- Push when ready.

## Actions Log:
- [2026-04-26] Replaced flat gallery with two-column panel (filter, rail list, detail + image). Added sidebar nav "Tool Program" and fifth stat card. Split data into `cbaScannedPages` and `toolProgramScans` with per-page `description` text.
- [2026-04-26] Digitized CBA pages 9–13 and facility tool policies into `data.js` as Articles XII–XXI.
- [2026-04-26] Updated `STYLE_GUIDE.md` with mandatory digitization rules for future imports.
- [2026-04-26] Extended `contractImages` with pages 9–13 and three facility policy images; optional `section` labels and `renderGallery` headings.

[AMENDED 2026-03-29]:
## Current Task:
Implemented side-by-side Split View reading mode.
- Push all changes to remote repo `Otterdays/835`

## Actions Log:
- [2026-03-29] Added Split View Mode with a floating action button on desktop viewports.
- [2026-03-29] Upgraded contract container layout to flex row when split mode is active.
- [2026-03-28] Added a mobile-specific "Quick Jump" dropdown that appears on smaller screens to allow easy document traversal.
- [2026-03-28] Fixed DOM load timing bug in initial rendering of the floating desk by hoisting DOM element assignments.
- [2026-03-28] Synthesized official contract text for Pages 2 through 8 from user-provided images.
- [2026-03-28] Implemented "Floating Navigation Desk" - a live, side-fixed table of contents that tracks the current article in view using Intersection Observer.
- [2026-03-28] Added smooth-scroll anchor links to the navigation desk for rapid document traversal.
- [2026-03-28] Highlighting active article cards with premium border/glow effects during scroll.
- [2026-03-28] Expanded the 'Scanned Pages' gallery to include all 8 pages with descriptive captions.

## [0.4.0] - 2026-03-29
- Added Split View toggle for side-by-side article reading.
- Updated main container responsive layout with dynamic width adjustments up to 1400px.
- Enhanced Javascript renderer to support mirroring articles across split panes.

## [0.3.0] - 2026-03-28
- Implemented Mobile Quick Jump dropdown menu.
- Optimized responsive layout for smaller viewports.
- Enhanced navigation visibility across different views.

## [0.2.0] - 2026-03-28
- Synthesized Pages 2-8 of the official contract.
- Implemented Floating Navigation Desk (Live Side Table of Contents).
- Added smooth scrolling and active-state tracking for contract articles.
- Expanded scanned document gallery to 8 pages.

## [0.1.0] - 2026-03-27
- [2026-03-27] Deployed/Pushed basic implementation to remote repository: Otterdays/835
- [2026-03-27] Migrated design to a light theme for improved readability for older crowds
- [2026-03-27] Inserted hidden "natee" text string into sample data (Article 10) for search testing
- [2026-03-27] Freshened up README with GitHub badges, styled layout, and click-able live links
- [2026-03-27] Added interactive slide-out sidebar menu featuring views for Contract and new RCF Employees data
- [2026-03-27] Refined CSS media queries for improved mobile interface responsiveness and button overlap prevention
- [2026-03-27] Added 'Shop Stewards' profile section with leadership posters for Trevor (CFCF) and Justin (RCF)
- [2026-03-27] Added interactive 'Scanned Pages' gallery to display original contract images (page_1.jpg)
- [2026-03-27] Synthesized Page 1 of the official contract from user-provided image (page_1.jpg)
- [2026-03-27] Cleared sample contract data and replaced with authentic Article I: Recognition & Scope
- [2026-03-27] Enhanced script.js to handle multiline contract content and preservation of formatting in search highlights
<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->

[AMENDED 2026-11-18]:
## Current Task:
Continue Local 835 account system: registration/sign-in, profile pages, member directory, comments wall, account-aware forum, shell/navigation, and durable documentation.

## Actions Log:
- [2026-11-18] Added `signin.html`, profile view/editor, member directory, profile UI helpers, and fixed-choice Myspace-inspired profile styling.
- [2026-11-18] Reworked forum browser UI to remove local guest-name posting; new posts use the signed-in server session, with profile links and badges. Legacy guest posts remain readable.
- [2026-11-18] Added account side-panel links, navigation/search/Home links, sign-up environment variables, account documentation, and updated project maps.
- [2026-11-18] Refined mobile account usability: grouped profile fields, larger controls, safe-area-aware save button, one-column mobile results, and collapsed password-change panel.
- [2026-11-18] Updated smoke-check expectations and API/file maps. Tests were not run in this continuation.

## Next Steps:
- Configure signup policy (`SIGNUP_CODE` or `SIGNUP_CLOSED`) in the production environment before sharing account creation.
- Validate the account APIs against the configured MongoDB/Vercel environment and review the complete diff before committing or deploying.

[AMENDED 2026-11-18]: Reworked `contract.html` into a compact agreement-first reading flow. The first section guides members across the proposed 2026–27 term, pay/GWI, pension/layoffs, discipline, and forced-overtime terms, with direct memorandum scan links and a clear statement that ratification/signature is not confirmed by the supplied copy. The existing searchable 2022–26 CBA browser follows. Mobile rules prioritize compact header spacing, horizontal touch-friendly section links, readable text, and large source links. Existing CBA page 24–26 workspace edits were preserved.
[AMENDED 2026-11-18]: Simplified mobile site search by hiding the keyboard shortcut chip row at the mobile breakpoint; desktop hints and keyboard controls remain intact.
[AMENDED 2026-11-17]: Removed the Bargaining Tools destination from `home.html` member resources; the standalone page and its other routes remain unchanged.
[AMENDED 2026-11-17]: Site roster task completed in `data.js`; removed Anthony and rogue duplicate Vetter, corrected/additional employee details and statuses, and synced Charles/Orlando PICC steward roles. Recorded the member-facing change in `updates.html`. No dependencies changed.
[AMENDED 2026-11-17]: Expanded the roster with the additional CFCF, RCF, and PICC employees; corrected Kevin Lyons and synced his assistant steward listing; added the numbered management chain. Member update and durable notes recorded.

[AMENDED 2026-11-17]: Calendar correction: recurring union-wide meetings are every third Wednesday of the month; time and venue were not supplied. The December 8, 2026, 7:00 p.m. meeting at 5th and Willow is for assistant shop stewards and the chief shop steward only.

[AMENDED 2026-11-17]:
## Current Task:
Reorganize the member home page for clear mobile reading and a restrained professional appearance.

## Actions Log:
- [2026-11-17] Reduced hero height and decoration; clarified primary actions; grouped resource destinations; compacted facility and resource rows for touch use. Updated the member-facing project log. No dependencies added.

[AMENDED 2026-11-17]:
## Current Task:
Ingest CBA page 15 and continue Articles XX–XXII.

## Actions Log:
- [2026-11-17] Added page 15 scan/transcription, completed Article XX, added partial Articles XXI and XXII, and refreshed site search, bargaining reference, and member updates.

[AMENDED 2026-11-17]:
## Current Task:
Update all four State Road shop steward roles and remove their portraits.

## Actions Log:
- [2026-11-17] Replaced old steward contacts with Charles (Head Shop Steward), Kevin (CFCF), Ryan (RCF), and Orlando (PICC); removed portraits and promotional taglines from the steward directory.
<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
[AMENDED 2026-07-28]:
## Current Task:
Publish the new IUOE Local 835 Word and Markdown working documents in the member website.

## Actions Log:
- [2026-07-28] Added `member-documents.html` with Working Packet and Petition & Meeting Motion entries.
- [2026-07-28] Added Word download and Markdown source links for both documents.
- [2026-07-28] Linked Member Documents from the homepage and shared Documents navigation.
- [2026-07-28] Added both working documents to sitewide search.


[AMENDED 2026-11-17]:
## Current Task:
Refine the Community Forum for clear mobile reading and easier posting, keeping the existing Mongo-backed thread and reply behavior.

## Actions Log:
- [2026-11-17] Tightened the forum into a calmer Local 835 notice-board style: clearer thread hierarchy, larger tap rows, 18px body/control type, and a shorter reply field on phones. Preserved existing forum behaviors and added no dependencies.


[AMENDED 2026-11-17]:
## Current Task:
Rebuild the community forum front end in the active workspace using the existing Mongo forum API contract.

## Actions Log:
- [2026-11-17] Added the readable, mobile-first forum page and connected it to existing thread/reply endpoints; added home, navigation, and site-search entry points. No dependencies added.

[AMENDED 2026-11-17]: Supplied CBA photo was verified as printed page 13 (the existing gallery item), not page 14. Refreshed `images/page_13.jpg` at higher resolution; added the verbatim visible text to the page 13 scan metadata so sitewide scan search includes clauses as well as the Article XVII–XVIII contract transcription. Page 14's Article XIX holiday provisions still need their scan.

[AMENDED 2026-11-17]: Site continuity/search audit: added searchable entries for Home, Action Center, Evidence Log, Bargaining Tools, and Suggestions; normalized accents and punctuation; deduplicated query tokens; made data-load failures retryable and local results independent of forum availability. Forum search now uses Mongo text indexes for thread/reply content and is debounced with abort/timeout handling. Smoke checks now cover local HTML assets, shared shell/search loading, static-page index coverage, and forum search indexes.

[AMENDED 2026-11-17]: Digitized supplied printed page 14 to `images/page_14.jpg`; transcribed Article XIX Sections 1–4 and the visible beginning of Article XX Section 1 into contract articles and scan metadata. Page 14 now appears in Scanned Pages and sitewide search. Article XX is explicitly marked as continuing beyond the available scan.

[AMENDED 2026-11-17 8:26 p.m. EST]: Created member-facing `updates.html` with November 17 work grouped by verified EST repo-edit time: forum (7:16 p.m.), page 13 scan (7:49 p.m.), steward roles and portrait removal (8:01 p.m.), search/site continuity (8:12 p.m.), and page 14 (8:17 p.m.). Added home, shared-navigation, and site-search links. Listed page 15+ and additional verified information as upcoming work.

[AMENDED 2026-11-17]: Created `DOCS/CONTRACT_PAGE_INGESTION.md` with the scan-to-site checklist: source/page identity, faithful OCR review, image handling, article continuation IDs, scan metadata, search and deep links, update timestamps, preservation, validation, and handoff. Replaced root `AGENTS.md` with current shared rules and added `CLAUDE.md` importing it for cross-environment consistency. Owner's standing push authorization is recorded in AGENTS.md.

[AMENDED 2026-11-17 8:42 p.m. EST]: Added shared Codex/OpenAI and Claude Code entrypoints (`AGENTS.md`, `CLAUDE.md`) and `DOCS/CONTRACT_PAGE_INGESTION.md`, documenting source checks, faithful transcription, article continuation, scan metadata, search/deep links, dated updates, partial text, and verification for future pages. Smoke checks now cover update pages, scan assets, search targets, and agent-rule wiring. `npm run test:smoke`, `npm run check:deploy`, JavaScript syntax checks, and `git diff --check` passed. Owner authorized pushing the entire current project state and following project commits to `origin`; inspect full diff, exclude secrets/local-only files, and never force-push.

[AMENDED 2026-11-17 8:50 p.m. EST]: Digitized supplied printed page 15 to `images/page_15.jpg` (converted from the supplied 2552×3508 PNG to high-quality JPEG for the archive; inspected the full page after conversion). Added Article XX Sections 2–4 to complete Pension across pages 14–15; added Article XXI Wages Sections 1–2; added Article XXII Health Care Insurance Section 1 as partial. Added `cba-p15` scan transcription and search row, updated archive range and bargaining status, and linked all three articles from Project Updates. Article XXI and XXII continuations remain pending. No dependencies changed.

[AMENDED 2026-11-17 8:53 p.m. EST]:
## Current Task:
Audit member portal behavior for bugs and mobile edge cases.

## Actions Log:
- [2026-11-17 8:53 p.m. EST] Fixed mobile sidebar width parsing, safe Markdown evidence export cells and delayed download URL cleanup, and site-search dialog focus restoration/keyboard containment. No test suite was run during this audit.

[AMENDED 2026-11-17 9:12 p.m. EST]: Search-system audit found the contract search was literal-only, sitewide result highlights did not follow accent-folded matching, the 12-result cap was not explained, the dialog lacked a visible close button, and mobile Document Tools stayed expanded/sticky. Updated global results with safe diacritic-aware highlights, ranked numbers, visible total/truncation guidance, live keyboard-selection status, accessible close/focus handling, and deferred forum requests until a meaningful query. Contract search now folds punctuation/accents, requires all query words, and highlights each match. Document Tools is an accessible disclosure, collapsed and non-sticky on screens up to 767px; `/` and direct focus links expand it. Added smoke checks and Project Updates entry. No dependencies changed.

[AMENDED 2026-11-17 9:36 p.m. EST]: Final search verification passed: `npm run test:smoke`, `npm run check:deploy`, `node --check js/site-search.js`, `node --check js/contract-app.js`, and `git diff --check`. Added cached punctuation-folded text maps and tests for the normalized search/disclosure behaviors. A local browser preview could not start because sandbox networking denied the local server; no visual mobile-browser pass is claimed.

[AMENDED 2026-11-17 9:38 p.m. EST]: Final run after the keyboard/closed-dialog race guard and ranked-list accessibility changes: smoke, deploy, syntax, and diff checks all passed. Added CSS coverage confirming the mobile Document Tools toolbar is static/collapsible. Latest search update is dated 9:38 p.m. EST.

[AMENDED 2026-11-17]: Mapped the repository for future navigation. Added `PROJECT_MAP.md` and folder maps under `DOCS/`, `api/`, and `js/`; linked the maps from `AGENTS.md` and `CLAUDE.md`. Recorded stale auth and missing agreement-page references as observed oddities without changing application behavior.

[AMENDED 2026-11-17]:
## Current Task:
Digitize the supplied printed CBA page 16.

## Actions Log:
- [2026-11-17 11:04 p.m. EST] Added the full-resolution page image and scan record `cba-p16`. Extended Article XXII with visible Sections 1–3 across pages 15–16; added Article XXIII Sections 1–3, marked as continuing beyond page 16. Updated the scan range, bargaining snapshot, member updates, and durable project notes. Preserved the pre-existing uncommitted roster edits in `data.js`.
[AMENDED 2026-11-17]: Added Mike Knepper (RCF Locksmith), Jason Kinser (CFCF Locksmith), Scott (Warehouse crew), Bryan Phillips and Dan Pagano (Kitchen roles), Eric Moran (PICC Helper), Andrew (PICC Locksmith), and Xavior (CFCF Helper) to the roster; added the member-facing update.

[AMENDED 2026-11-17]:
## Current Task:
Digitize the supplied printed CBA page 17.

## Actions Log:
- [2026-11-17 11:12 p.m. EST] Added the full-resolution page image and scan record `cba-p17`. Completed Article XXIII Miscellaneous Sections 1–9 across pages 16–17; added Article XXIV Term of Agreement Section 1 and the visible start of Section 2, marked partial beyond page 17. Updated the scan range, bargaining snapshot, member updates, and durable project notes.

[AMENDED 2026-11-17]:
## Current Task:
Digitize the supplied printed CBA page 18.

## Actions Log:
- [2026-11-17 11:14 p.m. EST] Added the full-resolution page image and scan record `cba-p18`. Completed Article XXIV Term of Agreement Sections 1–2 across pages 17–18. Transcribed printed signatory names/titles and visible dates without guessing handwritten signatures. Updated the scan range, bargaining snapshot, member updates, and durable project notes.

[AMENDED 2026-11-17]:
## Current Task:
Digitize the supplied printed CBA pages 19 and 20 (Exhibits A and B).

## Actions Log:
- [2026-11-17 11:28 p.m. EST] Added full-resolution scans and gallery/search records `cba-p19` and `cba-p20`. Transcribed Exhibit A into Article XXII and all Exhibit B wage rates into Article XXI. Updated the archive range, bargaining snapshot, member updates, and durable project notes.

[AMENDED 2026-11-17]:
## Current Task:
Digitize the supplied printed CBA pages 21–23, Exhibit C.

## Actions Log:
- [2026-11-17 11:39 p.m. EST] Added full-resolution scans and page-specific gallery/search records `cba-p21` through `cba-p23`. Transcribed Exhibit C Substance Abuse Policy across its introduction/definitions, general policy, and random testing provisions; connected the exhibit to Article XXIII, Section 9. Updated archive range, bargaining snapshot, member updates, and durable project notes.

[AMENDED 2026-11-18]:
## Current Task:
Digitize the supplied printed CBA pages 24–26, continuing Exhibit C.

## Actions Log:
- [2026-11-18 12:02 a.m. EST] Added full-resolution scans and page-specific gallery/search records `cba-p24` through `cba-p26`. Extended Exhibit C within Article XXIII, retained page 26's incomplete ending, and marked the procedure partial. Updated archive range, bargaining snapshot, member updates, and durable project notes.

[AMENDED 2026-11-18]:
## Current Task:
Digitize the supplied printed CBA page 27, continuing Exhibit C.

## Actions Log:
- [2026-11-18 9:59 a.m. EST] Added the full-resolution page image and gallery/search record `cba-p27`. Continued Exhibit C's investigation questions in Article XXIII; preserved the printed numbering, including the visible “(13)” followed by “(2)”, and marked the page's ending after question 11. Updated archive range, bargaining snapshot, member updates, and durable project notes.

[AMENDED 2026-11-19]:
## Current Task:
Refine the sign-in / create-account page (`signin.html`).

## Actions Log:
- [2026-11-19, time not recorded] Replaced the banner hero with a plain heading, removed the stray "change password" link, shows the Change password form only to signed-in members who open it from the menu, added an honest "forgot your password" note (officer reset; no email reset yet), helper text for username/display name/password/sign-up code, padded footer note, larger card titles and Show/Hide toggle, loading and error states, and a "continue to the forum/profile" notice from `?next=`. New accounts land on the profile editor. Checked at desktop and 375px widths in a static preview (no API there); `npm run test:smoke` passed. Detector findings left standing are in shared `style.css` selectors this page does not use.
