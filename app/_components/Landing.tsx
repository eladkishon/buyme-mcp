"use client";

import { useEffect, useState } from "react";
import {
  Gift,
  GithubLogo,
  ArrowDown,
  MagnifyingGlass,
  Storefront,
  SquaresFour,
  MapPin,
  ArrowUpRight,
  DownloadSimple,
  FileText,
  Sparkle,
} from "@phosphor-icons/react";
import { CopyButton } from "./CopyButton";
import { ConnectTabs } from "./ConnectTabs";
import { LogoMarquee } from "./LogoMarquee";

const REPO_URL = "https://github.com/eladkishon/buyme-mcp";
type Lang = "he" | "en";
type Stats = { businesses: number; products: number; categories: number; regions: number };

const fmt = (n: number) => n.toLocaleString("en-US");

const DICT = {
  he: {
    navTools: "יכולות",
    navConnect: "חיבור",
    heroEyebrow: (n: string) => `מחובר ל-${n} בתי עסק`,
    ctaPrimary: "חברו לעוזר ה-AI",
    ctaSecondary: "צפו בקוד",
    endpointLbl: "נקודת קצה",
    proof: (n: string) => `מחפש בתוך ${n} בתי עסק ועוד`,
    examplesTitle: "פשוט שואלים, בשפה חופשית",
    examplesLede: "העוזר מבין עברית ואנגלית, ומחזיר בתי עסק אמיתיים עם מחירים, אזורים ותנאי מימוש.",
    examples: [
      "מסעדות שף בתל אביב עם מימוש אונליין",
      "ספא בצפון עד 300 ₪",
      "חנויות אופנה שמכבדות BUYME",
    ],
    statsTitle: "הקטלוג במספרים",
    statLabels: ["בתי עסק", "מוצרים ומחירים", "קטגוריות", "אזורים"],
    toolsTitle: "מה העוזר יכול לעשות",
    toolsLede: "כל היכולות נחשפות כ-MCP, כך שכל עוזר AI יכול להפעיל אותן ישירות.",
    tools: [
      { title: "חיפוש בתי עסק", body: "חיפוש חופשי בעברית ובאנגלית לפי שם, מותג, קטגוריה ומוצר, עם סינון לפי אזור, מחיר ומימוש אונליין." },
      { title: "פרטי בית עסק", body: "כל המוצרים והמחירים, טווח השובר, תנאי המימוש ופרטי הקשר של בית עסק אחד." },
      { title: "קטגוריות", body: "כל 13 הקטגוריות ותתי-הקטגוריות, עם מספר בתי העסק בכל אחת." },
      { title: "אזורים", body: "כל האזורים בארץ, עם מספר בתי העסק שאפשר להגיע אליהם בכל אזור." },
    ],
    connectTitle: "חיבור בשורה אחת",
    connectLede: "מוסיפים את נקודת הקצה לכל לקוח MCP. בלי מפתח, בלי חשבון, בלי הגדרות.",
    connectNoteA: "עובד עם כל לקוח MCP. ל-Gemini API או SDK אחר, כוונו את ה-MCP אל",
    claudeAiComment: "הגדרות -> Connectors -> חיבור מותאם אישית\nהדביקו את הכתובת:",
    footerDisc:
      "אינדקס קהילתי לא רשמי שנבנה מנתונים הזמינים לכלל באתר buyme.co.il. איננו משויכים ל-BUYME ואיננו מקבלים את חסותה. ייתכן שמחירים, תנאים ורשימת בתי העסק אינם מעודכנים. תמיד מומלץ לאמת באתר הרשמי לפני מימוש.",
    endpointLink: "נקודת קצה",
    gemTitle: "מעדיפים Gemini? בנו Gem",
    gemLede: "צרו עוזר BUYME אישי בתוך Gemini בעזרת קובץ הקטלוג והוראות מוכנות מראש.",
    gemSteps: [
      "היכנסו ל-gemini.google.com ובחרו Gems ואז New Gem",
      "הדביקו את הוראות ה-Gem",
      "העלו את קובץ הקטלוג (CSV) כ-Knowledge",
      "שמרו ושאלו: ״ספא בצפון עד 300 ₪״",
    ],
    gemCsv: "הורדת הקטלוג (CSV)",
    gemInstr: "הוראות ל-Gem",
    gemOpen: "פתחו את Gemini",
    gemNote: "ב-Gem הנתונים מקומיים. לחיפוש חי ומלא, חברו את נקודת הקצה דרך Gemini API או SDK.",
    ctaTitle: "מצאו את המתנה המושלמת",
    ctaLede: "חברו את העוזר וקבלו המלצות אמיתיות מתוך אלפי בתי עסק שמכבדים BUYME.",
    ctaConnect: "חברו עכשיו",
    ctaBuyme: "buyme.co.il",
  },
  en: {
    navTools: "Tools",
    navConnect: "Connect",
    heroEyebrow: (n: string) => `Connected to ${n} businesses`,
    ctaPrimary: "Connect your AI",
    ctaSecondary: "View source",
    endpointLbl: "Endpoint",
    proof: (n: string) => `Searching across ${n} businesses and counting`,
    examplesTitle: "Just ask, in plain language",
    examplesLede: "Your assistant understands Hebrew and English, and returns real businesses with prices, regions, and redemption terms.",
    examples: [
      "Chef restaurants in Tel Aviv I can redeem online",
      "A spa up north under ₪300",
      "Fashion stores that accept BuyMe",
    ],
    statsTitle: "The catalog in numbers",
    statLabels: ["businesses", "products & prices", "categories", "regions"],
    toolsTitle: "What your assistant can do",
    toolsLede: "Every capability is exposed as MCP, so any AI assistant can call it directly.",
    tools: [
      { title: "Search businesses", body: "Free-text search in Hebrew or English by name, brand, category, and product, with filters for region, price, and online redemption." },
      { title: "Business details", body: "All products and prices, the voucher value range, redemption terms, and contact links for one business." },
      { title: "Categories", body: "All 13 categories and their subcategories, each with a count of participating businesses." },
      { title: "Regions", body: "Every region across Israel, each with the number of businesses you can reach there." },
    ],
    connectTitle: "Connect in one line",
    connectLede: "Add the endpoint to any MCP client. No API key, no account, no setup.",
    connectNoteA: "Works with any MCP client. For the Gemini API or other SDKs, point the MCP transport at",
    claudeAiComment: "Settings -> Connectors -> Add custom connector\nPaste this URL:",
    footerDisc:
      "Unofficial community index built from publicly available data on buyme.co.il. Not affiliated with or endorsed by BuyMe. Prices, terms, and the list of participating businesses may be out of date. Always confirm on the official site before relying on it.",
    endpointLink: "Endpoint",
    gemTitle: "Prefer Gemini? Build a Gem",
    gemLede: "Create your own BUYME assistant inside Gemini using the catalog file and ready-made instructions.",
    gemSteps: [
      "Open gemini.google.com and choose Gems, then New Gem",
      "Paste the Gem instructions",
      "Upload the catalog file (CSV) as Knowledge",
      "Save and ask: “A spa up north under ₪300”",
    ],
    gemCsv: "Download catalog (CSV)",
    gemInstr: "Gem instructions",
    gemOpen: "Open Gemini",
    gemNote: "In a Gem the data is local. For live, full search, connect the endpoint via the Gemini API or SDK.",
    ctaTitle: "Find the perfect gift",
    ctaLede: "Connect your assistant and get real recommendations from thousands of businesses that accept BUYME.",
    ctaConnect: "Connect now",
    ctaBuyme: "buyme.co.il",
  },
} as const;

