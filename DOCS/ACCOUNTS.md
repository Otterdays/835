<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# Member accounts and profiles

Updated 2026-11-18.

## Account behavior

The document portal remains open to visitors. A signed-in account is required for forum posts and member profiles, profile editing, the member directory, and comments. `js/auth.js` checks `/api/auth/me` without redirecting guests from public portal pages. `signin.html` handles account creation and sign-in and accepts a restricted `?next=` destination.

Accounts live in MongoDB `users`; public profile data lives separately in `profiles`. Password hashes, salts, and session secrets are never returned to the browser. `api/auth/register.js` supports optional `SIGNUP_CODE` gating and `SIGNUP_CLOSED=1`; without a code, sign-up is open. Password changes require the current password and invalidate older sessions. Password recovery without email remains an officer task using `npm run manage:user password <username> <new-password>`.

## Member profiles

`profile.html` shows a member's public profile and comments wall. `profile-edit.html` edits only the signed-in member's own profile. `members.html` lists visible member profiles. Themes, background patterns, moods, and avatar glyphs/colors are fixed choices; member-entered fields render as text. There is no custom HTML, CSS, or image upload. A member may set a display name, headline, self-reported job title and facility, About Me, Interests, Who I'd Like to Meet, Top 8, mood, and visibility.

Verified badges and administrative roles cannot be self-assigned. Use `npm run manage:user badges`, `npm run manage:user badge <username> add|remove <badge-id>`, or `npm run manage:user role <username> member|steward|admin`. Titles describe verified Local 835 roles; job title and facility entered in a profile are marked self-reported.

## Forum identity

New forum threads and replies take the author from the signed-in session, not submitted form fields. Forum responses may include the author's public profile summary and awarded badges. Posts created before account login retain their original guest author text. Reading threads remains open; posting requires sign-in.

## API and data

- `api/auth/register.js`: registration availability and account creation.
- `api/auth/password.js`: authenticated password change.
- `api/profile/index.js`: fixed options, profile reads/edits, and member directory.
- `api/profile/comments.js`: profile comments wall.
- `api/_lib/accounts.js`: session resolution and safe profile/account response shaping.
- `api/_lib/profile-schema.js`: profile option lists and validation.
- `scripts/manage-user.js`: officer account/role/badge operations.

Mongo indexes for `profiles` and `profile_comments` are created in `api/_lib/mongo.js`. Runtime sign-up options are listed in `.env.example`. Browser helpers are in `js/profile-ui.js`, `js/profile-app.js`, and `js/signin-app.js`.

## Current boundaries

There is no web-based admin panel, email-based password reset, or verified connection to the static Site Roster. Signup policy should be configured in the live environment before sharing the registration link. Keep the repository private and never put account secrets in project documentation.

[AMENDED 2026-11-19]: Profile job title is a fixed list (`JOB_TITLES`, 17 roster trades), not free text. When the roster in `data.js` gains a new trade, add it to `api/_lib/profile-schema.js`; the smoke test will flag the mismatch. Steward titles remain verified badges.

[AMENDED 2026-11-19]: Admin markers. Every account with role `admin` automatically shows a dark "Site Admin" badge (read from `users` at request time, so it matches the real role even if edited in Atlas; not awardable). "Lead Admin" is a new awardable title: `npm run manage:user badge <username> add lead-admin`. Both show on profiles, the directory, forum posts and the comments wall.

[AMENDED 2026-11-19]: Admin panel. `admin.html` + `js/admin-app.js` + `api/admin/index.js` (one function; 10 of 12 total). Layers: (1) `middleware.js` returns 404 for any path segment starting with "admin" (decoded, case-folded, dot-segments resolved) and for `/api/admin` unless the session cookie is a valid HS256 token whose role claim is admin; the token library loads only for those paths and any failure is a 404. (2) `api/admin` re-checks the role in the database on every request, so a stale or forged token does nothing; non-admins get the same 404 as a missing route; POSTs also need a same-site Origin. (3) The menu link is shown only to admins (cosmetic). Safeguards: no self role/status changes, no cross-site posts, every change logged to `admin_audit` without passwords. Role changes made in Atlas need a fresh sign-in before the page opens (the page gate reads the token; the API reads the database). Links clicked from outside the site do not send the SameSite=Strict cookie, so open the admin page from this site or type its address.

[AMENDED 2026-11-19]: Forum deletion. `DELETE /api/forum/thread?id=` removes a thread and its replies; `?reply=` removes one reply. Allowed for the post author or an admin (role read from the database); posts from before accounts (no authorKey) are admin-only. Cross-site requests are refused. When an admin deletes someone else's post it is written to `admin_audit` (title or short excerpt only) and shows in the admin panel log. An author deleting their own thread also removes other members' replies in it; the confirmation says how many.
