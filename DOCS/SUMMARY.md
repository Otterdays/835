<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->

[AMENDED 2026-11-19]: Admin AI chat now shows an in-chat pending state, links known source/article citations to same-site pages in a new tab, and has no portal-level hourly/daily question cap. OpenRouter/provider limits still apply; admin account actions retain their rate limit.

[AMENDED 2026-11-19]: Admin desktop layout: widened the account/admin content to 82rem and gave the AI conversation more vertical display space (up to 56vh/44rem); mobile layout remains unchanged.

[AMENDED 2026-11-19]: Admin AI routing fix: strict ZDR requests continue to deny data-collecting endpoints; confirmed non-ZDR free-model requests allow those providers under the existing UI warning/confirmation. All requests remain server-validated `:free` models with zero maximum price. OpenRouter 404 errors now describe an unavailable provider route. See `DOCS/LLM_INTEGRATION.md`.

[AMENDED 2026-11-17]: **Home page readability.** Reorganized the State Road member home page with a restrained, compact layout, clear primary actions, facility steward links, and grouped resource links sized for mobile reading.

[AMENDED 2026-11-17]: **CBA page 15.** Added the page 15 scan; completed Article XX Pension Sections 1–4 across pages 14–15; transcribed Article XXI Wages Sections 1–2 and the opening of Article XXII Health Care Insurance. Updated scan search, article coverage, bargaining reference, and member updates. Articles XXI and XXII remain partial.

[AMENDED 2026-11-17]: **Steward roster.** Updated the four Local 835 State Road contacts to Charles (Head Shop Steward), Kevin (Assistant Shop Steward, CFCF), Ryan (Assistant Shop Steward, RCF), and Orlando (Assistant Shop Steward, PICC). Removed steward portraits and promotional taglines.

[AMENDED 2026-11-17]: **Community forum.** `forum.html` lets members post threads and replies under a temporary, self-chosen username stored only in their browser (changeable under Account options). Posts persist in MongoDB Atlas through Vercel `api/forum/*`. No real login yet — names are unverified and unclaimed.

[AMENDED 2026-11-17]: **2026–27 tentative agreement.** Added a member-facing companion page for the October 2, 2026 memorandum, preserving all three page images and the source PDF under `images/2026-27/`. The transcription and scan rows cover the proposed term extension, weekly pay, GWI, layoffs, pension, badge pulling, and forced overtime. The page is labeled tentative; the supplied signature/date lines are blank and ratification is not confirmed.

[AMENDED 2026-11-17]: Added a project navigation index in `PROJECT_MAP.md` with folder maps in `DOCS/`, `api/`, and `js/`; linked it from the Codex/OpenAI and Claude Code instructions. The map records observed documentation/code mismatches without changing application behavior.
# Summary

[AMENDED 2026-11-19]: Built the Free-only OpenRouter admin AI assistant. New: `api/_lib/ai-catalog.js` (free-only `:free` catalog with strict-ZDR detection from `/endpoints/zdr`), `api/_lib/ai-context.js` (retrieval over the generated `api/_lib/ai-site-data.json`; roster/steward/`updates.html` excluded), `api/_lib/ai.js` (hardcoded OpenRouter URL, `max_price` 0, `data_collection:"deny"`, provider-only for strict models), `api/_lib/admin-ai.js` (status + ask: server allowlist, 10/h per admin, 30/day site, `admin_ai_log` metadata), admin panel AI section (`admin.html` + `js/admin-ai.js`, text-only), styles (`profile.css`/`dark.css`), `tests/llm.js`, deploy-check key scanning, `.env.example` entries, and `api/_lib/ai-site-data.json` built by `npm run build:ai-context` with a roster-name leak guard.

