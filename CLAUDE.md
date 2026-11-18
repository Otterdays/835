@AGENTS.md

## Claude Code compatibility

Use the imported `AGENTS.md` as the single source of shared project rules. The import supports Claude Code sessions configured to read `CLAUDE.md` only and older environments that do not load `AGENTS.md` directly. Do not duplicate project instructions here.

For scan ingestion, follow `DOCS/CONTRACT_PAGE_INGESTION.md` and verify that the imported project guidance is loaded when practical (Claude Code `/memory` or `/context all`).

Official reference: [Claude Code memory and instruction files](https://code.claude.com/docs/en/memory).
