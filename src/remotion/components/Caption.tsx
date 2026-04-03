import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import type { CaptionSegment, CaptionStyle } from "@/lib/types";

interface CaptionProps {
  segments: CaptionSegment[];
  style: CaptionStyle;
}

export const Caption: React.FC<CaptionProps> = ({ segments, style }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const activeSegment = segments.find(
    (seg) => frame >= seg.startFrame && frame < seg.endFrame
  );

  if (!activeSegment) return null;

  const localFrame = frame - activeSegment.startFrame;
  const totalFrames = activeSegment.endFrame - activeSegment.startFrame;

  let positionStyle: React.CSSProperties = {};
  switch (style.position) {
    case "top":
      positionStyle = { top: "8%", left: "50%", transform: "translateX(-50%)" };
      break;
    case "center":
      positionStyle = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
      break;
    case "bottom":
    default:
      positionStyle = { bottom: "10%", left: "50%", transform: "translateX(-50%)" };
      break;
  }

  let opacity = 1;
  let scale = 1;

  switch (style.animation) {
    case "fade": {
      const fadeInDuration = 5;
      const fadeOutStart = totalFrames - 5;
      if (localFrame < fadeInDuration) {
        opacity = interpolate(localFrame, [0, fadeInDuration], [0, 1], {
          extrapolateRight: "clamp",
        });
      } else if (localFrame > fadeOutStart) {
        opacity = interpolate(localFrame, [fadeOutStart, totalFrames], [1, 0], {
          extrapolateRight: "clamp",
        });
      }
      break;
    }
    case "pop": {
      const springVal = spring({
        frame: localFrame,
        fps,
        config: { damping: 10, stiffness: 200, mass: 0.4 },
      });
      scale = interpolate(springVal, [0, 1], [0.5, 1]);
      opacity = interpolate(springVal, [0, 0.5], [0, 1], {
        extrapolateRight: "clamp",
      });
      break;
    }
    case "highlight-word": {
      // Render words individually with highlighting
      const wordProgress = localFrame / Math.max(totalFrames - 1, 1);
      const activeWordIndex = Math.floor(wordProgress * activeSegment.words.length);

      return (
        <div
          style={{
            position: "absolute",
            ...positionStyle,
            maxWidth: `${style.maxWidth}%`,
            textAlign: "center",
            zIndex: 100,
          }}
        >
          <div
            style={{
              backgroundColor: style.backgroundColor,
              borderRadius: 12,
              padding: "12px 24px",
              display: "inline-block",
            }}
          >
            {activeSegment.words.map((word, idx) => (
              <span
                key={idx}
                style={{
                  fontFamily: style.fontFamily,
                  fontSize: style.fontSize,
                  fontWeight: idx === activeWordIndex ? 800 : style.fontWeight,
                  color: idx === activeWordIndex ? "#fbbf24" : style.color,
                  marginRight: 8,
                  transition: "color 0.1s",
                  display: "inline",
                }}
              >
                {word.word}
              </span>
            ))}
          </div>
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
        ...positionStyle,
        maxWidth: `${style.maxWidth}%`,
        textAlign: "center",
        opacity,
        zIndex: 100,
      }}
    >
      <div
        style={{
          backgroundColor: style.backgroundColor,
          borderRadius: 12,
          padding: "12px 24px",
          display: "inline-block",
          transform: `scale(${scale})`,
        }}
      >
        <span
          style={{
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            color: style.color,
            lineHeight: 1.4,
          }}
        >
          {activeSegment.text}
        </span>
      </div>
    </div>
  );
};
