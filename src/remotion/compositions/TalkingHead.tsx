import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  AbsoluteFill,
} from "remotion";
import { applyiPhoneGrade, type ColorGrade } from "@/lib/color-grades";

interface CaptionEntry {
  id: string;
  text: string;
  startFrame: number;
  endFrame: number;
  words: Array<{ word: string; startTime: number; endTime: number }>;
}

interface OverlayEntry {
  imageSrc: string;
  startSecond: number;
  endSecond: number;
  label: string;
  position: "top-center" | "bottom-center" | "top-right";
}

interface LowerThirdEntry {
  line1: string;
  line2: string;
  startSecond: number;
  endSecond: number;
}

interface TalkingHeadProps extends Record<string, unknown> {
  videoSrc: string;
  grade: ColorGrade;
  captions: CaptionEntry[];
  overlays: OverlayEntry[];
  lowerThirds: LowerThirdEntry[];
  hookText?: string;
  outroText?: string;
  accentColor: string;
}

/** Returns overlay position styles based on placement key */
function getOverlayPosition(position: OverlayEntry["position"]): React.CSSProperties {
  switch (position) {
    case "top-center":
      return { top: 60, left: "50%", transform: "translateX(-50%)" };
    case "bottom-center":
      return { bottom: 180, left: "50%", transform: "translateX(-50%)" };
    case "top-right":
      return { top: 60, right: 40 };
    default:
      return { top: 60, left: "50%", transform: "translateX(-50%)" };
  }
}

