import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

export const metadata = {
  title: "BuyMe MCP — search businesses that accept BuyMe, from your AI",
  description:
    "A public MCP (Model Context Protocol) server that lets Gemini, Claude, and any agent search 1,244 Israeli businesses accepting BuyMe gift cards by name, category, region, price, and online redemption. Unofficial index of buyme.co.il.",
  metadataBase: new URL("https://buyme-mcp-vercel.vercel.app"),
  openGraph: {
    title: "BuyMe MCP",
    description:
      "Search businesses that accept BuyMe gift cards, straight from your AI assistant. One MCP endpoint.",
    url: "https://buyme-mcp-vercel.vercel.app",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
