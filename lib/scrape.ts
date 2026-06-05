// Scrapes the BuyMe catalog and returns the dataset object (no fs writes).
// Used by /api/refresh to rebuild and store the catalog in Vercel Blob.
// Mirrors the local scrape.mjs logic.

const BASE = "https://buyme.co.il";
const MASTER_VOUCHER_ID = 13438757;
const CONCURRENCY = 6;
const RETRIES = 3;
const UA = "buyme-mcp/1.0 (catalog indexer; +https://buyme.co.il)";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(path: string, allowMissing = false): Promise<any> {
  const url = path.startsWith("http") ? path : BASE + path;
  let lastErr: any;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { accept: "application/json", "user-agent": UA },
        cache: "no-store",
      });
      if (res.status === 404 && allowMissing) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const text = await res.text();
      if (text.trimStart().startsWith("<")) {
        if (allowMissing) return null;
        throw new Error(`Non-JSON for ${url}`);
      }
      return JSON.parse(text);
    } catch (err) {
      lastErr = err;
      if (attempt < RETRIES) await sleep(400 * (attempt + 1) + Math.floor(Math.random() * 250));
    }
  }
  throw lastErr;
}

async function pool<T, R>(items: T[], limit: number, worker: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

function stripHtml(html: any): string {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<\s*br\s*\/?>/gi, " ")
    .replace(/<\/(p|li|div|h[1-6])>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSearchTerms(raw: any): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.map((s) => String(s).trim()).filter((s) => s && !s.startsWith("#"));
  } catch {
    /* ignore */
  }
  return [];
}

const fileUrl = (name: any) => (name ? `${BASE}/files/${name}` : null);

function toNumber(v: any): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() && !isNaN(Number(v))) return Number(v);
  return null;
}

function extractProducts(detail: any) {
  const products: any[] = [];
  for (const p of Array.isArray(detail?.packages) ? detail.packages : []) {
    products.push({
      id: p.id,
      name: (p.name || p.packageHeader || "").trim(),
      price: toNumber(p.voucherValue),
      priceBeforeDiscount: toNumber(p.beforeDiscountSum),
      onlineRedeem: !!p.online_redeem,
      description: stripHtml(p.description).slice(0, 600) || null,
    });
  }
  return products;
}

function extractMoneyVoucher(detail: any) {
  const min = toNumber(detail?.voucherMinValue);
  const max = toNumber(detail?.voucherMaxValue);
  const v = detail?.voucher;
  let values: number[] | null = null;
  if (v && typeof v === "object" && !Array.isArray(v) && Array.isArray(v.values)) {
    values = v.values.map(toNumber).filter((n: any) => n != null);
  }
  if (min == null && max == null && !values) return null;
  return { min, max, ...(values && values.length ? { values } : {}) };
}

export async function scrapeCatalog() {
  const master = await fetchJson(`/brands/${MASTER_VOUCHER_ID}/options`);
  const brands: any[] = master.brands || [];

  const categories = (master.categories || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    pos: c.pos,
    subCategories: (c.subCategories || []).map((s: any) => ({ id: s.id, name: s.name, shortName: s.shortName })),
  }));
  const regions = (master.regions || []).map((r: any) => ({ id: r.id, name: r.name }));

  const businesses = await pool(brands, CONCURRENCY, async (b: any) => {
    const supplierId = b.suppliers_id ?? b.id;
    const base = {
      id: supplierId,
      brandId: b.id,
      name: (b.title || "").trim(),
      slogan: b.siteSlogan || null,
      categories: (b.categories_on_brands || []).map((c: any) => c.name).filter(Boolean),
      categoryIds: (b.categories_on_brands || []).map((c: any) => c.categories_id),
      subcategories: (b.subcategories_on_brands || []).map((s: any) => s.name).filter(Boolean),
      subcategoryIds: (b.subcategories_on_brands || []).map((s: any) => s.id),
      regions: (b.supplier_regions || []).map((r: any) => r.name).filter(Boolean),
      regionIds: (b.supplier_regions || []).map((r: any) => r.region_id),
      onlineRedeem: !!b.online_redeem,
      phone: b.phone || null,
      website: b.siteWeb || b.siteLink || b.siteAddress || null,
      storeLocatorUrl: b.siteAddress || null,
      reservationUrl: b.reservation_url || null,
      address: b.googleMapAddr || null,
      email: b.siteEmail || null,
      instagram: b.siteInstagram || null,
      facebook: b.siteFacebook || null,
      logo: fileUrl(b.logo),
      url: `${BASE}/supplier/${supplierId}`,
      searchTerms: parseSearchTerms(b.searchTerms),
      terms: stripHtml(b.smallPrint).slice(0, 800) || null,
    };

    const detail = await fetchJson(`/siteapi/supplier/${supplierId}`, true).catch(() => null);
    if (!detail) return { ...base, about: null, voucher: null, products: [], productCount: 0 };

    const products = extractProducts(detail);
    return {
      ...base,
      about: stripHtml(detail.siteAbout).slice(0, 1200) || null,
      voucher: extractMoneyVoucher(detail),
      products,
      productCount: products.length,
    };
  });

  return {
    source: "buyme.co.il",
    masterVoucherId: MASTER_VOUCHER_ID,
    businessCount: businesses.length,
    productCount: businesses.reduce((n: number, b: any) => n + b.productCount, 0),
    categories,
    regions,
    businesses,
  };
}
