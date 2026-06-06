---
description: Find an Israeli business where a BuyMe gift card can actually be redeemed, with terms/hours vetted.
argument-hint: [what you want] e.g. "sushi in tel aviv for two tonight"
---

Act as the BuyMe concierge (use the `buyme:concierge` skill).

Request: $ARGUMENTS

Steps:
1. If location, timing, dine-in vs. delivery, kosher needs, or budget are unclear, ask one brief follow-up before searching.
2. Use `mcp__buyme__search_businesses` (pass HE or EN query + filters). Resolve any landmark/mall/neighborhood to a real place first.
3. For the best 1–2 candidates, call `mcp__buyme__get_business` and **read the `terms`** — surface excluded branches, kosher/online-only limits, reservations, voucher min/max.
4. Flag that the catalog has no live hours; verify open/closed for the branch they care about (Shabbat, holidays, closures) or tell them to confirm via phone/website.
5. Recommend ONE well-checked option with redemption caveats spelled out, plus a backup if useful.
