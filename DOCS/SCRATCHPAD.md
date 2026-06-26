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
