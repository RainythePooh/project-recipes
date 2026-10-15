# Project Recipes — Copilot migration handoff

This package contains the actual source of the current published application, not a screenshot-only reconstruction.

- Live app: https://landscape-product-library.ruany.chatgpt.site
- Export date: 14 October 2026, Australia/Perth
- Published baseline: version 9
- Source commit: `9c46c6eb8539beaec8528e45c23745ff51570898`
- Brand: **Project Recipes**
- Headline: **Create your play&furniture collection**
- Current logo: `source/public/project-recipes-chef.svg` (redrawn vector; #285543)
- Interface language: English


This export matches the restored version 9. Product Tag export and specification simplification/option selection were cancelled and are excluded. Do not reintroduce them during migration. This package supersedes the earlier version 10 handoff.

## Give this package to Copilot

1. Extract the ZIP in a working directory.
2. Open the directory in VS Code/GitHub Copilot, or attach the ZIP to a Copilot service that accepts source archives.
3. Start with `COPILOT_PROMPT.md` and ask Copilot to inspect `source/`, then the documents below.
4. If the service cannot ingest ZIP files, provide `COPILOT_PROMPT.md`, these Markdown documents, and the source through a private repository created in your own account. This package does not provision a GitHub repository.

## Contents

| Path | Purpose |
| --- | --- |
| `source/` | Tracked application source, dependency lockfile, assets, platform adapters and migrations |
| `docs/01_CURRENT_SYSTEM.md` | Architecture, code map and existing limitations |
| `docs/02_USER_WORKFLOWS.md` | User actions, rules and expected results |
| `docs/03_API_AND_DATA.md` | Routes, payloads, current database and project state |
| `docs/04_ENTRA_AND_AZURE_MIGRATION.md` | Replacement boundaries, identity and deployment planning |
| `docs/05_ACCEPTANCE_CHECKLIST.md` | Behaviour to preserve and migration verification |
| `docs/06_ACCESS_AND_OPEN_DECISIONS.md` | Missing tenant/admin/data inputs and decision register |
| `database/current_schema.sql` | Current SQLite/D1 migration |
| `database/azure_sql_proposal.sql` | Proposed lossless starting schema; not deployed |
| `examples/project_state.json` | Public sample project; no real cloud-user data |
| `SOURCE_MANIFEST.json` | Source inventory and SHA-256 digests |

## Not included

- Cloud D1 records, user accounts, sessions, login credentials, private keys or Azure credentials.
- A dedicated admin interface: none currently exists in this application.
- Current screenshots of every screen: browser capture was unavailable. Source, workflows and the live URL are the primary reference.
- `node_modules`, build output, Git history, local execution state or environment-secret files.

The source uses the ChatGPT Sites/Cloudflare runtime. It is a complete source baseline, but **not an already migrated Azure application**. Replacing identity and database/runtime integration is required before independent production hosting.

The historical `source/README.md` records incremental changes and may contain superseded descriptions. The actual source and this handoff's current behaviour contract take precedence.

