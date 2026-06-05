import { headers } from "next/headers";
import { getDataset } from "../lib/dataset";
import { datasetMeta } from "../lib/catalog";
import { Landing } from "./_components/Landing";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = await getDataset();
  const meta = datasetMeta(db);
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "buyme-mcp-vercel.vercel.app";
  const proto = h.get("x-forwarded-proto") || "https";
  const endpoint = `${proto}://${host}/api/mcp`;

  return (
    <Landing
      endpoint={endpoint}
      stats={{
        businesses: meta.businessCount,
        products: meta.productCount,
        categories: meta.categoryCount,
        regions: meta.regionCount,
      }}
    />
  );
}