[AMENDED 2026-11-19]: Added Bryant Barr as Local 835 Union President to the leadership directory and employee roster. Added a contract/employment notice that a small crew covered by an 835–USF agreement is working at the Philadelphia Detention Center; the agreement and crew list remain pending submission and review.
[AMENDED 2026-11-19]: Home page now links directly to Bryant Barr under union leadership and lists the Philadelphia Detention Center as a site. The roster has a DC filter and a pending crew-list message until the agreement and names are provided.
[AMENDED 2026-11-19]: Added temporary DC assignments for Joe Delcampo, Patrick "Pat" Martin, Robert "Rob" Martin, Paul "Paulson" Avarachan, Andrew Gniewek, and Albert "Al" Andalis, preserving their primary facilities. The roster marks temporary assignments, and the worksite notice distinguishes the supplied names from a complete verified crew list. The 835–USF agreement remains pending review.
[AMENDED 2026-11-19]: The earlier DC roster note's pending-names language is superseded: six names are now listed as temporary assignments. Confirmation that these are the complete covered crew and review of the 835–USF agreement remain pending.
[AMENDED 2026-11-19]: Corrected the temporary DC list: Albert "Al" Andalis remains at CFCF; Eric Moran is temporarily assigned to DC. The list still has six names, with complete-crew confirmation and agreement review pending.
[AMENDED 2026-11-19]: Expanded admin AI retrieval to include published roster names, roles/trades, facilities, and steward directory entries so admins can ask about them. Injury/termination notes, private contacts, accounts/profiles, forum posts and Project Updates body text remain excluded. Owner approved other free models with the existing per-model privacy warning and confirmation.

[AMENDED 2026-11-19]: Moved Mongo, session, password, and login-rate helpers into `api/_lib/` to keep Vercel from counting helper modules toward its Hobby serverless-function deployment cap. Updated imports and maps.
[AMENDED 2026-11-19]: Added a standing agent rule for Vercel Hobby's 12-function-per-deployment cap: keep shared helpers under `api/_lib/`, recount endpoints before API pushes, and verify successful deployment and Node 26 runtime.
[AMENDED 2026-11-19]: Added click-to-show password controls to sign-in and account creation; controls toggle between Show and Hide and expose pressed state to assistive technology.

[AMENDED 2026-11-19]: Improved admin AI OpenRouter limit visibility. The server reads only `free_model_daily_requests` from the current-key endpoint and reports sanitized counters; 429/402 errors distinguish documented OpenRouter account limits from upstream shared provider capacity and include safe retry/reset details when supplied. The key, raw provider body, and other key metadata are never returned. Provider requests remain single-shot without retries.

[AMENDED 2026-11-19]: Pinned project Node.js engine to `26.x` in the package manifest and lockfile to keep Vercel deployments on Node 26.

[AMENDED 2026-11-19]: Added a native tooltip reading “BEST IN CLASS ASSHOLES” to the Management group heading in the member roster, per user request.
[AMENDED 2026-11-19]: Replaced the delayed native tooltip with an immediate custom tooltip on the Management heading and each management card; added keyboard focus access.
[AMENDED 2026-11-19]: Moved John Carroll III (3 · Supervisor) and Roman Solecki (4 · Warehouse Supervisor) from Supervisors into the Management roster group, preserving the supplied rank numbers and titles. Added a member-facing Project Updates entry.
[AMENDED 2026-11-19]: Added Chris Mallon (PICC Painter), Cregg Lix and Keith Doyle (CFCF Painters), Elias Pinto and Stever Driscoll (CFCF Stationary Engineers), and Pat Murphy (part-time Warehouse Crew). Roman Solecki remains Management #4 and is also listed in Warehouse as Warehouse Crew.

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
[AMENDED 2026-11-19]: Sign-in page refined for clarity and older-member readability; password reset remains an officer task via `npm run manage:user`.
[AMENDED 2026-11-19]: Forum board view added (all topics visible at once, columns per category); profile-page helper-script bug fixed.
[AMENDED 2026-11-19]: Job titles on profiles are limited to the 17 trades on the site roster.
[AMENDED 2026-11-19]: Admin accounts now show a Site Admin badge; Lead Admin title available through `npm run manage:user`.
[AMENDED 2026-11-19]: Profile editor improved (live preview, Top 8 list, back link); dropdown "none" bug fixed.
[AMENDED 2026-11-19]: Admin panel (accounts, roles, titles, disable, password reset) for admins only.
[AMENDED 2026-11-19]: Forum deletion for authors and admins.
[AMENDED 2026-11-19]: Job title list updated: kitchen supervisor and kitchen mechanic are separate; stationary and building engineer are separate.
[AMENDED 2026-11-19]: Members can add clickable links to their profile and choose from five light and four dark themes; admins can remove links.
[AMENDED 2026-11-19]: Roster additions (Mike Brown, Lauren Battilana) and support for people who work at two facilities (`alsoAt`); Mike Henry is at RCF and CFCF.
[AMENDED 2026-11-19]: Menu has clearer section headings and a proper account footer with Sign out on every page.
[AMENDED 2026-11-19]: Forum board has scroll arrows that appear only when the board scrolls sideways.
[AMENDED 2026-11-19]: A floating forum speech bubble links to the forum from most pages.
[AMENDED 2026-11-19]: Whole portal has Auto/Light/Dark appearance from the menu, remembered per device; member profile themes keep their own colors.
[AMENDED 2026-11-19]: Site Roster: added Luong Trinh, Mathew-George, William Bates, Baris Kaya, Justin Lowe, Ho Song; Adrian Molina now Welder, Michael Jones now CFCF Painter, Sabu now Sabu Gokul (Building Engineer, RCF). New "Supervisors" group (John Carroll III 3, Roman Solecki 4, shift supervisors 5) and "Security" group: electronic security techs are one entry under Security, no longer repeated under every building. JOB_TITLES: Welder replaces Maintenance Mechanic.

