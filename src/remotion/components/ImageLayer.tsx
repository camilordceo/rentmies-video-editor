import React from "react";
import {
  useCurrentFrame,
  interpolate,
  Img,
} from "remotion";
import type { MediaElement } from "@/lib/types";

interface ImageLayerProps {
  element: MediaElement;
}

export const ImageLayer: React.FC<ImageLayerProps> = ({ element }) => {
  const frame = useCurrentFrame();

  const localFrame = frame - element.startFrame;
  if (localFrame < 0 || localFrame >= element.durationFrames) return null;

  const fadeInDuration = 10;
  const fadeOutStart = element.durationFrames - 10;

  let opacity = element.opacity;
  if (localFrame < fadeInDuration) {
    opacity =
      element.opacity *
      interpolate(localFrame, [0, fadeInDuration], [0, 1], {
        extrapolateRight: "clamp",
      });
  } else if (localFrame > fadeOutStart) {
    opacity =
      element.opacity *
      interpolate(localFrame, [fadeOutStart, element.durationFrames], [1, 0], {
        extrapolateRight: "clamp",
      });
  }

  return (
    <div
      style={{
        position: "absolute",
        left: `${element.position.x}%`,
        top: `${element.position.y}%`,
        width: `${element.size.width}%`,
        height: `${element.size.height}%`,
        opacity,
        overflow: "hidden",
      }}
    >
      <Img
        src={element.src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: element.fit,
        }}
      />
    </div>
  );
};
