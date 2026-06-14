import { NextResponse } from "next/server";
import { mapArticles } from "@/lib/news-api";

// Server route for the Vercel/private deploy: keeps FINNHUB_API_KEY server-side.
// (Excluded from the static GitHub Pages export — that surface uses the browser-direct key.)
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "FINNHUB_API_KEY not set", items: [] }, { status: 200 });
  }
  const symbol = new URL(req.url).searchParams.get("symbol") || "All";
  const market = symbol === "All" || symbol === "MKT";
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
  const url = market
    ? `https://finnhub.io/api/v1/news?category=general&token=${key}`
    : `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${key}`;

  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Finnhub ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Unexpected response");
    return NextResponse.json({ items: mapArticles(data, symbol) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "failed", items: [] },
      { status: 200 },
    );
  }
}
