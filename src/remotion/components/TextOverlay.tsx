import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import type { TextElement } from "@/lib/types";

interface TextOverlayProps {
  element: TextElement;
}

export const TextOverlay: React.FC<TextOverlayProps> = ({ element }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - element.startFrame;
  if (localFrame < 0 || localFrame >= element.durationFrames) return null;

  const progress = localFrame / Math.max(element.durationFrames - 1, 1);
  const animDuration = 20;
  const animProgress = Math.min(localFrame / animDuration, 1);
  const exitStart = element.durationFrames - animDuration;
  const exitProgress = localFrame > exitStart ? (localFrame - exitStart) / animDuration : 0;

  let opacity = 1;
  let translateX = 0;
  let translateY = 0;
  let scale = 1;

  switch (element.animation) {
    case "fade-in":
      opacity = interpolate(animProgress, [0, 1], [0, 1], {
        extrapolateRight: "clamp",
      });
      break;

    case "fade-out":
      opacity = interpolate(exitProgress, [0, 1], [1, 0], {
        extrapolateRight: "clamp",
      });
      break;

    case "slide-up":
      translateY = interpolate(animProgress, [0, 1], [60, 0], {
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      });
      opacity = interpolate(animProgress, [0, 0.3], [0, 1], {
        extrapolateRight: "clamp",
      });
      break;

    case "slide-down":
      translateY = interpolate(animProgress, [0, 1], [-60, 0], {
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      });
      opacity = interpolate(animProgress, [0, 0.3], [0, 1], {
        extrapolateRight: "clamp",
      });
      break;

    case "slide-left":
      translateX = interpolate(animProgress, [0, 1], [-120, 0], {
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      });
      opacity = interpolate(animProgress, [0, 0.3], [0, 1], {
        extrapolateRight: "clamp",
      });
      break;

    case "slide-right":
      translateX = interpolate(animProgress, [0, 1], [120, 0], {
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      });
      opacity = interpolate(animProgress, [0, 0.3], [0, 1], {
        extrapolateRight: "clamp",
      });
      break;

    case "scale-in": {
      const springVal = spring({
        frame: localFrame,
        fps,
        config: { damping: 12, stiffness: 100, mass: 0.5 },
      });
      scale = interpolate(springVal, [0, 1], [0.3, 1]);
      opacity = interpolate(springVal, [0, 0.5], [0, 1], {
        extrapolateRight: "clamp",
      });
      break;
    }

    case "bounce": {
      const springVal = spring({
        frame: localFrame,
        fps,
        config: { damping: 8, stiffness: 150, mass: 0.6 },
      });
      scale = interpolate(springVal, [0, 1], [0, 1]);
      translateY = interpolate(springVal, [0, 1], [80, 0]);
      opacity = interpolate(springVal, [0, 0.3], [0, 1], {
        extrapolateRight: "clamp",
      });
      break;
    }

    case "typewriter": {
      const charsToShow = Math.floor(
        (animProgress * 2) * element.text.length
      );
      const visibleText = element.text.slice(
        0,
        Math.min(charsToShow, element.text.length)
      );
      return (
        <div
          style={{
            position: "absolute",
            left: `${element.position.x - element.size.width / 2}%`,
            top: `${element.position.y - element.size.height / 2}%`,
            width: `${element.size.width}%`,
            height: `${element.size.height}%`,
            display: "flex",
            alignItems: "center",
            justifyContent:
              element.style.textAlign === "center"
                ? "center"
                : element.style.textAlign === "right"
                ? "flex-end"
                : "flex-start",
          }}
        >
          <span
            style={{
              fontFamily: element.style.fontFamily,
              fontSize: element.style.fontSize,
              fontWeight: element.style.fontWeight,
              color: element.style.color,
              backgroundColor: element.style.backgroundColor,
              textAlign: element.style.textAlign,
              lineHeight: element.style.lineHeight,
              letterSpacing: element.style.letterSpacing,
              textShadow: element.style.textShadow,
              borderRadius: element.style.borderRadius,
              padding: element.style.padding,
            }}
          >
            {visibleText}
            <span style={{ opacity: Math.round(localFrame / 8) % 2 === 0 ? 1 : 0 }}>|</span>
          </span>
        </div>
      );
    }

    case "none":
    default:
      break;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: `${element.position.x - element.size.width / 2}%`,
        top: `${element.position.y - element.size.height / 2}%`,
        width: `${element.size.width}%`,
        height: `${element.size.height}%`,
        display: "flex",
        alignItems: "center",
        justifyContent:
          element.style.textAlign === "center"
            ? "center"
            : element.style.textAlign === "right"
            ? "flex-end"
            : "flex-start",
        opacity,
        transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
      }}
    >
      <span
        style={{
          fontFamily: element.style.fontFamily,
          fontSize: element.style.fontSize,
          fontWeight: element.style.fontWeight,
          color: element.style.color,
          backgroundColor: element.style.backgroundColor,
          textAlign: element.style.textAlign,
          lineHeight: element.style.lineHeight,
          letterSpacing: element.style.letterSpacing,
          textShadow: element.style.textShadow,
          borderRadius: element.style.borderRadius,
          padding: element.style.padding,
          display: "inline-block",
        }}
      >
        {element.text}
      </span>
    </div>
  );
};
