"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";

interface WompiCheckoutProps {
  plan: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

interface AcceptanceTokens {
  acceptance_token: string;
  permalink: string;
  type: string;
}

export default function WompiCheckout({ plan, onSuccess, onError }: WompiCheckoutProps) {
  const { user } = useAuth();

  const [tokens, setTokens] = useState<AcceptanceTokens | null>(null);
  const [loadingTokens, setLoadingTokens] = useState(true);

  // Form state
  const [cardNumber, setCardNumber] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardHolder, setCardHolder] = useState("");

  // Checkboxes (required by Colombian law)
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "processing" | "done">("form");

  // Fetch acceptance tokens on mount
  useEffect(() => {
    async function loadTokens() {
      try {
        const res = await fetch("/api/payments/acceptance-tokens");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Error obteniendo tokens");
        setTokens(json.data);
      } catch (err) {
        onError(err instanceof Error ? err.message : "Error cargando tokens de aceptacion");
      } finally {
        setLoadingTokens(false);
      }
    }
    loadTokens();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function tokenizeCard(): Promise<string> {
    const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
    const baseUrl = publicKey?.startsWith("pub_test_")
      ? "https://sandbox.wompi.co/v1"
      : "https://production.wompi.co/v1";

    const res = await fetch(`${baseUrl}/tokens/cards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${publicKey}`,
      },
      body: JSON.stringify({
        number: cardNumber.replace(/\s/g, ""),
        exp_month: expMonth.padStart(2, "0"),
        exp_year: expYear.length === 2 ? expYear : expYear.slice(-2),
        cvc,
        card_holder: cardHolder,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || json.message || "Error tokenizando tarjeta");
    }
    return json.data.id;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!user) {
      onError("Debes iniciar sesion");
      return;
    }
    if (!tokens) {
      onError("Tokens de aceptacion no disponibles");
      return;
    }
    if (!acceptTerms || !acceptPrivacy) {
      onError("Debes aceptar los terminos y la politica de privacidad");
      return;
    }

    setSubmitting(true);
    setStep("processing");

    try {
      // Step 1: Tokenize card with Wompi
      const cardToken = await tokenizeCard();

      // Step 2: Create payment source
      const sourceRes = await fetch("/api/payments/payment-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: cardToken,
          customerEmail: user.email,
          acceptanceToken: tokens.acceptance_token,
          userId: user.id,
        }),
      });

      const sourceJson = await sourceRes.json();
      if (!sourceRes.ok) {
        throw new Error(sourceJson.error || "Error creando fuente de pago");
      }

      const paymentSourceId = sourceJson.data.id;

