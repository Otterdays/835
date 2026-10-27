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

## Next Steps:
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
<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
[AMENDED 2026-07-28]:
## Current Task:
Publish the new IUOE Local 835 Word and Markdown working documents in the member website.

## Actions Log:
- [2026-07-28] Added `member-documents.html` with Working Packet and Petition & Meeting Motion entries.
- [2026-07-28] Added Word download and Markdown source links for both documents.
- [2026-07-28] Linked Member Documents from the homepage and shared Documents navigation.
- [2026-07-28] Added both working documents to sitewide search.
