import React from "react";
import { AbsoluteFill } from "remotion";
import type { Scene } from "@/lib/types";
import { VideoEditor } from "./VideoEditor";

interface ShortVideoProps {
  scenes: Scene[];
}

/**
 * 9:16 vertical composition wrapper for YouTube Shorts / TikTok / Reels.
 * The composition is registered at 1080x1920 in Root.tsx.
 */
export const ShortVideo: React.FC<ShortVideoProps> = ({ scenes }) => {
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
