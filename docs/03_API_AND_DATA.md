# API and data contracts

## Existing routes

| Method and path | Request | Result / errors |
| --- | --- | --- |
| POST `/api/collect` | `{url:string, refresh?:boolean}` | `{product:Product}` or `{directory:Directory}`; validation/supplier errors 422; declared body >8000 bytes 413 |
| GET `/api/file` | `url`, optional `name`, `inline`; or `spec` for Moduplay; optional `entry`, `preview`, `thumbnail` | Verified binary or generated SVG; failures 422 JSON `{error}` |
| GET `/api/projects` | Authenticated session | `{projects:[{id,name,revision,created_at,updated_at}]}`; owner only; up to 200 most recently updated; 401/503 |
| POST `/api/projects` | `{name,state,revision?}` | 201 `{project:{id,name,revision:1,created_at,updated_at}}`; 401/403/400/503 |
| GET `/api/projects/:id` | Authenticated session | `{project:{id,name,revision,created_at,updated_at,state}}`; owner lookup; 401/404/503 |
| PUT `/api/projects/:id` | `{name,state,revision}` | Incremented metadata; owner + revision conditional update; 401/403/400/404/409/503 |

GET responses for projects are no-store. Mutations check same-origin request headers. Preserve this protection when replacing session middleware. Errors should be understandable in the English UI. There is no DELETE route. Save a copy is POST, not a separate endpoint.

For a known seed URL, collection returns the explicit bundled snapshot unless `refresh:true`. Do not turn all live collection into undated seed fallback silently.

## Product contract

```ts
interface Pricing { unitPrice: number | null; quantity: number }
interface Asset {
  role: string; url: string; filename: string;
  kind: 'image' | 'cad' | 'pdf'; status: 'available' | 'blocked';
  note?: string; previewUrl?: string;
}
interface Product {
  id: string; name: string; code: string; url: string;
  fields: {
    Supplier: string; 'Product code': string; Material: string;
    Finishes: string; Colour: string; 'Fixing options': string;
    Price: string; 'CAD status': string;
  };
  assets: Asset[]; notes: string[];
  image?: string; plan?: string; planLabel?: string;
  checkedAt: string; reviewed: boolean; fromSnapshot: boolean;
  pricing?: Pricing;
}
interface ProjectState {
  products: Product[];
  queue: {url:string; state:'pending'|'loading'|'done'|'error'; error?:string}[];
  selected: string[];
  input: string;
}
interface Directory {
  name: string; url: string;
  items: {name:string; url:string; kind:'product'|'category'}[];
}
```

A product's ID is normally its normalised source URL, including retained variant/page parameters. Code alone is not a unique key. Missing code is represented as source text such as Not published. Some product-family pages carry multiple codes. Preserve all eight source-field strings and their evidence independently of user-entered pricing.

Price arithmetic converts unit prices to cents for multiplication/summation. Retain precision and null semantics when using decimal or integer-cent database columns. Do not infer a missing price from unrelated dollar text.

`examples/project_state.json` illustrates the exact state with the three bundled public sample products. It is synthetic project state, not an export of the owner's cloud projects.

## Current database

D1/SQLite has one `projects` table:

| Column | Type / semantics |
| --- | --- |
| id | Text UUID primary key |
| owner_id | Text ChatGPT user ID, obtained server-side |
| name | Text project name |
| data | JSON string of the complete ProjectState |
| revision | Integer, starts at one; optimistic concurrency |
| created_at / updated_at | Integer Unix milliseconds |

Index: `(owner_id, updated_at)`. All list/get/insert/update operations bind the current authenticated owner; clients do not choose it. The project JSON schema is enforced in `lib/projects.ts`. `database/current_schema.sql` is the actual migration.

## Bounds and compatibility

- 40 products / project; up to 80 stored queue entries; project name 1–100 characters; input 16000 characters; body/text size limit 800000.
- Source URL max 2000 characters in collect; stored URL max 2100.
- Up to 60 assets / product and 20 notes. Asset paths in cloud state must match the server validator.
- Unit price 0–10000000 AUD, cents precision; quantity integer 0–100000.
- Supplier fetch redirect loop is bounded; each destination must be an exact allowlisted HTTPS host; timeout 22 seconds per fetch; no credentials/non-default ports in supplier URLs.
- Binary proxy default file bound 22 MiB; HTML source 6 MiB. Public technical PDF enrichment has an 8 MiB / 12-page bound.
- CAD ZIP extraction: maximum 20 entries, 16 MiB each, 32 MiB total expanded CAD.
- DXF reference preview: up to 8 MiB, 20000 traversed entities, nesting depth bound.
- Browser image fetch: 30 seconds, 22 MiB per file; aggregate original images limited to 64 MiB. Oversized/missing entries are reported, not silently marked downloaded.

These are current code bounds, not universal infrastructure limits. Revisit explicitly during migration if requirements change.

## Proposed database starting point

`database/azure_sql_proposal.sql` is an optional Azure SQL design: an Entra-backed user table, projects storing full validated state JSON and a reviewed legacy-owner mapping table. It is not an applied migration. Keeping JSON initially avoids losing queue, selection, evidence, variants and optional fields. Normalisation into product/asset tables can be a later deliberate change, with equivalent API payloads and round-trip tests.

No original D1 records are supplied. The owner must authorise and obtain the appropriate data export separately. Preserve timestamps, project IDs/revisions and selected URL IDs; validate each JSON object before import. Map identity through a reviewed mapping, never an unverified email match.

