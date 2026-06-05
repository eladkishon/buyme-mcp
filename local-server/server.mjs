#!/usr/bin/env node
// MCP server exposing search over the BuyMe (buyme.co.il) business catalog.
//
// Tools:
//   search_businesses  - find businesses that accept BuyMe by free text +
//                        optional category / region / online-redeem filters
//   get_business       - full detail (all products/prices) for one business
//   list_categories    - browse the category tree
//   list_regions       - list geographic regions
//
// Data: data/buyme.json, produced by scrape.mjs. Loaded once into memory.

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "data", "buyme.json");

let DB;
try {
  DB = JSON.parse(readFileSync(DATA_PATH, "utf8"));
} catch (e) {
  console.error(
    `[buyme-mcp] Could not load ${DATA_PATH}. Run \`npm run scrape\` first.\n${e.message}`
  );
  process.exit(1);
}

const norm = (s) => (s || "").toString().toLowerCase().trim();

// Precompute a search haystack per business.
for (const b of DB.businesses) {
  b._hay = norm(
    [
      b.name,
      b.slogan,
      b.about,
      ...(b.searchTerms || []),
      ...(b.categories || []),
      ...(b.subcategories || []),
      ...(b.regions || []),
      ...(b.products || []).map((p) => `${p.name} ${p.description || ""}`),
    ].join("  ")
  );
  b._name = norm(b.name);
  b._terms = (b.searchTerms || []).map(norm);
}

function businessOnline(b) {
  return !!b.onlineRedeem || (b.products || []).some((p) => p.onlineRedeem);
}

function scoreBusiness(b, tokens) {
  let score = 0;
  for (const t of tokens) {
    if (!t) continue;
    if (b._name === t) score += 120; // exact name
    else if (b._name.includes(t)) score += 40; // name substring
    if (b._terms.some((x) => x === t)) score += 30; // alias exact
    else if (b._terms.some((x) => x.includes(t))) score += 12;
    if (b._hay.includes(t)) score += 6; // anywhere
  }
  // Light boost for businesses with richer data.
  if (score > 0) score += Math.min(b.productCount, 5);
  return score;
}

function matchesCategory(b, cat) {
  const c = norm(cat);
  return (
    (b.categories || []).some((x) => norm(x).includes(c)) ||
    (b.subcategories || []).some((x) => norm(x).includes(c))
  );
}

// The dataset uses abbreviated/region-cluster labels (e.g. 'ת"א והסביבה').
// Map common things users actually type to substrings present in those labels.
const REGION_ALIASES = [
  { canon: 'ת"א', names: ["תל אביב", "תל-אביב", "tel aviv", "telaviv", "tlv"] },
  { canon: "חיפה", names: ["haifa"] },
  { canon: "ירושלים", names: ["jerusalem", "jlm"] },
  { canon: "אילת", names: ["eilat"] },
  { canon: "מרכז", names: ["center", "central"] },
  { canon: "צפון", names: ["north", "northern"] },
  { canon: "דרום", names: ["south", "southern"] },
  { canon: "אונליין", names: ["online"] },
];

function matchesRegion(b, region) {
  const r = norm(region);
  const targets = new Set([r]);
  for (const a of REGION_ALIASES) {
    const canon = norm(a.canon);
    const aliasHit = a.names.some((n) => {
      const nn = norm(n);
      return nn === r || nn.includes(r) || r.includes(nn);
    });
    if (aliasHit) targets.add(canon);
    if (canon.includes(r) || r.includes(canon)) a.names.forEach((n) => targets.add(norm(n)));
  }
  return (b.regions || []).some((x) => {
    const xn = norm(x);
    return [...targets].some((t) => t && xn.includes(t));
  });
}

