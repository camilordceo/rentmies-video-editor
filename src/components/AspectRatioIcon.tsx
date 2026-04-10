"use client";

import React from "react";

interface AspectRatioIconProps {
  ratio: "16:9" | "9:16" | "1:1" | "4:5";
  size?: number;
  className?: string;
}

export default function AspectRatioIcon({ ratio, size = 24, className = "" }: AspectRatioIconProps) {
  const strokeColor = "#6b7280";
  const sw = 1.5;

  switch (ratio) {
    case "16:9":
      // Monitor / desktop rectangle (landscape)
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect x="2" y="4" width="20" height="12" rx="2" stroke={strokeColor} strokeWidth={sw} />
          <line x1="8" y1="20" x2="16" y2="20" stroke={strokeColor} strokeWidth={sw} strokeLinecap="round" />
          <line x1="12" y1="16" x2="12" y2="20" stroke={strokeColor} strokeWidth={sw} strokeLinecap="round" />
        </svg>
      );

    case "9:16":
      // Phone rectangle (portrait)
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect x="6" y="2" width="12" height="20" rx="2" stroke={strokeColor} strokeWidth={sw} />
          <line x1="10" y1="19" x2="14" y2="19" stroke={strokeColor} strokeWidth={sw} strokeLinecap="round" />
        </svg>
      );

    case "1:1":
      // Square
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect x="4" y="4" width="16" height="16" rx="2" stroke={strokeColor} strokeWidth={sw} />
        </svg>
      );

    case "4:5":
      // Tablet rectangle (slightly tall)
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect x="4" y="3" width="16" height="18" rx="2" stroke={strokeColor} strokeWidth={sw} />
          <line x1="10" y1="18" x2="14" y2="18" stroke={strokeColor} strokeWidth={sw} strokeLinecap="round" />
        </svg>
      );

    default:
      return null;
  }
}
