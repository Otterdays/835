<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# My Thoughts

- Designing it as a static client-side application so it works flawlessly on GitHub Pages without requiring backend logic.
- We separate the contract data (`data.js`) from the logic (`script.js`) to make it easily updatable.

[AMENDED 2026-04-26]: Logic now lives in `js/contract-app.js` and other page scripts; home is a gateway so `data.js` is not required on `index.html`.

[AMENDED 2026-06-26]: Sitewide search lazy-loads `data.js` on gateway/suggestions pages so first paint stays light; contract page keeps its own in-page search for reading flow while the modal handles cross-site discovery.
