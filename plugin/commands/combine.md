---
description: Work out which BuyMe cards to combine to cover a target ₪ amount (lowest balance first).
argument-hint: <amount in ₪> e.g. 250
---

Act as the BuyMe concierge (use the `buyme:concierge` skill).

Target amount: $ARGUMENTS

Call `mcp__buyme__assemble_amount` with the target. Present which cards to stack (lowest
balance first, so small cards get cleared), the running total, and any shortfall or leftover.
Note that this is guidance for **stacking cards at checkout** — BuyMe does not merge balances
into a single card. If the total falls short, say how much more is needed.

If the tool returns `NEEDS_REAUTH`, relay the refresh `instructions`. If it returns
`DISABLED_ON_CLOUD`, tell the user wallet tools require the local stdio buyme server.
