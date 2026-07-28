<div align="center">
  <h1>Operating Engineers Local 835</h1>
  <p><strong>State Road member document center</strong></p>
</div>

<br/>

A **private** document and member-action portal for **Operating Engineers Local 835** members employed by **U.S. Facilities** at CFCF, RCF, and PICC (Philadelphia / State Road). Sign in, then use the home gateway; each major area loads only the scripts it needs.

> **Hosting:** Keep this repository **private**. Do not publish via public GitHub Pages. Prefer Vercel with Mongo-backed auth so `data.js`, `images/`, and API routes are gated. Offline petition/working-packet drafts live in `source/` and are **excluded from deploy**.

## Features

- **Login** (`index.html`) — username/password; server session cookie when Vercel + Mongo are configured (`js/auth.js`).
- **Home** (`home.html`) — Local 835 / State Road identity, facility steward links, resource destinations.
- **Member Action Center** — grievance prep, issue→article routing, steward prep worksheet.
- **Contract / scans / tool program** — CBA viewer, paneled archives, deep links.
- **Evidence log & bargaining tools** — client-side export only; factual checklists.
- **Stewards / roster / suggestions** — site filters and structured share/copy feedback.
- **Sitewide search** — Ctrl+K or `/`.

## Local usage

```bash
git clone <private-repo-url>
cd 835
copy local.auth.example.json local.auth.json
copy .env.example .env
npm install
npm run dev
```

Or double-click **`launch.bat`** for a static file server (client-only gate; not production security).

Open **http://localhost:3000**. Create credentials in gitignored `local.auth.json` for local fallback, or set Mongo env vars for API auth.

## Architecture (short)

| Path | Role |
|------|------|
| `index.html` / `home.html` | Login + gateway |
| `member-action.html` | Grievance / issue hub / steward prep |
| `evidence-log.html` / `bargaining.html` | Local evidence export + bargaining checklists |
| `contract.html`, `scans.html`, `tool-program.html` | CBA and archives |
| `member-documents.html` | Summaries only (no `source/` downloads) |
| `api/auth/*` | Vercel login / logout / me |
| `middleware.js` | Protects HTML + `data.js` + `images/` |
| `source/` | Offline drafts — **not deployed** |
| `DOCS/` | Status docs and audits |

See `AGENTS.md` and `DOCS/` for agent and status detail.
