/**
 * Format seconds into MM:SS display string.
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format frame number into timecode string at given FPS.
 */
export function formatFrameAsTime(frame: number, fps: number): string {
  const totalSeconds = frame / fps;
  return formatTime(totalSeconds);
}

/**
 * Convert seconds to frame number at given FPS.
 */
export function secondsToFrames(seconds: number, fps: number): number {
  return Math.round(seconds * fps);
}

/**
 * Convert frame number to seconds at given FPS.
 */
export function framesToSeconds(frames: number, fps: number): number {
  return frames / fps;
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate a CSS color string with opacity.
 */
export function colorWithOpacity(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Lerp between two values.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/**
 * Ease-in-out cubic interpolation.
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Calculate total duration in frames across all scenes.
 */
export function getTotalDurationFrames(
  scenes: { durationFrames: number }[]
): number {
  return scenes.reduce((total, scene) => total + scene.durationFrames, 0);
}

/**
 * Get the scene index and local frame for a given global frame.
 */
export function getSceneAtFrame(
  scenes: { durationFrames: number }[],
  globalFrame: number
): { sceneIndex: number; localFrame: number } {
  let accumulated = 0;
  for (let i = 0; i < scenes.length; i++) {
    if (globalFrame < accumulated + scenes[i].durationFrames) {
      return { sceneIndex: i, localFrame: globalFrame - accumulated };
    }
    accumulated += scenes[i].durationFrames;
  }
  const lastIndex = scenes.length - 1;
  return {
    sceneIndex: lastIndex,
    localFrame: scenes[lastIndex]?.durationFrames ?? 0,
  };
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Format file size in human-readable form.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
