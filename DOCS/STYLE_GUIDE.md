<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# Style Guide

## Architecture
- `index.html`: Main layout
- `style.css`: Styles using CSS variables for theme and responsive layout
- `script.js`: DOM manipulation

[AMENDED 2026-04-26]: Per-page scripts under `js/*-app.js` plus shared `js/shell.js`, `js/paneled-archive.js`, `js/image-modal.js`. Legacy monolithic `script.js` removed.
[AMENDED 2026-06-26]: Shared `js/nav-config.js` (sidebar structure), `js/site-search.js` (sitewide modal). Page apps: `contract-app.js`, `scans-app.js`, `tool-app.js`, `stewards-app.js`, `employees-app.js`, `suggestions-app.js`.
[AMENDED 2026-07-28]: `index.html` = login; `home.html` = gateway. `js/auth.js` + `js/login-app.js`. Media in `images/`.
- `data.js`: Contract text, scan metadata, stewards, employees — also feeds sitewide search index when loaded

## Design Philosophy
- Premium light mode aesthetic (high-contrast for older crowds)
- Smooth transitions
- Fast search response
- Legible typography

## Data Ingestion & Digitization
- **Mandatory OCR/Transcription**: Any new scanned page (CBA or facility policy) must be digitized into `data.js`.
- **Searchability**: All transcribed text must be added to the `contractData.articles` array to ensure it is searchable in the main contract viewer.
- **Formatting**: Preserve section headers and list numbering from the original documents. Use backticks for multi-line content in `data.js`.
- **Gallery Sync**: When adding a new image, ensure both the text entry in `contractData.articles` and the image metadata in `cbaScannedPages` or `toolProgramScans` are updated.
- **Sitewide search**: New `cbaScannedPages` / `toolProgramScans` rows are picked up automatically when `label`, `title`, `description`, `section`, or `transcription` are populated. Rosters and stewards index from `employeesData` / `shopStewards`. Contract articles index from `contractData.articles`.

[AMENDED 2026-11-17]: Sitewide search also has a curated entry for each static member page. When adding or renaming pages, update `js/site-search.js` and `js/nav-config.js`; forum search queries the Mongo text indexes for both threads and replies. Keep `npm run test:smoke` local-link and search-coverage checks green.

[AMENDED 2026-11-17]: For future CBA or facility-policy scans, follow `DOCS/CONTRACT_PAGE_INGESTION.md`. It covers printed-page verification, faithful transcription, `contractData.articles`, scan metadata, search/deep links, dated updates, and cross-assistant instruction loading. Keep `AGENTS.md` canonical and import it from `CLAUDE.md`.
