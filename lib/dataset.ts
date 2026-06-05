// Loads the catalog bundled at build time (data/buyme.json) and prepares it
// for search. The catalog is refreshed weekly by a GitHub Action that re-scrapes
// and commits data/buyme.json, which triggers a Vercel deploy (see scripts/scrape.mjs
// and .github/workflows/refresh-catalog.yml).

import bundled from "../data/buyme.json";
import { prepareDataset } from "./catalog";

let cache: any = null;

export async function getDataset(): Promise<any> {
  if (!cache) cache = prepareDataset(bundled as any);
  return cache;
}
