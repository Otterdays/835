<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->

[AMENDED 2026-11-17]: **Home page readability.** Reorganized the State Road member home page with a restrained, compact layout, clear primary actions, facility steward links, and grouped resource links sized for mobile reading.

[AMENDED 2026-11-17]: **CBA page 15.** Added the page 15 scan; completed Article XX Pension Sections 1–4 across pages 14–15; transcribed Article XXI Wages Sections 1–2 and the opening of Article XXII Health Care Insurance. Updated scan search, article coverage, bargaining reference, and member updates. Articles XXI and XXII remain partial.

[AMENDED 2026-11-17]: **Steward roster.** Updated the four Local 835 State Road contacts to Charles (Head Shop Steward), Kevin (Assistant Shop Steward, CFCF), Ryan (Assistant Shop Steward, RCF), and Orlando (Assistant Shop Steward, PICC). Removed steward portraits and promotional taglines.

[AMENDED 2026-11-17]: **Community forum.** `forum.html` lets members post threads and replies under a temporary, self-chosen username stored only in their browser (changeable under Account options). Posts persist in MongoDB Atlas through Vercel `api/forum/*`. No real login yet — names are unverified and unclaimed.

[AMENDED 2026-11-17]: **2026–27 tentative agreement.** Added a member-facing companion page for the October 2, 2026 memorandum, preserving all three page images and the source PDF under `images/2026-27/`. The transcription and scan rows cover the proposed term extension, weekly pay, GWI, layoffs, pension, badge pulling, and forced overtime. The page is labeled tentative; the supplied signature/date lines are blank and ratification is not confirmed.

[AMENDED 2026-11-17]: Added a project navigation index in `PROJECT_MAP.md` with folder maps in `DOCS/`, `api/`, and `js/`; linked it from the Codex/OpenAI and Claude Code instructions. The map records observed documentation/code mismatches without changing application behavior.
# Summary

[AMENDED 2026-11-18]: Checked PICC employee/trade data against the supplied 21-person roster image. Completed names and aligned roles/spellings, including Charles Worrell, Orlando Rivera, Andrew Patchak, Gregory Plotts, and Anthony Lange; kept Charles and Orlando's steward designations. Added a member-facing Project Updates entry.
[AMENDED 2026-11-18; superseded 2026-11-19]: An earlier correction abbreviated Patrick Martin as Pat Martin. The user clarified the full name is Patrick Martin and confirmed his PICC assignment; the duplicate CFCF entry has been removed.
[AMENDED 2026-11-19]: Confirmed Patrick Martin is assigned to PICC, not CFCF. Updated the roster and added a dated member-facing correction.

[AMENDED 2026-11-18]: **Agreement-first contract reader.** Reworked `contract.html` to reduce the oversized opening area and guide members through the 2026–27 tentative memorandum first, with direct links to each source scan page. Kept ratification/signature status clearly unconfirmed from the supplied copy, then placed the searchable 2022–26 CBA article reader below.

[AMENDED 2026-11-18]: Hid the four keyboard shortcut chips in the site search dialog on mobile to simplify the header; desktop keyboard guidance remains visible.

[AMENDED 2026-11-17]: Removed the Bargaining Tools link from the Home page member resources list, as requested. The page remains available elsewhere in the portal.

[AMENDED 2026-11-17]: Corrected Monica Manning, Robert Korchak, and Xavier Wilson in the roster; added Elliott Pinto and Barry Sanchez as CFCF Helpers.

[AMENDED 2026-11-17]: Expanded the roster with Mike Knepper (RCF Locksmith), Jason Kinser (CFCF Locksmith), Scott (Warehouse crew), Bryan Phillips (Kitchen Mechanic Helper), Dan Pagano (Kitchen Supervisor/Mechanic), Eric Moran (PICC Helper), Andrew (PICC Locksmith), and Xavier Wilson (CFCF Helper). See `data.js` and `updates.html`.

[AMENDED 2026-11-17]: **Roster expanded.** Added the supplied employee and trade entries across CFCF, RCF, and PICC, corrected Kevin Lyons as a CFCF painter while retaining his assistant steward role, and added the ordered management contacts: John Caroll (1, Project Manager), Jebouy John (2, Lead APM), and Vince Regalbuto (3, Assistant APM). See `data.js` and `updates.html`.

