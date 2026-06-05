"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Plus, Microphone, CaretDown } from "@phosphor-icons/react";
import { ClaudeMark, GeminiMark } from "./ProviderMarks";

type Lang = "he" | "en";
type Provider = "claude" | "gemini";
type Arg = { k: string; v: string };
type Status = { open: boolean; text: string };
type Result = { name: string; meta: string; logo: string; status: Status; price?: string; online?: boolean };
type WalletCard = { name: string; meta: string; balance: string };
type Wallet = { total: string; note: string; cards: WalletCard[] };
type Demo = { prompt: string; args: Arg[]; results: Result[]; summary: string; tool?: string; wallet?: Wallet };

const L = (id: string) => `https://buyme.co.il/files/siteNewLogo${id}.jpg`;

/* Real prompts → real BuyMe businesses & logos from the catalog (data/buyme.json).
   Open/now status is illustrative of how the assistant enriches each result. */
const DEMOS: Record<Lang, Demo[]> = {
  he: [
    {
      prompt: "מצא ספא זוגי בתל אביב עד ₪1000",
      args: [
        { k: "query", v: '"ספא זוגי"' },
        { k: "region", v: '"תל אביב"' },
        { k: "max_price", v: "1000" },
      ],
      results: [
        { name: "3030", meta: "ספא · ת״א והסביבה", logo: L("17573513"), price: "₪679", status: { open: true, text: "פתוח · עד 22:00" } },
        { name: "ספא גולף קיסריה", meta: "ספא · השרון", logo: L("5531871"), price: "₪840", status: { open: true, text: "פתוח · עד 21:00" } },
        { name: "אחוזת הספא", meta: "ספא · מרכז", logo: L("321452"), status: { open: false, text: "סגור · נפתח 09:00" } },
      ],
      summary: "12 בתי ספא שמכבדים BUYME באזור תל אביב — 9 פתוחים עכשיו.",
    },
    {
      prompt: "איפה לממש שובר על ארוחה בתל אביב?",
      args: [
        { k: "query", v: '"מסעדות"' },
        { k: "region", v: '"תל אביב"' },
      ],
      results: [
        { name: "מסעדת MOSHIK", meta: "שף · ת״א", logo: L("17574227"), price: "₪950", status: { open: true, text: "פתוח · עד 23:00" } },
        { name: "קפה גרג", meta: "קפה · ת״א", logo: L("351980"), price: "₪84", status: { open: true, text: "פתוח · עד 22:00" } },
        { name: "KFC", meta: "מזון מהיר · ת״א", logo: L("17574081"), online: true, status: { open: true, text: "פתוח · עד 23:30" } },
      ],
      summary: "38 מסעדות ובתי קפה בתל אביב — מסוננות לפתוחות עכשיו.",
    },
    {
      prompt: "יש לי שובר ₪200 — מה אפשר אונליין?",
      args: [
        { k: "online_only", v: "true" },
        { k: "max_price", v: "200" },
      ],
      results: [
        { name: "תחביבן", meta: "סדנאות · אונליין", logo: L("17573982"), price: "₪150", online: true, status: { open: true, text: "זמין 24/7 אונליין" } },
        { name: "מאפיית לחמים", meta: "קולינריה · מרכז", logo: L("17573731"), price: "₪60", online: true, status: { open: true, text: "פתוח · עד 20:00" } },
      ],
      summary: "27 בתי עסק עם מימוש אונליין עד ₪200.",
    },
    {
      prompt: "סדנת בישול במתנה לזוג",
      args: [
        { k: "query", v: '"סדנת בישול"' },
        { k: "category", v: '"סדנאות והעשרה"' },
      ],
      results: [
        { name: "הסטודיו לבישול", meta: "סדנאות · ת״א", logo: L("48170"), price: "₪410", status: { open: true, text: "פתוח · עד 22:00" } },
        { name: "דרך היין", meta: "יין · ת״א", logo: L("137281"), price: "₪199", status: { open: true, text: "פתוח · עד 23:00" } },
      ],
      summary: "9 סדנאות בישול וטעימות.",
    },
    {
      prompt: "כמה כסף נשאר לי בארנק ה-BUYME שלי?",
      tool: "list_my_giftcards",
      args: [],
      results: [],
      wallet: {
        total: "₪540",
        note: "3 שוברים פעילים",
        cards: [
          { name: "BUYME ALL", meta: "בתוקף עד 2031", balance: "₪300" },
          { name: "BUYME ALL", meta: "בתוקף עד 2031", balance: "₪200" },
          { name: "BUYME ALL", meta: "בתוקף עד 2030", balance: "₪40" },
        ],
      },
      summary: "₪540 בארנק — רץ מקומית, הטוקן שלכם נשאר על המכשיר.",
    },
  ],
  en: [
    {
      prompt: "Find a couples spa in Tel Aviv under ₪1000",
      args: [
        { k: "query", v: '"spa couples"' },
        { k: "region", v: '"tel aviv"' },
        { k: "max_price", v: "1000" },
      ],
      results: [
        { name: "3030", meta: "Spa · Tel Aviv", logo: L("17573513"), price: "₪679", status: { open: true, text: "Open · until 22:00" } },
        { name: "Spa Golf Caesarea", meta: "Spa · Sharon", logo: L("5531871"), price: "₪840", status: { open: true, text: "Open · until 21:00" } },
        { name: "Ahuzat HaSpa", meta: "Spa · Center", logo: L("321452"), status: { open: false, text: "Closed · opens 09:00" } },
      ],
      summary: "12 spas that accept BuyMe around Tel Aviv — 9 open now.",
    },
    {
      prompt: "Where can I redeem a voucher for dinner in Tel Aviv?",
      args: [
        { k: "query", v: '"restaurants"' },
        { k: "region", v: '"tel aviv"' },
      ],
      results: [
        { name: "MOSHIK", meta: "Chef · Tel Aviv", logo: L("17574227"), price: "₪950", status: { open: true, text: "Open · until 23:00" } },
        { name: "Cafe Greg", meta: "Café · Tel Aviv", logo: L("351980"), price: "₪84", status: { open: true, text: "Open · until 22:00" } },
        { name: "KFC", meta: "Fast food · Tel Aviv", logo: L("17574081"), online: true, status: { open: true, text: "Open · until 23:30" } },
      ],
      summary: "38 restaurants and cafés in Tel Aviv — filtered to open now.",
    },
    {
      prompt: "I have a ₪200 voucher — what can I get online?",
      args: [
        { k: "online_only", v: "true" },
        { k: "max_price", v: "200" },
      ],
      results: [
        { name: "Tahbivan", meta: "Workshops · Online", logo: L("17573982"), price: "₪150", online: true, status: { open: true, text: "Available 24/7 online" } },
        { name: "Lehamim Bakery", meta: "Culinary · Center", logo: L("17573731"), price: "₪60", online: true, status: { open: true, text: "Open · until 20:00" } },
      ],
      summary: "27 businesses with online redemption up to ₪200.",
    },
    {
      prompt: "A cooking workshop gift for two",
      args: [
        { k: "query", v: '"cooking workshop"' },
        { k: "category", v: '"workshops"' },
      ],
      results: [
        { name: "The Cooking Studio", meta: "Workshops · Tel Aviv", logo: L("48170"), price: "₪410", status: { open: true, text: "Open · until 22:00" } },
        { name: "Derech HaYayin", meta: "Wine · Tel Aviv", logo: L("137281"), price: "₪199", status: { open: true, text: "Open · until 23:00" } },
      ],
      summary: "9 cooking and tasting workshops.",
    },
    {
      prompt: "How much do I have left in my BuyMe wallet?",
      tool: "list_my_giftcards",
      args: [],
      results: [],
      wallet: {
        total: "₪540",
        note: "3 active gift cards",
        cards: [
          { name: "BUYME ALL", meta: "Valid until 2031", balance: "₪300" },
          { name: "BUYME ALL", meta: "Valid until 2031", balance: "₪200" },
          { name: "BUYME ALL", meta: "Valid until 2030", balance: "₪40" },
        ],
      },
      summary: "₪540 in your wallet — runs locally, your token never leaves your device.",
    },
  ],
};

