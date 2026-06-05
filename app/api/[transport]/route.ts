// Public remote MCP server over Streamable HTTP.
// Endpoint: /api/mcp  (SSE fallback at /api/sse)
//
// Tools: search_businesses, get_business, list_categories, list_regions
// Data: BuyMe (buyme.co.il), community index — see attribution in responses.

import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { getDataset } from "../../../lib/dataset";
import {
  search,
  getBusiness,
  listCategories,
  listRegions,
  datasetMeta,
} from "../../../lib/catalog";

export const runtime = "nodejs";
export const maxDuration = 60;

const ATTRIBUTION =
  "Source: buyme.co.il (unofficial community index; data may be stale — verify prices/terms on the official site before relying on them).";

function ok(payload: any) {
  return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "search_businesses",
      {
        title: "Search BuyMe businesses",
        description:
          "Search Israeli businesses that accept BuyMe gift cards. Free-text query matches business name, aliases (Hebrew + English), category, region, and product names. Optional filters narrow by category, region, online redemption, and price range. Returns ranked businesses with a few sample products each; call get_business for the full product list.",
        inputSchema: {
          query: z
            .string()
            .optional()
            .describe("Free text, Hebrew or English (e.g. 'spa tel aviv', 'מסעדות שף', 'adidas', 'coffee')."),
          category: z
            .string()
            .optional()
            .describe("Category or subcategory name (e.g. 'מסעדות וקולינריה', 'ספא', 'אופנה'). See list_categories."),
          region: z
            .string()
            .optional()
            .describe("Region name (e.g. 'תל אביב', 'tel aviv', 'ירושלים', 'צפון'). See list_regions."),
          online_only: z.boolean().optional().describe("Only businesses where the voucher can be redeemed online."),
          min_price: z.number().optional().describe("Only businesses offering a product/voucher value >= this."),
          max_price: z.number().optional().describe("Only businesses offering a product/voucher value <= this."),
          limit: z.number().optional().describe("Max results (default 20, max 100)."),
        },
      },
      async (args) => {
        const db = await getDataset();
        return ok({ ...search(db, args), _source: ATTRIBUTION });
      }
    );

    server.registerTool(
      "get_business",
      {
        title: "Get BuyMe business detail",
        description:
          "Full detail for one business by its id (from search_businesses results): all products with prices, money-voucher value range, redemption terms, contact info, and links.",
        inputSchema: {
          id: z.union([z.number(), z.string()]).describe("Business id."),
        },
      },
      async ({ id }) => {
        const db = await getDataset();
        return ok({ ...getBusiness(db, id), _source: ATTRIBUTION });
      }
    );

    server.registerTool(
      "list_categories",
      {
        title: "List BuyMe categories",
        description: "List BuyMe categories and their subcategories, with the number of businesses in each.",
        inputSchema: {},
      },
      async () => {
        const db = await getDataset();
        return ok({ ...listCategories(db), _source: ATTRIBUTION });
      }
    );

    server.registerTool(
      "list_regions",
      {
        title: "List BuyMe regions",
        description: "List BuyMe geographic regions, with the number of businesses in each.",
        inputSchema: {},
      },
      async () => {
        const db = await getDataset();
        return ok({ ...listRegions(db), _source: ATTRIBUTION });
      }
    );
  },
  {},
  { basePath: "/api", maxDuration: 60, verboseLogs: false }
);

// --- Best-effort rate limiting (per warm instance; for hard limits use Upstash) ---
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 120;
const hits = new Map<string, number[]>();

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return (xff ? xff.split(",")[0] : "") || req.headers.get("x-real-ip") || "unknown";
}

function rateLimited(req: Request): boolean {
  const ip = clientIp(req);
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear(); // crude memory cap
  return arr.length > MAX_PER_WINDOW;
}

async function guarded(req: Request) {
  if (rateLimited(req)) {
    return new Response(JSON.stringify({ error: "rate_limited", retryAfterSeconds: 60 }), {
      status: 429,
      headers: { "content-type": "application/json", "retry-after": "60" },
    });
  }
  return handler(req);
}

export { guarded as GET, guarded as POST, guarded as DELETE };
