import { NextResponse } from "next/server";

import { searchDiscovery } from "@/lib/discovery";

/**
 * GET /api/discovery/search?q=<query>
 *
 * Server-side discovery search used by `app/customers/DiscoveryView.tsx`
 * with a 300ms client-side debounce. Returns 200 with `{ results: [] }`
 * for empty/missing queries — the empty case is not an error.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  try {
    const results = await searchDiscovery(q);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("[/api/discovery/search] failed", err);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 },
    );
  }
}
