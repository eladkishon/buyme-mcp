// Framework-agnostic search over the BuyMe catalog (data/buyme.json shape).
// Mirrors the local stdio server's logic so both behave identically.

type AnyObj = Record<string, any>;

const norm = (s: any): string => (s ?? "").toString().toLowerCase().trim();

// Build a search haystack on each business. Idempotent + cached via db._prepared.
export function prepareDataset(db: AnyObj): AnyObj {
  if (!db || db._prepared) return db;
  for (const b of db.businesses || []) {
    b._hay = norm(
      [
        b.name,
        b.slogan,
        b.about,
        ...(b.searchTerms || []),
        ...(b.categories || []),
        ...(b.subcategories || []),
        ...(b.regions || []),
        ...(b.products || []).map((p: AnyObj) => `${p.name} ${p.description || ""}`),
      ].join("  ")
    );
    b._name = norm(b.name);
    b._terms = (b.searchTerms || []).map(norm);
  }
  db._prepared = true;
  return db;
}

function businessOnline(b: AnyObj): boolean {
  return !!b.onlineRedeem || (b.products || []).some((p: AnyObj) => p.onlineRedeem);
}

function scoreBusiness(b: AnyObj, tokens: string[]): number {
  let score = 0;
  for (const t of tokens) {
    if (!t) continue;
    if (b._name === t) score += 120;
    else if (b._name.includes(t)) score += 40;
    if (b._terms.some((x: string) => x === t)) score += 30;
    else if (b._terms.some((x: string) => x.includes(t))) score += 12;
    if (b._hay.includes(t)) score += 6;
  }
  if (score > 0) score += Math.min(b.productCount || 0, 5);
  return score;
}

function matchesCategory(b: AnyObj, cat: string): boolean {
  const c = norm(cat);
  return (
    (b.categories || []).some((x: string) => norm(x).includes(c)) ||
    (b.subcategories || []).some((x: string) => norm(x).includes(c))
  );
}

// Dataset uses clustered/abbreviated region labels (e.g. 'ת"א והסביבה').
const REGION_ALIASES: { canon: string; names: string[] }[] = [
  { canon: 'ת"א', names: ["תל אביב", "תל-אביב", "tel aviv", "telaviv", "tlv"] },
  { canon: "חיפה", names: ["haifa"] },
  { canon: "ירושלים", names: ["jerusalem", "jlm"] },
  { canon: "אילת", names: ["eilat"] },
  { canon: "מרכז", names: ["center", "central"] },
  { canon: "צפון", names: ["north", "northern"] },
  { canon: "דרום", names: ["south", "southern"] },
  { canon: "אונליין", names: ["online"] },
];

function matchesRegion(b: AnyObj, region: string): boolean {
  const r = norm(region);
  const targets = new Set<string>([r]);
  for (const a of REGION_ALIASES) {
    const canon = norm(a.canon);
    const aliasHit = a.names.some((n) => {
      const nn = norm(n);
      return nn === r || nn.includes(r) || r.includes(nn);
    });
    if (aliasHit) targets.add(canon);
    if (canon.includes(r) || r.includes(canon)) a.names.forEach((n) => targets.add(norm(n)));
  }
  return (b.regions || []).some((x: string) => {
    const xn = norm(x);
    return [...targets].some((t) => t && xn.includes(t));
  });
}

