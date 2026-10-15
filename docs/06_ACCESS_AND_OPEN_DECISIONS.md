# Access and open decisions

## Supplied

The actual source ZIP, lockfile, current schema, public samples/assets, latest SVG logo, live URL, workflows, API contracts and migration notes. A source repository URL is not needed to start because the source is included. The original source host is platform-managed; no reusable repository credentials are exported.

## Not currently available in this package

- Azure subscription, Entra tenant/app registration, tenant admin consent or deployment credentials.
- Actual cloud-user project rows or an authorised D1 export.
- Browser-local drafts from the owner's computer.
- Full up-to-date screen captures or access to the user's signed-in session.
- An app-admin interface: the current UI has My projects for each owner, not an administrator console.

The existing Site owner continues to manage original publication/access through the original hosting service. This document does not grant Copilot access to that service. Do not share passwords, tokens or browser cookies in a prompt or repository.

## Ask before destination implementation/cutover

| Decision | Why it matters |
| --- | --- |
| Microsoft audience: staff / guests / public customers | Determines tenant model and sign-up/login flow |
| Preserve anonymous collection? | Current public visitors can use local drafts without signing in |
| Azure subscription, region and budget | Determines actual provisioning and deployment configuration |
| Destination domain | Determines Entra callback/logout and cookie settings |
| Need old cloud projects migrated? Which owners? | Requires authorised export and verified identity mapping |
| Team project sharing/admin controls required? | They are new features, not existing behaviours |
| Persist downloaded assets in Blob storage? | Current live asset URLs can change or expire |
| GST basis / monetary policy | Current AUD table does not convert GST or foreign prices |
| Larger file/project limits needed? | Current limits are documented in API_AND_DATA |

Copilot can prepare architecture and implementation with placeholders without stopping the handoff. It must not deploy to real resources or import real-user data on assumptions.