export function Landing({ endpoint, stats }: { endpoint: string; stats: Stats }) {
  const [lang, setLang] = useState<Lang>("he");
  const t = DICT[lang];
  const rtl = lang === "he";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = rtl ? "rtl" : "ltr";
  }, [lang, rtl]);

  const n = fmt(stats.businesses);
  const toolIcons = [
    <MagnifyingGlass size={22} key="s" />,
    <Storefront size={22} key="b" />,
    <SquaresFour size={22} key="c" />,
    <MapPin size={22} key="r" />,
  ];
  const toolApi = ["search_businesses", "get_business", "list_categories", "list_regions"];
  const toolArgs = ["query", "category", "region", "online_only", "min_price", "max_price"];
  const exIcons = [<MagnifyingGlass size={20} key="0" />, <MapPin size={20} key="1" />, <Storefront size={20} key="2" />];
  const statNums = [fmt(stats.businesses), fmt(stats.products), String(stats.categories), String(stats.regions)];

  return (
    <div dir={rtl ? "rtl" : "ltr"}>
      {/* nav */}
      <nav className="nav">
        <div className="wrap nav-inner">
          <div className="brand">
            <img src="/buyme-logo.webp" alt="BUYME" className="brand-logo" />
            <span className="brand-finder">Finder</span>
            <span className="tag">MCP</span>
          </div>
          <div className="nav-right">
            <div className="nav-links">
              <a href="#tools" className="hide-sm">{t.navTools}</a>
              <a href="#connect">{t.navConnect}</a>
              <a href={REPO_URL} target="_blank" rel="noreferrer" className="icon-link" aria-label="GitHub">
                <GithubLogo size={20} />
              </a>
            </div>
            <div className="lang" role="group" aria-label="Language">
              <button className={rtl ? "on" : ""} onClick={() => setLang("he")}>עברית</button>
              <button className={!rtl ? "on" : ""} onClick={() => setLang("en")}>EN</button>
            </div>
          </div>
        </div>
      </nav>

      {/* hero */}
      <header className="hero">
        <div className="wrap hero-inner">
          <span className="hero-eyebrow rise d1"><Gift size={15} weight="fill" /> {t.heroEyebrow(n)}</span>
          <h1 className="h1 rise d1">
            {rtl ? (
              <>מצאו כל בית עסק שמכבד <span className="brandc">BUYME</span>, ישר מתוך ה-AI שלכם.</>
            ) : (
              <>Find every business that accepts <span className="brandc">BuyMe</span>, straight from your AI.</>
            )}
          </h1>
          <p className="lede rise d2">
            {rtl
              ? `נקודת קצה אחת שמאפשרת לעוזר ה-AI שלכם לחפש בתוך ${n} בתי עסק לפי קטגוריה, אזור, מחיר ומימוש אונליין.`
              : `One endpoint that lets your AI assistant search ${n} businesses by category, region, price, and online redemption.`}
          </p>
          <div className="hero-cta rise d3">
            <a href="#connect" className="btn btn-primary">{t.ctaPrimary} <ArrowDown size={17} weight="bold" /></a>
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="btn btn-ghost"><GithubLogo size={18} /> {t.ctaSecondary}</a>
          </div>
          <div className="endpoint-row rise d3">
            <span className="lbl">{t.endpointLbl}</span>
            <span className="endpoint-url mono" dir="ltr">{endpoint}</span>
            <CopyButton text={endpoint} label={rtl ? "העתק" : "Copy"} />
          </div>
        </div>
      </header>

      {/* logos */}
      <section className="proof">
        <div className="wrap"><p className="proof-label" dangerouslySetInnerHTML={{ __html: t.proof(`<b>${n}</b>`) }} /></div>
        <LogoMarquee />
      </section>

      {/* examples */}
      <section className="block soft">
        <div className="wrap">
          <h2 className="h2 center">{t.examplesTitle}</h2>
          <p className="section-lede center">{t.examplesLede}</p>
          <div className="examples">
            {t.examples.map((ex, i) => (
              <div className={`ex tile t${i}`} key={i}>
                <div className="ex-ico">{exIcons[i]}</div>
                <p>{ex}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* stats */}
      <section className="block">
        <div className="wrap">
          <h2 className="h2 center">{t.statsTitle}</h2>
          <div className="stats" style={{ marginTop: 8 }}>
            {statNums.map((num, i) => (
              <div className="stat" key={i}>
                <div className="stat-num mono">{num}</div>
                <div className="stat-label">{t.statLabels[i]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* tools */}
      <section className="block soft" id="tools">
        <div className="wrap">
          <h2 className="h2">{t.toolsTitle}</h2>
          <p className="section-lede">{t.toolsLede}</p>
          <div className="bento">
            {t.tools.map((tool, i) => (
              <div className={`tool${i === 0 ? " feature" : ""}${i === 3 ? " wide" : ""}`} key={i}>
                <div className="tool-ico">{toolIcons[i]}</div>
                <h3>{tool.title}</h3>
                <span className="api mono" dir="ltr">{toolApi[i]}</span>
                <p>{tool.body}</p>
                {i === 0 && (
                  <div className="tool-args">
                    {toolArgs.map((a) => <span className="mono" key={a} dir="ltr">{a}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* gemini gem */}
      <section className="block">
        <div className="wrap">
          <h2 className="h2">{t.gemTitle}</h2>
          <p className="section-lede">{t.gemLede}</p>
          <div className="steps">
            {t.gemSteps.map((s, i) => (
              <div className="step" key={i}>
                <div className="step-n mono">{i + 1}</div>
                <p>{s}</p>
              </div>
            ))}
          </div>
          <div className="btn-row">
            <a className="btn btn-primary" href="/buyme-businesses.csv" download>
              <DownloadSimple size={18} weight="bold" /> {t.gemCsv}
            </a>
            <a className="btn btn-ghost" href="/gem-instructions.md" target="_blank" rel="noreferrer">
              <FileText size={18} /> {t.gemInstr}
            </a>
            <a className="btn btn-ghost" href="https://gemini.google.com/gems/create" target="_blank" rel="noreferrer">
              <Sparkle size={18} weight="fill" /> {t.gemOpen}
            </a>
          </div>
          <p className="code-note">{t.gemNote}</p>
        </div>
      </section>

      {/* connect */}
      <section className="block soft" id="connect">
        <div className="wrap">
          <h2 className="h2">{t.connectTitle}</h2>
          <p className="section-lede">{t.connectLede}</p>
          <ConnectTabs
            endpoint={endpoint}
            copyLabel={rtl ? "העתק" : "Copy"}
            claudeAiComment={t.claudeAiComment}
            note={t.connectNoteA}
          />
        </div>
      </section>

      {/* cta band */}
      <section className="block">
        <div className="wrap">
          <div className="cta-band">
            <h2 className="h2">{t.ctaTitle}</h2>
            <p>{t.ctaLede}</p>
            <div className="btn-row" style={{ justifyContent: "center" }}>
              <a className="btn btn-white" href="#connect">{t.ctaConnect}</a>
              <a className="btn btn-outline-white" href="https://buyme.co.il" target="_blank" rel="noreferrer">
                {t.ctaBuyme} <ArrowUpRight size={15} weight="bold" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="footer">
        <div className="wrap">
          <div className="footer-top">
            <div className="brand"><img src="/buyme-logo.webp" alt="BUYME" className="brand-logo" /><span className="brand-finder">Finder</span></div>
            <div className="footer-links">
              <a href="https://buyme.co.il" target="_blank" rel="noreferrer">buyme.co.il <ArrowUpRight size={12} /></a>
              <a href={REPO_URL} target="_blank" rel="noreferrer">GitHub</a>
              <a href={endpoint} dir="ltr">{t.endpointLink}</a>
            </div>
          </div>
          <p className="footer-disc">{t.footerDisc}</p>
        </div>
      </footer>
    </div>
  );
}