function summarize(b: AnyObj): AnyObj {
  const out: AnyObj = {
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
  if (b.products?.length) {
    out.products = b.products.slice(0, 6).map((p: AnyObj) => ({
      name: p.name,
      price: p.price ?? undefined,
      onlineRedeem: p.onlineRedeem || undefined,
    }));
  }
  return out;
}

export interface SearchArgs {
  query?: string;
  category?: string;
  region?: string;
  online_only?: boolean;
  min_price?: number;
  max_price?: number;
  limit?: number;
}

export function search(db: AnyObj, args: SearchArgs = {}) {
  const { query, category, region, online_only, min_price, max_price, limit } = args;
  const tokens = norm(query).split(/[\s,]+/).filter(Boolean);
  const lim = Math.max(1, Math.min(Number(limit) || 20, 100));

  let candidates: AnyObj[] = db.businesses;
  if (category) candidates = candidates.filter((b) => matchesCategory(b, category));
  if (region) candidates = candidates.filter((b) => matchesRegion(b, region));
  if (online_only) candidates = candidates.filter(businessOnline);
  if (min_price != null || max_price != null) {
    const lo = min_price ?? -Infinity;
    const hi = max_price ?? Infinity;
    candidates = candidates.filter((b) => {
      const prices = (b.products || []).map((p: AnyObj) => p.price).filter((n: any) => n != null);
      if (b.voucher) {
        if (b.voucher.min != null) prices.push(b.voucher.min);
        if (b.voucher.max != null) prices.push(b.voucher.max);
      }
      return prices.some((p: number) => p >= lo && p <= hi);
    });
  }

  let scored: { b: AnyObj; s: number }[];
  if (tokens.length) {
    scored = candidates
      .map((b) => ({ b, s: scoreBusiness(b, tokens) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);
  } else {
    scored = candidates
      .map((b) => ({ b, s: b.productCount || 0 }))
      .sort((a, b) => b.s - a.s);
  }

  return {
    total: scored.length,
    returned: Math.min(scored.length, lim),
    results: scored.slice(0, lim).map((x) => summarize(x.b)),
  };
}

export function getBusiness(db: AnyObj, id: string | number) {
  const b = db.businesses.find((x: AnyObj) => String(x.id) === String(id));
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
    // How the business redeems BuyMe + whether multiple cards can be combined in one purchase.
    paymentWay: b.paymentWay ?? null,
    acceptsMultipleVouchers: b.acceptsMultipleVouchers ?? null,
    onlineRedeemMoney: b.onlineRedeemMoney ?? null,
    multipleVouchersNote: multiVoucherNote(b.paymentWay ?? null, b.acceptsMultipleVouchers ?? null),
    searchTerms: b.searchTerms,
    products: b.products,
    productCount: b.productCount,
  };
}

// Human note about combining several BuyMe cards at one business, from its paymentWay.
function multiVoucherNote(paymentWay: string | null, accepts: boolean | null): string {
  if (accepts === true)
    return "MultiPass redemption — BuyMe manages the transaction, so you can spend a card partially and stack several BuyMe cards in one purchase.";
  if (accepts === false)
    return `Redeemed via ${paymentWay || "the card POS"} — the voucher is swiped once like a prepaid card, so typically one BuyMe voucher per purchase. To combine several, call BuyMe support (03-3737117) or confirm with the branch.`;
  return "Couldn't determine whether this business accepts multiple BuyMe cards in one purchase — confirm with the branch or BuyMe support (03-3737117).";
}

export function listCategories(db: AnyObj) {
  const counts = new Map<string, number>();
  for (const b of db.businesses)
    for (const c of b.categories || []) counts.set(c, (counts.get(c) || 0) + 1);
  return {
    categories: db.categories.map((c: AnyObj) => ({
      name: c.name,
      businessCount: counts.get(c.name) || 0,
      subCategories: (c.subCategories || []).map((s: AnyObj) => s.name),
    })),
  };
}

export function listRegions(db: AnyObj) {
  const counts = new Map<string, number>();
  for (const b of db.businesses)
    for (const r of b.regions || []) counts.set(r, (counts.get(r) || 0) + 1);
  return {
    regions: db.regions.map((r: AnyObj) => ({
      name: r.name,
      businessCount: counts.get(r.name) || 0,
    })),
  };
}

export function datasetMeta(db: AnyObj) {
  return {
    source: db.source,
    businessCount: db.businessCount,
    productCount: db.productCount,
    categoryCount: (db.categories || []).length,
    regionCount: (db.regions || []).length,
  };
}
