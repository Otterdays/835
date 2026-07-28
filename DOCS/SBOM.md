<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# SBOM

[AMENDED 2026-07-28]: **Vercel + Mongo auth dependencies added.**

| Package | Version | Purpose | Risk notes |
|---------|---------|---------|------------|
| `mongodb` | ^6.17.0 | Atlas / Mongo driver for `users` + `login_attempts` | Official driver; keep URI in `.env` only |
| `jose` | ^5.10.0 | HS256 session JWT sign/verify (API + Edge middleware) | No known critical CVEs at install; pin major |

Fonts: Public Sans + Source Serif 4 (Google Fonts). No other runtime npm deps.

Dev workflow: `npm install`, `npm run seed:user`, `npm run vercel:dev` or static `npm run dev` with gitignored `local.auth.json`.

[AMENDED 2026-07-28]: Member Documents page added with no new dependencies.

## Dependencies
- Vanilla HTML/JS/CSS used. No external libraries or NPM packages added.
- Fonts: Google Fonts (Inter)
- Icons: None required for now.

[AMENDED 2026-07-28]: Still no NPM packages. Fonts in use: Public Sans + Source Serif 4 (Google Fonts). Auth remains client-side only (no Mongo/Vercel deps yet).
