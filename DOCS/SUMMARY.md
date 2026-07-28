<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# Summary

[AMENDED 2026-07-28]: **Secure Member Action Center roadmap (1.2.0).** Exposure containment + Vercel/Mongo auth scaffolding; Member Action Center; evidence log; bargaining tools; structured suggestions. Keep repo private; complete Vercel env + user seed before treating as confidential. Article XIX holidays still await later scan OCR. `member-documents.html` no longer serves `source/` downloads.

[AMENDED 2026-07-28]: **Member documents.** Added a protected `member-documents.html` resource page linking the IUOE Local 835 Working Packet and Petition & Meeting Motion in downloadable Word and openable Markdown formats.

[AMENDED 2026-07-28]: **State Road login.** `index.html` now shares the homepage identity: Local 835, State Road, U.S. Facilities, and CFCF / RCF / PICC. The existing form IDs and temporary sample login remain intact.

[AMENDED 2026-07-28]: **State Road homepage.** `home.html` now leads with Operating Engineers Local 835, identifies U.S. Facilities members at CFCF, RCF, and PICC in Philadelphia, and replaces portal-card grids with facility steward links plus a compact resource list.

[AMENDED 2026-07-28]: **Login gate + folder cleanup.** `index.html` is the sign-in landing (`admin` / `sample` via `js/auth.js` + sessionStorage). Document gateway lives at `home.html`. Media in `images/`; petition drafts in `source/`. Client-side auth is temporary until Vercel + Mongo. See `AGENTS.md`.

[AMENDED 2026-07-28]: **Site audit.** Structure/paths/auth wiring pass. Gate does **not** protect `data.js` / `images/` / `source/` on static hosting — see `DOCS/debugs/debug_2026-07-28_site-audit.md`. Fixed: `auth.js` in `<head>`, `launch.bat` cwd.

[AMENDED 2026-04-26]: Site is a **document gateway** (`index.html`) plus per-area pages (contract, scans, tool program, stewards, employees); logic split into `js/*-app.js` and shared helpers.

A single-page contract viewer application for "Operating Engineers 835". It provides a rich, modern UI to display and search through the company's contract document. Built using Vanilla HTML, CSS, and JS. Designed to be hosted on GitHub Pages.

[AMENDED 2026-04-26]: Scanned archive now includes CBA pages 9–13. Tool Control Program (2009) and lost-tool disciplinary steps (1998) textual data has been integrated directly into the Tool Program viewer page, removing them from the main contract viewer to maintain CBA focus.

[AMENDED 2026-06-26]: UX pass — grouped sidebar nav (`nav-config.js`), home portal sections, quick actions, roster/steward filters, live suggestions form (share/copy), breadcrumbs, **sitewide search** (`site-search.js`).

## Status:
- [UPDATED 2026-07-28]: Roadmap 1.2.0 — Action Center + auth API scaffolding; smoke/deploy checks green.
- [UPDATED 2026-07-28]: Login screen redesigned to match State Road / Local 835 homepage identity.
- [UPDATED 2026-07-28]: Home redesigned around Local 835, U.S. Facilities, and State Road facility context.
- [UPDATED 2026-07-28]: Site audit logged; auth-in-head + launch.bat fix. Gate remains deterrent-only.
- [UPDATED 2026-07-28]: Folder cleanup + client login gate (`admin`/`sample`); gateway at `home.html`.
- Initialized documentation structure
- Initialized web app structure
- [UPDATED 2026-04-26]: Expanded Shop Steward roster: Trevor (Lead), Justin (RCF), Jason (CFCF), and Andrew (PICC).
- [UPDATED 2026-04-26]: Reorganized Site Roster: Alphabetical sorting, grouped by facility (RCF, CFCF, PICC) with dedicated headings, and expanded horizontal grid layout. Added Andrew (Locksmith, PICC) and Jason (Locksmith, CFCF).
- [UPDATED 2026-04-27]: Added a barebones Suggestions page and updated all site sidebars to include the link. Renamed "Employees (RCF)" to "Site Roster" globally.
- [UPDATED 2026-06-26]: Sitewide search modal (`js/site-search.js`) indexes contract, scans, tool program, stewards, and roster from `data.js` (lazy-loaded on gateway pages). Shortcuts: Ctrl+K, `/` (except on contract page where `/` focuses CBA search). Deep links: `?q`, `?article`, `?item`, `?site`.
- [UPDATED 2026-06-26]: Navigation centralized in `js/nav-config.js` with grouped sidebar (Documents / People / Feedback). Breadcrumbs on subpages. Home portal split into sections; roster search + facility chips; steward site filter; suggestions share/copy form.
