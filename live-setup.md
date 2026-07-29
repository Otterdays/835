Here’s the production path for this repo.

## 1. MongoDB Atlas

1. Create a free/shared cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Database Access** → create a user (save username/password).
3. **Network Access** → allow Vercel egress. Easiest for first deploy: `0.0.0.0/0` (tighten later).
4. **Connect** → copy the `mongodb+srv://…` URI.
5. Use database name `oe835` (matches `.env.example`).

## 2. Local env + first user

```bash
cd C:\Users\Ryan\Desktop\835
copy .env.example .env
npm install
```

Edit `.env`:

```env
MONGODB_URI=mongodb+srv://USER:PASS@CLUSTER/oe835?retryWrites=true&w=majority
MONGODB_DB=oe835
AUTH_SECRET=paste-a-long-random-string-here
SESSION_TTL_HOURS=12
AUTH_LOCAL_FALLBACK=0
```

Generate a secret (PowerShell):

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

Seed an admin (uses your local `.env`):

```bash
npm run seed:user -- yourusername YourStrongPassword admin
```

## 3. Private GitHub + Vercel

1. Push to a **private** GitHub repo (do not use public Pages).
2. [vercel.com](https://vercel.com) → **Add New Project** → import that repo.
3. **Settings → Environment Variables** (Production + Preview):

| Name | Value |
|------|--------|
| `MONGODB_URI` | same Atlas URI |
| `MONGODB_DB` | `oe835` |
| `AUTH_SECRET` | same long secret as local |
| `SESSION_TTL_HOURS` | `12` |
| `AUTH_LOCAL_FALLBACK` | `0` |

4. Deploy. Confirm `source/` is not in the build (`.vercelignore` already excludes it).
5. Open the Vercel URL → sign in with the seeded user → you should land on `home.html`.

Optional local API test (real middleware + `/api/auth/*`):

```bash
npm run vercel:dev
```

(`npm run dev` / `launch.bat` is static-only; use `local.auth.json` there, not production.)

## 4. Before sharing with members

```bash
npm run check:deploy
npm run test:smoke
```

Then walk the checklist in `DOCS/debugs/debug_2026-07-28_security-checklist.md` (private repo, env set, seed done, no sample passwords, middleware gating HTML/`data.js`/`images/`).

**What you get:** HttpOnly session cookie, Mongo `users` + login rate limits, Edge middleware blocking unauthenticated access to pages and assets. **What stays local-only:** `local.auth.json` fallback and client-only evidence/suggestions export.