const WordByWordCaption: React.FC<{
  caption: CaptionEntry;
  accentColor: string;
  fps: number;
}> = ({ caption, accentColor, fps }) => {
  const frame = useCurrentFrame();
  const currentSecond = frame / fps;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 80,
        left: 40,
        right: 40,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 6,
        zIndex: 10,
      }}
    >
      {caption.words.map((w, i) => {
        const isActive =
          currentSecond >= w.startTime && currentSecond < w.endTime;
        return (
          <span
            key={i}
            style={{
              fontSize: 42,
              fontWeight: 800,
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              color: isActive ? accentColor : "#ffffff",
              textShadow: "0 2px 8px rgba(0,0,0,0.7)",
              padding: "2px 4px",
              backgroundColor: isActive
                ? "rgba(0,0,0,0.6)"
                : "transparent",
              borderRadius: 4,
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
};

const ScreenshotOverlay: React.FC<{
  overlay: OverlayEntry;
  fps: number;
}> = ({ overlay, fps }) => {
  const frame = useCurrentFrame();
  const startFrame = overlay.startSecond * fps;
  const endFrame = overlay.endSecond * fps;
  const duration = endFrame - startFrame;

  // Slide-in during first 15 frames, slide-out during last 15 frames
  const slideIn = interpolate(frame - startFrame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const slideOut = interpolate(
    frame - startFrame,
    [duration - 15, duration],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  const progress = Math.min(slideIn, slideOut);
  const translateY = interpolate(progress, [0, 1], [40, 0]);

  if (frame < startFrame || frame > endFrame) return null;

  const positionStyle = getOverlayPosition(overlay.position);

  return (
    <div
      style={{
        position: "absolute",
        ...positionStyle,
        opacity: progress,
        transform: `${positionStyle.transform ?? ""} translateY(${translateY}px)`.trim(),
        zIndex: 8,
      }}
    >
      {/* Screenshot placeholder */}
      <div
        style={{
          width: 480,
          height: 300,
          backgroundColor: "#1e293b",
          borderRadius: 12,
          border: "2px solid rgba(255,255,255,0.15)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 8,
          overflow: "hidden",
        }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#64748b"
          strokeWidth="1.5"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span style={{ color: "#64748b", fontSize: 12, fontFamily: "monospace" }}>
          {overlay.imageSrc}
        </span>
      </div>
      {/* Label */}
      <div
        style={{
          marginTop: 8,
          textAlign: "center",
          fontSize: 16,
          fontWeight: 600,
          color: "#ffffff",
          textShadow: "0 1px 4px rgba(0,0,0,0.6)",
        }}
      >
        {overlay.label}
      </div>
    </div>
  );
};

const LowerThird: React.FC<{
  entry: LowerThirdEntry;
  accentColor: string;
  fps: number;
}> = ({ entry, accentColor, fps }) => {
  const frame = useCurrentFrame();
  const startFrame = entry.startSecond * fps;
  const endFrame = entry.endSecond * fps;

  if (frame < startFrame || frame > endFrame) return null;

  const localFrame = frame - startFrame;
  const duration = endFrame - startFrame;

  const slideIn = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const slideOut = interpolate(localFrame, [duration - 12, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const progress = Math.min(slideIn, slideOut);
  const translateX = interpolate(progress, [0, 1], [-300, 0]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 180,
        left: 0,
        opacity: progress,
        transform: `translateX(${translateX}px)`,
        display: "flex",
        flexDirection: "row",
        zIndex: 9,
      }}
    >
      {/* Accent bar */}
      <div
        style={{
          width: 6,
          backgroundColor: accentColor,
          borderRadius: "0 4px 4px 0",
        }}
      />
      {/* Text content */}
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          padding: "14px 28px 14px 20px",
          borderRadius: "0 8px 8px 0",
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#ffffff",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            lineHeight: 1.2,
          }}
        >
          {entry.line1}
        </div>
        {entry.line2 && (
          <div
            style={{
              fontSize: 18,
              fontWeight: 400,
              color: "#a0aec0",
              marginTop: 4,
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            {entry.line2}
          </div>
        )}
      </div>
    </div>
  );
};

export const TalkingHead: React.FC<TalkingHeadProps> = ({
  videoSrc,
  grade,
  captions,
  overlays,
  lowerThirds,
  hookText,
  outroText,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const hookEndFrame = 3 * fps; // first 3 seconds
  const outroStartFrame = durationInFrames - 3 * fps;

  // Zoom punch: every 5 seconds, 15-frame burst of scale(1.05)
  const secondsCycle = (frame % (5 * fps)) / fps;
  const inPunchWindow = secondsCycle < 15 / fps;
  const punchProgress = inPunchWindow
    ? interpolate(
        frame % (5 * fps),
        [0, 7, 15],
        [1, 1.05, 1],
        { extrapolateRight: "clamp" }
      )
    : 1;

  // Current active caption
  const activeCaption = captions.find(
    (c) => frame >= c.startFrame && frame <= c.endFrame
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
      }}
    >
      {/* Main video layer with color grade and zoom punch */}
      <div
        style={applyiPhoneGrade(
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            transform: `scale(${punchProgress})`,
            transformOrigin: "center center",
          },
          grade
        )}
      >
        {/* Video placeholder */}
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "#1a1a2e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4a4a6a"
            strokeWidth="1.5"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span
            style={{
              color: "#4a4a6a",
              fontSize: 16,
              fontFamily: "monospace",
            }}
          >
            {videoSrc}
          </span>
        </div>
      </div>

      {/* Word-by-word captions */}
      {activeCaption && (
        <WordByWordCaption
          caption={activeCaption}
          accentColor={accentColor}
          fps={fps}
        />
      )}

      {/* Screenshot overlays */}
      {overlays.map((overlay, index) => (
        <ScreenshotOverlay key={index} overlay={overlay} fps={fps} />
      ))}

      {/* Lower thirds */}
      {lowerThirds.map((entry, index) => (
        <LowerThird
          key={index}
          entry={entry}
          accentColor={accentColor}
          fps={fps}
        />
      ))}

      {/* Hook text - first 3 seconds */}
      {hookText && frame < hookEndFrame && (
        <Sequence from={0} durationInFrames={hookEndFrame}>
          <HookOverlay
            text={hookText}
            accentColor={accentColor}
            fps={fps}
          />
        </Sequence>
      )}

      {/* Outro text - last 3 seconds */}
      {outroText && frame >= outroStartFrame && (
        <Sequence from={outroStartFrame} durationInFrames={3 * fps}>
          <OutroOverlay text={outroText} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

const HookOverlay: React.FC<{
  text: string;
  accentColor: string;
  fps: number;
}> = ({ text, accentColor, fps }) => {
  const frame = useCurrentFrame();

  const scaleSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.8 },
  });

  const scale = interpolate(scaleSpring, [0, 1], [0.5, 1]);
  const opacity = interpolate(scaleSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        zIndex: 20,
      }}
    >
      <div
        style={{
          fontSize: 64,
          fontWeight: 900,
          color: "#ffffff",
          textAlign: "center",
          maxWidth: "80%",
          lineHeight: 1.2,
          textShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 40px ${accentColor}30`,
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

const OutroOverlay: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        zIndex: 20,
      }}
    >
      <div
        style={{
          fontSize: 48,
          fontWeight: 700,
          color: "#ffffff",
          textAlign: "center",
          maxWidth: "80%",
          lineHeight: 1.3,
          opacity,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
