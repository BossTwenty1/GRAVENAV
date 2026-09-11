# Data normalization and safe imports (Task 4)

Task 4 implements a server-side engine, synthetic tests and a dry-run CLI. It does **not** import client workbooks, expose an upload/import UI, publish records, or perform a production migration.

## Source adapters and privacy

The first worksheet row must contain the required headers. Comparison trims/collapses whitespace and ignores case; it does not use fuzzy matching. Duplicate approved headers and missing required headers fail closed. Unknown columns are discarded before normalization, fingerprints, issues or persistence.

| Adapter | Required columns | Optional columns | Accepted worksheet names (case/whitespace normalized) |
| --- | --- | --- | --- |
| `inventory-list` | `Sector (Lot No.)`, `Lot Status` | None | `Inventory`, `Inventory List`, `Synthetic Inventory` |
| `interment-summary` | `Lot Location`, `Name of Deceased`, `Date of Interment` | `Birthday`, `Date of Death`, `Site` | `Interment Summary`, `Synthetic Interments` |

These are explicit developer contracts, not claims about official workbook tab names. Any additional source worksheet name/header/grammar requires an adapter review and tests. High-sensitivity summary/FINAL, owner, representative, payment, contact and accounting sheets have no adapters. Do not rename one to bypass this boundary.

Excluded fields include Customer Name, addresses, contacts, NCP, Equity Paid, collections/principal, interest, AR, payment percentages, receipts, payment information, cause of death and other operational/accounting fields. `PA No.`, `PA Number`, `I.O. #` and `Time` are intentionally excluded: row provenance and sanitized logical fingerprints suffice for this task. No financial/customer data enters the domain model.

Each run requires an explicit cemetery-site UUID and a non-sensitive file label. File paths are never stored or logged. A worksheet must represent one reviewed site. The optional `Site` value is preserved, and a populated indicator requires review. Per-row Leg1/Leg2 or other site meanings are **TBD** and are not guessed or used to merge locations; mixed-site sources require a reviewed adapter extension before persistence. The file label is an operator-supplied alias, not the raw filename. Worksheet names are retained only from the explicit allowlist.

## Workbook reader and limits

