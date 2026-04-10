import { NextRequest, NextResponse } from "next/server";
import { createTransaction, generateIntegritySignature } from "@/lib/wompi";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Plan definitions: amounts in COP cents
// ---------------------------------------------------------------------------

interface PlanConfig {
  amountInCents: number;
  credits: number;
  label: string;
}

const PLANS: Record<string, PlanConfig> = {
  starter: { amountInCents: 50_000_00, credits: 10, label: "Starter" },
  pro: { amountInCents: 150_000_00, credits: 30, label: "Pro" },
  enterprise: { amountInCents: 300_000_00, credits: 80, label: "Enterprise" },
};

/**
 * POST /api/payments/charge
 * Creates a Wompi transaction for a given plan using a stored payment source.
 *
 * Body: { paymentSourceId: number, plan: string, userId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentSourceId, plan, userId } = body;

    if (!paymentSourceId || !plan || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: paymentSourceId, plan, userId" },
        { status: 400 }
      );
    }

    const planConfig = PLANS[plan];
    if (!planConfig) {
      return NextResponse.json(
        { error: `Invalid plan "${plan}". Valid plans: ${Object.keys(PLANS).join(", ")}` },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Look up the payment source
    const { data: source, error: srcErr } = await supabase
      .from("payment_sources")
      .select("*")
      .eq("id", paymentSourceId)
      .eq("user_id", userId)
      .single();

    if (srcErr || !source) {
      return NextResponse.json(
        { error: "Payment source not found" },
        { status: 404 }
      );
    }

    // Generate unique reference
    const reference = `PROJ-${userId.slice(0, 8)}-${Date.now()}`;
    const currency = "COP";

    // Generate integrity signature
    const integritySignature = await generateIntegritySignature(
      reference,
      planConfig.amountInCents,
      currency
    );

    // Create Wompi transaction
    const transaction = await createTransaction({
      amountInCents: planConfig.amountInCents,
      currency,
      customerEmail: source.customer_email,
      paymentSourceId: source.wompi_source_id,
      reference,
    });

    // Save to wompi_transactions table
    const { data: txRecord, error: txErr } = await supabase
      .from("wompi_transactions")
      .insert({
        user_id: userId,
        wompi_transaction_id: transaction.id,
        reference,
        amount_in_cents: planConfig.amountInCents,
        currency,
        status: transaction.status,
        plan,
        credits: planConfig.credits,
        payment_source_id: paymentSourceId,
        integrity_signature: integritySignature,
      })
      .select()
      .single();

    if (txErr) {
      console.error("DB insert wompi_transactions error:", txErr.message);
      return NextResponse.json(
        { error: "Failed to save transaction record" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: {
          transaction: txRecord,
          wompiStatus: transaction.status,
          reference,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("charge error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