[AMENDED 2026-11-19]: **CBA pages 28–30 digitized.** Added `images/page_28.jpg` through `images/page_30.jpg` and scan/search records `cba-p28` through `cba-p30`. Continued Exhibit C in Article XXIII through the reasonable-suspicion questions, testing procedures, cutoff levels, federal workplace notice, and Drug-Free Awareness Program. Printed page 30 concludes the supplied Exhibit C text; current CBA scan range is pages 1–30. Updated the bargaining reference and member-facing Project Updates entry.

[AMENDED 2026-11-19]: Planned (not built) an admin-only AI chat assistant through OpenRouter (no Google services); design, Vercel/key handling, and open owner questions are in `DOCS/LLM_INTEGRATION.md`.
[AMENDED 2026-11-19]: Updated the planned admin AI assistant to the owner's strict FREE ONLY requirement. The plan now calls for API-discovered `:free` zero-price chat models, server-enforced allowlisting with no paid fallback, no member personal data in context by default, and a model-selector/privacy/quota/error UX plus TDD acceptance plan. No code is built; see `DOCS/LLM_INTEGRATION.md` for current official references.

[AMENDED 2026-11-19]: Added Mark to the CFCF employee roster as a Project Management Assistant; the supplied name was “Mark” with no surname.

[AMENDED 2026-11-20]: Admin AI assistant now handles reasoning-model output budgets and retries busy/empty free models on backups without widening privacy (see `DOCS/LLM_INTEGRATION.md`).

[AMENDED 2026-11-20]: Admin AI assistant has an Auto mode that picks the healthiest free model (live uptime + own recent results), zero-retention first.
[AMENDED 2026-11-20]: Corrected the temporary site code from DC to DOC (Department of Corrections) in the live roster, Home link, roster search/filter, and member notices. Added and transcribed the one-page DOC Hospital Temporary Project side letter in the scan archive (`doc-temp-2026-p1`); it specifies five volunteer positions and an approximate November 16–30, 2026 project window. The supplied scan shows Bryant Barr's Union signature dated November 13 and a blank Employer signature line. Existing six temporary roster assignments remain, without mapping individuals to the agreement's positions.
[AMENDED 2026-11-20]: Added home-screen installation support with a PWA manifest, Local 835 icons, shared install prompt and iOS/Android installation guidance. The prompt is delayed, hidden for installed apps, and snoozed on dismissal; it does not claim offline support.
[AMENDED 2026-11-20]: Added an Admin Documents section and a separate reserved section for future admin content. Both appear only on the existing admin-gated page and currently contain clear empty-state copy.
