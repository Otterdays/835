<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# Security review checklist — Member Action Center roadmap

Date: 2026-07-28

## Before first private Vercel deploy

- [ ] Repository is **private**; public GitHub Pages demo disabled
- [ ] `npm run check:deploy` passes
- [ ] `.env` / `AUTH_SECRET` / `MONGODB_URI` set in Vercel (not committed)
- [ ] `npm run seed:user` created at least one admin in Mongo
- [ ] Middleware redirects unauthenticated requests for HTML / `data.js` / `images/`
- [ ] `source/` absent from production deployment
- [ ] Login page does not display shared sample passwords
- [ ] Rate limiting on `/api/auth/login` exercised (expect 429 after repeated failures)

## Before enabling any server-stored member content

- [ ] Retention policy written (who can read grievances / updates)
- [ ] Bargaining updates require V/R/A/Q/L status + citation fields
- [ ] No unbounded arrays embedded on user documents
- [ ] Second security review of write APIs

## Residual accepted risks (current)

- Local `npx serve` + `local.auth.json` remains a **dev-only** deterrent, not production security
- Article XIX holiday body still pending later scan OCR
- Suggestions / evidence remain client export-only (intentional)
