import { ImageResponse } from "next/og";

// Branded 1200×630 share card. Self-hosted so Facebook/Twitter/LinkedIn have one
// explicit preview image instead of scraping remote business logos off the page
// (which is what stalled the FB composer). Latin-only copy keeps it font-safe.
export const alt = "BUYME Finder — every business that accepts BuyMe, through your AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  const chips = ["search_businesses", "get_business", "list_my_giftcards"];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          color: "#fff",
          background: "linear-gradient(135deg, #ff5c9b 0%, #df0f65 52%, #b00b50 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* brand lockup: BUYME · MCP */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: -1 }}>BUYME</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: 48,
              padding: "0 20px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.2)",
              border: "2px solid rgba(255,255,255,0.45)",
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            MCP
          </div>
        </div>

        {/* headline + subhead */}
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2, maxWidth: 1010 }}>
            Every business that accepts BuyMe — through your AI.
          </div>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 500, lineHeight: 1.4, opacity: 0.93, maxWidth: 980 }}>
            Search 1,200+ businesses, check open-now status, and read your own gift-card balance — from Claude, Gemini or ChatGPT.
          </div>
        </div>

        {/* tool chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {chips.map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                padding: "11px 22px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.16)",
                border: "1px solid rgba(255,255,255,0.32)",
                fontSize: 25,
                fontWeight: 600,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
