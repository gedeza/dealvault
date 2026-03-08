import { NextResponse } from "next/server";

interface CacheEntry {
  rates: Record<string, number>;
  lastUpdated: string;
}

let cache: CacheEntry | null = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const CURRENCIES = ["EUR", "GBP", "ZAR", "CHF", "AED", "CNY", "JPY", "AUD", "CAD"];

export async function GET() {
  const now = Date.now();

  if (cache && now - cacheTime < CACHE_TTL) {
    return NextResponse.json({ base: "USD", ...cache });
  }

  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=USD&to=${CURRENCIES.join(",")}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      if (cache) {
        return NextResponse.json({ base: "USD", ...cache });
      }
      return NextResponse.json({ error: "Failed to fetch rates" }, { status: 502 });
    }

    const data = await res.json();
    cache = {
      rates: { USD: 1, ...data.rates },
      lastUpdated: new Date().toISOString(),
    };
    cacheTime = now;

    return NextResponse.json({ base: "USD", ...cache });
  } catch {
    if (cache) {
      return NextResponse.json({ base: "USD", ...cache });
    }
    return NextResponse.json({ error: "Exchange rate service unavailable" }, { status: 502 });
  }
}