const STR = {
  he: { tool: "search_businesses", online: "אונליין", askClaude: "כתבו ל-Claude…", askGemini: "שאלו את Gemini", totalLabel: "היתרה הכוללת", local: "רץ מקומית · פרטי" },
  en: { tool: "search_businesses", online: "online", askClaude: "Reply to Claude…", askGemini: "Ask Gemini", totalLabel: "Total balance", local: "Runs locally · private" },
} as const;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

type Stage = "type" | "call" | "results" | "done";

function ToolCall({ demo, tool, localLabel }: { demo: Demo; tool: string; localLabel?: string }) {
  const fn = demo.tool ?? tool;
  return (
    <div className="toolcall" dir="ltr">
      <span className="tc-dot" />
      <code className="tc-code">
        <span className="tc-fn">{fn}</span>
        <span className="tc-pun">(</span>
        {demo.args.length > 0 && (
          <>
            <span className="tc-pun">{"{ "}</span>
            {demo.args.map((a, i) => (
              <span key={a.k}>
                <span className="tc-key">{a.k}</span>
                <span className="tc-pun">: </span>
                <span className="tc-val">{a.v}</span>
                {i < demo.args.length - 1 && <span className="tc-pun">, </span>}
              </span>
            ))}
            <span className="tc-pun">{" }"}</span>
          </>
        )}
        <span className="tc-pun">)</span>
      </code>
      {localLabel && demo.wallet && <span className="tc-local">{localLabel}</span>}
    </div>
  );
}

