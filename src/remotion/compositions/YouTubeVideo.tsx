import React from "react";
import { AbsoluteFill } from "remotion";
import type { Scene } from "@/lib/types";
import { VideoEditor } from "./VideoEditor";

interface YouTubeVideoProps extends Record<string, unknown> {
  scenes: Scene[];
}

/**
 * 16:9 landscape composition wrapper for standard YouTube videos.
 * The composition is registered at 1920x1080 in Root.tsx.
 */
export const YouTubeVideo: React.FC<YouTubeVideoProps> = ({ scenes }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
      }}
    >
      <VideoEditor scenes={scenes} />
    </AbsoluteFill>
  );
};
