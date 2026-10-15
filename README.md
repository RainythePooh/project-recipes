# Project Recipes

Project Products Collection

Source and Copilot migration handoff for **version 9**, the version before Product Tag was added.

## Start here

- [Migration overview](START_HERE.md)
- [Instructions to give Copilot](COPILOT_PROMPT.md)
- [Application source](source/)
- [User workflows](docs/02_USER_WORKFLOWS.md)
- [Microsoft Entra ID and Azure migration plan](docs/04_ENTRA_AND_AZURE_MIGRATION.md)
- [Acceptance checklist](docs/05_ACCEPTANCE_CHECKLIST.md)

The `source/` directory is an unchanged export of site version 9 (commit `9c46c6eb8539beaec8528e45c23745ff51570898`). All 167 source files are recorded in [SOURCE_MANIFEST.json](SOURCE_MANIFEST.json). Run application commands from `source/`; see its package.json and the current-system documentation for runtime requirements.

This is the existing Sites/Cloudflare application plus migration documentation. Microsoft Entra ID and Azure deployment are proposed work, not already implemented. Cloud database records and credentials are not included. Product Tag and specification option editing are excluded.
