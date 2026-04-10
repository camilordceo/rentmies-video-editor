import { NextRequest, NextResponse } from "next/server";
import { createPaymentSource } from "@/lib/wompi";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * POST /api/payments/payment-sources
 * Tokenizes a card via Wompi and saves the payment source to Supabase.
 *
 * Body: { token: string, customerEmail: string, acceptanceToken: string, userId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, customerEmail, acceptanceToken, userId } = body;

    if (!token || !customerEmail || !acceptanceToken || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: token, customerEmail, acceptanceToken, userId" },
        { status: 400 }
      );
    }

    // Create the payment source in Wompi
    const source = await createPaymentSource(token, customerEmail, acceptanceToken);

    // Save to Supabase payment_sources table
    const supabase = getServiceClient();
    const { data: saved, error: dbError } = await supabase
      .from("payment_sources")
      .insert({
        user_id: userId,
        wompi_source_id: source.id,
        type: source.type,
        token: source.token,
        status: source.status,
        customer_email: source.customer_email,
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB insert payment_sources error:", dbError.message);
      return NextResponse.json(
        { error: "Failed to save payment source" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: saved }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("payment-sources error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
