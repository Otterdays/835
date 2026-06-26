<div align="center">
  <h1>🚜 Operating Engineers 835</h1>
  <p><strong>Contract Viewer Application</strong></p>
  
  [![Live Demo](https://img.shields.io/badge/Live-Demo-2563eb?style=for-the-badge&logo=github)](https://otterdays.github.io/835/)
</div>

<br/>

A static **document center** for **Operating Engineers Local 835**: the home page is a lightweight gateway; each major area (current CBA, scans, tool program, stewards, roster) has its own HTML page and only loads the scripts it needs.

## ✨ Features

- **Gateway home** (`index.html`) — grouped portal cards (Documents / Members / Feedback), quick actions, lightweight first load.
- **Sitewide search** (`js/site-search.js`) — search contract, scans, tool program, stewards, and roster from any page (Ctrl+K, `/`, or top-right button). Lazy-loads `data.js` when needed.
- **Contract viewer** (`contract.html`) — in-page search, split view, floating article desk, article jump (`?q=`, `?article=`).
- **Scanned pages** (`scans.html`) and **tool program** (`tool-program.html`) — paneled archive UI, list filter, image lightbox (`?item=` deep links).
- **Shop stewards** — site filter chips (`?site=`); **Site roster** — search + facility filters (`?q=`).
- **Suggestions** — share/copy form (no backend).
- **100% client-side** — works on GitHub Pages; use a local HTTP server when developing (see below).

## 🚀 Live Website

👉 **[https://otterdays.github.io/835/](https://otterdays.github.io/835/)** — start at **Home**, then open any section.

## 💻 Local usage

```bash
git clone https://github.com/Otterdays/835.git
cd 835
npx --yes serve -l 3000
```

Open **http://localhost:3000** (avoid opening `file://` directly so scripts and images load reliably).

## 📁 Architecture

| File / folder | Role |
|---------------|------|
| `index.html` | Gateway: grouped portal cards + quick actions (`js/nav-config.js`, `js/shell.js`, `js/site-search.js`) |
| `contract.html` | CBA viewer — `data.js`, `js/contract-app.js` |
| `scans.html` | Full-page scans — `data.js`, `js/paneled-archive.js`, `js/image-modal.js`, `js/scans-app.js` |
| `tool-program.html` | Tool policy scans — same archive + `js/tool-app.js` |
| `stewards.html` / `employees.html` | Rosters — `data.js` + filter/search page scripts |
| `suggestions.html` | Member feedback form — `js/suggestions-app.js` |
| `data.js` | Contract text, scan lists, stewards, employees (edit to add content) |
| `js/` | Page apps + shared: `nav-config.js`, `shell.js`, `site-search.js`, `paneled-archive.js`, `image-modal.js` |
| `style.css` | Shared styling |
| `DOCS/` | Project notes and changelog |
