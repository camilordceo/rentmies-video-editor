import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import type { TransitionType } from "@/lib/types";

interface TransitionEffectProps {
  type: TransitionType;
  durationFrames: number;
  sceneDurationFrames: number;
  children: React.ReactNode;
}

export const TransitionEffect: React.FC<TransitionEffectProps> = ({
  type,
  durationFrames,
  sceneDurationFrames,
  children,
}) => {
  const frame = useCurrentFrame();

  if (type === "none" || durationFrames <= 0) {
    return <>{children}</>;
  }

  const enterProgress =
    frame < durationFrames
      ? interpolate(frame, [0, durationFrames], [0, 1], {
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : 1;

  const exitStart = sceneDurationFrames - durationFrames;
  const exitProgress =
    frame > exitStart
      ? interpolate(frame, [exitStart, sceneDurationFrames], [1, 0], {
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.cubic),
        })
      : 1;

  const progress = Math.min(enterProgress, exitProgress);

  let style: React.CSSProperties = {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
  };

  switch (type) {
    case "fade":
      style.opacity = progress;
      break;

    case "slide-left":
      style.transform = `translateX(${(1 - enterProgress) * 100}%)`;
      style.opacity = exitProgress;
      break;

    case "slide-right":
      style.transform = `translateX(${(enterProgress - 1) * 100}%)`;
      style.opacity = exitProgress;
      break;

    case "wipe":
      style.clipPath = `inset(0 ${(1 - progress) * 100}% 0 0)`;
      break;

    case "zoom":
      const scale = interpolate(progress, [0, 1], [1.3, 1]);
      style.transform = `scale(${scale})`;
      style.opacity = progress;
      break;
  }

  return <div style={style}>{children}</div>;
};
