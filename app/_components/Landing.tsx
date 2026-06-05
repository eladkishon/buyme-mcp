"use client";

import { useEffect, useState } from "react";
import { Star, GithubLogo } from "@phosphor-icons/react";
import { CopyButton } from "./CopyButton";
import { McpCommand } from "./InstallRow";
import { PromptDemo } from "./PromptDemo";
import { GeminiMark } from "./ProviderMarks";

const REPO_URL = "https://github.com/eladkishon/buyme-mcp";
const GEM_URL = "https://gemini.google.com/gem/1cL6G9GX2osUIDNmg1EMkDwDbncglq2z7?usp=sharing";

type Lang = "he" | "en";
type Provider = "claude" | "gemini";
type Stats = { businesses: number; products: number; categories: number; regions: number };

const fmt = (n: number) => n.toLocaleString("en-US");

const promptHe = (ep: string) =>
  `התחברו לשרת ה-MCP של BUYME בכתובת ${ep} ופעלו כ-BUYME Finder — קונסיירז' שעוזר לממש שוברי BUYME בישראל. השתמשו בכלים (search_businesses, get_business, list_categories, list_regions) כדי למצוא בתי עסק שמכבדים BUYME. התאימו לפי קטגוריה, אזור, תקציב ומימוש אונליין, ובדקו אילו פתוחים עכשיו. החזירו 5–8 התוצאות הטובות ביותר — לכל אחת: שם · קטגוריה · אזור, סטטוס פתיחה, טווח מחיר/שובר וקישור. ענו אך ורק מתוך הכלים — בלי להמציא בתי עסק או מחירים. ענו בשפת המשתמש.`;

const promptEn = (ep: string) =>
  `Connect to the BuyMe MCP server at ${ep} and act as BUYME Finder — a concierge for spending BuyMe gift cards in Israel. Use its tools (search_businesses, get_business, list_categories, list_regions) to find businesses that accept BuyMe. Match the user's category, region, budget and online-redemption needs, and check which are open now. Return the 5–8 best matches — each with name · category · region, open status, price or voucher range, and the business link. Answer only from the tools — never invent businesses or prices. Reply in the user's language.`;

const DICT = {
  he: {
    h1a: "כל בית עסק שמכבד",
    h1c: " דרך ה-AI שלכם.",
    lede: (n: string) =>
      `נקודת קצה אחת שמחברת כל עוזר AI ל-${n} בתי העסק שמכבדים שובר BUYME — חיפוש לפי קטגוריה, אזור, תקציב, מימוש אונליין ושעות פתיחה.`,
    walletCap: "שואלים “כמה נשאר לי ב-BUYME?” והוא בודק את הארנק שלכם — רץ מקומית, הטוקן נשאר על המכשיר.",
    copyPrompt: "קחו את הפרומפט",
    copied: "הועתק",
    gemCta: "נסו ב-Gemini",
    addTo: "הוספה ל-",
    copy: "העתק",
    star: "כוכב ב-GitHub",
    prompt: promptHe,
    gem: "ה-Gem ב-Gemini",
    howTitle: "איך מתחילים",
    howSteps: [
      { t: "מעתיקים", d: 'לוחצים "העתק פרומפט התקנה".' },
      { t: "מדביקים", d: "פותחים צ'אט חדש ב-Gemini, Claude או ChatGPT ומדביקים כהודעה הראשונה." },
      { t: "שואלים", d: "מבקשים בית עסק שמכבד BUYME — וזה מחפש בקטלוג החי." },
    ],
    howEasiest: "הכי פשוט, בלי הגדרות:",
  },
  en: {
    h1a: "Every business that accepts",
    h1c: " through your AI.",
    lede: (n: string) =>
      `One endpoint that connects any AI assistant to the ${n} businesses that accept BuyMe gift cards — search by category, region, budget, online redemption and opening hours.`,
    walletCap: "Ask “how much is left in my BuyMe?” and it checks your own wallet — runs locally, your token never leaves your device.",
    copyPrompt: "Grab the prompt",
    copied: "Copied",
    gemCta: "Try it on Gemini",
    addTo: "Add to ",
    copy: "Copy",
    star: "Star on GitHub",
    prompt: promptEn,
    gem: "Gemini Gem",
    howTitle: "How to start",
    howSteps: [
      { t: "Copy", d: 'Hit "Copy install prompt".' },
      { t: "Paste", d: "Open a new chat in Gemini, Claude or ChatGPT and paste it as your first message." },
      { t: "Ask", d: "Ask for a business that accepts BuyMe — it searches the live catalog." },
    ],
    howEasiest: "Easiest, with no setup:",
  },
} as const;

