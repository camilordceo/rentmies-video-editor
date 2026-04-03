import React from "react";
import { useCurrentFrame, useVideoConfig, Sequence, AbsoluteFill } from "remotion";
import type { Scene } from "@/lib/types";
import { TextOverlay } from "../components/TextOverlay";
import { Caption } from "../components/Caption";
import { ImageLayer } from "../components/ImageLayer";
import { TransitionEffect } from "../components/TransitionEffect";

export interface VideoEditorProps extends Record<string, unknown> {
  scenes: Scene[];
}

const SceneRenderer: React.FC<{ scene: Scene }> = ({ scene }) => {
  return (
    <TransitionEffect
      type={scene.transition}
      durationFrames={scene.transitionDurationFrames}
      sceneDurationFrames={scene.durationFrames}
    >
      <AbsoluteFill style={{ backgroundColor: scene.backgroundColor }}>
        {/* Media layers */}
        {scene.mediaElements
          .filter((el) => el.type === "image")
          .map((el) => (
            <ImageLayer key={el.id} element={el} />
          ))}

        {/* Video layers rendered as colored rectangles in preview */}
        {scene.mediaElements
          .filter((el) => el.type === "video")
          .map((el) => (
            <div
              key={el.id}
              style={{
                position: "absolute",
                left: `${el.position.x}%`,
                top: `${el.position.y}%`,
                width: `${el.size.width}%`,
                height: `${el.size.height}%`,
                backgroundColor: "#1a1a2e",
                opacity: el.opacity,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4a4a6a" strokeWidth="1.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          ))}

        {/* Text overlays */}
        {scene.textElements.map((el) => (
          <TextOverlay key={el.id} element={el} />
        ))}

        {/* Captions */}
        {scene.captions.length > 0 && (
          <Caption segments={scene.captions} style={scene.captionStyle} />
        )}
      </AbsoluteFill>
    </TransitionEffect>
  );
};

export const VideoEditor: React.FC<VideoEditorProps> = ({ scenes }) => {
  let startFrame = 0;

  return (
    <AbsoluteFill>
      {scenes.map((scene) => {
        const from = startFrame;
        startFrame += scene.durationFrames;
        return (
          <Sequence
            key={scene.id}
            from={from}
            durationInFrames={scene.durationFrames}
          >
            <SceneRenderer scene={scene} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
