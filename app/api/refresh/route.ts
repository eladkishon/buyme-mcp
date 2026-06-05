// Weekly cron (see vercel.json) — re-scrapes the BuyMe catalog and stores it in
// Vercel Blob at a stable URL. The MCP route reads that URL (BUYME_DATA_URL).
//
// Protected by CRON_SECRET: Vercel automatically sends `Authorization: Bearer
// <CRON_SECRET>` on cron invocations when the env var is set. Manual callers
// must send the same header.
//
// NOTE: scraping ~1,244 suppliers can take 1-2 minutes. maxDuration below
// requires Vercel Fluid compute (Pro/Enterprise). On Hobby, refresh via the
// local script instead (see README) — the bundled catalog still serves fine.

import { put } from "@vercel/blob";
import { scrapeCatalog } from "../../../lib/scrape";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json(
      { ok: false, error: "No Vercel Blob store linked (BLOB_READ_WRITE_TOKEN missing)." },
      { status: 501 }
    );
  }

  const started = Date.now();
  const dataset = await scrapeCatalog();
  const blob = await put("buyme.json", JSON.stringify(dataset), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });

  return Response.json({
    ok: true,
    url: blob.url,
    businesses: dataset.businessCount,
    products: dataset.productCount,
    tookMs: Date.now() - started,
    hint: "Set BUYME_DATA_URL to this url so the MCP server serves fresh data.",
  });
}
