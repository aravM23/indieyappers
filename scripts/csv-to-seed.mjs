// One-shot converter: spreadsheet CSV -> data/founders.json seed file.
// Usage: node scripts/csv-to-seed.mjs /path/to/accounts.csv
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: node scripts/csv-to-seed.mjs <csv path>");
  process.exit(1);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((f) => f !== "")) rows.push(row);
  }
  return rows;
}

const rows = parseCsv(readFileSync(csvPath, "utf8"));
const [, ...data] = rows; // drop header

const founders = data.map(([handle, name, product, tier, followers, notes, flag]) => ({
  handle: handle.replace(/^@/, "").trim(),
  name: name.trim(),
  product: product.trim(),
  tier: Number(tier.trim()[0]),
  tierLabel: tier.trim(),
  approxFollowers: Number(followers.replace(/,/g, "")) || null,
  notes: notes.trim(),
  flag: (flag ?? "").trim() || null,
}));

mkdirSync(new URL("../data", import.meta.url), { recursive: true });
writeFileSync(
  new URL("../data/founders.json", import.meta.url),
  JSON.stringify(founders, null, 2) + "\n"
);
console.log(`Wrote ${founders.length} founders to data/founders.json`);
