import React from "react";
import { useCurrentFrame, useVideoConfig, Sequence, AbsoluteFill } from "remotion";
import type { Scene } from "@/lib/types";
import { TextOverlay } from "../components/TextOverlay";
import { Caption } from "../components/Caption";
import { ImageLayer } from "../components/ImageLayer";
import { VideoLayer } from "../components/VideoLayer";
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

        {/* Video layers */}
        {scene.mediaElements
          .filter((el) => el.type === "video")
          .map((el) => (
            <VideoLayer key={el.id} element={el} />
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
