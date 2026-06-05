import { headers } from "next/headers";
import {
  MagnifyingGlass,
  Storefront,
  SquaresFour,
  MapPin,
  Gift,
  GithubLogo,
  ArrowDown,
  ArrowUpRight,
} from "@phosphor-icons/react/dist/ssr";
import { getDataset } from "../lib/dataset";
import { datasetMeta } from "../lib/catalog";
import { CopyButton } from "./_components/CopyButton";
import { ConnectTabs } from "./_components/ConnectTabs";
import { LogoMarquee } from "./_components/LogoMarquee";

export const dynamic = "force-dynamic";

const REPO_URL = "https://github.com/eladkishon/buyme-mcp";

export default async function Home() {
  const db = await getDataset();
  const meta = datasetMeta(db);
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "buyme-mcp-vercel.vercel.app";
  const proto = h.get("x-forwarded-proto") || "https";
  const endpoint = `${proto}://${host}/api/mcp`;

  const fmt = (n: number) => n.toLocaleString("en-US");

  const stats = [
    { num: fmt(meta.businessCount), label: "businesses" },
    { num: fmt(meta.productCount), label: "products & prices" },
    { num: String(meta.categoryCount), label: "categories" },
    { num: String(meta.regionCount), label: "regions" },
  ];

  const tools = [
    {
      icon: <MagnifyingGlass size={20} />,
      name: "search_businesses",
      body: "Free-text search in Hebrew or English across names, aliases, categories, and product titles, with filters for the things that matter when spending a voucher.",
      args: ["query", "category", "region", "online_only", "min_price", "max_price"],
      feature: true,
    },
    {
      icon: <Storefront size={20} />,
      name: "get_business",
      body: "Full detail for one business: every product and price, the voucher value range, redemption terms, and contact links.",
    },
    {
      icon: <SquaresFour size={20} />,
      name: "list_categories",
      body: "Browse all 13 categories and their subcategories, each with a live count of participating businesses.",
    },
    {
      icon: <MapPin size={20} />,
      name: "list_regions",
      body: "Every region across Israel, each with the number of businesses you can reach there.",
      wide: true,
    },
  ];

  return (
    <>
      {/* nav */}
      <nav className="nav">
        <div className="wrap nav-inner">
          <div className="brand">
            <span className="brand-mark"><Gift size={17} weight="fill" /></span>
            BuyMe MCP
          </div>
          <div className="nav-links">
            <a href="#tools" className="hide-sm">Tools</a>
            <a href="#connect">Connect</a>
            <a href={REPO_URL} target="_blank" rel="noreferrer" aria-label="GitHub repository">
              <GithubLogo size={20} />
            </a>
          </div>
        </div>
      </nav>

      {/* hero */}
      <header className="hero">
        <div className="wrap hero-grid">
          <div>
            <h1 className="h1 rise d1">
              Search every business that takes <span className="accent">BuyMe</span>, from your AI.
            </h1>
            <p className="lede rise d2">
              One MCP endpoint that lets your agent find any of {fmt(meta.businessCount)} Israeli
              businesses by category, region, price, or online redemption.
            </p>
            <div className="hero-cta rise d3">
              <a href="#connect" className="btn btn-primary">
                Add to your agent <ArrowDown size={16} weight="bold" />
              </a>
              <a href={REPO_URL} target="_blank" rel="noreferrer" className="btn btn-ghost">
                <GithubLogo size={17} /> View source
              </a>
            </div>
          </div>

          <div className="endpoint-card rise d4">
            <div className="endpoint-label"><span className="dot-live" /> MCP endpoint</div>
            <div className="endpoint-row">
              <span className="endpoint-url mono">{endpoint}</span>
              <CopyButton text={endpoint} />
            </div>
            <div className="tool-chips">
              {tools.map((t) => (
                <span className="chip mono" key={t.name}>{t.name}</span>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* social proof / logos */}
      <section className="proof">
        <div className="wrap">
          <p className="proof-label">
            Indexing <b>{fmt(meta.businessCount)} businesses</b> and counting
          </p>
        </div>
        <LogoMarquee />
      </section>

      {/* stats */}
      <section className="block">
        <div className="wrap">
          <div className="stats">
            {stats.map((s) => (
              <div className="stat" key={s.label}>
                <div className="stat-num mono">{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* tools */}
      <section className="block" id="tools">
        <div className="wrap">
          <h2 className="h2">Four tools, one endpoint.</h2>
          <p className="section-lede">
            Everything your agent needs to turn a BuyMe gift card into a real decision, exposed as plain
            MCP tools.
          </p>
          <div className="bento">
            {tools.map((t) => (
              <div className={`tool${t.feature ? " feature" : ""}${t.wide ? " wide" : ""}`} key={t.name}>
                <div className="tool-ico">{t.icon}</div>
                <h3><span className="mono">{t.name}</span></h3>
                <p>{t.body}</p>
                {t.args && (
                  <div className="tool-args">
                    {t.args.map((a) => (
                      <span className="mono" key={a}>{a}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* connect */}
      <section className="block" id="connect">
        <div className="wrap">
          <h2 className="h2">Connect in one line.</h2>
          <p className="section-lede">
            Add the endpoint to any MCP client. No API key, no account, no setup.
          </p>
          <ConnectTabs endpoint={endpoint} />
        </div>
      </section>

      {/* footer */}
      <footer className="footer">
        <div className="wrap">
          <div className="footer-top">
            <div className="brand" style={{ color: "var(--text)" }}>
              <span className="brand-mark"><Gift size={17} weight="fill" /></span>
              BuyMe MCP
            </div>
            <div style={{ display: "flex", gap: 22 }}>
              <a href="https://buyme.co.il" target="_blank" rel="noreferrer">
                buyme.co.il <ArrowUpRight size={12} />
              </a>
              <a href={REPO_URL} target="_blank" rel="noreferrer">GitHub</a>
              <a href={endpoint}>Endpoint</a>
            </div>
          </div>
          <p className="footer-disc">
            Unofficial community index built from publicly available data on buyme.co.il. Not affiliated
            with or endorsed by BuyMe. Catalog data such as prices, terms, and participating businesses
            may be out of date. Always confirm on the official site before relying on it.
          </p>
        </div>
      </footer>
    </>
  );
}
