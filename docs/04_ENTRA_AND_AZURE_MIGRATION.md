# Entra and Azure migration planning

This is a proposed direction for Copilot to evaluate, not a completed migration or an assertion that tenant resources already exist.

## Replace these boundaries

1. Replace `app/chatgpt-auth.ts` and the Sites gateway routes with an actual Entra/OIDC integration. Current trusted `oai-authenticated-user-*` headers are valid only behind the original trusted Sites gateway. They must not remain a public header-based login mechanism on Azure.
2. Replace `cloudflare:workers` imports, `env.DB.prepare().bind()` calls and D1 SQL/runtime assumptions with an owner-aware repository using the destination database driver.
3. Remove or replace `.openai/hosting.json`, Sites build/dispatch integrations, the Cloudflare plugin and connector-preview machinery for the destination runtime. Do not deploy starter mock authentication.
4. Preserve the React UI, supplier extraction, type/validation contracts, pricing, PDF/ZIP modules, bundled assets and SVG logo where feasible.
5. Keep public asset proxying separate from user-private project endpoints. Decide anonymous collection policy/rate limits independently of authenticated cloud saving.

## Target architecture option

React/TypeScript UI in a supported Next.js/Node application; App Service or Container Apps for the web/API runtime; Microsoft Entra for sign-in; Azure SQL for projects; managed identity for database access; optional Blob storage for durable supplier-file copies; structured application logs/metrics. A same-origin server session/BFF is a useful starting point to keep browser credentials and project mutation boundaries simple.

This is an architectural recommendation. Copilot should compare it with a SPA + separate API option and provide costs, runtime constraints and maintenance tradeoffs before implementation. Do not assume the existing Vinext/Cloudflare bundle deploys unchanged to App Service.

## Identity decisions

- Staff-only: workforce tenant and single-tenant app registration may fit.
- Invited external collaborators: evaluate tenant guests and the intended sharing rules.
- Public customer/email sign-up: evaluate Microsoft Entra External ID in an external tenant. A staff-only login is not equivalent to public self-service registration.
- Anonymous local collection currently works; retaining it avoids changing the public visitor flow unless the owner explicitly requests otherwise.

Use a maintained identity library and authorization-code flow suitable for the chosen application type. PKCE applies to SPA flows; server flows need their own appropriately registered confidential-client/session configuration. Validate issuer, audience, expiry and relevant nonce/state checks through the chosen library. For a separate API, validate access tokens for that API; do not use an ID token as its bearer authorisation token.

Use stable identity keys (for a workforce account, tenant ID plus object ID) to map to an application user. Email/name are display data and may change. Keep all project operations owner-scoped. An admin role, if requested, should be explicitly defined; do not infer administrative permission from an email domain.

## Identity migration

Current `owner_id` values are ChatGPT identities; destination identities are different. Preserve old owner IDs in a reviewed migration mapping. Unmapped projects remain quarantined/unavailable rather than assigned to the next person with a matching email. Account verification and permissions are an owner/admin migration task.

## Deployment work Copilot must supply

- Destination project layout, production build/start commands and supported Node/runtime versions.
- Azure resource definition (Bicep/Terraform or equivalent), selected region and sizing.
- Entra app registration, account audience, exact redirect/logout URIs and sign-in/session implementation.
- Secret/session-cookie management and managed identity/database grants; no real secret in Git or browser bundles.
- Schema creation and authorised data-import procedure.
- CI/CD with type checking, tests, build and staging validation; health/readiness checks and logging.
- Production hostname/TLS, cache rules for public binary files and no-store private responses.
- Canary/cutover plan, old-host retention window, data freeze/delta strategy and rollback.

Suggested configuration names (placeholders, not existing settings): `APP_BASE_URL`, `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID`, a server-client credential or certificate only if the selected auth flow needs one, `SESSION_SECRET`, `AZURE_SQL_SERVER`, `AZURE_SQL_DATABASE`, and optional `AZURE_STORAGE_ACCOUNT`. Copilot must derive exact names from its implementation, not assume these are already provisioned.

## Official references reviewed for this handoff

- Microsoft identity sign-in flow: https://learn.microsoft.com/en-us/entra/identity-platform/app-sign-in-flow
- Application types / flow choice: https://learn.microsoft.com/en-us/entra/identity-platform/v2-app-types
- ID token claims / stable identity guidance: https://learn.microsoft.com/en-us/entra/identity-platform/id-token-claims-reference
- External customer tenant overview: https://learn.microsoft.com/en-us/entra/external-id/customers/overview-customers-ciam
- App Service database access with managed identity: https://learn.microsoft.com/en-us/azure/app-service/tutorial-connect-msi-azure-database
- Node.js Azure SQL driver quickstart: https://learn.microsoft.com/en-us/azure/azure-sql/database/azure-sql-javascript-mssql-quickstart

Consult the applicable language/hosting documentation again during implementation; this package supplies migration inputs, not fixed future SDK versions.

