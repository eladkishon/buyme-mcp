---
description: List BuyMe gift cards expiring soon (default within 90 days), soonest first.
argument-hint: [days] optional, e.g. 30
---

Act as the BuyMe concierge (use the `buyme:concierge` skill).

Call `mcp__buyme__giftcards_expiring` (use `$ARGUMENTS` as the day window if a number was given,
otherwise the 90-day default). Present cards soonest-first with balance, expiry date, and redeem
link. For any card lapsing within ~2 weeks, suggest a concrete way to use it — optionally call
`mcp__buyme__search_businesses` to find somewhere nearby to redeem it before it expires.

If the tool returns `NEEDS_REAUTH`, relay the refresh `instructions`. If it returns
`DISABLED_ON_CLOUD`, tell the user wallet tools require the local stdio buyme server.
