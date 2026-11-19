# js/
**Purpose:** Browser-side authentication, profile and forum account flows, shared navigation/search, and page rendering.
**Keywords:** JavaScript, browser, page behavior, UI, navigation, menu, search, article, scans, roster, steward, forum

## Files
| File | What it does | Key symbols |
|---|---|---|
| `auth.js` | Provides the `Auth` browser object and current open/API/local access behavior | `Auth` |
| `signin-app.js` | Handles account sign-in, registration, password changes, and safe next redirects | — |
| `profile-ui.js` | Shared account API, avatar, badges, and member-safe DOM helpers | `ProfileUI` |
| `profile-app.js` | Renders member profiles, comments wall, and directory | — |
| `admin-app.js` | Admin panel client: account list, roles, titles, disable, password reset, audit log (admins only) | — |
| `profile-edit-app.js` | Profile editor: grouped fields, counters, picture/color pickers, Top 8 list, live preview, unsaved-changes warning | — |
| `login-app.js` | Handles the login/entry form and redirects to Home | — |
| `nav-config.js` | Defines shared menu groups and page IDs | `SITE_NAV`, `SITE_PAGE_IDS` |
| `theme.js` | Loaded in `<head>`: light/dark/auto choice (`localStorage` `oe835_theme`), sets `data-theme` on `<html>` | `SiteTheme` |
| `shell.js` | Renders navigation, breadcrumbs, the account footer (profile links, Sign out or Sign in), the Appearance (Auto/Light/Dark) switch, the floating forum bubble, and menu behavior | — |
| `site-search.js` | Builds the cross-page search index and handles result routing/highlighting | — |
| `contract-app.js` | Renders, searches, deep-links, and navigates CBA articles | — |
| `paneled-archive.js` | Renders and filters scan/policy archive panels | `filterScanQuery()`, `renderPaneledArchive()` |
| `image-modal.js` | Opens and closes the shared full-size image lightbox | `initImageModal()` |
| `scans-app.js` | Connects `cbaScannedPages` to the scan archive panel | — |
| `tool-app.js` | Connects `toolProgramScans` to the tool-policy archive panel | — |
| `stewards-app.js` | Renders and filters steward contacts by facility | — |
| `employees-app.js` | Renders, searches, filters and sorts (A-Z by first name) the employee roster; phone A-Z jump rail | — |
| `member-action-app.js` | Copies grievance-preparation worksheets and related text | — |
| `evidence-log-app.js` | Keeps evidence entries in memory and exports Markdown | — |
| `bargaining-app.js` | Copies factual bargaining meeting language | — |
| `suggestions-app.js` | Saves structured suggestions locally and supports share/copy | — |
| `forum-app.js` | Manages account-backed forum views, signed-in posting, author badges, replies, and API calls | — |

## Connects to
- Page markup and script loading are in root `*.html` files; current page-to-script wiring is summarized in `../DOCS/ARCHITECTURE.md`.
- Contract, scan, steward, and roster data comes from `../data.js`.
- Shared nav: `nav-config.js` → `shell.js`; search uses `site-search.js`.
- Forum client calls `/api/forum/*`; server handlers are mapped in `../api/forum/_MAP.md`.
