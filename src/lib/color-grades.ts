import React from "react";
import type { CSSProperties } from "react";
import { AbsoluteFill } from "remotion";

export type ColorGrade = "iphone" | "cinematic" | "warm" | "raw";

const GRADE_FILTERS: Record<ColorGrade, string> = {
  iphone: "brightness(1.08) contrast(1.12) saturate(1.18) hue-rotate(-3deg)",
  cinematic: "brightness(0.95) contrast(1.25) saturate(0.85) sepia(0.15)",
  warm: "brightness(1.05) contrast(1.08) saturate(1.22) hue-rotate(8deg)",
  raw: "none",
};

export function getGradeFilter(grade: ColorGrade): string {
  return GRADE_FILTERS[grade];
}

export function applyiPhoneGrade(
  style: CSSProperties,
  grade: ColorGrade = "iphone"
): CSSProperties {
  if (grade === "raw") return style;
  return {
    ...style,
    filter: GRADE_FILTERS[grade],
  };
}

export const GradedVideo: React.FC<{
  grade: ColorGrade;
  children: React.ReactNode;
  style?: CSSProperties;
}> = ({ grade, children, style }) => {
  if (grade === "raw") {
    return React.createElement(
      AbsoluteFill,
      { style },
      children
    );
  }

  return React.createElement(
    AbsoluteFill,
    {
      style: {
        ...style,
        filter: GRADE_FILTERS[grade],
      },
    },
    children
  );
};
