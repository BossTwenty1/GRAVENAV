import { parseArgs } from "node:util";
import { readWorkbook } from "../src/lib/imports/workbook";
import { preview } from "../src/lib/imports/preview";
import { ImportError } from "../src/lib/imports/model";

async function main() {
  const { values } = parseArgs({ options: { adapter: { type: "string" }, file: { type: "string" }, sheet: { type: "string" }, site: { type: "string" }, label: { type: "string" } }, strict: true });
  if (!["inventory-list", "interment-summary"].includes(values.adapter ?? "") || !values.file || !values.sheet || !values.site || !values.label) throw new ImportError("usage: --adapter inventory-list|interment-summary --file <xlsx> --sheet <approved-sheet> --site <uuid> --label <non-sensitive-label>");
  const result = preview({ adapter: values.adapter as "inventory-list" | "interment-summary", siteId: values.site, fileLabel: values.label, sheet: values.sheet }, await readWorkbook(values.file, values.sheet));
  // Counts only: no raw rows, names, paths, unknown classifications or identifiers.
  const { unknownClassifications, ...summary } = result.summary;
  console.log(JSON.stringify({ mode: "dry-run", databaseCompared: false, ...summary, unknownClassificationCount: unknownClassifications.length }, null, 2));
  if (result.issues.some(issue => issue.severity === "error") || result.summary.reviewRows) process.exitCode = 2;
}
main().catch(error => { console.error(error instanceof ImportError ? error.code : "preview_failed"); process.exitCode = 1; });