export function Landing({ endpoint, stats }: { endpoint: string; stats: Stats }) {
  const [lang, setLang] = useState<Lang>("he");
  const [provider, setProvider] = useState<Provider>("claude");
  const t = DICT[lang];
  const rtl = lang === "he";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = rtl ? "rtl" : "ltr";
  }, [lang, rtl]);

  const promptText = t.prompt(endpoint);

  return (
    <main className="zen" dir={rtl ? "rtl" : "ltr"}>
      {/* ---------- top bar ---------- */}
      <header className="topbar">
        <div className="topbar-right">
          <div className="lang" role="group" aria-label="Language">
            <button className={rtl ? "on" : ""} onClick={() => setLang("he")}>עברית</button>
            <button className={!rtl ? "on" : ""} onClick={() => setLang("en")}>EN</button>
          </div>
          <a className="ghbtn" href={REPO_URL} target="_blank" rel="noreferrer">
            <GithubLogo size={16} weight="fill" />
            <span className="ghbtn-label">{t.star}</span>
            <Star size={14} weight="fill" className="star-ico" />
          </a>
        </div>
      </header>

      {/* ---------- single-page hero ---------- */}
      <section className="hero">
        <div className="hero-copy">
          <h1 className="h1">
            {t.h1a} <img className="h1-logo" src="/buyme-logo.webp" alt="BUYME" />{t.h1c}
          </h1>
          <p className="lede">{t.lede(fmt(stats.businesses))}</p>

          <p className="hero-cap"><span className="cap-dot" aria-hidden="true" />{t.walletCap}</p>

          <div className="hero-install">
            <div className="cta-row">
              <CopyButton variant="primary" text={promptText} label={t.copyPrompt} copiedLabel={t.copied} />
              <a className="btn btn-ghost" href={GEM_URL} target="_blank" rel="noreferrer">
                <GeminiMark size={18} /> {t.gemCta}
              </a>
            </div>
            <McpCommand endpoint={endpoint} provider={provider} t={{ addTo: t.addTo, copy: t.copy }} />
          </div>

          <div className="howto">
            <span className="howto-h">{t.howTitle}</span>
            <ol className="howto-steps">
              {t.howSteps.map((step, i) => (
                <li key={i}>
                  <span className="hs-num">{i + 1}</span>
                  <span className="hs-body"><b>{step.t}</b>{step.d}</span>
                </li>
              ))}
            </ol>
            <p className="howto-easiest">
              {t.howEasiest}{" "}
              <a href={GEM_URL} target="_blank" rel="noreferrer"><GeminiMark size={13} /> {t.gem}</a>
            </p>
          </div>
        </div>

        <div className="hero-demo">
          <PromptDemo lang={lang} provider={provider} onProvider={setProvider} />
        </div>
      </section>

      <footer className="zfoot">
        <a href="https://buyme.co.il" target="_blank" rel="noreferrer">buyme.co.il</a>
        <span className="sep">·</span>
        <a href={GEM_URL} target="_blank" rel="noreferrer">{t.gem}</a>
        <span className="sep">·</span>
        <a href={REPO_URL} target="_blank" rel="noreferrer">GitHub</a>
      </footer>
    </main>
  );
}
