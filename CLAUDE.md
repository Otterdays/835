@AGENTS.md

<!-- PROJECT-MAP:START -->
## Finding things in this project
Read `PROJECT_MAP.md` first, then the `_MAP.md` in the relevant folder, before searching
the file tree. Search only if the maps don't answer the question.
If a map is wrong or missing something, fix that map in the same change.
When you add, move, rename, or delete files, update the affected `_MAP.md` and the root
Quick lookup table. Keep maps short: they are an index, not documentation.
<!-- PROJECT-MAP:END -->

## Claude Code compatibility

Use the imported `AGENTS.md` as the single source of shared project rules. The import supports Claude Code sessions configured to read `CLAUDE.md` only and older environments that do not load `AGENTS.md` directly. Do not duplicate project instructions here.

For scan ingestion, follow `DOCS/CONTRACT_PAGE_INGESTION.md` and verify that the imported project guidance is loaded when practical (Claude Code `/memory` or `/context all`).

Official reference: [Claude Code memory and instruction files](https://code.claude.com/docs/en/memory).
