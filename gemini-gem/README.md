# BUYME Finder — Gemini Gem

A ready-to-create Gemini **Gem** that helps people find businesses which accept
BUYME gift cards, in Hebrew or English.

> Why a knowledge file and not the live MCP endpoint? Consumer **Gems** (at
> gemini.google.com) can take custom instructions + up to **10 knowledge files**,
> but they **cannot call MCP servers or make HTTP requests**. So this Gem ships the
> catalog as a knowledge file. For always-fresh, full live search, use the MCP
> endpoint from the Gemini **API/SDK** or **Gemini Enterprise** (see bottom).

## Files here
- `INSTRUCTIONS.md` — paste into the Gem's **Instructions** field.
- `buyme-businesses.csv` — upload as the Gem's **Knowledge** (1,244 businesses;
  name, categories, regions, online flag, voucher range, sample products, link).

## Create the Gem (2 minutes)
1. Go to **gemini.google.com** → left sidebar → **Gems** → **New Gem**
   (or **Gem manager** → **New**).
2. **Name:** `BUYME Finder`  ·  שם: `מחפש מתנות BUYME`
3. **Instructions:** paste the full contents of `INSTRUCTIONS.md`.
4. **Knowledge:** click **Add files** and upload `buyme-businesses.csv`.
   (If CSV upload is rejected, import it into a Google Sheet and add that, or
   "Save as PDF" and upload the PDF.)
5. **Save**, then test:
   - "ספא בצפון עד 300 שקל"
   - "fashion stores in Tel Aviv that redeem online"
   - "מסעדות שף עם מימוש אונליין"

The Gem will answer from the catalog and always include each business's link.

## Keeping the Gem fresh
The CSV is a snapshot. To refresh it, regenerate from the latest catalog and
re-upload to the Gem's Knowledge:

```sh
# from the repo root, after a catalog refresh (data/buyme.json):
node scripts/gen-gem-csv.mjs   # rewrites gemini-gem/buyme-businesses.csv
```

(The weekly GitHub Action keeps `data/buyme.json` current; regenerate the CSV from
it when you want to update the Gem, then re-upload it to the Gem's Knowledge.)

## Live alternative — MCP (always fresh, full catalog)
The Gem is offline. For real-time search over the full live catalog:

- **Gemini API / SDK** (`google-genai`): point an MCP client at
  `https://buyme-mcp-vercel.vercel.app/api/mcp` and pass it as a tool. The model
  calls `search_businesses`, `get_business`, `list_categories`, `list_regions`.
- **Gemini CLI:** `gemini mcp add --transport http buyme https://buyme-mcp-vercel.vercel.app/api/mcp`
- **Gemini Enterprise:** register the same URL as a **custom MCP server data store**.
