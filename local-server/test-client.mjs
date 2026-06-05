// Smoke test: spawn server.mjs over stdio and exercise the tools.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const transport = new StdioClientTransport({
  command: "node",
  args: [join(__dirname, "server.mjs")],
});
const client = new Client({ name: "test", version: "1.0.0" }, { capabilities: {} });
await client.connect(transport);

const tools = await client.listTools();
console.log("TOOLS:", tools.tools.map((t) => t.name).join(", "));

async function call(name, args) {
  const r = await client.callTool({ name, arguments: args });
  return JSON.parse(r.content[0].text);
}

console.log("\n[1] search 'adidas':");
let r = await call("search_businesses", { query: "adidas", limit: 3 });
console.log("  total:", r.total, "->", r.results.map((x) => `${x.name}(${x.id})`).join(", "));

console.log("\n[2] search Hebrew 'מסעדות שף' (chef restaurants), online filter off, top 5:");
r = await call("search_businesses", { query: "מסעדות שף", limit: 5 });
console.log("  total:", r.total);
for (const x of r.results) console.log(`   - ${x.name} | ${x.categories?.join("/")} | products:${x.productCount}`);

console.log("\n[3] category=ספא region=תל אביב online_only=true, top 5:");
r = await call("search_businesses", { category: "ספא", region: "תל אביב", online_only: true, limit: 5 });
console.log("  total:", r.total);
for (const x of r.results) console.log(`   - ${x.name} | online:${x.onlineRedeem} | ${x.regions?.slice(0,2).join(",")}`);

console.log("\n[4] coffee search:");
r = await call("search_businesses", { query: "coffee קפה", limit: 4 });
console.log("  ->", r.results.map((x) => x.name).join(", "));

console.log("\n[5] price filter: chef restaurants with a product <= 300:");
r = await call("search_businesses", { category: "מסעדות", max_price: 300, limit: 5 });
console.log("  total:", r.total, "->", r.results.map((x) => x.name).slice(0,5).join(", "));

console.log("\n[6] get_business(2208):");
const b = await call("get_business", { id: 2208 });
console.log(`  ${b.name} | online:${b.onlineRedeem} | voucher:${JSON.stringify(b.voucher)} | regions:${b.regions.length} | aliases:${b.searchTerms.length}`);

console.log("\n[7] list_categories:");
const c = await call("list_categories", {});
for (const cat of c.categories) console.log(`   ${cat.businessCount.toString().padStart(4)}  ${cat.name}`);

console.log("\n[8] list_regions:");
const rg = await call("list_regions", {});
for (const reg of rg.regions) console.log(`   ${reg.businessCount.toString().padStart(4)}  ${reg.name}`);

console.log("\n[9] wallet_summary:");
const ws = await call("wallet_summary", {});
if (ws.status === "OK") {
  console.log(`  total: ₪${ws.totalBalance} | active:${ws.activeCount} | smallest:₪${ws.smallestBalance} largest:₪${ws.largestBalance} avg:₪${ws.averageBalance}`);
  console.log(`  expiring 30/90/365d: ${ws.expiring.within30d}/${ws.expiring.within90d}/${ws.expiring.within365d} | small(<₪50): ${ws.smallCards.map((c) => `₪${c.balance}`).join(", ") || "none"}`);
} else console.log("  status:", ws.status);

console.log("\n[10] giftcards_expiring(within 2200 days):");
const ex = await call("giftcards_expiring", { within_days: 2200 });
if (ex.status === "OK") {
  console.log(`  ${ex.count} cards, ₪${ex.expiringBalance} at risk; soonest:`);
  for (const c of ex.giftcards.slice(0, 3)) console.log(`   - ₪${c.balance} expires ${c.expiresAt?.slice(0,10)} (${c.daysUntilExpiry}d)`);
} else console.log("  status:", ex.status);

console.log("\n[11] assemble_amount(₪250) — lowest balance first:");
const as = await call("assemble_amount", { amount: 250 });
if (as.status === "OK") {
  console.log(`  covered:${as.covered} | cardsUsed:${as.cardsUsed} | sum:₪${as.sumOfSelected} | leftoverOnLast:₪${as.leftoverOnLastCard} | remaining:₪${as.remainingToPayElsewhere}`);
  for (const p of as.plan) console.log(`   ${p.order}. card ${p.id} balance ₪${p.balance} → use ₪${p.use}`);
} else console.log("  status:", as.status, as.error || "");

await client.close();
console.log("\nOK");
process.exit(0);
