// Smoke test for the remote MCP endpoint (Streamable HTTP).
// Usage: node test-remote.mjs [baseUrl]   (default http://localhost:3000)
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const base = process.argv[2] || "http://localhost:3000";
const url = new URL("/api/mcp", base);

const transport = new StreamableHTTPClientTransport(url);
const client = new Client({ name: "test", version: "1.0.0" }, { capabilities: {} });
await client.connect(transport);

const tools = await client.listTools();
console.log("ENDPOINT:", url.href);
console.log("TOOLS:", tools.tools.map((t) => t.name).join(", "));

async function call(name, args) {
  const r = await client.callTool({ name, arguments: args });
  return JSON.parse(r.content[0].text);
}

let r = await call("search_businesses", { query: "adidas", limit: 3 });
console.log("\nsearch adidas -> total", r.total, ":", r.results.map((x) => x.name).join(", "));

r = await call("search_businesses", { query: "מסעדות שף", limit: 3 });
console.log("search 'מסעדות שף' -> total", r.total, ":", r.results.map((x) => x.name).join(", "));

r = await call("search_businesses", { category: "ספא", region: "תל אביב", online_only: true, limit: 3 });
console.log("spa+TLV+online -> total", r.total, ":", r.results.map((x) => x.name).join(", "));

const b = await call("get_business", { id: 2208 });
console.log("get_business(2208):", b.name, "| voucher", JSON.stringify(b.voucher), "| attribution:", !!b._source);

const c = await call("list_categories", {});
console.log("categories:", c.categories.length, "| regions:", (await call("list_regions", {})).regions.length);

await client.close();
console.log("\nOK");
process.exit(0);