function WalletPanel({ w, totalLabel }: { w: Wallet; totalLabel: string }) {
  return (
    <div className="wallet">
      <div className="wallet-total">
        <span className="wt-label">{totalLabel}</span>
        <span className="wt-amount" dir="ltr">{w.total}</span>
        <span className="wt-note">{w.note}</span>
      </div>
      <div className="wallet-cards">
        {w.cards.map((c, i) => (
          <div className="wcard" key={i}>
            <span className="wc-mark" aria-hidden="true">BM</span>
            <span className="wc-main">
              <span className="wc-name">{c.name}</span>
              <span className="wc-meta">{c.meta}</span>
            </span>
            <span className="wc-balance" dir="ltr">{c.balance}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultCard({ r, lang }: { r: Result; lang: Lang }) {
  const [imgOk, setImgOk] = useState(true);
  const online = STR[lang].online;
  return (
    <div className="rcard">
      {imgOk ? (
        <img className="rc-logo" src={r.logo} alt="" loading="lazy" onError={() => setImgOk(false)} />
      ) : (
        <span className="rc-logo fallback" aria-hidden="true">{r.name.charAt(0)}</span>
      )}
      <span className="rc-main">
        <span className="rc-name">{r.name}</span>
        <span className="rc-meta">{r.meta}</span>
        <span className={`rc-status ${r.status.open ? "open" : "closed"}`}>
          <span className="sdot" />{r.status.text}
        </span>
      </span>
      <span className="rc-side">
        {r.price && <span className="rc-price">{r.price}</span>}
        {r.online && <span className="rc-online">{online}</span>}
      </span>
    </div>
  );
}

function Summary({ text }: { text: string }) {
  const [head, ...rest] = text.split(" ");
  return <div className="summary">✦ <b>{head}</b> {rest.join(" ")}</div>;
}

function AiAvatar({ provider }: { provider: Provider }) {
  return (
    <span className="ai-avatar">
      {provider === "claude" ? <ClaudeMark size={15} /> : <GeminiMark size={15} />}
    </span>
  );
}

function Turn({ demo, lang, provider }: { demo: Demo; lang: Lang; provider: Provider }) {
  const s = STR[lang];
  return (
    <div className="turn">
      <div className="msg user"><span className="msg-prompt">{demo.prompt}</span></div>
      <div className="msg assistant">
        <AiAvatar provider={provider} />
        <div className="ai-body">
          <ToolCall demo={demo} tool={s.tool} localLabel={s.local} />
          {demo.wallet ? (
            <WalletPanel w={demo.wallet} totalLabel={s.totalLabel} />
          ) : (
            <div className="results">
              {demo.results.map((r) => <ResultCard key={r.name} r={r} lang={lang} />)}
            </div>
          )}
          <Summary text={demo.summary} />
        </div>
      </div>
    </div>
  );
}

function DemoWindow({
  demos,
  lang,
  provider,
  onProvider,
  className = "",
  badge,
}: {
  demos: Demo[];
  lang: Lang;
  provider: Provider;
  onProvider?: (p: Provider) => void;
  className?: string;
  badge?: string;
}) {
  const s = STR[lang];
  const reduced = usePrefersReducedMotion();

  const [done, setDone] = useState<number[]>([]);
  const [active, setActive] = useState(0);
  const [typed, setTyped] = useState("");
  const [stage, setStage] = useState<Stage>("type");
  const [shown, setShown] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const clearAll = () => { timers.current.forEach((id) => clearTimeout(id)); timers.current = []; };
  const after = (ms: number, fn: () => void) => { const id = window.setTimeout(fn, ms); timers.current.push(id); };

  useEffect(() => { setDone([]); setActive(0); }, [lang]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }, [stage, shown, done.length, active, reduced]);

  useEffect(() => {
    clearAll();
    const demo = demos[active];
    if (!demo) return;

    const advance = () => {
      if (active >= demos.length - 1) {
        after(reduced ? 5200 : 3600, () => { setDone([]); setActive(0); });
      } else {
        setDone((d) => [...d, active]);
        setActive((a) => a + 1);
      }
    };

    if (reduced) {
      setTyped(demo.prompt); setStage("done"); setShown(demo.results.length);
      after(2600, advance);
      return clearAll;
    }

    setTyped(""); setStage("type"); setShown(0);

    const revealResults = () => {
      setStage("results");
      let r = 0;
      const step = () => {
        r += 1; setShown(r);
        if (r < demo.results.length) after(300, step);
        else after(440, () => { setStage("done"); after(2400, advance); });
      };
      step();
    };

    const typeNext = (i: number) => {
      setTyped(demo.prompt.slice(0, i));
      if (i < demo.prompt.length) {
        const ch = demo.prompt[i];
        after(30 + (ch === " " ? 20 : 0), () => typeNext(i + 1));
      } else {
        after(420, () => { setStage("call"); after(780, revealResults); });
      }
    };

    after(active === 0 ? 360 : 480, () => typeNext(1));
    return clearAll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, lang, reduced, demos]);

  const demo = demos[active];

  return (
    <div className={`demo-win prov-${provider} ${className}`}>
      <div className="demo-bar">
        <span className="demo-av">
          {provider === "claude" ? <ClaudeMark size={16} /> : <GeminiMark size={16} />}
        </span>
        <span className="demo-name">{provider === "claude" ? "Claude" : "Gemini"}</span>
        {badge && <span className="demo-badge">{badge}</span>}
        {onProvider && (
          <div className="demo-seg" role="group" aria-label="Assistant">
            <button className={provider === "claude" ? "on" : ""} onClick={() => onProvider("claude")} aria-label="Claude">
              <ClaudeMark size={15} />
            </button>
            <button className={provider === "gemini" ? "on" : ""} onClick={() => onProvider("gemini")} aria-label="Gemini">
              <GeminiMark size={15} />
            </button>
          </div>
        )}
      </div>

      <div className="demo-scroll" ref={scrollRef}>
        {done.map((idx) => <Turn key={`done-${idx}`} demo={demos[idx]} lang={lang} provider={provider} />)}

        {demo && (
          <div className="turn" key={`active-${active}`}>
            <div className="msg user">
              <span className="msg-prompt">
                {typed}
                {stage === "type" && <span className="caret" />}
              </span>
            </div>

            {stage !== "type" && (
              <div className="msg assistant">
                <AiAvatar provider={provider} />
                <div className="ai-body">
                  <ToolCall demo={demo} tool={s.tool} localLabel={s.local} />
                  {stage === "call" && <div className="thinking"><i /><i /><i /></div>}
                  {(stage === "results" || stage === "done") &&
                    (demo.wallet ? (
                      <WalletPanel w={demo.wallet} totalLabel={s.totalLabel} />
                    ) : (
                      <div className="results">
                        {demo.results.slice(0, shown).map((r) => <ResultCard key={r.name} r={r} lang={lang} />)}
                      </div>
                    ))}
                  {stage === "done" && <Summary text={demo.summary} />}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="demo-foot" aria-hidden="true">
        {provider === "gemini" ? (
          <div className="gem-composer">
            <Plus className="gc-ic" size={18} />
            <span className="gc-text">{s.askGemini}</span>
            <span className="gc-pro">Pro <CaretDown size={12} weight="bold" /></span>
            <Microphone className="gc-ic" size={17} weight="fill" />
          </div>
        ) : (
          <>
            <span className="fake-input">{s.askClaude}</span>
            <button className="send" tabIndex={-1}><ArrowUp size={17} weight="bold" /></button>
          </>
        )}
      </div>
    </div>
  );
}

export function PromptDemo({
  lang,
  provider,
  onProvider,
}: {
  lang: Lang;
  provider: Provider;
  onProvider: (p: Provider) => void;
}) {
  const rtl = lang === "he";
  const s = STR[lang];
  const searchDemos = DEMOS[lang].filter((d) => !d.wallet);
  const walletDemos = DEMOS[lang].filter((d) => d.wallet);

  return (
    <div className="demo demo-stack" dir={rtl ? "rtl" : "ltr"}>
      <span className="demo-glow" aria-hidden="true" />
      <DemoWindow className="is-back" demos={walletDemos} lang={lang} provider={provider} badge={s.local} />
      <DemoWindow className="is-front" demos={searchDemos} lang={lang} provider={provider} onProvider={onProvider} />
    </div>
  );
}
