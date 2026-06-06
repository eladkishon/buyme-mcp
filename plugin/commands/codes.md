---
description: Bulk-export redemption codes/barcodes + links for multiple BuyMe gift cards at once.
argument-hint: [card ids] optional, space/comma separated; omit for all active cards
---

Act as the BuyMe concierge (use the `buyme:concierge` skill).

Call `mcp__buyme__bulk_giftcard_codes`. If `$ARGUMENTS` lists card ids, pass them as `ids`
(otherwise return all active cards with a balance). Present a compact table: title, balance,
serial `code`, `barcode` (if any), expiry, and `redeemUrl`. This is for fulfilling/redeeming
several cards in one go.

Reminder: this only stacks cards at checkout — BuyMe has no merge-into-one-card. Stacking only
works where the business is MultiPass (`get_business` → `acceptsMultipleVouchers: true`); for
Shva/card-POS businesses it's usually one voucher per purchase (combine via BuyMe, 03-3737117).

If the tool returns `NEEDS_REAUTH`, relay the refresh `instructions`. If it returns
`DISABLED_ON_CLOUD`, tell the user wallet tools require the local stdio buyme server.
