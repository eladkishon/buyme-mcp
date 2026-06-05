#!/usr/bin/env node
// Scrapes the BuyMe catalog into data/buyme.json.
// Run weekly by .github/workflows/refresh-catalog.yml (and any time manually).
//
//   GET /brands/13438757/options  -> every accepting business + categories + regions
//   GET /siteapi/supplier/{id}    -> per-business about, voucher range, packages (products)

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = "https://buyme.co.il";
const MASTER_VOUCHER_ID = 13438757;
const OUT = join(__dirname, "..", "data", "buyme.json");

const CONCURRENCY = 8;
const RETRIES = 3;
const UA = "buyme-mcp/1.0 (catalog indexer; +https://buyme.co.il)";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(path, { allowMissing = false } = {}) {
  const url = path.startsWith("http") ? path : BASE + path;
  let lastErr;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, { headers: { accept: "application/json", "user-agent": UA } });
      if (res.status === 404 && allowMissing) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const text = await res.text();
      if (text.trimStart().startsWith("<")) {
        if (allowMissing) return null;
        throw new Error(`Non-JSON response for ${url}`);
      }
      return JSON.parse(text);
    } catch (err) {
      lastErr = err;
      if (attempt < RETRIES) await sleep(400 * (attempt + 1) + Math.floor(Math.random() * 250));
    }
  }
  throw lastErr;
}

async function pool(items, limit, worker, onTick) {
  const results = new Array(items.length);
  let next = 0, done = 0;
  async function run() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
      if (onTick && ++done % 100 === 0) onTick(done, items.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

const stripHtml = (html) =>
  !html || typeof html !== "string" ? "" :
  html.replace(/<\s*br\s*\/?>/gi, " ").replace(/<\/(p|li|div|h[1-6])>/gi, " ").replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
      .replace(/\s+/g, " ").trim();

function parseSearchTerms(raw) {
  if (!raw) return [];
  try { const a = JSON.parse(raw); if (Array.isArray(a)) return a.map((s) => String(s).trim()).filter((s) => s && !s.startsWith("#")); } catch {}
  return [];
}

const fileUrl = (name) => (name ? `${BASE}/files/${name}` : null);
const toNumber = (v) => (typeof v === "number" ? v : typeof v === "string" && v.trim() && !isNaN(Number(v)) ? Number(v) : null);

function extractProducts(detail) {
  return (Array.isArray(detail?.packages) ? detail.packages : []).map((p) => ({
    id: p.id,
    name: (p.name || p.packageHeader || "").trim(),
    price: toNumber(p.voucherValue),
    priceBeforeDiscount: toNumber(p.beforeDiscountSum),
    onlineRedeem: !!p.online_redeem,
    description: stripHtml(p.description).slice(0, 600) || null,
  }));
}

function extractMoneyVoucher(detail) {
  const min = toNumber(detail?.voucherMinValue), max = toNumber(detail?.voucherMaxValue);
  const v = detail?.voucher;
  let values = null;
  if (v && typeof v === "object" && !Array.isArray(v) && Array.isArray(v.values)) values = v.values.map(toNumber).filter((n) => n != null);
  if (min == null && max == null && !values) return null;
  return { min, max, ...(values && values.length ? { values } : {}) };
}

async function main() {
  console.error("Fetching master directory…");
  const master = await fetchJson(`/brands/${MASTER_VOUCHER_ID}/options`);
  const brands = master.brands || [];
  console.error(`Directory: ${brands.length} businesses.`);

  const categories = (master.categories || []).map((c) => ({
    id: c.id, name: c.name, pos: c.pos,
    subCategories: (c.subCategories || []).map((s) => ({ id: s.id, name: s.name, shortName: s.shortName })),
  }));
  const regions = (master.regions || []).map((r) => ({ id: r.id, name: r.name }));

  let failures = 0;
  const businesses = await pool(brands, CONCURRENCY, async (b) => {
    const supplierId = b.suppliers_id ?? b.id;
    const base = {
      id: supplierId, brandId: b.id, name: (b.title || "").trim(), slogan: b.siteSlogan || null,
      categories: (b.categories_on_brands || []).map((c) => c.name).filter(Boolean),
      categoryIds: (b.categories_on_brands || []).map((c) => c.categories_id),
      subcategories: (b.subcategories_on_brands || []).map((s) => s.name).filter(Boolean),
      subcategoryIds: (b.subcategories_on_brands || []).map((s) => s.id),
      regions: (b.supplier_regions || []).map((r) => r.name).filter(Boolean),
      regionIds: (b.supplier_regions || []).map((r) => r.region_id),
      onlineRedeem: !!b.online_redeem, phone: b.phone || null,
      website: b.siteWeb || b.siteLink || b.siteAddress || null, storeLocatorUrl: b.siteAddress || null,
      reservationUrl: b.reservation_url || null, address: b.googleMapAddr || null, email: b.siteEmail || null,
      instagram: b.siteInstagram || null, facebook: b.siteFacebook || null, logo: fileUrl(b.logo),
      url: `${BASE}/supplier/${supplierId}`, searchTerms: parseSearchTerms(b.searchTerms),
      terms: stripHtml(b.smallPrint).slice(0, 800) || null,
    };
    const detail = await fetchJson(`/siteapi/supplier/${supplierId}`, { allowMissing: true }).catch(() => null);
    if (!detail) { failures++; return { ...base, about: null, voucher: null, products: [], productCount: 0 }; }
    const products = extractProducts(detail);
    return { ...base, about: stripHtml(detail.siteAbout).slice(0, 1200) || null, voucher: extractMoneyVoucher(detail), products, productCount: products.length };
  }, (d, t) => console.error(`  …${d}/${t}`));

  const dataset = {
    source: "buyme.co.il", masterVoucherId: MASTER_VOUCHER_ID,
    businessCount: businesses.length,
    productCount: businesses.reduce((n, b) => n + b.productCount, 0),
    categories, regions, businesses,
  };

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(dataset, null, 0));
  console.error(`Wrote ${OUT} — ${dataset.businessCount} businesses, ${dataset.productCount} products, ${failures} detail failures.`);
}

main().catch((e) => { console.error("Scrape failed:", e); process.exit(1); });
