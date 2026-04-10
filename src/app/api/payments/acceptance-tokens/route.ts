import { NextResponse } from "next/server";
import { fetchAcceptanceTokens } from "@/lib/wompi";

export const runtime = "nodejs";

/**
 * GET /api/payments/acceptance-tokens
 * Returns Wompi acceptance tokens (T&C, privacy policy) required by Colombian law.
 * Cached for 5 minutes via response headers.
 */
export async function GET() {
  try {
    const tokens = await fetchAcceptanceTokens();

    return NextResponse.json(
      { data: tokens },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("acceptance-tokens error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