[AMENDED 2026-11-17]: **Site roster correction.** Removed Anthony and the duplicate Vetter entry; retained Bill Vetter as an RCF Laborer; updated Jerome Hudson, Jim Turner, Nate Villanueva, Nick Martino, and Ryan Lorenz; added Robert Korcheck and Ian Roonen at CFCF. Recorded the supplied injury and contested firing statuses. Charles and Orlando are listed as PICC engineers and their lead/assistant steward roles are synced to the steward directory. See the member-facing roster update in `updates.html`.

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

[AMENDED 2026-11-17 11:04 p.m. EST]: **CBA page 16 digitized.** Added `images/page_16.jpg` and scan/search record `cba-p16`. Completed Article XXII Health Care Insurance Sections 1–3 across pages 15–16. Added Article XXIII Miscellaneous Sections 1–3 (safety committee, uniforms, job postings), marked partial pending continuation. Updated the current scan range to pages 1–16+.

[AMENDED 2026-11-17 11:12 p.m. EST]: **CBA page 17 digitized.** Added `images/page_17.jpg` and scan/search record `cba-p17`. Completed Article XXIII Miscellaneous Sections 1–9 across pages 16–17. Added Article XXIV Term of Agreement Section 1 and the visible opening of Section 2; Article XXIV remains partial pending continuation. Current scan range is pages 1–17+.

[AMENDED 2026-11-17 11:14 p.m. EST]: **CBA page 18 digitized.** Added `images/page_18.jpg` and scan/search record `cba-p18`. Completed Article XXIV Term of Agreement Sections 1–2 across pages 17–18. Preserved the signature page and transcribed printed names/titles and legible dates without identifying handwritten signatures. Current scan range is pages 1–18+.

[AMENDED 2026-11-17 11:28 p.m. EST]: **CBA pages 19–20 digitized.** Added `images/page_19.jpg` / `cba-p19` for Exhibit A Health and Welfare Contributions and `images/page_20.jpg` / `cba-p20` for Exhibit B Wage Rates. Connected both exhibit transcriptions to Articles XXII and XXI respectively, including every listed job class and rate. Current scan range is pages 1–20+.

[AMENDED 2026-11-17 11:39 p.m. EST]: **CBA pages 21–23 digitized.** Added `images/page_21.jpg` through `images/page_23.jpg` and scan/search records `cba-p21` through `cba-p23`. Transcribed Exhibit C Substance Abuse Policy across its introduction, definitions, general policy, and random drug testing provisions; connected it to Article XXIII, Section 9. Current scan range is pages 1–23+.

[AMENDED 2026-11-18 12:02 a.m. EST]: **CBA pages 24–26 digitized.** Added full-resolution scans and gallery/search records `cba-p24` through `cba-p26`, extending the Exhibit C transcription in Article XXIII. Page 24 contains third-sample and reasonable-suspicion provisions; page 25 completes the reasonable-suspicion examples and removal procedure; page 26 contains treatment and the opening investigation procedure, which ends mid-sentence and remains partial. Current CBA scan range is through page 26.

[AMENDED 2026-11-18 9:59 a.m. EST]: **CBA page 27 digitized.** Added `images/page_27.jpg` and scan/search record `cba-p27`, continuing Exhibit C’s investigation questions within Article XXIII. The page reaches question 11 and any following questionnaire text is not shown in the supplied scan. Current CBA scan range is through page 27.


[AMENDED 2026-11-18]: **Member accounts and profiles.** Continued the account system with sign-in and registration, password change, member directory, editable Myspace-inspired profile pages, fixed-choice themes/avatars, Top 8 and comments wall. Forum posting now uses signed-in identity and shows profile links/badges while preserving legacy guest posts. See `DOCS/ACCOUNTS.md`.


[AMENDED 2026-11-18]: Refined account screens for phone use with grouped profile-edit sections, larger type and touch controls, safe-area-aware save action, a collapsed password-change disclosure, and simpler one-column directory/profile cards on narrow screens.
