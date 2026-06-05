#!/usr/bin/env node
// Scrapes the BuyMe (buyme.co.il) catalog into data/buyme.json.
//
// Data sources (same-origin JSON the site itself calls):
//   GET /brands/13438757/options        -> master directory: every accepting
//                                           business + categories + regions.
//                                           (13438757 = the "BUYME ALL" voucher
//                                           that is honored by every business.)
//   GET /siteapi/supplier/{id}          -> per-business detail: about text,
//                                           money-voucher min/max, and fixed
//                                           "packages" (products with prices).
//
// Run: npm run scrape   (or: node scrape.mjs)

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = "https://buyme.co.il";
const MASTER_VOUCHER_ID = 13438757;
const OUT = join(__dirname, "data", "buyme.json");

const CONCURRENCY = 6; // be polite to the origin
const RETRIES = 3;
const UA =
  "buyme-mcp/1.0 (personal catalog indexer; +https://buyme.co.il)";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(path, { allowMissing = false } = {}) {
  const url = path.startsWith("http") ? path : BASE + path;
  let lastErr;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { accept: "application/json", "user-agent": UA },
      });
      if (res.status === 404 && allowMissing) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const ct = res.headers.get("content-type") || "";
      const text = await res.text();
      if (!ct.includes("json") && text.trimStart().startsWith("<")) {
        // Got the SPA shell instead of JSON.
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

// Run `worker` over `items` with bounded concurrency; reports progress.
async function pool(items, limit, worker, onTick) {
  const results = new Array(items.length);
  let next = 0;
  let done = 0;
  async function run() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
      done++;
      if (onTick && done % 25 === 0) onTick(done, items.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

function stripHtml(html) {
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

function parseSearchTerms(raw) {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      return arr
        .map((s) => String(s).trim())
        .filter((s) => s && !s.startsWith("#")); // drop campaign hashtags
    }
  } catch {
    /* fall through */
  }
  return [];
}

const fileUrl = (name) =>
  name ? `${BASE}/files/${name}` : null;

function toNumber(v) {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() && !isNaN(Number(v))) return Number(v);
  return null;
}

function extractProducts(detail) {
  const products = [];
  const pkgs = Array.isArray(detail?.packages) ? detail.packages : [];
  for (const p of pkgs) {
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

function extractMoneyVoucher(detail) {
  const min = toNumber(detail?.voucherMinValue);
  const max = toNumber(detail?.voucherMaxValue);
  const v = detail?.voucher;
  let values = null;
  if (v && typeof v === "object" && !Array.isArray(v) && Array.isArray(v.values)) {
    values = v.values.map(toNumber).filter((n) => n != null);
  }
  if (min == null && max == null && !values) return null;
  return { min, max, ...(values && values.length ? { values } : {}) };
}

async function main() {
  console.error("Fetching master directory…");
  const master = await fetchJson(`/brands/${MASTER_VOUCHER_ID}/options`);
  const brands = master.brands || [];
  console.error(`Directory has ${brands.length} businesses.`);

  const categories = (master.categories || []).map((c) => ({
    id: c.id,
    name: c.name,
    pos: c.pos,
    subCategories: (c.subCategories || []).map((s) => ({
      id: s.id,
      name: s.name,
      shortName: s.shortName,
    })),
  }));
  const regions = (master.regions || []).map((r) => ({ id: r.id, name: r.name }));

  console.error(`Fetching products for ${brands.length} businesses (concurrency ${CONCURRENCY})…`);
  let failures = 0;

  const businesses = await pool(
    brands,
    CONCURRENCY,
    async (b) => {
      const supplierId = b.suppliers_id ?? b.id;
      const base = {
        id: supplierId,
        brandId: b.id,
        name: (b.title || "").trim(),
        slogan: b.siteSlogan || null,
        categories: (b.categories_on_brands || []).map((c) => c.name).filter(Boolean),
        categoryIds: (b.categories_on_brands || []).map((c) => c.categories_id),
        subcategories: (b.subcategories_on_brands || []).map((s) => s.name).filter(Boolean),
        subcategoryIds: (b.subcategories_on_brands || []).map((s) => s.id),
        regions: (b.supplier_regions || []).map((r) => r.name).filter(Boolean),
        regionIds: (b.supplier_regions || []).map((r) => r.region_id),
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

      const detail = await fetchJson(`/siteapi/supplier/${supplierId}`, {
        allowMissing: true,
      }).catch(() => null);

      if (!detail) {
        failures++;
        return { ...base, about: null, voucher: null, products: [], productCount: 0 };
      }

      const products = extractProducts(detail);
      return {
        ...base,
        about: stripHtml(detail.siteAbout).slice(0, 1200) || null,
        voucher: extractMoneyVoucher(detail),
        products,
        productCount: products.length,
      };
    },
    (done, total) => console.error(`  …${done}/${total}`)
  );

  const dataset = {
    source: "buyme.co.il",
    masterVoucherId: MASTER_VOUCHER_ID,
    businessCount: businesses.length,
    productCount: businesses.reduce((n, b) => n + b.productCount, 0),
    categories,
    regions,
    businesses,
  };

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(dataset, null, 0));
  console.error(
    `\nWrote ${OUT}\n  businesses: ${dataset.businessCount}\n  products:   ${dataset.productCount}\n  detail fetch failures: ${failures}`
  );
}

main().catch((e) => {
  console.error("Scrape failed:", e);
  process.exit(1);
});
