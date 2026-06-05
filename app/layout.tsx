import "./globals.css";
import { Assistant, Rubik } from "next/font/google";
import { GeistMono } from "geist/font/mono";

// Clean, refined humanist body — premium in both Hebrew and Latin.
const assistant = Assistant({
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

// Modern geometric display for headlines — strong, premium, bilingual.
const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

export const metadata = {
  title: "BUYME Finder — חיפוש בתי עסק שמכבדים BUYME דרך ה-AI",
  description:
    "כלי חכם לחיפוש בתי עסק שמכבדים שובר BUYME — לפי קטגוריה, אזור, מחיר ומימוש אונליין. מתחבר ל-Gemini, Claude וכל עוזר AI. A smart finder for businesses that accept BuyMe gift cards, from your AI assistant.",
  metadataBase: new URL("https://buyme-mcp-vercel.vercel.app"),
  openGraph: {
    title: "BUYME Finder",
    description: "חיפוש בתי עסק שמכבדים BUYME, ישר מתוך עוזר ה-AI שלכם.",
    url: "https://buyme-mcp-vercel.vercel.app",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${assistant.variable} ${rubik.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
