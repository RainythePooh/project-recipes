# Current system

## Architecture

One React/TypeScript application using Vinext's Next-style App Router, Vite and a Cloudflare Worker, published through ChatGPT Sites. It is not a standard unmodified Next.js deployment despite containing the `next` package.

The root server page obtains the current ChatGPT user and passes it to the client workspace. Collection and file downloads run through server routes. Named projects use Cloudflare D1; browser drafts use localStorage. PDFs and image ZIPs are generated in the browser. There is no OpenAI model/API call and no AI API key required by the collection logic.

Public assets include reviewed supplier files for three sample products, Vera fonts and SVG branding. Other supplier assets are fetched from their public remote URLs on demand; R2 is not configured. A cloud project stores state and asset URLs, not a durable private copy of every supplier file.

## Code map

| File or directory | Responsibility / migration treatment |
| --- | --- |
| `app/page.tsx` | Server entry; replace identity adapter |
| `app/workspace.tsx` | Main workflow, queue, selection, draft/cloud state, downloads and exports |
| `app/price-table.tsx` | Editable selected-product pricing |
| `app/directory-browser.tsx` | Supplier catalogue/category browser and product selection |
| `app/chatgpt-auth.ts` | Sites trusted-header identity and gateway sign-in paths; replace for Entra |
| `app/layout.tsx`, `app/globals.css` | Metadata, English language, branding and responsive styling |
| `app/api/collect/route.ts` | Public product/directory collection endpoint |
| `app/api/file/route.ts` | Public binary proxy, CAD entry extraction and previews |
| `app/api/projects/` | Owner-scoped D1 project routes; replace database/auth bindings |
| `lib/server.ts`, `lib/supplier-collect.ts`, `lib/suppliers.ts` | Supplier extraction, redirect and host policy |
| `lib/pdf-spec.ts` | Bounded public PDF text supplementation |
| `lib/dxf-preview.ts`, `lib/zip.ts` | DXF reference rendering and bounded CAD archive extraction |
| `lib/pdf.ts` | Browser PDF template; reuse |
| `lib/image-archive.ts` | Browser flat ZIP of original main images; reuse |
| `lib/pricing.ts` | AUD parsing, cents-based calculations and defaults; reuse |
| `lib/types.ts`, `lib/projects.ts` | Product contracts, project validation and SQL strings |
| `lib/seed.json`, `public/products/` | Three explicit reviewed public samples, with original assets |
| `db/schema.ts`, `drizzle/` | Current D1/SQLite schema and migrations |
| `.openai/hosting.json`, `build/`, `vite.config.ts` | Original platform/build integrations; not Azure configuration |
| `scripts/` | Starter execution-profile/build helpers; review before reusing |

## Dependencies at export

React 19.2.6; Next package 16.3.4; Vinext 1.0.0-beta.5; Vite 8.0.13; TypeScript 5.9.3. Libraries include cheerio, unpdf, pdf-lib/fontkit, fflate, dxf-parser, zod and Drizzle. `source/package.json` and `source/pnpm-lock.yaml` are authoritative. The declared Node minimum is 22.13.0; lockfile package-manager version is pnpm 11.25.0.

For inspection on a clean checkout, install the pinned dependencies, then run `pnpm exec tsc --noEmit` and `pnpm build`. Clean source defaults to the portable execution profile; `pnpm dev` uses port 5173. Original live sign-in and D1 production bindings do not exist in a standalone checkout. Local starter authentication may be mocked; it is not a production Entra implementation. These instructions are for the exported baseline, not deployment of the migrated app.

## Supported supplier domains

Moduplay; Van Ryt Industries; KOMPAN; WillPlay; Active Discovery; Lypa (both lypa.com.au and lypaproduct.com.au); Landmark Products; Street Furniture Australia; IronClad WA. Exact file/CDN hosts are in `lib/server.ts`. Category/homepage support is provided by the additional-supplier adapter. Lypa's primary site links to its separate official product catalogue.

Street Furniture CAD requires a supplier account and remains blocked. WillPlay CAD ZIPs expose actual DXF/DWG entries. Some suppliers only publish PDF drawings or do not expose CAD. Unknown specifications require supplier confirmation.

## Important limitations

No independent email/password registration, no admin UI, no team-sharing workflow, no project delete endpoint, no automatic cloud autosave, no currency/GST conversion, no full DWG renderer and no durable storage of all newly collected files. DXF previews omit unsupported content including text/dimensions; they are reference views. Snapshot data is dated and live refresh is available. Supplier DOM changes can break adapters.

Production builds, sample-file signatures, pricing calculations, archive contents and selected-price output were checked during development. PDF pages were rendered and inspected for sampled layouts. Real browser account/cross-device and full interactive workflows were not end-to-end verified. The current vector logo was built successfully but not browser-screen captured.

