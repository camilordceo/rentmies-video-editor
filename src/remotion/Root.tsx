import React from "react";
import { Composition } from "remotion";
import { VideoEditor } from "./compositions/VideoEditor";
import { ShortVideo } from "./compositions/ShortVideo";
import { YouTubeVideo } from "./compositions/YouTubeVideo";
import { SkillBreakdown } from "./compositions/SkillBreakdown";
import { TalkingHead } from "./compositions/TalkingHead";
import { HookCard } from "./compositions/HookCard";
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
      <Composition
        id="SkillBreakdown"
        component={SkillBreakdown}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          videoSrc: "creator-footage.mp4",
          grade: "iphone" as const,
          hookText: "Here are the skills that changed everything",
          items: [
            {
              number: 1,
              command: "ffmpeg -i",
              title: "Video Transcoding",
              input: "RAW 4K",
              output: "H.265 1080p",
              category: "post-production" as const,
            },
            {
              number: 2,
              command: "whisper --model",
              title: "Auto Captions",
              input: "Audio",
              output: "SRT + VTT",
              category: "post-production" as const,
            },
            {
              number: 3,
              command: "claude --prompt",
              title: "Script Generation",
              input: "Topic brief",
              output: "Full script",
              category: "pre-production" as const,
            },
          ],
          accentColor: "#58a6ff",
        }}
      />
      <Composition
        id="TalkingHead"
        component={TalkingHead}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          videoSrc: "talking-head.mp4",
          grade: "iphone" as const,
          captions: [
            {
              id: "cap-1",
              text: "Welcome to the channel",
              startFrame: 0,
              endFrame: 60,
              words: [
                { word: "Welcome", startTime: 0, endTime: 0.5 },
                { word: "to", startTime: 0.5, endTime: 0.7 },
                { word: "the", startTime: 0.7, endTime: 0.9 },
                { word: "channel", startTime: 0.9, endTime: 1.5 },
              ],
            },
          ],
          overlays: [
            {
              imageSrc: "screenshot-demo.png",
              startSecond: 5,
              endSecond: 10,
              label: "Product Demo",
              position: "top-center" as const,
            },
          ],
          lowerThirds: [
            {
              line1: "John Doe",
              line2: "Software Engineer",
              startSecond: 1,
              endSecond: 5,
            },
          ],
          hookText: "Stop scrolling. Watch this.",
          outroText: "Like and subscribe for more",
          accentColor: "#ff6b6b",
        }}
      />
      <Composition
        id="HookCard"
        component={HookCard}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          backgroundType: "gradient" as const,
          hookHeadline: "The AI Tool That Changes Everything",
          hookSubtitle: "Most creators don't know about this yet",
          stat: "10x",
          statLabel: "faster editing",
          accentColor: "#7c3aed",
        }}
      />
    </>
  );
};
