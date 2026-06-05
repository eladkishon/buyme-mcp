"use client";

import { useEffect, useState } from "react";
import { Star, GithubLogo } from "@phosphor-icons/react";
import { CopyButton } from "./CopyButton";

const REPO_URL = "https://github.com/eladkishon/buyme-mcp";
type Lang = "he" | "en";
type Stats = { businesses: number; products: number; categories: number; regions: number };

const fmt = (n: number) => n.toLocaleString("en-US");

const DICT = {
  he: {
    copy: "העתק",
    sub: (n: string) => `נקודת קצה אחת לחיפוש חכם מתוך ${n} בתי עסק.`,
    hint: "הוסיפו לכל לקוח MCP. לחצו על שם הכלי כדי להעתיק את הפקודה.",
    star: "תנו כוכב ב-GitHub",
    unofficial: "לא רשמי · אינו משויך ל-BUYME",
    gem: "בניית Gem ל-Gemini",
  },
  en: {
    copy: "Copy",
    sub: (n: string) => `One endpoint for smart search across ${n} businesses.`,
    hint: "Add to any MCP client. Click a tool name to copy its command.",
    star: "Star on GitHub",
    unofficial: "Unofficial · not affiliated with BuyMe",
    gem: "Build a Gemini Gem",
  },
} as const;

export function Landing({ endpoint, stats }: { endpoint: string; stats: Stats }) {
  const [lang, setLang] = useState<Lang>("he");
  const t = DICT[lang];
  const rtl = lang === "he";
  const n = fmt(stats.businesses);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = rtl ? "rtl" : "ltr";
  }, [lang, rtl]);

  return (
    <main className="zen" dir={rtl ? "rtl" : "ltr"}>
      <div className="zen-top">
        <div className="lang" role="group" aria-label="Language">
          <button className={rtl ? "on" : ""} onClick={() => setLang("he")}>עברית</button>
          <button className={!rtl ? "on" : ""} onClick={() => setLang("en")}>EN</button>
        </div>
      </div>

      <div className="stack">
        <div className="lockup">
          <img src="/buyme-logo.webp" alt="BUYME" className="zlogo" />
          <span className="rule" />
          <span className="mcp-badge">MCP</span>
        </div>
        <h1 className="zh1">
          {rtl ? (
            <>כל בית עסק שמכבד <span className="zbrand">BUYME</span>, דרך ה-AI שלכם.</>
          ) : (
            <>Every business that accepts <span className="zbrand">BuyMe</span>, through your AI.</>
          )}
        </h1>
        <p className="zsub">{t.sub(n)}</p>

        <div className="zend">
          <span className="lbl">MCP</span>
          <span className="url mono" dir="ltr">{endpoint}</span>
          <CopyButton text={endpoint} label={t.copy} />
        </div>

        <div className="zchips">
          <CopyButton variant="chip" text={`gemini mcp add --transport http buyme ${endpoint}`} label="Gemini" />
          <CopyButton variant="chip" text={`claude mcp add --transport http buyme ${endpoint}`} label="Claude" />
        </div>

        <p className="zhint">{t.hint}</p>

        <a className="zstar" href={REPO_URL} target="_blank" rel="noreferrer">
          <GithubLogo size={18} weight="fill" />
          {t.star}
          <Star size={16} weight="fill" className="star-ico" />
        </a>
      </div>

      <footer className="zfoot">
        <span>{t.unofficial}</span>
        <span className="sep">·</span>
        <a href="https://buyme.co.il" target="_blank" rel="noreferrer">buyme.co.il</a>
        <span className="sep">·</span>
        <a href={`${REPO_URL}/tree/main/gemini-gem`} target="_blank" rel="noreferrer">{t.gem}</a>
      </footer>
    </main>
  );
}
