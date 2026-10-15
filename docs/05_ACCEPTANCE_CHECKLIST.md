# Migration acceptance checklist

## Functional parity

- [ ] English brand, headline and vector chef logo match the latest baseline.
- [ ] Repeated pasted batches, Enter/Shift+Enter, deduplication, error/retry and variant URLs work.
- [ ] All nine suppliers remain supported; catalogue results allow adding actual products.
- [ ] Product fields, image and blocked-file status are source-backed; no invented missing prices/CAD.
- [ ] Available files preserve real original bytes and correct names/extensions; HTML is rejected as CAD/image.
- [ ] WillPlay ZIP CAD extraction and Lypa CAD paths work.
- [ ] Street Furniture supplier-login requirement remains explicit.
- [ ] Images/PDF/DXF/DWG-thumbnail reference previews work with accurate limitations.
- [ ] Selected products alone appear in pricing and PDF; display filters do not alter selection.
- [ ] Uncheck/recheck preserves edited prices and quantities; refresh also preserves overrides.
- [ ] Missing unit price stays blank; explicit zero remains zero; quantity starts at one; cents arithmetic is correct.
- [ ] No selection shows a clear empty price state; known-price totals exclude missing prices.
- [ ] One-click image ZIP includes all collected main images, even unchecked items, directly at ZIP root.
- [ ] Duplicate filenames cannot overwrite; partial failures produce a report; total failure is not a false success.
- [ ] PDF product-page layout matches the existing A4 template; price summary contains selected values, pagination and totals.
- [ ] Anonymous drafts, legacy draft import, account draft isolation and selected state survive reload.
- [ ] Authenticated project create/open/rename/copy/save round-trip all JSON fields and pricing.
- [ ] Stale revision returns 409 with a safe recovery path.


## Destination identity / data

- [ ] Real Entra sign-in/logout and the agreed tenant/audience succeed on the actual production hostname.
- [ ] No Sites header/mock-auth shortcut grants a session.
- [ ] Two users cannot list, fetch or mutate each other's projects; invalid identities/tenants are rejected.
- [ ] Token/session validation is server-side; same-origin/CSRF protections remain effective.
- [ ] Owner IDs come from the validated session, never client request bodies.
- [ ] Legacy owner mapping is reviewed; unmapped data is not guessed or exposed.
- [ ] Source and imported project counts, IDs, revisions and JSON hashes reconcile.
- [ ] Secret storage, database grants and logs avoid credentials/private project contents.

## Runtime and release

- [ ] Type check, targeted unit/API tests and production build pass.
- [ ] Browser tests cover desktop/mobile, input, selection, downloads, cloud projects and PDF preview.
- [ ] Supplier timeout/redirect/file-limit failures are handled without crashing the service.
- [ ] Real destination egress/CDN downloads are tested, not just fixtures.
- [ ] Staging data backup/import, cutover and rollback are rehearsed.
- [ ] Health checks, errors, revision conflicts and failed supplier downloads are observable.

The original application did not complete real browser authentication/cross-device verification. Do not carry that verification gap into a claim that the migrated application is production-ready.

