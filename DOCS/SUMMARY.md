<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->

[AMENDED 2026-11-17]: **Home page readability.** Reorganized the State Road member home page with a restrained, compact layout, clear primary actions, facility steward links, and grouped resource links sized for mobile reading.

[AMENDED 2026-11-17]: **CBA page 15.** Added the page 15 scan; completed Article XX Pension Sections 1–4 across pages 14–15; transcribed Article XXI Wages Sections 1–2 and the opening of Article XXII Health Care Insurance. Updated scan search, article coverage, bargaining reference, and member updates. Articles XXI and XXII remain partial.

[AMENDED 2026-11-17]: **Steward roster.** Updated the four Local 835 State Road contacts to Charles (Head Shop Steward), Kevin (Assistant Shop Steward, CFCF), Ryan (Assistant Shop Steward, RCF), and Orlando (Assistant Shop Steward, PICC). Removed steward portraits and promotional taglines.

[AMENDED 2026-11-17]: **Community forum.** `forum.html` lets members post threads and replies under a temporary, self-chosen username stored only in their browser (changeable under Account options). Posts persist in MongoDB Atlas through Vercel `api/forum/*`. No real login yet — names are unverified and unclaimed.

[AMENDED 2026-11-17]: **2026–27 tentative agreement.** Added a member-facing companion page for the October 2, 2026 memorandum, preserving all three page images and the source PDF under `images/2026-27/`. The transcription and scan rows cover the proposed term extension, weekly pay, GWI, layoffs, pension, badge pulling, and forced overtime. The page is labeled tentative; the supplied signature/date lines are blank and ratification is not confirmed.

[AMENDED 2026-11-17]: Added a project navigation index in `PROJECT_MAP.md` with folder maps in `DOCS/`, `api/`, and `js/`; linked it from the Codex/OpenAI and Claude Code instructions. The map records observed documentation/code mismatches without changing application behavior.
# Summary

[AMENDED 2026-11-17]: **Member calendar.** `calendar.html` lists the union-wide meeting every third Wednesday and a separate December 8, 2026, 7:00 p.m. meeting at 5th and Willow for assistant shop stewards and the chief shop steward only. Linked from Home, shared navigation, and sitewide search; notable changes go in Project Updates.

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

[AMENDED 2026-11-17]: **CBA scan refresh.** Replaced the lower-resolution page 13 scan with a higher-resolution copy of the supplied image and added its full transcription to the scanned-page search index. The image is printed page 13 and ends at the Article XIX heading; page 14 holiday provisions remain pending the correct scan.

[AMENDED 2026-11-17]: **Site continuity + search.** Search indexes every static member page, normalizes punctuation and diacritics, retries a failed data load, and keeps local results responsive while forum results load. Mongo text indexes support matching forum threads and replies. `npm run test:smoke` checks page-local assets, shared shell/search wiring, and index coverage.

[AMENDED 2026-11-17]: **CBA page 14 digitized.** Added the page 14 scan and transcription of Article XIX Sections 1–4. Added Article XX’s visible pension Section 1 as a partial article with a continuation note. The previous page 13-only holiday pending note is superseded.

[AMENDED 2026-11-17 8:26 p.m. EST]: Added `updates.html`, a member-facing, time-stamped record of the November 17 forum, page 13, steward roster, search, and page 14 work. Linked it from site navigation, home, and sitewide search. Page 15+ and future member information are listed as next work.

[AMENDED 2026-11-17]: Added cross-agent page-ingestion guidance for future CBA scans in `DOCS/CONTRACT_PAGE_INGESTION.md`. `AGENTS.md` is the canonical Codex/OpenAI instruction file; root `CLAUDE.md` imports it for Claude Code sessions that load CLAUDE instructions only. README and architecture links updated.

[AMENDED 2026-11-17]: Added `contract-updates.html`, a member-facing contract and employment notices page. Its first item records the negotiated move from bi-weekly to weekly pay and attributes the timeline statement to USF / USF HR contact Susan Laramore-Johnson. It states that management has not established an implementation timeline and does not give an effective date. Linked from Home, shared navigation, and sitewide search.

[AMENDED 2026-11-17 8:42 p.m. EST]: Added the shared Codex/OpenAI and Claude Code project instructions and the end-to-end CBA/policy page ingestion guide. Added smoke coverage for update pages, scan assets, search indexes, and agent instruction loading. Smoke, deploy, syntax, and diff checks passed. Owner authorized full-project pushes to `origin` and subsequent project commits, subject to reviewing the full diff and excluding secrets/local-only files.

[AMENDED 2026-11-17 8:50 p.m. EST]: **CBA page 15 digitized.** Added `images/page_15.jpg` and scan/search record `cba-p15`. Completed Article XX Pension Sections 1–4 across pages 14–15; added Article XXI Wages Sections 1–2 and Article XXII Health Care Insurance Section 1. Articles XXI and XXII are partial pending continuation scans. Current archive range is pages 1–15+.

[AMENDED 2026-11-17 8:53 p.m. EST]: Mobile and edge-case audit: corrected invalid sidebar width math on narrow screens; preserved evidence-log Markdown table cells containing pipes/newlines and delayed Blob URL cleanup for mobile download handling; improved site-search dialog focus restoration and keyboard focus containment.

[AMENDED 2026-11-17 9:12 p.m. EST]: Search UX audit: sitewide results now show numbered ranking, diacritic-aware match highlights, match totals and truncation guidance, live keyboard status, and an accessible close control. Forum search waits for a meaningful query. Contract search now matches all query words across punctuation/diacritics and highlights matches. The Document Tools disclosure starts collapsed and is not sticky on mobile/small tablet screens; keyboard and deep-link search still open it.

[AMENDED 2026-11-17 9:36 p.m. EST]: Search changes verified by smoke, deploy, JavaScript syntax, and diff checks. Text normalization is cached per search entry; responsive rules collapse the contract tools on narrow screens. Local browser preview was unavailable because sandbox networking blocked the local server.

[AMENDED 2026-11-17 9:38 p.m. EST]: Re-ran smoke, deploy, JavaScript syntax, and diff checks after final keyboard and mobile adjustments; all passed.