`src/lib/imports/workbook.ts` reads `.xlsx` only. CSV, legacy Excel and macro-enabled files are unsupported. `read-excel-file` 9.3.10 was selected for focused XLSX reading, current maintenance and Node support. Its [maintainer documentation](https://github.com/catamphetamine/read-excel-file) describes cached formula values: formulas are not evaluated. The dependency registry showed an August 2026 update at implementation time; the installed npm audit reported no vulnerabilities. Recheck dependencies before real-data use.

`fflate` is a direct dependency for bounded ZIP inspection and in-memory synthetic fixtures (also a reader dependency). `server-only` marks the reader, preview/fingerprinting and persistence modules so Next.js rejects browser imports. `tsx` runs TypeScript through Node's built-in test runner; no larger test framework is added.

| Limit | Default | Hard ceiling |
| --- | ---: | ---: |
| Compressed file | 10 MiB | 20 MiB |
| Actual expanded archive | 64 MiB | 128 MiB |
| ZIP entries | 100 | 200 |
| Worksheet parts | 10 | 20 |
| Data rows per sheet | 10,000 plus header | 20,000 plus header |
| Columns per sheet | 64 | 128 |
| Approved text cell | 512 characters | 2,048 characters |

The 10,000-row default is above the known GRAVENAV inventory scale of more than 5,000 meaningful records, based solely on the approved task description; no client workbook was opened to choose it. The 10 MiB compressed and 64 MiB expanded defaults allow the additional rows and ordinary XLSX XML overhead while keeping memory and decompression bounded. The hard ceilings allow a reviewed project adjustment without permitting arbitrary growth. Entry, sheet, column and cell defaults retain the original narrow behavior; their hard ceilings are absolute guards, not migration targets.

`DEFAULT_LIMITS` and immutable `HARD_LIMITS` are project constants. Trusted server code may provide smaller reader limits or reviewed reader overrides up to the hard ceiling. Normalization and persistence remain capped at the 10,000-row default; raising the reader alone does not enlarge an import batch. Invalid, zero, non-integer, infinite or above-ceiling settings fail with `workbook_limit_exceeds_hard_ceiling`. The developer CLI always uses defaults and has no flag to weaken or disable limits. Real-data migration must not bypass, disable, monkey-patch or raise the hard ceilings; a legitimate end-to-end exception requires a reviewed code change, synthetic boundary tests and a fresh privacy/resource review.

ZIP inflation consumes small input chunks and counts actual output bytes, rather than trusting declared sizes. Sparse cell/range references, row and cell counts are checked before spreadsheet parsing. DTD/entity declarations, macro content and external workbook link parts are rejected. External links are never followed. The file read is bounded even if a file grows after `stat`. Raw cells exist transiently inside the Node reader; only approved columns enter domain records. Archive inspection bounds the whole workbook, while only the selected worksheet is converted to rows. Oversized inputs return specific safe codes such as `file_size_limit`, `inflated_size_limit`, `row_limit`, `column_limit`, `worksheet_limit` or `archive_entry_limit`; parsing and persistence stop without copying or writing source data. No file is copied to Git, public assets, Storage or seed data.

## Lot normalization

The raw lot string is retained. The comparison key trims/collapses whitespace, uppercases structural codes, normalizes Unicode dashes and removes whitespace around `:`, `;` and `/`. It does not strip unknown tokens, zeros, prefixes, suffixes or units, and it does not fuzzy-match locations.

The only fully resolved grammar currently implemented is the explicitly labeled developer convention:

```text
AREA:TEST;SECTOR:TEST;LOT:001A;UNIT:B-2;TYPE:STD
```

`UNIT` is optional. `AREA`, `SECTOR`, `LOT` and `TYPE` are required in that order. Lot numbers retain leading zeros and an optional letter suffix. Parsed labels do not create cemetery-area/sector entities automatically. The site's UUID remains explicit. No real-world location samples were inspected, so undocumented source formats remain partial, preserve the complete raw/key text and require review. This is an intentional limitation before approving real workbook mappings.

`STD → standard`, `PRM → premium`, `SPR → special_premium` are the approved mappings. `EST → estate` is a **project inference**, producing a warning. Persistence requires an active configured plot type with that code; Task 4 does not add EST to the seed automatically. `MCF` has no invented type and requires review. Unknown type tokens remain in the record and preview. Conflicting type tokens for one explicit physical location require review, rather than silently becoming separate plots.

`BOOKED`, `AVAILABLE` and `HOLD` remain `source_commercial_status`. Unknown statuses are preserved in the preview and require review because the existing database intentionally accepts only those three values. They are never occupancy. Occupancy still derives from active interments: zero is unoccupied, one occupied, two or more multiple interments. No importer input sets occupancy or coordinates.

## Names and dates

The original full display name is preserved, including punctuation, suffixes and whitespace. Comparison uses NFC normalization, collapsed whitespace and uppercase. No first/middle/last decomposition is attempted. The database adds `source_display_name`; its generated display/search columns use that name when supplied and retain the existing name-parts behavior otherwise.

Dates accept real Excel date cells converted by the reader, or strict `YYYY-MM-DD` strings with calendar validation. Missing dates remain null. Unstyled numeric serials and ambiguous locale strings such as `02/03/2020` are rejected, not guessed. Time is not imported. Invalid syntax/calendar dates reject the record; birth after death, interment before death, or birth after interment require review while preserving the parseable dates. Source row references remain available for correcting invalid values; issues deliberately omit raw date/name values. Future locale/legacy date support needs explicit parsing rules and tests.

## Duplicates, identity and preview

SHA-256 fingerprints cover a versioned JSON array of adapter, site UUID, normalized lot key, commercial status, normalized full name, birth, death and interment dates, and the source site indicator. Column order, source row, filename, sheet alias, excluded fields and processing time do not change logical identity. Fingerprints are internal matching references, not proof of a person's identity or anonymization suitable for public exposure.

Exact sanitized duplicates are skipped. Inventory conflicts on one normalized location require review. Distinct people may have multiple interments at one plot. Compatible same-name/date candidates require review and are never auto-merged; conflicting known birth/death dates can distinguish candidates. Existing archived records also participate in duplicate/identity checks to prevent accidental recreation. No fuzzy matching is used.

The preview is deterministic and read-only. It reports read/ignored/valid/warning/review/rejected rows, new plots, existing plot matches, deceased candidates, possible identity matches, proposed interments, exact duplicates, issue counts and unknown classifications. Blank approved fields are ignored even if excluded columns contain values. Validity counts include duplicate rows; duplicates are separately marked, while proposal counts exclude them and review/rejected records. A malformed/missing header produces a batch issue and no proposals.

Offline preview assumes an empty database. For existing matches and configured capacity checks, pass an authenticated `readImportSnapshot` result. Database reads use exact counts and reject truncated results instead of silently producing an incomplete duplicate scan. The initial snapshot supports up to the configured PostgREST result limit (currently 1,000 rows per query); pagination is a required extension for larger datasets. Offline previews do not infer capacity. Persistence rechecks capacity transactionally.

## Issue model

Every issue includes code, severity, adapter, source row, field, description and suggested resolution. Issues contain no complete raw row or excluded column value. Row states are `valid`, `valid_with_warnings`, `needs_review` and `rejected`.

| Codes | Severity / state | Meaning |
| --- | --- | --- |
| `missing_required_header` | error / batch blocked | Required approved header absent |
| `missing_lot_location`, `missing_deceased_name`, `invalid_cell_type` | error / rejected | Missing or wrongly typed required source value |
| `invalid_birth_date`, `invalid_death_date`, `invalid_interment_date` | error / rejected | Invalid or ambiguous date syntax/calendar value |
| `lot_parse_partial` | warning / needs_review | Unapproved location grammar |
| `unknown_lot_type`, `unresolved_source_modifier` | warning / needs_review | Unknown code or unresolved MCF |
| `unknown_commercial_status` | warning / needs_review | Value cannot enter the constrained status field |
| `unresolved_site_indicator` | warning / needs_review | Source site code needs an approved UUID mapping |
| `suspicious_date_sequence` | warning / needs_review | Parseable dates require verification |
| `duplicate_plot_candidate`, `ambiguous_plot_match` | warning / needs_review | Plot identity/metadata conflict |
| `ambiguous_deceased_match` | warning / needs_review | Identity candidate cannot be merged safely |
| `capacity_review_required` | warning / needs_review | Exceeds known configured capacity |
| `estate_inference` | warning / valid_with_warnings | Documented EST inference |
| `duplicate_source_row` | info / skipped | Exact sanitized record already seen |

Reader failures use safe error codes such as `unsupported_file`, `file_size_limit`, `inflated_size_limit`, `archive_entry_limit`, `worksheet_limit`, `row_limit`, `column_limit`, `workbook_limit_exceeds_hard_ceiling`, `unapproved_worksheet`, `worksheet_missing`, `empty_workbook`, `invalid_cell_reference`, `unsupported_workbook_content`, `workbook_read_failure`, `duplicate_approved_header` and `approved_cell_too_long`. They do not include filesystem paths, raw rows or library exception contents.

## Dry-run command

```bash
npm run import:preview -- --adapter inventory-list --file <local.xlsx> --sheet "Inventory" --site <site-uuid> --label reviewed-source-alias
```

The command has no database credentials or write mode. It prints counts only (including an unknown-classification count), not names, file paths, raw values or full records. Exit 0 indicates a successful preview without blocking issues, 2 indicates review/rejected rows or missing headers, and 1 indicates a reader/configuration failure. A successful preview does not mean records were imported. Synthetic tests generate temporary XLSX files and execute this command; no real file was used in Task 4.

## Controlled persistence

Use `persistImportPlan` only from a trusted server workflow with the existing cookie-authenticated `createSupabaseServerClient()`. No HTTP endpoint, Server Action, import UI or commit CLI is provided by Task 4. The caller must explicitly select the site and synthetic/real target mode. No service-role credential is needed.

The boundary verifies claims and the active Administrator profile, takes a fresh RLS-protected snapshot, reconstructs approved fields and reruns normalization. Caller-supplied state, fingerprints, counts, issues and extra properties are not trusted. Any rejected/review record blocks the batch. There is no automatic partial acceptance or identity resolution. Resolve the approved source values and generate a fresh preview first. Persistence accepts at most the 10,000-row default import batch and 10 MiB of normalized JSON, matching the supported default reader scale.

One `SECURITY INVOKER` RPC writes plots, undecomposed deceased persons, private interments, `import_batches`, and applicable `import_issues` in one PostgreSQL transaction. It explicitly checks Administrator authorization, field shapes/allowlists, grammar, dates, target site/mode, plot conflicts, exact interment duplicates, identity ambiguity and configured capacity. It uses an import advisory lock, plot locks and unique constraints. Normal Task 3 RLS and hard-delete restrictions remain intact. Direct Administrator table permissions from Task 3 are unchanged; this RPC is not a replacement for all future database mutation validation.

The existing batch stores a compact `validated_records` ledger of source row, fingerprint, normalized key, validation state and resulting plot/person/interment IDs. Adapter/file alias/sheet and timestamps live on the batch. No whole source row or name is copied into ledger JSON. Accepted EST warnings are saved in `import_issues`; unresolved/rejected issues remain in the dry-run result because those batches do not write. Persisted batch counts describe submitted accepted records; the preview retains full source/ignored/duplicate counts. Previously processed duplicates keep their original provenance.

Failure rolls back all writes, including the batch row. The server returns a safe failure code; re-preview before retrying. A lost network response may mean the transaction committed: fresh fingerprints and database duplicate checks protect retries. There is no claim that a network error proves rollback. Existing plot metadata is never silently overwritten. Corrections, explicit person matching and review-resolution workflows remain future work.

## Validation and future migration

```bash
npx supabase start
npx supabase db reset
npx supabase gen types typescript --local
npx supabase db lint --local --level warning --schema public --schema private
npx supabase test db
npm run test:imports
npm run lint
npm run typecheck
npm run build
git diff --check
```

The new migration preserves earlier migrations, updates generated name columns for PostgreSQL 15, adds the batch ledger, adds an import interment fingerprint index and creates the invoker RPC. Database types must be regenerated after migration changes. Tests generate obviously synthetic OOXML archives in memory or temporary directories rather than commit binaries. They cover ordinary workbooks, a 6,001-row GRAVENAV-scale workbook, default and hard row ceilings, compressed/expanded size rejection, worksheet/column limits, malformed archives and cached formulas without external fixture tools. Database tests run inside transactions and roll back their synthetic records.

Before any real migration: review the engine, approve exact source sheet/header/lot/site/date mappings, review privacy and retention, extend bounded snapshots for the dataset size, configure plot types/capacities without guessing, perform controlled local preview, resolve every review/rejected record, verify target database and authorization, and approve the persistence run separately. Keep raw files outside Git and Storage. Task 4 does not authorize or execute those steps on client data.
