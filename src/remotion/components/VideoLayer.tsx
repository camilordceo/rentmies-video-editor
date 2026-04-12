import React from "react";
import { Video, useCurrentFrame, interpolate } from "remotion";
import type { MediaElement } from "@/lib/types";

interface VideoLayerProps {
  element: MediaElement;
}

export const VideoLayer: React.FC<VideoLayerProps> = ({ element }) => {
  const frame = useCurrentFrame();
  const localFrame = frame - element.startFrame;

  if (localFrame < 0 || localFrame >= element.durationFrames) return null;

  // Fade in/out over 10 frames
  const fadeIn = interpolate(localFrame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    localFrame,
    [element.durationFrames - 10, element.durationFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const opacity = element.opacity * Math.min(fadeIn, fadeOut);

  // Check if src is a valid URL (not a placeholder)
  const isValidSrc = element.src.startsWith("http") || element.src.startsWith("/") || element.src.startsWith("blob:");

  if (!isValidSrc) {
    // Render placeholder for non-URL sources
    return (
      <div
        style={{
          position: "absolute",
          left: `${element.position.x}%`,
          top: `${element.position.y}%`,
          width: `${element.size.width}%`,
          height: `${element.size.height}%`,
          backgroundColor: "#1a1a2e",
          opacity,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4a4a6a" strokeWidth="1.5">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        left: `${element.position.x}%`,
        top: `${element.position.y}%`,
        width: `${element.size.width}%`,
        height: `${element.size.height}%`,
        overflow: "hidden",
        opacity,
      }}
    >
      <Video
        src={element.src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: element.fit,
        }}
        volume={element.volume ?? 1}
      />
    </div>
  );
};
