<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# Summary

[AMENDED 2026-04-26]: Site is a **document gateway** (`index.html`) plus per-area pages (contract, scans, tool program, stewards, employees); logic split into `js/*-app.js` and shared helpers.

A single-page contract viewer application for "Operating Engineers 835". It provides a rich, modern UI to display and search through the company's contract document. Built using Vanilla HTML, CSS, and JS. Designed to be hosted on GitHub Pages.

[AMENDED 2026-04-26]: Scanned archive now includes CBA pages 9–13. Tool Control Program (2009) and lost-tool disciplinary steps (1998) textual data has been integrated directly into the Tool Program viewer page, removing them from the main contract viewer to maintain CBA focus.

[AMENDED 2026-06-26]: UX pass — grouped sidebar nav (`nav-config.js`), home portal sections, quick actions, roster/steward filters, live suggestions form (share/copy), breadcrumbs, **sitewide search** (`site-search.js`).

## Status:
- Initialized documentation structure
- Initialized web app structure
- [UPDATED 2026-04-26]: Expanded Shop Steward roster: Trevor (Lead), Justin (RCF), Jason (CFCF), and Andrew (PICC).
- [UPDATED 2026-04-26]: Reorganized Site Roster: Alphabetical sorting, grouped by facility (RCF, CFCF, PICC) with dedicated headings, and expanded horizontal grid layout. Added Andrew (Locksmith, PICC) and Jason (Locksmith, CFCF).
- [UPDATED 2026-04-27]: Added a barebones Suggestions page and updated all site sidebars to include the link. Renamed "Employees (RCF)" to "Site Roster" globally.
- [UPDATED 2026-06-26]: Sitewide search modal (`js/site-search.js`) indexes contract, scans, tool program, stewards, and roster from `data.js` (lazy-loaded on gateway pages). Shortcuts: Ctrl+K, `/` (except on contract page where `/` focuses CBA search). Deep links: `?q`, `?article`, `?item`, `?site`.
- [UPDATED 2026-06-26]: Navigation centralized in `js/nav-config.js` with grouped sidebar (Documents / People / Feedback). Breadcrumbs on subpages. Home portal split into sections; roster search + facility chips; steward site filter; suggestions share/copy form.
