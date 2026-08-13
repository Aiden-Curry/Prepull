import { filteredRows, rowsToCsv } from "./curated-common.ts";
const rows = filteredRows();
process.stdout.write(rowsToCsv(rows));
console.error(`Exported ${rows.length} curated row${rows.length === 1 ? "" : "s"}.`);
