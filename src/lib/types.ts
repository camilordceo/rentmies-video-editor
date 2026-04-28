import { z } from "zod";

export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:5";

export interface Resolution {
  width: number;
  height: number;
}

export const RESOLUTIONS: Record<AspectRatio, Resolution> = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
};

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  backgroundColor: string;
  textAlign: "left" | "center" | "right";
  lineHeight: number;
  letterSpacing: number;
  textShadow: string;
  borderRadius: number;
  padding: number;
}

export interface TextElement {
  id: string;
  type: "title" | "subtitle" | "lower-third" | "cta" | "custom";
  text: string;
  position: Position;
  size: Size;
  style: TextStyle;
  startFrame: number;
  durationFrames: number;
  animation: AnimationType;
}

export type AnimationType =
  | "none"
  | "fade-in"
  | "fade-out"
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right"
  | "scale-in"
  | "typewriter"
  | "bounce";

export interface CaptionSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  startFrame: number;
  endFrame: number;
  words: CaptionWord[];
}

export interface CaptionWord {
  word: string;
  startTime: number;
  endTime: number;
}

export interface CaptionStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  backgroundColor: string;
  position: "bottom" | "center" | "top";
  maxWidth: number;
  animation: "none" | "fade" | "pop" | "highlight-word";
}

export interface MediaElement {
  id: string;
  type: "video" | "image" | "audio";
  src: string;
  name: string;
  position: Position;
  size: Size;
  startFrame: number;
  durationFrames: number;
  opacity: number;
  fit: "cover" | "contain" | "fill";
  volume?: number;
}

export type TransitionType =
  | "none"
  | "fade"
  | "slide-left"
  | "slide-right"
  | "wipe"
  | "zoom";

export interface Scene {
  id: string;
  name: string;
  durationFrames: number;
  backgroundColor: string;
  mediaElements: MediaElement[];
  textElements: TextElement[];
  captions: CaptionSegment[];
  captionStyle: CaptionStyle;
  transition: TransitionType;
  transitionDurationFrames: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  aspectRatio: AspectRatio;
  fps: number;
  scenes: Scene[];
  templateId: string | null;
  status: "draft" | "rendering" | "completed" | "error";
  outputUrl: string | null;
  sourceVideoUrl?: string | null;
  sourceVideoPath?: string | null;
  sourceVideoDurationSeconds?: number | null;
  brand?: string | null;
  grade?: "canon" | "cinematic" | "warm" | "raw";
  transcript?: unknown;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: "youtube" | "shorts" | "marketing" | "product";
  aspectRatio: AspectRatio;
  thumbnail: string;
  fps: number;
  scenes: Scene[];
  captionStyle: CaptionStyle;
}

export interface RenderRequest {
  projectId: string;
  outputFormat: "mp4" | "webm";
  quality: "draft" | "standard" | "high";
}

export interface RenderResponse {
  jobId: string;
  status: "queued" | "rendering" | "completed" | "error";
  progress: number;
  outputUrl: string | null;
  error: string | null;
}

export interface TranscriptionRequest {
  file: File;
  language?: string;
}

export interface TranscriptionResponse {
  segments: CaptionSegment[];
  fullText: string;
  language: string;
  duration: number;
}

export type EditorTool =
  | "select"
  | "text"
  | "media"
  | "caption"
  | "ai"
  | "template"
  | "export";

export interface EditorState {
  project: Project;
  selectedSceneId: string | null;
  selectedElementId: string | null;
  selectedElementType: "text" | "media" | "caption" | null;
  currentFrame: number;
  isPlaying: boolean;
  activeTool: EditorTool;
  zoom: number;
}

// Zod schemas for API validation
export const renderRequestSchema = z.object({
  projectId: z.string().uuid(),
  outputFormat: z.enum(["mp4", "webm"]),
  quality: z.enum(["draft", "standard", "high"]),
});

export const transcriptionRequestSchema = z.object({
  language: z.string().optional(),
});
