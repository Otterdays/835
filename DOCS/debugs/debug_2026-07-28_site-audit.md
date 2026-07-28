<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# Site audit — 2026-07-28

## Scope

Full-site audit after organize + login gate. Structure, asset paths, auth wiring, security posture, docs drift. Followed `AGENTS.md` (SUMMARY → SBOM → SCRATCHPAD → STYLE_GUIDE). Security review of uncommitted gate changes + functional defect pass.

## Verdict

Site is **structurally healthy** for local / private-repo verification. The login gate is a **UI deterrent only** — not confidentiality. Ready for continued local work; **not** ready as a public “members only” host until Vercel/Mongo (or equivalent) gates data and assets.

## Pass

| Check | Result |
|-------|--------|
| Folder map (`images/`, `source/`, `js/`, HTML at root) | Matches AGENTS / README |
| `data.js` image paths vs `images/` files | All 20 refs resolve |
| Auth script on every HTML page | Present |
| Nav / breadcrumbs Home → `home.html` | Correct |
| No root-level jpg/png leftovers | Clean |
| Page script dependency order (nav → shell → apps) | OK |
| Sample login on page (`admin` / `sample`) | Intentional for current stage |

## Findings (security)

| Severity | Finding | Location | Status |
|----------|---------|----------|--------|
| HIGH | `data.js`, `images/`, `source/` fetchable without session on static hosting | Host / static routes | Open — needs server auth |
| HIGH | Session forgeable via `sessionStorage` (any `{username}` JSON) | `js/auth.js` | Open — expected until API auth |
| MEDIUM | Working sample credentials in UI + client JS + README | `index.html`, `auth.js`, README | Open — intentional for now; remove before public go-live |
| MEDIUM | `source/` petition drafts in web root if deployed | `source/` | Open — exclude from deploy or keep private hosting |

## Findings (functional) — fixed this pass

| Severity | Finding | Fix |
|----------|---------|-----|
| P2 | Protected pages loaded `auth.js` at end of body (content flash before redirect) | Moved `auth.js` into `<head>` on all protected pages |
| P2 | `launch.bat` missing `cd /d "%~dp0"` (wrong cwd if launched elsewhere) | Added cwd fix |

## Docs drift noted

- `ARCHITECTURE.md` opening still describes legacy SPA + `script.js` (historical; amended notes supersede).
- June note “all pages load shell/search” is false for login `index.html` — annotated in ARCHITECTURE this audit.

## Next steps (do not block local use)

1. Private repo + authenticated host (Vercel middleware / Access) before treating content as confidential.
2. Replace `js/auth.js` `ACCOUNTS` + sessionStorage with server session + Mongo.
3. Keep `source/` out of public deploy (gitignore deploy exclude or private storage).
4. Remove on-page credential hint and README sample password before any public URL.

## Residual risk

Anyone with the URL can still pull CBA text, roster, and scans by fetching static files. Treat current gate as “casual browser redirect,” not security.

[AMENDED 2026-07-28]: **Exposure containment started (roadmap Phase 0).**
- Removed public GitHub Pages badge/URL and on-page sample credentials from login/README/launcher.
- `member-documents.html` no longer links to `source/` downloads; `.vercelignore` excludes `source/`, DOCS, and local secrets.
- Added `.gitignore`, `.env.example`, `local.auth.example.json`. Repo must remain **private**; real route protection lands in Phase 1 (Vercel middleware + Mongo).
