/**
 * Wompi Colombia payment gateway client.
 * All amounts are in COP cents (centavos). Currency is always "COP".
 *
 * Docs: https://docs.wompi.co/docs/colombia/
 */

const SANDBOX_URL = "https://sandbox.wompi.co/v1";
const PRODUCTION_URL = "https://production.wompi.co/v1";

export function getWompiBaseUrl(): string {
  const publicKey = process.env.WOMPI_PUBLIC_KEY || "";
  // Sandbox keys start with "pub_test_", production with "pub_prod_"
  if (publicKey.startsWith("pub_test_")) {
    return SANDBOX_URL;
  }
  return PRODUCTION_URL;
}

// ---------------------------------------------------------------------------
// Acceptance tokens (required by Colombian regulations)
// ---------------------------------------------------------------------------

export interface AcceptanceTokens {
  acceptance_token: string;
  permalink: string;
  type: string;
}

export async function fetchAcceptanceTokens(): Promise<AcceptanceTokens> {
  const publicKey = process.env.WOMPI_PUBLIC_KEY;
  if (!publicKey) throw new Error("WOMPI_PUBLIC_KEY is not set");

  const url = `${getWompiBaseUrl()}/merchants/${publicKey}`;
  const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5 min
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wompi merchants request failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  const presigned = json.data?.presigned_acceptance;
  if (!presigned) {
    throw new Error("No presigned_acceptance in Wompi merchant response");
  }

  return {
    acceptance_token: presigned.acceptance_token,
    permalink: presigned.permalink,
    type: presigned.type,
  };
}

// ---------------------------------------------------------------------------
// Payment sources (tokenized cards)
// ---------------------------------------------------------------------------

export interface PaymentSourceResult {
  id: number;
  type: string;
  token: string;
  status: string;
  customer_email: string;
}

export async function createPaymentSource(
  token: string,
  customerEmail: string,
  acceptanceToken: string
): Promise<PaymentSourceResult> {
  const privateKey = process.env.WOMPI_PRIVATE_KEY;
  if (!privateKey) throw new Error("WOMPI_PRIVATE_KEY is not set");

  const url = `${getWompiBaseUrl()}/payment_sources`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${privateKey}`,
    },
    body: JSON.stringify({
      type: "CARD",
      token,
      customer_email: customerEmail,
      acceptance_token: acceptanceToken,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wompi createPaymentSource failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  return json.data as PaymentSourceResult;
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

export interface CreateTransactionParams {
  amountInCents: number;
  currency?: string;
  customerEmail: string;
  paymentSourceId: number;
  reference: string;
  customerData?: {
    full_name?: string;
    phone_number?: string;
  };
}

export interface TransactionResult {
  id: string;
  status: string;
  reference: string;
  amount_in_cents: number;
  currency: string;
  payment_source_id: number;
  created_at: string;
}

export async function createTransaction(
  params: CreateTransactionParams
): Promise<TransactionResult> {
  const privateKey = process.env.WOMPI_PRIVATE_KEY;
  if (!privateKey) throw new Error("WOMPI_PRIVATE_KEY is not set");

  const url = `${getWompiBaseUrl()}/transactions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${privateKey}`,
    },
    body: JSON.stringify({
      amount_in_cents: params.amountInCents,
      currency: params.currency || "COP",
      customer_email: params.customerEmail,
      payment_source_id: params.paymentSourceId,
      reference: params.reference,
      customer_data: params.customerData,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wompi createTransaction failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  return json.data as TransactionResult;
}

// ---------------------------------------------------------------------------
// Integrity signature (SHA-256)
// ---------------------------------------------------------------------------

export async function generateIntegritySignature(
  reference: string,
  amountInCents: number,
  currency: string = "COP"
): Promise<string> {
  const secret = process.env.WOMPI_INTEGRITY_SECRET;
  if (!secret) throw new Error("WOMPI_INTEGRITY_SECRET is not set");

  const payload = `${reference}${amountInCents}${currency}${secret}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------------------
// Webhook signature verification
// ---------------------------------------------------------------------------

export async function verifyWebhookSignature(
  body: string,
  timestamp: string,
  signature: string
): Promise<boolean> {
  const secret = process.env.WOMPI_EVENTS_SECRET;
  if (!secret) {
    console.error("WOMPI_EVENTS_SECRET is not set — cannot verify webhook");
    return false;
  }

  const payload = `${timestamp}${body}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(payload);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuffer = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  const computed = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computed === signature;
}
