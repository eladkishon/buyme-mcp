# buyme-mcp-vercel

Public **remote MCP server** (Streamable HTTP) for searching Israeli businesses
that accept **BuyMe** (buyme.co.il) gift cards. Deployed on Vercel.

**Live:** https://buyme-mcp-vercel.vercel.app
**MCP endpoint:** `https://buyme-mcp-vercel.vercel.app/api/mcp`

Same catalog and tools as the local `~/buyme-mcp` stdio server, re-wrapped as a
stateless Streamable HTTP endpoint so any MCP client (Gemini, Claude, ChatGPT,
etc.) can use it over the internet.

## Tools

- `search_businesses` — `query` (HE/EN) + filters: `category`, `region`, `online_only`, `min_price`, `max_price`, `limit`
- `get_business` — full detail + all products/prices for one `id`
- `list_categories` / `list_regions` — browse with counts

## Connect

```sh
# Gemini CLI
gemini mcp add --transport http buyme https://buyme-mcp-vercel.vercel.app/api/mcp

# Claude Code
claude mcp add --transport http buyme https://buyme-mcp-vercel.vercel.app/api/mcp
```

**Claude.ai / Claude Desktop:** Settings → Connectors → Add custom connector →
paste the endpoint URL.

**Gemini API (`google-genai`)** and other SDKs: point their MCP client transport
at the same URL.

## Architecture

```
app/api/[transport]/route.ts   MCP server (mcp-handler, Streamable HTTP) -> /api/mcp
app/api/refresh/route.ts       weekly cron: re-scrape -> Vercel Blob
app/page.tsx                   public landing page + attribution
lib/catalog.ts                 search / filter / lookup logic (shared)
lib/dataset.ts                 load from Blob (BUYME_DATA_URL) else bundled JSON
lib/scrape.ts                  scraper (used by the cron)
data/buyme.json                bundled catalog (build-time fallback)
vercel.json                    cron schedule
```

Stateless Streamable HTTP — **no Redis required**. Node.js runtime.

## Keeping the catalog fresh

The bundled `data/buyme.json` always works. Two ways to refresh:

### A) Re-scrape locally + redeploy (any Vercel plan)

```sh
cd ~/buyme-mcp && npm run scrape           # rebuild ~/buyme-mcp/data/buyme.json
cp ~/buyme-mcp/data/buyme.json ~/buyme-mcp-vercel/data/
cd ~/buyme-mcp-vercel && git commit -am "refresh catalog" && git push   # auto-deploys (or: vercel deploy --prod)
```

> This repo is connected to Vercel — pushing to `main` triggers a production deploy automatically.

### B) Automated weekly cron → Vercel Blob (needs Blob store + Fluid compute)

`vercel.json` already schedules `GET /api/refresh` Mondays 04:00 UTC. To activate:

1. Create a Blob store and link it (adds `BLOB_READ_WRITE_TOKEN`):
   `vercel blob store add buyme-data`
2. Set a cron secret so the expensive scrape can't be triggered by anyone:
   `vercel env add CRON_SECRET production` (Vercel sends it automatically on cron runs).
3. After the first successful `/api/refresh`, set `BUYME_DATA_URL` to the returned
   blob URL (`https://<store>.public.blob.vercel-storage.com/buyme.json`) so the
   MCP route serves the fresh copy. Redeploy.

The in-function scrape (~1,244 requests, 1-2 min) needs `maxDuration: 300`
(Fluid compute, Pro/Enterprise). On Hobby, use method (A).

## Caveat

Unofficial community index built from publicly available data on buyme.co.il.
Not affiliated with BuyMe. Prices/terms/participating businesses may be stale —
verify on the official site. Every tool response includes a `_source` attribution
note. The endpoint has best-effort per-instance rate limiting; for hard limits
add Upstash/Vercel KV.
