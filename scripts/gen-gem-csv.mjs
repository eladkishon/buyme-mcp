#!/usr/bin/env node
// Generates gemini-gem/buyme-businesses.csv (the Gemini Gem knowledge file)
// from data/buyme.json. Run after a catalog refresh, then re-upload to the Gem.
//   node scripts/gen-gem-csv.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const db = JSON.parse(readFileSync(join(root, "data", "buyme.json"), "utf8"));

const esc = (s) => {
  s = (s == null ? "" : String(s)).replace(/\s+/g, " ").trim();
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const rows = [
  ["name", "categories", "subcategories", "regions", "online_redeem", "voucher_min", "voucher_max", "top_products", "url"],
];
for (const b of db.businesses) {
  const prods = (b.products || []).slice(0, 3).map((p) => (p.price != null ? `${p.name} (${p.price})` : p.name)).join("; ");
  rows.push(
    [
      b.name,
      (b.categories || []).join("|"),
      (b.subcategories || []).join("|"),
      (b.regions || []).join("|"),
      b.onlineRedeem ? "yes" : "no",
      b.voucher && b.voucher.min != null ? b.voucher.min : "",
      b.voucher && b.voucher.max != null ? b.voucher.max : "",
      prods,
      b.url,
    ].map(esc).join(",")
  );
}

const out = join(root, "gemini-gem", "buyme-businesses.csv");
writeFileSync(out, rows.join("\n"));
console.log(`Wrote ${out} — ${rows.length - 1} businesses.`);
