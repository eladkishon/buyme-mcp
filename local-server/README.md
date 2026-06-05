# buyme-mcp

An MCP server for searching Israeli businesses that accept **BuyMe** (buyme.co.il)
gift cards / vouchers. The catalog is scraped from BuyMe's own public JSON API
into `data/buyme.json` and served in-memory.

## Tools

- **`search_businesses`** — free-text search (Hebrew + English) over business
  name, aliases, category, region, and product names. Optional filters:
  `category`, `region`, `online_only`, `min_price`, `max_price`, `limit`.
- **`get_business`** — full detail for one business id: all products & prices,
  money-voucher value range, redemption terms, contact info, links.
- **`list_categories`** — the 13 categories + subcategories, with counts.
- **`list_regions`** — the 15 regions, with counts.

## Data model

- `1,244` businesses, `13` categories, `15` regions.
- Two product shapes:
  - **Money voucher** (most businesses): a `voucher` value range
    (`min`/`max`, e.g. ₪1–₪1500) you choose at purchase.
  - **Fixed packages** (restaurants, spas, experiences): named products with a
    set `price` and description.
- Region labels are clustered/abbreviated (e.g. `ת"א והסביבה`). The server
  aliases common inputs — `תל אביב` / `tel aviv` → `ת"א`, plus haifa, jerusalem,
  eilat, center/north/south, online.

## Refreshing the catalog

BuyMe's directory changes over time. Re-scrape periodically:

```sh
cd ~/buyme-mcp
npm run scrape      # rewrites data/buyme.json (~1–2 min, polite concurrency)
```

The MCP server loads `data/buyme.json` at startup, so restart your Claude
session (or reconnect MCP) after re-scraping to pick up changes.

## Files

| File              | Purpose                                            |
| ----------------- | -------------------------------------------------- |
| `scrape.mjs`      | Crawler → `data/buyme.json`                        |
| `server.mjs`      | MCP stdio server (search/lookup over the dataset)  |
| `test-client.mjs` | `node test-client.mjs` — smoke test all tools      |
| `data/buyme.json` | Generated catalog (not hand-edited)                |

## Source endpoints (for reference)

- `GET /brands/13438757/options` — master directory (13438757 = "BUYME ALL",
  honored by every business) → all businesses + categories + regions.
- `GET /siteapi/supplier/{id}` — per-business detail (about, voucher, packages).

## Registration

Registered at user scope:

```sh
claude mcp add buyme --scope user -- node ~/buyme-mcp/server.mjs
```
