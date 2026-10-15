# Paste this request into Copilot

You are migrating Project Recipes from ChatGPT Sites/Cloudflare to a Microsoft/Azure production environment.

Inspect the supplied source and handoff documents before making architecture decisions. The current published baseline is commit 9c46c6eb8539beaec8528e45c23745ff51570898, version 9. Do not treat this archive as an already Azure-compatible application.

Please produce:
1. A migration architecture and mapping of each existing module to its replacement.
2. Microsoft Entra authentication and owner-scoped authorisation.
3. A database design that preserves every project field, selected product, unit-price override and quantity.
4. A rebuilt application structure, implementation and deployment instructions.
5. Tests, data-import instructions, cutover and rollback instructions.

The owner rolled back to version 9. Do not add Product Tag export, specification simplification or specification option selection; these were explicitly cancelled.

Preserve the existing English UI and workflows. Specifically:
- Brand Project Recipes, headline Create your play&furniture collection, vector chef logo and existing green/off-white palette.
- Repeated batch URL paste; Enter adds links, Shift+Enter adds a newline; duplicate links are skipped.
- All existing supplier adapters and catalogue selection flows; public files only; never bypass supplier login.
- Product images, CAD/PDF downloads and correctly labelled plan previews.
- Product checkboxes drive the price table, totals and exported PDF. Unchecking must preserve edited prices/quantities for re-selection.
- Unknown unit prices are null/blank, never zero. Zero is a valid explicit price. Currency is AUD. No automatic GST assumption or price conversion.
- Download all images exports all collected main images, including unchecked products, in one ZIP. Every image is at ZIP root with product-name/code filenames. No product subfolders. Do not silently overwrite duplicate names. Report missing images.
- Preserve the current A4 product PDF layout and append a pricing summary for selected products.
- Anonymous browser drafts; signed-in, independently owned named cloud projects; Save, Open, New and Save a copy; optimistic revision conflicts.
- Preserve the fixed supplier-host allowlist, file signature checks and bounds. Improve safeguards without expanding supported suppliers silently.

Do not trust the current oai-authenticated-user-* headers outside the original Sites gateway. Do not merely rename ChatGPT sign-in routes. Implement validated Entra identity/session handling and stable owner IDs. Email is display/contact data, not an authorisation key. Never automatically equate ChatGPT user IDs with Entra IDs.

First ask the owner to confirm the target audience (staff-only, invited guests or public customers), Azure tenant/subscription, destination domain, region, existing-data migration scope and whether an admin interface is actually required. You can prepare architecture and code with explicit placeholders while those inputs are pending; never fabricate credentials.

Recommended starting direction, subject to confirmation: reuse the React/TypeScript UI and supplier/domain logic, replace the runtime with a supported Next.js/Node deployment, use App Service or Container Apps, and Azure SQL with a lossless JSON project state initially. Blob storage is optional for durable supplier files; currently most files are live URLs and only the three sample products are bundled.

Separate verified current behaviour from proposed changes. Do not claim production readiness until real Entra sign-in, cross-user isolation, cloud project save/open, supplier download paths and browser workflows have been tested in the destination environment. Provide the exact environment-variable names, app-registration settings, schema migrations, CI/CD steps, tests, operational checks and remaining decisions.

