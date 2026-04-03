"use client";

import React, { useCallback, useRef } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { VideoEditor } from "@/remotion/compositions/VideoEditor";
import { useEditor } from "@/lib/store";
import { RESOLUTIONS } from "@/lib/types";
import { getTotalDurationFrames, formatFrameAsTime } from "@/lib/utils";

export default function VideoPreview() {
  const { state, dispatch } = useEditor();
  const playerRef = useRef<PlayerRef>(null);
  const { project } = state;

  const resolution = RESOLUTIONS[project.aspectRatio];
  const totalFrames = getTotalDurationFrames(project.scenes);

  const handleFrameChange = useCallback(
    (e: { detail: { frame: number } }) => {
      dispatch({ type: "SET_FRAME", frame: e.detail.frame });
    },
    [dispatch]
  );

  const handlePlay = useCallback(() => {
    dispatch({ type: "SET_PLAYING", playing: true });
  }, [dispatch]);

  const handlePause = useCallback(() => {
    dispatch({ type: "SET_PLAYING", playing: false });
  }, [dispatch]);

  // Determine container sizing to preserve aspect ratio
  const isVertical = resolution.height > resolution.width;
  const containerStyle: React.CSSProperties = isVertical
    ? { maxHeight: "100%", aspectRatio: `${resolution.width}/${resolution.height}` }
    : { maxWidth: "100%", aspectRatio: `${resolution.width}/${resolution.height}` };

  return (
    <div className="flex flex-col h-full">
      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center bg-editor-bg p-4 overflow-hidden">
        <div
          style={containerStyle}
          className="relative bg-black rounded-lg overflow-hidden shadow-2xl w-full h-full max-h-full"
        >
          {totalFrames > 0 ? (
            <Player
              ref={playerRef}
              component={VideoEditor}
              inputProps={{ scenes: project.scenes }}
              durationInFrames={Math.max(totalFrames, 1)}
              fps={project.fps}
              compositionWidth={resolution.width}
              compositionHeight={resolution.height}
              style={{
                width: "100%",
                height: "100%",
              }}
              controls={false}
              loop
              autoPlay={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-editor-text-muted">
              <p>Add a scene to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Transport Controls */}
      <div className="bg-editor-surface border-t border-editor-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playerRef.current?.seekTo(0);
                dispatch({ type: "SET_FRAME", frame: 0 });
              }}
              className="p-2 hover:bg-editor-panel rounded-lg transition-colors"
              title="Go to start"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>
            <button
              onClick={() => {
                if (state.isPlaying) {
                  playerRef.current?.pause();
                } else {
                  playerRef.current?.play();
                }
              }}
              className="p-2 px-4 bg-editor-accent hover:bg-editor-accent-hover rounded-lg transition-colors"
              title={state.isPlaying ? "Pause" : "Play"}
            >
              {state.isPlaying ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => {
                playerRef.current?.seekTo(Math.max(totalFrames - 1, 0));
                dispatch({ type: "SET_FRAME", frame: Math.max(totalFrames - 1, 0) });
              }}
              className="p-2 hover:bg-editor-panel rounded-lg transition-colors"
              title="Go to end"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-editor-text-muted">
              {formatFrameAsTime(state.currentFrame, project.fps)} /{" "}
              {formatFrameAsTime(totalFrames, project.fps)}
            </span>
            <span className="text-xs text-editor-text-muted">
              {project.aspectRatio} &middot; {project.fps}fps
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
