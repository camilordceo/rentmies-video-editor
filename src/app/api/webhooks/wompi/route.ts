import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/wompi";
import { addCredits } from "@/lib/credit-service";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * POST /api/webhooks/wompi
 * Receives Wompi webhook events for transaction status updates.
 *
 * Wompi sends a JSON body with:
 * - event: string (e.g. "transaction.updated")
 * - data: { transaction: { id, status, reference, ... } }
 * - timestamp: number
 * - signature: { checksum: string }
 *
 * See: https://docs.wompi.co/docs/colombia/eventos/
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);

    console.log("[wompi-webhook] Event received:", payload.event);

    // ------------------------------------------------------------------
    // Verify signature
    // ------------------------------------------------------------------
    const timestamp = String(payload.timestamp ?? "");
    const checksum = payload.signature?.checksum ?? "";

    if (checksum) {
      const valid = await verifyWebhookSignature(rawBody, timestamp, checksum);
      if (!valid) {
        console.warn("[wompi-webhook] Invalid signature, rejecting");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else {
      console.warn("[wompi-webhook] No checksum in payload — skipping verification (dev mode)");
    }

    // ------------------------------------------------------------------
    // Handle transaction.updated
    // ------------------------------------------------------------------
    if (payload.event === "transaction.updated") {
      const txData = payload.data?.transaction;
      if (!txData) {
        console.error("[wompi-webhook] No transaction data in payload");
        return NextResponse.json({ error: "Missing transaction data" }, { status: 400 });
      }

      const wompiTxId = txData.id;
      const newStatus: string = txData.status; // APPROVED, DECLINED, ERROR, VOIDED
      const reference: string = txData.reference;

      console.log(`[wompi-webhook] Transaction ${wompiTxId} (${reference}) => ${newStatus}`);

      const supabase = createAdminClient();

      // Look up our internal transaction record
      const { data: txRecord, error: lookupErr } = await supabase
        .from("wompi_transactions")
        .select("*")
        .eq("wompi_transaction_id", wompiTxId)
        .single();

      if (lookupErr || !txRecord) {
        console.error("[wompi-webhook] Transaction not found in DB:", wompiTxId);
        // Return 200 to avoid Wompi retries for unknown transactions
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Update status
      const { error: updateErr } = await supabase
        .from("wompi_transactions")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("wompi_transaction_id", wompiTxId);

      if (updateErr) {
        console.error("[wompi-webhook] Failed to update transaction status:", updateErr.message);
      }

      // On APPROVED: add credits to the user
      if (newStatus === "APPROVED") {
        const creditsToAdd = txRecord.credits ?? 0;
        if (creditsToAdd > 0) {
          const added = await addCredits(txRecord.user_id, creditsToAdd);
          if (added) {
            console.log(`[wompi-webhook] Added ${creditsToAdd} credits to user ${txRecord.user_id}`);
          } else {
            console.error(`[wompi-webhook] Failed to add credits for user ${txRecord.user_id}`);
          }
        }
      }

      // DECLINED / ERROR / VOIDED: status already updated above, nothing else to do
      if (["DECLINED", "ERROR", "VOIDED"].includes(newStatus)) {
        console.log(`[wompi-webhook] Transaction ${wompiTxId} status: ${newStatus} — no credits added`);
      }
    } else {
      console.log(`[wompi-webhook] Unhandled event type: ${payload.event}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[wompi-webhook] Error:", message);
    // Return 200 to prevent retries for malformed payloads
    return NextResponse.json({ error: message }, { status: 200 });
  }
}
