// Loads the catalog. Prefers a fresh copy from Vercel Blob (written by the
// weekly /api/refresh cron) and falls back to the JSON bundled at build time.
// Cached in module scope per warm serverless instance.

import bundled from "../data/buyme.json";
import { prepareDataset } from "./catalog";

let cache: any = null;
let cachedAt = 0;
const TTL_MS = 30 * 60 * 1000; // 30 min

export async function getDataset(): Promise<any> {
  const now = Date.now();
  if (cache && now - cachedAt < TTL_MS) return cache;

  const url = process.env.BUYME_DATA_URL;
  if (url) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        cache = prepareDataset(await res.json());
        cachedAt = now;
        return cache;
      }
    } catch {
      /* fall back to bundled */
    }
  }

  cache = prepareDataset(bundled as any);
  cachedAt = now;
  return cache;
}
