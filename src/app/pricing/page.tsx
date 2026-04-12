"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import WompiCheckout from "@/components/WompiCheckout";

interface Plan {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  credits: number;
  features: string[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 50000,
    priceLabel: "$50,000",
    credits: 10,
    features: [
      "10 videos incluidos",
      "Exportar en HD",
      "Subtitulado con IA",
      "Plantillas basicas",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 150000,
    priceLabel: "$150,000",
    credits: 30,
    popular: true,
    features: [
      "30 videos incluidos",
      "Exportar en Full HD",
      "Subtitulado con IA",
      "Todas las plantillas",
      "Soporte prioritario",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 300000,
    priceLabel: "$300,000",
    credits: 80,
    features: [
      "80 videos incluidos",
      "Exportar en 4K",
      "Subtitulado con IA",
      "Todas las plantillas",
      "Soporte dedicado",
      "Marca personalizada",
    ],
  },
];

export default function PricingPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSelect(planId: string) {
    setSuccessMessage(null);
    setErrorMessage(null);
    setSelectedPlan(planId);
  }

  function handleSuccess() {
    setSelectedPlan(null);
    setSuccessMessage("Pago procesado exitosamente. Tus creditos han sido actualizados.");
  }

  function handleError(msg: string) {
    setErrorMessage(msg);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-[#6b7280] text-sm">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1
            className="text-3xl font-medium text-[#1a1a1a] mb-3"
            style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 500 }}
          >
            Planes y precios
          </h1>
          <p className="text-[#6b7280] text-base" style={{ fontWeight: 400 }}>
            Elige el plan que mejor se adapte a tus necesidades de contenido.
          </p>
        </div>

        {/* Success / Error messages */}
        {successMessage && (
          <div className="mb-8 p-4 rounded-xl border border-[#40d99d]/30 bg-[#40d99d]/5 text-center text-sm text-[#1a1a1a]">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-8 p-4 rounded-xl border border-red-200 bg-red-50 text-center text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-xl border bg-white p-6 transition-all duration-200 hover:shadow-sm ${
                plan.popular
                  ? "border-[#40d99d] shadow-sm"
                  : "border-[#e5e5e5]"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-block px-3 py-1 bg-[#40d99d] text-white text-xs font-medium rounded-full">
                    Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2
                  className="text-lg text-[#1a1a1a] mb-1"
                  style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 500 }}
                >
                  {plan.name}
                </h2>
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-3xl text-[#1a1a1a]"
                    style={{ fontWeight: 500 }}
                  >
                    {plan.priceLabel}
                  </span>
                  <span className="text-sm text-[#6b7280]" style={{ fontWeight: 400 }}>
                    COP
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#6b7280]" style={{ fontWeight: 400 }}>
                  {plan.credits} videos
                </p>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-[#1a1a1a]"
                    style={{ fontWeight: 400 }}
                  >
                    <svg
                      className="w-4 h-4 mt-0.5 text-[#40d99d] flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelect(plan.id)}
                disabled={!user}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  plan.popular
                    ? "bg-[#40d99d] text-white hover:bg-[#40d99d]/90"
                    : "bg-white text-[#1a1a1a] border border-[#e5e5e5] hover:bg-[#f0f0f0]/50"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {user ? "Seleccionar" : "Inicia sesion para comprar"}
              </button>
            </div>
          ))}
        </div>

        {/* Checkout modal */}
        {selectedPlan && user && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl border border-[#e5e5e5] shadow-lg p-6 w-full max-w-md mx-4 relative">
              <button
                onClick={() => setSelectedPlan(null)}
                className="absolute top-4 right-4 text-[#6b7280] hover:text-[#1a1a1a] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h3
                className="text-lg text-[#1a1a1a] mb-4"
                style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 500 }}
              >
                Pagar plan {PLANS.find((p) => p.id === selectedPlan)?.name}
              </h3>
              <WompiCheckout
                plan={selectedPlan}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            </div>
          </div>
        )}

        {/* Admin note */}
        <div className="text-center">
          <p className="text-xs text-[#6b7280]" style={{ fontWeight: 400 }}>
            Los usuarios administradores tienen acceso ilimitado sin necesidad de creditos.
          </p>
          {isAdmin && (
            <p className="mt-1 text-xs text-[#40d99d]" style={{ fontWeight: 500 }}>
              Tu cuenta tiene acceso de administrador.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
