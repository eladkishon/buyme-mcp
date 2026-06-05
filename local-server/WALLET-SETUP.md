# BuyMe wallet (`list_my_giftcards`)

Fully automatic. The tool fetches the user's gift cards live from buyme.co.il and
returns balances, codes, expiry, redeem links, and a total.

## How auth works

BuyMe's frontend is **Ember** and uses **token auth**, not cookies. After login
(Google SSO) it stores a long-lived JWT in
`localStorage["ember_simple_auth-session"]` (the `token` field) and sends it as
`Authorization: Bearer <jwt>`. That JWT is stateless, so the MCP fetches the API
directly over HTTP — no browser, no cookie, no bridge. BuyMe JWTs are valid
**~1 year**.

This is why every cookie/CDP/disk approach failed: `/siteapi` ignores cookies
entirely and only honors the Bearer token.

## Token storage

The MCP reads the token from, in order:
1. `BUYME_TOKEN` env var
2. `~/.buyme-token.json` → `{ "token": "<jwt>", "exp": <unix>, "expIso": "...", "sub": "<uid>" }`

The file is `0600`. The tool decodes the JWT `exp` and returns `tokenValidUntil`;
if expired/missing it returns `status: NEEDS_REAUTH` with refresh instructions.

## Refreshing the token (rare — ~yearly, or after logout)

1. Open a browser logged in to buyme.co.il.
2. In the console: `JSON.parse(localStorage['ember_simple_auth-session']).authenticated.token`
3. Write it to `~/.buyme-token.json` as `{"token":"<jwt>"}` (or set `BUYME_TOKEN`).

The agent can do this automatically by driving a logged-in browser (Playwright),
reading that localStorage key, and writing the file.

## Notes

- Local stdio server only. The public cloud server (`buyme-mcp-vercel`) returns
  `DISABLED_ON_CLOUD` — a shared deployment must never hold a user's token.
- The token is a bearer credential to the user's BuyMe account; keep it private.