      // Step 3: Create charge
      const chargeRes = await fetch("/api/payments/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentSourceId,
          plan,
          userId: user.id,
        }),
      });

      const chargeJson = await chargeRes.json();
      if (!chargeRes.ok) {
        throw new Error(chargeJson.error || "Error procesando el cobro");
      }

      setStep("done");
      onSuccess();
    } catch (err) {
      setStep("form");
      onError(err instanceof Error ? err.message : "Error procesando el pago");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingTokens) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-sm text-[#6b7280]">Cargando...</div>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <svg
          className="animate-spin h-6 w-6 text-[#40d99d]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="text-sm text-[#6b7280]">Procesando pago...</p>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <svg className="w-10 h-10 text-[#40d99d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <p className="text-sm text-[#1a1a1a] font-medium">Pago exitoso</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* T&C and Privacy checkboxes */}
      <div className="space-y-2 p-3 rounded-lg bg-[#f0f0f0]/50 border border-[#e5e5e5]">
        <label className="flex items-start gap-2 text-xs text-[#1a1a1a] cursor-pointer">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-0.5 accent-[#40d99d]"
          />
          <span>
            Acepto los{" "}
            {tokens?.permalink ? (
              <a
                href={tokens.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#40d99d] underline"
              >
                terminos y condiciones
              </a>
            ) : (
              "terminos y condiciones"
            )}
          </span>
        </label>
        <label className="flex items-start gap-2 text-xs text-[#1a1a1a] cursor-pointer">
          <input
            type="checkbox"
            checked={acceptPrivacy}
            onChange={(e) => setAcceptPrivacy(e.target.checked)}
            className="mt-0.5 accent-[#40d99d]"
          />
          <span>
            Acepto la politica de privacidad y tratamiento de datos personales
          </span>
        </label>
      </div>

      {/* Card holder */}
      <div>
        <label className="block text-xs text-[#6b7280] mb-1" style={{ fontWeight: 400 }}>
          Nombre del titular
        </label>
        <input
          type="text"
          required
          value={cardHolder}
          onChange={(e) => setCardHolder(e.target.value)}
          placeholder="Como aparece en la tarjeta"
          className="w-full px-3 py-2 bg-[#f0f0f0] border border-[#e5e5e5] rounded-lg text-[#1a1a1a] placeholder-[#6b7280] text-sm focus:outline-none focus:ring-2 focus:ring-[#40d99d] focus:border-[#40d99d] transition-all duration-200"
        />
      </div>

      {/* Card number */}
      <div>
        <label className="block text-xs text-[#6b7280] mb-1" style={{ fontWeight: 400 }}>
          Numero de tarjeta
        </label>
        <input
          type="text"
          required
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value.replace(/[^\d\s]/g, ""))}
          placeholder="0000 0000 0000 0000"
          maxLength={19}
          className="w-full px-3 py-2 bg-[#f0f0f0] border border-[#e5e5e5] rounded-lg text-[#1a1a1a] placeholder-[#6b7280] text-sm focus:outline-none focus:ring-2 focus:ring-[#40d99d] focus:border-[#40d99d] transition-all duration-200"
        />
      </div>

      {/* Expiry + CVC */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-[#6b7280] mb-1" style={{ fontWeight: 400 }}>
            Mes
          </label>
          <input
            type="text"
            required
            value={expMonth}
            onChange={(e) => setExpMonth(e.target.value.replace(/\D/g, "").slice(0, 2))}
            placeholder="MM"
            maxLength={2}
            className="w-full px-3 py-2 bg-[#f0f0f0] border border-[#e5e5e5] rounded-lg text-[#1a1a1a] placeholder-[#6b7280] text-sm focus:outline-none focus:ring-2 focus:ring-[#40d99d] focus:border-[#40d99d] transition-all duration-200"
          />
        </div>
        <div>
          <label className="block text-xs text-[#6b7280] mb-1" style={{ fontWeight: 400 }}>
            Ano
          </label>
          <input
            type="text"
            required
            value={expYear}
            onChange={(e) => setExpYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="YY"
            maxLength={4}
            className="w-full px-3 py-2 bg-[#f0f0f0] border border-[#e5e5e5] rounded-lg text-[#1a1a1a] placeholder-[#6b7280] text-sm focus:outline-none focus:ring-2 focus:ring-[#40d99d] focus:border-[#40d99d] transition-all duration-200"
          />
        </div>
        <div>
          <label className="block text-xs text-[#6b7280] mb-1" style={{ fontWeight: 400 }}>
            CVC
          </label>
          <input
            type="text"
            required
            value={cvc}
            onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="123"
            maxLength={4}
            className="w-full px-3 py-2 bg-[#f0f0f0] border border-[#e5e5e5] rounded-lg text-[#1a1a1a] placeholder-[#6b7280] text-sm focus:outline-none focus:ring-2 focus:ring-[#40d99d] focus:border-[#40d99d] transition-all duration-200"
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || !acceptTerms || !acceptPrivacy}
        className="w-full py-2.5 bg-[#40d99d] text-white rounded-lg text-sm font-medium transition-all duration-200 hover:bg-[#40d99d]/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Procesando..." : "Pagar"}
      </button>

      <p className="text-center text-[10px] text-[#6b7280]">
        Pagos procesados de forma segura por Wompi
      </p>
    </form>
  );
}