function summarize(b, { withProducts = true } = {}) {
  const out = {
    id: b.id,
    name: b.name,
    slogan: b.slogan || undefined,
    categories: b.categories,
    subcategories: b.subcategories?.length ? b.subcategories : undefined,
    regions: b.regions,
    onlineRedeem: businessOnline(b),
    phone: b.phone || undefined,
    website: b.website || undefined,
    url: b.url,
    voucher: b.voucher || undefined,
    productCount: b.productCount,
  };
  if (withProducts && b.products?.length) {
    out.products = b.products.slice(0, 6).map((p) => ({
      name: p.name,
      price: p.price ?? undefined,
      onlineRedeem: p.onlineRedeem || undefined,
    }));
  }
  return out;
}

function searchBusinesses({ query, category, region, online_only, min_price, max_price, limit }) {
  const tokens = norm(query).split(/[\s,]+/).filter(Boolean);
  const lim = Math.max(1, Math.min(Number(limit) || 20, 100));

  let candidates = DB.businesses;
  if (category) candidates = candidates.filter((b) => matchesCategory(b, category));
  if (region) candidates = candidates.filter((b) => matchesRegion(b, region));
  if (online_only) candidates = candidates.filter(businessOnline);
  if (min_price != null || max_price != null) {
    const lo = min_price ?? -Infinity;
    const hi = max_price ?? Infinity;
    candidates = candidates.filter((b) => {
      const prices = (b.products || []).map((p) => p.price).filter((n) => n != null);
      if (b.voucher) {
        if (b.voucher.min != null) prices.push(b.voucher.min);
        if (b.voucher.max != null) prices.push(b.voucher.max);
      }
      return prices.some((p) => p >= lo && p <= hi);
    });
  }

  let scored;
  if (tokens.length) {
    scored = candidates
      .map((b) => ({ b, s: scoreBusiness(b, tokens) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);
  } else {
    // No query -> just list filtered results, most products first.
    scored = candidates
      .map((b) => ({ b, s: b.productCount }))
      .sort((a, b) => b.s - a.s);
  }

  return {
    total: scored.length,
    returned: Math.min(scored.length, lim),
    results: scored.slice(0, lim).map((x) => summarize(x.b)),
  };
}

function getBusiness(id) {
  const b = DB.businesses.find((x) => String(x.id) === String(id));
  if (!b) return { error: `No business with id ${id}` };
  return {
    id: b.id,
    name: b.name,
    slogan: b.slogan,
    about: b.about,
    categories: b.categories,
    subcategories: b.subcategories,
    regions: b.regions,
    onlineRedeem: businessOnline(b),
    phone: b.phone,
    website: b.website,
    storeLocatorUrl: b.storeLocatorUrl,
    reservationUrl: b.reservationUrl,
    address: b.address,
    email: b.email,
    instagram: b.instagram,
    facebook: b.facebook,
    logo: b.logo,
    url: b.url,
    terms: b.terms,
    voucher: b.voucher,
    searchTerms: b.searchTerms,
    products: b.products,
    productCount: b.productCount,
  };
}

// --- Personal wallet (the user's own logged-in buyme.co.il session) ---
//
// buyme.co.il's frontend is Ember and uses TOKEN auth, not cookies: it stores a
// long-lived JWT in localStorage["ember_simple_auth-session"] and sends it as
// `Authorization: Bearer <jwt>`. That JWT works from anywhere (it's stateless),
// so this server fetches the wallet directly over HTTP — no browser, no cookie.
//
// The token is read from BUYME_TOKEN env or ~/.buyme-token.json (written once by
// the agent after a login). BuyMe's tokens are valid ~1 year; when one expires
// the tool returns NEEDS_REAUTH so the agent can refresh it from a logged-in tab.

const TOKEN_FILE = join(homedir(), ".buyme-token.json");
const WALLET_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36";

const REAUTH_STEPS = [
  "The stored BuyMe token is missing or expired.",
  "To refresh it (the agent can do this):",
  "1. Open a browser logged in to buyme.co.il (Google SSO).",
  "2. In that tab's console run: localStorage.getItem('ember_simple_auth-session')",
  "   and read the JWT from the JSON (the `token` field).",
  "3. Save it to ~/.buyme-token.json as {\"token\":\"<jwt>\"} (or set BUYME_TOKEN), then retry.",
  "BuyMe JWTs are typically valid ~1 year, so this is rare.",
].join("\n");

function getToken() {
  if (process.env.BUYME_TOKEN) return process.env.BUYME_TOKEN.trim();
  try {
    const f = JSON.parse(readFileSync(TOKEN_FILE, "utf8"));
    return (f.token || f.access_token || "").trim() || null;
  } catch {
    return null;
  }
}

// Decode a JWT's exp (seconds) without verifying — just to report validity.
function jwtExp(tok) {
  try {
    const p = JSON.parse(Buffer.from(tok.split(".")[1], "base64").toString("utf8"));
    return p.exp ? p.exp * 1000 : null;
  } catch {
    return null;
  }
}

async function fetchVouchers(token, isUsed, isExpired) {
  const out = [];
  let page = 1;
  while (page < 20) {
    const url =
      `https://buyme.co.il/siteapi/vouchers/received?page=${page}&perPage=50` +
      `&isUsed=${isUsed}&isExpired=${isExpired}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "User-Agent": WALLET_UA },
    });
    if (res.status === 401 || res.status === 403) return { auth: false };
    if (!res.ok) break;
    const text = await res.text();
    let j;
    try {
      j = JSON.parse(text); // token responses are plain JSON
    } catch {
      try {
        j = JSON.parse(Buffer.from(text, "base64").toString("utf8")); // cookie path returned base64
      } catch {
        break;
      }
    }
    if (!j || !Array.isArray(j.vouchers)) break;
    out.push(...j.vouchers.map((v) => v.data));
    if (!j.meta || !j.meta.hasMore) break;
    page += 1;
  }
  return { auth: true, vouchers: out };
}

// Shared loader: fetches the wallet once and returns normalized cards.
// Returns { status:"OK", tokenValidUntil, cards } or a NEEDS_REAUTH object.
async function loadWallet({ include_used = false, include_expired = false } = {}) {
  const token = getToken();
  if (!token) return { status: "NEEDS_REAUTH", instructions: REAUTH_STEPS };

  const exp = jwtExp(token);
  if (exp && exp < Date.now()) return { status: "NEEDS_REAUTH", instructions: REAUTH_STEPS };

  // Gather active + (optionally) used/expired, de-duped by id.
  const byId = new Map();
  const combos = [[0, 0]];
  if (include_used) combos.push([1, 0]);
  if (include_expired) combos.push([0, 1]);
  if (include_used && include_expired) combos.push([1, 1]);

  for (const [u, e] of combos) {
    const r = await fetchVouchers(token, u, e);
    if (r.auth === false) return { status: "NEEDS_REAUTH", instructions: REAUTH_STEPS };
    for (const d of r.vouchers || []) byId.set(d.id, d);
  }

  const cards = [...byId.values()].map((c) => ({
    id: c.id,
    title: c.title,
    balance: c.amount,
    originalValue: c.originalValue,
    code: c.serialnumber,
    expiresAt: c.expiresAt,
    used: c.used,
    supplier: c.supplier?.name,
    url: c.url,
  }));
  return { status: "OK", tokenValidUntil: exp ? new Date(exp).toISOString() : null, cards };
}

const DAY_MS = 86_400_000;
function daysUntil(iso) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / DAY_MS);
}

async function listMyGiftcards({ include_used = false, include_expired = false } = {}) {
  const w = await loadWallet({ include_used, include_expired });
  if (w.status !== "OK") return w;
  return {
    status: "OK",
    tokenValidUntil: w.tokenValidUntil,
    count: w.cards.length,
    totalBalance: w.cards.reduce((s, c) => s + (c.balance || 0), 0),
    currency: "ILS",
    giftcards: w.cards,
  };
}

// One-call overview of the wallet: totals, distribution, small cards to clear,
// and expiry buckets. Active (unused, unexpired) cards only.
async function walletSummary() {
  const w = await loadWallet();
  if (w.status !== "OK") return w;
  const cards = w.cards.filter((c) => (c.balance || 0) > 0);
  const balances = cards.map((c) => c.balance || 0);
  const total = balances.reduce((s, b) => s + b, 0);
  const sorted = [...cards].sort((a, b) => (a.balance || 0) - (b.balance || 0));
  const bucket = (days) =>
    cards.filter((c) => {
      const d = daysUntil(c.expiresAt);
      return d != null && d <= days;
    }).length;

  return {
    status: "OK",
    tokenValidUntil: w.tokenValidUntil,
    currency: "ILS",
    totalBalance: total,
    activeCount: cards.length,
    smallestBalance: balances.length ? Math.min(...balances) : 0,
    largestBalance: balances.length ? Math.max(...balances) : 0,
    averageBalance: cards.length ? Math.round(total / cards.length) : 0,
    expiring: { within30d: bucket(30), within90d: bucket(90), within365d: bucket(365) },
    // Tiny leftover cards worth using up first.
    smallCards: sorted
      .filter((c) => (c.balance || 0) < 50)
      .map((c) => ({ id: c.id, balance: c.balance, code: c.code, expiresAt: c.expiresAt, url: c.url })),
    smallestFirst: sorted.slice(0, 5).map((c) => ({ id: c.id, balance: c.balance, expiresAt: c.expiresAt })),
  };
}

// Cards lapsing within a window, soonest first, so nothing expires unused.
async function giftcardsExpiring({ within_days = 90 } = {}) {
  const w = await loadWallet();
  if (w.status !== "OK") return w;
  const within = Number(within_days) || 90;
  const cards = w.cards
    .filter((c) => (c.balance || 0) > 0)
    .map((c) => ({ ...c, daysUntilExpiry: daysUntil(c.expiresAt) }))
    .filter((c) => c.daysUntilExpiry != null && c.daysUntilExpiry <= within)
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  return {
    status: "OK",
    withinDays: within,
    count: cards.length,
    expiringBalance: cards.reduce((s, c) => s + (c.balance || 0), 0),
    currency: "ILS",
    giftcards: cards.map((c) => ({
      id: c.id,
      balance: c.balance,
      code: c.code,
      expiresAt: c.expiresAt,
      daysUntilExpiry: c.daysUntilExpiry,
      url: c.url,
    })),
  };
}

// Pick cards to cover a target amount, LOWEST balance first, so small leftover
// cards get cleared. Returns the order to use them and how much to draw from each.
async function assembleAmount({ amount } = {}) {
  const target = Number(amount);
  if (!target || target <= 0)
    return { status: "ERROR", error: "Provide a positive `amount` (ILS) to cover." };

  const w = await loadWallet();
  if (w.status !== "OK") return w;

  const cards = w.cards
    .filter((c) => (c.balance || 0) > 0)
    .sort((a, b) => (a.balance || 0) - (b.balance || 0)); // lowest balance first

  const use = [];
  let sum = 0;
  for (const c of cards) {
    if (sum >= target) break;
    use.push(c);
    sum += c.balance || 0;
  }

  const covered = sum >= target;
  const overshoot = covered ? sum - target : 0; // balance left on the last card after use

  return {
    status: "OK",
    target,
    currency: "ILS",
    covered,
    cardsUsed: use.length,
    sumOfSelected: sum,
    leftoverOnLastCard: covered ? overshoot : 0,
    remainingToPayElsewhere: covered ? 0 : target - sum,
    note: covered
      ? "Use the cards in this order; the last card is only partially drawn (leftoverOnLastCard stays on it). Smallest balances are spent first to clear them."
      : "Your active gift cards don't fully cover this amount; pay remainingToPayElsewhere by another method.",
    plan: use.map((c, i) => ({
      order: i + 1,
      id: c.id,
      balance: c.balance,
      // amount actually drawn from this card toward the target
      use: i < use.length - 1 ? c.balance : c.balance - overshoot,
      code: c.code,
      expiresAt: c.expiresAt,
      url: c.url,
    })),
  };
}

const TOOLS = [
  {
    name: "search_businesses",
    description:
      "Search Israeli businesses that accept BuyMe gift cards. Free-text query matches business name, aliases (Hebrew + English), category, region, and product names. Optional filters narrow by category, region, online redemption, and price range. Returns ranked businesses with a few sample products each; use get_business for the full product list.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Free text, Hebrew or English (e.g. 'spa tel aviv', 'מסעדות שף', 'adidas', 'coffee').",
        },
        category: {
          type: "string",
          description:
            "Filter by category or subcategory name (e.g. 'מסעדות וקולינריה', 'ספא', 'אופנה'). See list_categories.",
        },
        region: {
          type: "string",
          description: "Filter by geographic region name (e.g. 'תל אביב', 'ירושלים', 'צפון'). See list_regions.",
        },
        online_only: {
          type: "boolean",
          description: "If true, only businesses where the voucher can be redeemed online.",
        },
        min_price: { type: "number", description: "Only businesses offering a product/voucher value >= this." },
        max_price: { type: "number", description: "Only businesses offering a product/voucher value <= this." },
        limit: { type: "number", description: "Max results (default 20, max 100)." },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_business",
    description:
      "Get full detail for one business by its id (from search_businesses results): all products with prices, money-voucher range, redemption terms, contact info, and links.",
    inputSchema: {
      type: "object",
      properties: { id: { type: ["number", "string"], description: "Business id." } },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "list_my_giftcards",
    description:
      "List the signed-in user's own BuyMe gift cards (their wallet) live: current balance, codes, expiry, redeem links, and a total balance. Fully automatic — it fetches buyme.co.il directly using a stored long-lived JWT (BuyMe uses Bearer-token auth), no browser or cookie needed. The result includes tokenValidUntil. By default returns only active (unused, unexpired) cards; pass include_used/include_expired for the rest. If the token is missing/expired it returns status NEEDS_REAUTH with `instructions` to refresh it from a logged-in tab. Local stdio server only; the public cloud server returns DISABLED_ON_CLOUD.",
    inputSchema: {
      type: "object",
      properties: {
        include_used: { type: "boolean", description: "Include already-used gift cards (default false)." },
        include_expired: { type: "boolean", description: "Include expired gift cards (default false)." },
      },
      additionalProperties: false,
    },
  },
  {
    name: "wallet_summary",
    description:
      "One-call overview of the user's BuyMe wallet (active cards): total balance, card count, value distribution (smallest/largest/average), the small leftover cards (< ₪50) worth clearing first, and how many cards expire within 30/90/365 days. Faster than reading every card. Local stdio server only; the public cloud server returns DISABLED_ON_CLOUD.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "giftcards_expiring",
    description:
      "List the user's BuyMe gift cards expiring within a window (default 90 days), soonest first, so nothing lapses unused. Returns each card's balance, code, expiry, days-until-expiry, and redeem link, plus the total balance at risk. Local stdio server only.",
    inputSchema: {
      type: "object",
      properties: {
        within_days: { type: "number", description: "Expiry window in days (default 90)." },
      },
      additionalProperties: false,
    },
  },
  {
    name: "assemble_amount",
    description:
      "Given a target amount in ILS, pick which of the user's BuyMe gift cards to combine to cover it — using the LOWEST balances first so small leftover cards get cleared. Returns the ordered plan (which cards, how much to draw from each, codes + redeem links), whether the target is fully covered, the leftover left on the last card, and any remainder to pay by other means. Local stdio server only.",
    inputSchema: {
      type: "object",
      properties: {
        amount: { type: "number", description: "Total amount in ILS to cover with gift cards." },
      },
      required: ["amount"],
      additionalProperties: false,
    },
  },
  {
    name: "list_categories",
    description: "List BuyMe categories and their subcategories (with the number of businesses in each).",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "list_regions",
    description: "List BuyMe geographic regions (with the number of businesses in each).",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
];

function listCategories() {
  const counts = new Map();
  for (const b of DB.businesses)
    for (const c of b.categories || []) counts.set(c, (counts.get(c) || 0) + 1);
  return {
    categories: DB.categories.map((c) => ({
      name: c.name,
      businessCount: counts.get(c.name) || 0,
      subCategories: c.subCategories.map((s) => s.name),
    })),
  };
}

function listRegions() {
  const counts = new Map();
  for (const b of DB.businesses)
    for (const r of b.regions || []) counts.set(r, (counts.get(r) || 0) + 1);
  return {
    regions: DB.regions.map((r) => ({ name: r.name, businessCount: counts.get(r.name) || 0 })),
  };
}

const INSTRUCTIONS = `You are a BuyMe gift-card concierge. BuyMe (buyme.co.il) gift cards are redeemed at specific Israeli businesses, so a recommendation is only useful if the holder can actually walk in and redeem it. Optimize for "can this person redeem this, here, now?" — not just "does a matching business exist?".

ALWAYS, before you present or confirm a business:
1. Call get_business and read the \`terms\` field. It routinely hides redemption blockers: excluded branches ("not valid at X / selected branches only"), kosher-only or online-only limits, reservation requirements, and product-vs-voucher conditions. Surface anything that affects whether THIS person, at THIS branch, can redeem.
2. Check for closures and timing — the catalog has NO live hours. Verify open/closed for the specific branch the user cares about: temporary/renovation closures, holiday hours, and Shabbat (kosher venues typically close Friday afternoon and reopen Saturday night). If you cannot verify, say so and point to the record's phone/website to confirm.
3. Flag fulfillment blockers explicitly: voucher min/max vs. the product's price; online-only redemption when the user wants to dine in (or vice-versa); chain entries labeled "selected branches" where the user's branch may not participate; region mismatch between the voucher and where they are.

Be a concierge, not a search box:
- Ask a brief follow-up whenever intent is ambiguous before recommending — location/branch, date & time (today's hours matter), dine-in vs. delivery, party size, kosher needs, budget or voucher value on hand, and the occasion.
- When the user names a landmark, mall, or neighborhood, resolve it to a real place first, then find the nearest redeemable business.
- Prefer ONE well-checked recommendation with the redemption caveats spelled out over a long unverified list.

You can also manage the user's OWN wallet. These fetch buyme.co.il live using a stored long-lived token; if any returns NEEDS_REAUTH, relay the included \`instructions\` to refresh it (rare — tokens last ~1 year):
- list_my_giftcards — every card: balance, code, expiry, redeem link, total.
- wallet_summary — fast overview: total, counts, distribution, small cards to clear, expiry buckets. Prefer this when the user asks "how much do I have / what's in my wallet".
- giftcards_expiring — cards lapsing within N days (default 90), soonest first; use proactively so nothing expires unused.
- assemble_amount — given a target ₪ amount, which cards to combine (lowest balance first, to clear small leftovers); returns the order, how much to draw from each, and any remainder to pay otherwise.

Tools: search_businesses (find), get_business (full detail + \`terms\` — always read before recommending), list_my_giftcards / wallet_summary / giftcards_expiring / assemble_amount (the user's own wallet), list_categories, list_regions.`;

const server = new Server(
  { name: "buyme", version: "1.0.0" },
  { capabilities: { tools: {} }, instructions: INSTRUCTIONS }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;
  let result;
  try {
    switch (name) {
      case "search_businesses":
        result = searchBusinesses(args);
        break;
      case "get_business":
        result = getBusiness(args.id);
        break;
      case "list_my_giftcards":
        result = await listMyGiftcards(args);
        break;
      case "wallet_summary":
        result = await walletSummary();
        break;
      case "giftcards_expiring":
        result = await giftcardsExpiring(args);
        break;
      case "assemble_amount":
        result = await assembleAmount(args);
        break;
      case "list_categories":
        result = listCategories();
        break;
      case "list_regions":
        result = listRegions();
        break;
      default:
        return { isError: true, content: [{ type: "text", text: `Unknown tool: ${name}` }] };
    }
  } catch (e) {
    return { isError: true, content: [{ type: "text", text: `Error: ${e.message}` }] };
  }
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(
  `[buyme-mcp] ready — ${DB.businessCount} businesses, ${DB.productCount} products`
);
