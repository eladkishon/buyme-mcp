# buyme-mcp-vercel

Public **remote MCP server** (Streamable HTTP) for searching Israeli businesses
that accept **BuyMe** (buyme.co.il) gift cards. Deployed on Vercel.

**Live:** https://buyme-mcp-vercel.vercel.app
**MCP endpoint:** `https://buyme-mcp-vercel.vercel.app/api/mcp`

This repo holds **two servers** that share the same catalog:

- **Cloud / remote** (this Next.js app, `app/api/[transport]/route.ts`) — the public
  Streamable HTTP endpoint any MCP client (Gemini, Claude, ChatGPT…) can use over the
  internet. Search/lookup only; wallet reads are `DISABLED_ON_CLOUD` by design.
- **Local / stdio** (`local-server/`) — the server you run on your own machine, where
  your BuyMe token stays local and the **wallet tools actually work**. See
  [`local-server/README.md`](local-server/README.md) and
  [`local-server/WALLET-SETUP.md`](local-server/WALLET-SETUP.md).

## Tools

Catalog tools (both servers):

- `search_businesses` — `query` (HE/EN) + filters: `category`, `region`, `online_only`, `min_price`, `max_price`, `limit`
- `get_business` — full detail + all products/prices for one `id`
- `list_categories` / `list_regions` — browse with counts

Wallet tools (**local server only** — the cloud server returns `DISABLED_ON_CLOUD`):

- `list_my_giftcards` — your cards: balance, code, expiry, redeem link, total
- `wallet_summary` — total, counts, value distribution, small cards to clear, expiry buckets
- `giftcards_expiring` — cards lapsing within N days (default 90), soonest first
- `assemble_amount` — which cards to combine to cover a target ₪ amount, lowest balance first

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
app/api/[transport]/route.ts        MCP server (mcp-handler, Streamable HTTP) -> /api/mcp
app/page.tsx                         server: gathers endpoint + stats
app/_components/Landing.tsx          bilingual (HE/EN) UI, RTL toggle
lib/catalog.ts                       search / filter / lookup logic (shared)
lib/dataset.ts                       loads bundled data/buyme.json
scripts/scrape.mjs                   scraper -> data/buyme.json
.github/workflows/refresh-catalog.yml  weekly auto-refresh
data/buyme.json                      bundled catalog
local-server/                        local stdio MCP server (wallet tools; not part of the Vercel build)
```

Stateless Streamable HTTP — **no Redis required**. Node.js runtime.

## Keeping the catalog fresh (automatic)

A GitHub Action (`.github/workflows/refresh-catalog.yml`) re-scrapes BuyMe **every
Monday 04:00 UTC**, and commits `data/buyme.json` only if it changed. The push
triggers a Vercel production deploy, so the live site + MCP endpoint always serve
fresh data. No Vercel plan limits apply (the scrape runs on the GitHub runner, not
in a serverless function).

- Run it on demand: GitHub → Actions → "Refresh BuyMe catalog" → **Run workflow**.
- Manual local refresh: `node scripts/scrape.mjs && git commit -am "refresh catalog" && git push`.

## Caveat

Unofficial community index built from publicly available data on buyme.co.il.
Not affiliated with BuyMe. Prices/terms/participating businesses may be stale —
verify on the official site. Every tool response includes a `_source` attribution
note. The endpoint has best-effort per-instance rate limiting; for hard limits
add Upstash/Vercel KV.
