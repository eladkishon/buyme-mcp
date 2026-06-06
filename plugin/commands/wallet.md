---
description: Summarize your BuyMe wallet — total balance, card count, value distribution, small cards to clear.
---

Act as the BuyMe concierge (use the `buyme:concierge` skill).

Call `mcp__buyme__wallet_summary` and present:
- Total balance and number of cards.
- Value distribution and any small/low-balance cards worth clearing first.
- Expiry buckets (highlight anything lapsing soon).

If the tool returns `NEEDS_REAUTH`, relay the refresh `instructions`. If it returns
`DISABLED_ON_CLOUD`, tell the user wallet tools require the local stdio buyme server.

$ARGUMENTS
