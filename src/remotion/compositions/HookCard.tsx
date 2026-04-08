import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  AbsoluteFill,
} from "remotion";

interface HookCardProps extends Record<string, unknown> {
  backgroundType: "gradient" | "image" | "solid";
  backgroundColor?: string;
  backgroundImage?: string;
  hookHeadline: string;
  hookSubtitle?: string;
  stat?: string;
  statLabel?: string;
  accentColor: string;
}

export const HookCard: React.FC<HookCardProps> = ({
  backgroundType,
  backgroundColor,
  backgroundImage,
  hookHeadline,
  hookSubtitle,
  stat,
  statLabel,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Headline spring animation
  const headlineSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100, mass: 0.9 },
  });
  const headlineScale = interpolate(headlineSpring, [0, 1], [0.6, 1]);
  const headlineOpacity = interpolate(headlineSpring, [0, 1], [0, 1]);

  // Subtitle slides in from bottom after headline settles (~frame 20)
  const subtitleSpring = spring({
    frame: frame - 20,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.8 },
  });
  const subtitleTranslateY = interpolate(subtitleSpring, [0, 1], [60, 0]);
  const subtitleOpacity = interpolate(subtitleSpring, [0, 1], [0, 1]);

  // Stat badge spring (appears at frame 30)
  const statSpring = spring({
    frame: frame - 30,
    fps,
    config: { damping: 12, stiffness: 150, mass: 0.7 },
  });
  const statScale = interpolate(statSpring, [0, 1], [0.5, 1]);
  const statOpacity = interpolate(statSpring, [0, 1], [0, 1]);

  // Ambient background animation: gentle gradient shift
  const gradientAngle = interpolate(frame, [0, 450], [135, 195]);
  const pulseScale = interpolate(
    Math.sin((frame / fps) * 0.8),
    [-1, 1],
    [1, 1.02]
  );

  // Compute background style
  const getBackgroundStyle = (): React.CSSProperties => {
    switch (backgroundType) {
      case "gradient":
        return {
          background: `linear-gradient(${gradientAngle}deg, #0f0c29, #302b63, #24243e)`,
        };
      case "solid":
        return {
          backgroundColor: backgroundColor ?? "#0f0c29",
        };
      case "image":
        return {
          backgroundColor: "#0f0c29",
          backgroundImage: backgroundImage
            ? `url(${backgroundImage})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        };
      default:
        return {
          background: `linear-gradient(${gradientAngle}deg, #0f0c29, #302b63, #24243e)`,
        };
    }
  };

  return (
    <AbsoluteFill
      style={{
        ...getBackgroundStyle(),
        transform: `scale(${pulseScale})`,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
      }}
    >
      {/* Ambient overlay for depth */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.05) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      {/* Stat badge - top right */}
      {stat && (
        <div
          style={{
            position: "absolute",
            top: 80,
            right: 60,
            opacity: statOpacity,
            transform: `scale(${statScale})`,
            zIndex: 5,
          }}
        >
          <div
            style={{
              backgroundColor: accentColor,
              borderRadius: 16,
              padding: "16px 28px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              boxShadow: `0 8px 32px ${accentColor}40`,
            }}
          >
            <span
              style={{
                fontSize: 48,
                fontWeight: 900,
                color: "#ffffff",
                lineHeight: 1,
              }}
            >
              {stat}
            </span>
            {statLabel && (
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.85)",
                  marginTop: 4,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                }}
              >
                {statLabel}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Center content area */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
          zIndex: 3,
        }}
      >
        {/* Headline */}
        <div
          style={{
            fontSize: 76,
            fontWeight: 900,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.15,
            letterSpacing: -1,
            transform: `scale(${headlineScale})`,
            opacity: headlineOpacity,
            textShadow: "0 4px 24px rgba(0,0,0,0.4)",
            maxWidth: 900,
          }}
        >
          {hookHeadline}
        </div>

        {/* Subtitle */}
        {hookSubtitle && (
          <div
            style={{
              fontSize: 32,
              fontWeight: 500,
              color: "rgba(255, 255, 255, 0.75)",
              textAlign: "center",
              marginTop: 28,
              lineHeight: 1.4,
              maxWidth: 780,
              opacity: subtitleOpacity,
              transform: `translateY(${subtitleTranslateY}px)`,
            }}
          >
            {hookSubtitle}
          </div>
        )}
      </div>

      {/* Bottom accent line */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: "50%",
          transform: "translateX(-50%)",
          width: interpolate(headlineSpring, [0, 1], [0, 200]),
          height: 4,
          backgroundColor: accentColor,
          borderRadius: 2,
          boxShadow: `0 0 20px ${accentColor}60`,
        }}
      />
    </AbsoluteFill>
  );
};
