"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function CreditsBadge() {
  const { profile, isAdmin, isLoading } = useAuth();

  if (isLoading || !profile) return null;

  const credits = profile.credits_remaining ?? 0;

  // Admin: show infinity
  if (isAdmin) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#40d99d]/10 text-[#40d99d]">
        <CoinIcon />
        <span>&infin;</span>
      </span>
    );
  }

  // Zero credits: red with link to pricing
  if (credits === 0) {
    return (
      <Link
        href="/pricing"
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors duration-200"
      >
        <CoinIcon />
        <span>0</span>
        <span className="ml-0.5">Comprar</span>
      </Link>
    );
  }

  // Low credits: amber warning
  if (credits <= 2) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600">
        <CoinIcon />
        <span>{credits}</span>
      </span>
    );
  }

  // Normal state
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f0f0f0] text-[#1a1a1a]">
      <CoinIcon />
      <span>{credits}</span>
    </span>
  );
}

function CoinIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v12M9 9h6M9 15h6" />
    </svg>
  );
}
