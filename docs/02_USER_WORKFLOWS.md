# User workflows and behaviour contract

The application is one main workspace page with conditional panels and preview dialogs, not a collection of separately routed product pages.

## 1. Anonymous start / named draft

Open the live URL. A new user sees the introduction, project name, Product URLs input, queue, empty product area and empty price summary. Work is stored as a browser-local draft. Naming a project does not itself save it to the cloud. A returning browser restores its draft. Existing localStorage keys still use `fieldwork-v2:<userId or guest>` and legacy `fieldwork-v1`; branding changes intentionally did not erase drafts.

## 2. Repeated product-link batches

Paste one or several supported HTTPS URLs. Press Enter or Add links to confirm. Shift+Enter inserts a newline. After adding, focus moves to Collect products. Add another batch at any time. URLs are normalised and deduplicated against the queue and products. Normalisation removes tracking/search parameters except the supported variant/page parameters `v`, `page`, `paged`; variants must remain distinct. Unsupported suppliers produce an English notice. Supported supplier labels sit inside the input container footer, outside the editable text.

Click Collect products. Pending/failed links are processed sequentially. Queue states are pending/loading/done/error. Successful product results create/update a card, select the product by default and show details. Failed links remain retryable; refresh failure retains earlier product information.

## 3. Home/category/catalogue links

A catalogue result opens Choose products above the collection, not a false product record. Switch supplier catalogues, search the current page, browse categories and check product choices. Add selected links adds them to the queue; then collect. Completed directory queue items can reopen the catalogue. Catalogue search covers the currently loaded page, not an entire supplier website. Directory browsing state is transient, while resulting queued URLs/project products are saved.

## 4. Product inspection

Open a card to show Specifications, Plan preview and Downloads tabs. Enlarge its image. Follow Supplier page in a new tab. Available file downloads use supplier-original bytes and product-name/code filenames. Blocked files show a supplier-access message and supplier-page link. Plan previews may be supplier reference images, embedded DWG thumbnails, a supplier PDF drawing or supported DXF geometry. A preview is not proof of final CAD units/layers/complete content.

Refresh re-collects the supplier page. Existing project pricing overrides/quantities survive refresh. Remove deletes the product from this draft, its checkbox selection and matching queue item.

## 5. Checkboxes and pricing

Every product checkbox controls inclusion in the price table and PDF. The all-products checkbox selects/unselects all collected products, including those currently hidden by a display filter. Display filters are All products, With CAD and Needs review; text search matches name, code and supplier. Display filters do not change the actual export/price selection.

The price table shows selected products only, with code, unit price in AUD, whole-number quantity and line total. Explicit supported supplier prices initialise the unit-price field; unavailable/from/range/foreign-currency prices remain blank. Quantity starts at one. Edit values directly; Enter ends editing. Zero price and zero quantity are valid. Blank price is `null`, never zero. Line totals and the known-price/project total recalculate. Missing-price count applies only to selected products.

Unchecking hides the row and excludes it from totals without clearing its values. Rechecking restores edited values. Clearing all selection shows the empty selection message. Custom pricing remains separate from original supplier source price text. There is no automatic GST conversion; prices must be entered on a consistent basis by the user.

## 6. Image ZIP

Download all images downloads one main image for **every collected product**, independent of checkbox selection and display filtering. It shows progress, then downloads `<project-name>_Product_Images.zip`. All files are at ZIP root. Names contain product name, product code and Main_Image; extensions are based on actual bytes. Case-insensitive duplicate names get numeric suffixes. Missing files are reported in `_Download_Report.txt` when at least one image succeeds. If none succeeds, show a clear error rather than an empty successful ZIP.

## 7. PDF

Create PDF / Export products uses selected products only. Retain the A4 product-page template with main image, eight specification fields, CAD status, evidence date and source notes. Append a paginated price summary based on the same selection and saved overrides. A preview dialog allows PDF download. Changing products or selection invalidates the latest-PDF shortcut. Unavailable image retrieval is disclosed in the document instead of aborting the entire report.

## 8. Sign-in / account draft / cloud projects

Current login is Sign in with ChatGPT. Named cloud projects require authentication. Account drafts are isolated by user key. Import browser draft is an explicit flow for previous anonymous/legacy work.

- Save project: create a cloud project, or update its current revision.
- My projects: list only this owner's projects, newest first; Open restores products, queue, selection, input and name.
- Editing project name followed by Save renames the saved project.
- Save a copy: creates a new independent project ID owned by the current user.
- New: starts an empty draft; warn before discarding non-empty unsaved work.
- Opening a different project warns before discarding unsaved work.
- Concurrent stale updates return 409; the user must reopen or save a copy.
- Sign out preserves the draft before navigation.

Cloud saving is explicit, not automatic. No cross-account project access, collaboration sharing, project delete or admin dashboard exists.

