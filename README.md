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
- `get_business` — full detail + all products/prices for one `id`, incl. `paymentWay` + `acceptsMultipleVouchers` (whether several BuyMe cards can be stacked in one purchase — `true` for MultiPass, `false` for Shva/card-POS)
- `list_categories` / `list_regions` — browse with counts

Wallet tools (**local server only** — the cloud server returns `DISABLED_ON_CLOUD`):

- `list_my_giftcards` — your cards: balance, code, expiry, redeem link, total
- `wallet_summary` — total, counts, value distribution, small cards to clear, expiry buckets
- `giftcards_expiring` — cards lapsing within N days (default 90), soonest first
- `assemble_amount` — which cards to combine to cover a target ₪ amount, lowest balance first
- `bulk_giftcard_codes` — redemption details (serial code, barcode, redeem link) for many cards at once; pass `ids` to target specific cards

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

## Claude Code plugin

`plugin/` is a self-contained Claude Code plugin (`buyme`) that wires this repo up
for Claude Code in one shot:

- **MCP** (`plugin/.mcp.json`) — registers TWO servers:
  - `buyme` (stdio, `local-server/server.mjs`) — full catalog **+ wallet** tools. Reads the
    BuyMe token from `BUYME_TOKEN` (passed through) or `~/.buyme-token.json`.
  - `buyme-cloud` (HTTP, the Vercel endpoint) — catalog only; works in any environment with
    no local setup, so the plugin is useful even where the stdio server can't run.
- **Skill** (`plugin/skills/concierge/SKILL.md`) — the concierge behavior (`buyme:concierge`):
  always read `terms`, verify hours/closures, flag redemption blockers, handle the wallet.
- **Commands** — `/buyme:find`, `/buyme:wallet`, `/buyme:expiring`, `/buyme:combine`, `/buyme:codes`.

Install (the marketplace lives on GitHub via `.claude-plugin/marketplace.json`):

```sh
claude plugin marketplace add eladkishon/buyme-mcp   # or: add .  (from a local clone)
claude plugin install buyme@buyme-local
```

### Running in a cloud / remote Claude env

- **Public / shared cloud:** add `buyme-cloud` (the HTTP endpoint) — catalog tools work
  everywhere. Wallet tools return `DISABLED_ON_CLOUD` by design (a shared server must never
  hold your credentials).
- **Private cloud env you control** (your own Claude Code sandbox/agent): the stdio `buyme`
  server gives full wallet access too — clone the repo, `cd local-server && npm install`, and
  set `BUYME_TOKEN` as a secret env var. The plugin forwards it (`"env": {"BUYME_TOKEN":
  "${BUYME_TOKEN:-}"}`), so no token file is needed.

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
plugin/                              Claude Code plugin: MCP config + concierge skill + slash commands
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
