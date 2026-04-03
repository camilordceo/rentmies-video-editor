import React from "react";
import { Composition } from "remotion";
import { VideoEditor } from "./compositions/VideoEditor";
import { ShortVideo } from "./compositions/ShortVideo";
import { YouTubeVideo } from "./compositions/YouTubeVideo";
import { TEMPLATES } from "@/lib/templates";
import { getTotalDurationFrames } from "@/lib/utils";

const youtubeTemplate = TEMPLATES.find((t) => t.id === "youtube-standard")!;
const shortsTemplate = TEMPLATES.find((t) => t.id === "youtube-shorts")!;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VideoEditor"
        component={VideoEditor}
        durationInFrames={getTotalDurationFrames(youtubeTemplate.scenes)}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          scenes: youtubeTemplate.scenes,
        }}
      />
      <Composition
        id="ShortVideo"
        component={ShortVideo}
        durationInFrames={getTotalDurationFrames(shortsTemplate.scenes)}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          scenes: shortsTemplate.scenes,
        }}
      />
      <Composition
        id="YouTubeVideo"
        component={YouTubeVideo}
        durationInFrames={getTotalDurationFrames(youtubeTemplate.scenes)}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          scenes: youtubeTemplate.scenes,
        }}
      />
    </>
  );
};
