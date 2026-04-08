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

interface SkillBreakdownItem {
  number: number;
  command: string;
  title: string;
  input: string;
  output: string;
  category?: "pre-production" | "post-production";
}

interface SkillBreakdownProps extends Record<string, unknown> {
  videoSrc: string;
  grade: ColorGrade;
  hookText: string;
  items: SkillBreakdownItem[];
  accentColor: string;
}

const TerminalItem: React.FC<{
  item: SkillBreakdownItem;
  index: number;
  accentColor: string;
  fps: number;
  frame: number;
}> = ({ item, index, accentColor, fps, frame }) => {
  const staggerDelay = index * 6;
  const itemSpring = spring({
    frame: frame - staggerDelay,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.8 },
  });

  const opacity = interpolate(itemSpring, [0, 1], [0, 1]);
  const translateY = interpolate(itemSpring, [0, 1], [20, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "10px 16px",
        borderBottom: "1px solid #1b2330",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 14,
            color: "#6e7681",
            fontWeight: 700,
            minWidth: 24,
          }}
        >
          {String(item.number).padStart(2, "0")}
        </span>
        <span
          style={{
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            fontSize: 16,
            color: accentColor,
            fontWeight: 600,
          }}
        >
          {item.command}
        </span>
        {item.category && (
          <span
            style={{
              fontSize: 10,
              color: "#8b949e",
              backgroundColor: "#161b22",
              padding: "2px 8px",
              borderRadius: 4,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {item.category}
          </span>
        )}
      </div>
      <div style={{ paddingLeft: 34 }}>
        <div
          style={{
            fontSize: 15,
            color: "#e6edf3",
            fontWeight: 500,
            marginBottom: 2,
          }}
        >
          {item.title}
        </div>
        <div style={{ fontSize: 13, color: "#8b949e" }}>
          {item.input}{" "}
          <span style={{ color: accentColor, margin: "0 4px" }}>→</span>{" "}
          {item.output}
        </div>
      </div>
    </div>
  );
};

export const SkillBreakdown: React.FC<SkillBreakdownProps> = ({
  videoSrc,
  grade,
  hookText,
  items,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Video fade-in over first 15 frames
  const videoOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Hook text word-by-word animation
  const words = hookText.split(" ");
  const wordDuration = 4; // frames per word
  const activeWordIndex = Math.floor(frame / wordDuration);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
      }}
    >
      {/* Top Panel: Terminal-style items list */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "40%",
          backgroundColor: "#0d1117",
          borderBottom: "2px solid #30363d",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          zIndex: 2,
        }}
      >
        {/* Terminal header bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 20px",
            backgroundColor: "#161b22",
            borderBottom: "1px solid #30363d",
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#ff5f57",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#febc2e",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#28c840",
            }}
          />
          <span
            style={{
              marginLeft: 12,
              fontSize: 13,
              color: "#8b949e",
              fontFamily: "monospace",
            }}
          >
            skill-breakdown.sh
          </span>
        </div>

        {/* Items list */}
        <div
          style={{
            flex: 1,
            overflowY: "hidden",
            padding: "8px 0",
          }}
        >
          {items.map((item, index) => (
            <TerminalItem
              key={item.number}
              item={item}
              index={index}
              accentColor={accentColor}
              fps={fps}
              frame={frame}
            />
          ))}
        </div>
      </div>

      {/* Middle Zone: Hook text word-by-word */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: 0,
          right: 0,
          height: "10%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          padding: "0 40px",
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {words.map((word, index) => (
            <span
              key={index}
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: index === activeWordIndex ? accentColor : "#ffffff",
                textShadow:
                  index === activeWordIndex
                    ? `0 0 20px ${accentColor}60`
                    : "none",
                transition: "color 0.1s ease",
              }}
            >
              {word}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom 50%: Video area with color grade */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "50%",
          overflow: "hidden",
          zIndex: 1,
        }}
      >
        <div
          style={applyiPhoneGrade(
            {
              width: "100%",
              height: "100%",
              opacity: videoOpacity,
              backgroundColor: "#1a1a2e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            },
            grade
          )}
        >
          {/* Video placeholder - in production replace with <Video src={videoSrc} /> */}
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
              width="64"
              height="64"
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
                fontSize: 14,
                fontFamily: "monospace",
              }}
            >
              {videoSrc}
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
