import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import type { CaptionSegment, CaptionWord } from "./types";
import { secondsToFrames } from "./utils";

function getOpenAIClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

interface WhisperSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

interface WhisperWord {
  word: string;
  start: number;
  end: number;
}

interface WhisperVerboseResponse {
  task: string;
  language: string;
  duration: number;
  text: string;
  segments: WhisperSegment[];
  words?: WhisperWord[];
}

/**
 * Transcribe an audio/video file using OpenAI Whisper API.
 * Returns timestamped caption segments ready for use in the editor.
 */
export async function transcribeFile(
  file: File,
  fps: number = 30,
  language?: string
): Promise<{
  segments: CaptionSegment[];
  fullText: string;
  language: string;
  duration: number;
}> {
  const openai = getOpenAIClient();
  const response = (await openai.audio.transcriptions.create({
    file: file,
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["segment", "word"],
    ...(language ? { language } : {}),
  })) as unknown as WhisperVerboseResponse;

  const segments: CaptionSegment[] = response.segments.map((seg) => {
    const segmentWords: CaptionWord[] = (response.words ?? [])
      .filter((w) => w.start >= seg.start && w.end <= seg.end)
      .map((w) => ({
        word: w.word.trim(),
        startTime: w.start,
        endTime: w.end,
      }));

    return {
      id: uuidv4(),
      text: seg.text.trim(),
      startTime: seg.start,
      endTime: seg.end,
      startFrame: secondsToFrames(seg.start, fps),
      endFrame: secondsToFrames(seg.end, fps),
      words: segmentWords,
    };
  });

  return {
    segments,
    fullText: response.text,
    language: response.language,
    duration: response.duration,
  };
}

/**
 * Split long caption segments into shorter chunks for better readability.
 * Aims for segments of approximately maxWordsPerLine words.
 */
export function splitLongSegments(
  segments: CaptionSegment[],
  maxWordsPerLine: number = 8,
  fps: number = 30
): CaptionSegment[] {
  const result: CaptionSegment[] = [];

  for (const segment of segments) {
    const words = segment.text.split(/\s+/);
    if (words.length <= maxWordsPerLine) {
      result.push(segment);
      continue;
    }

    const chunks: string[][] = [];
    for (let i = 0; i < words.length; i += maxWordsPerLine) {
      chunks.push(words.slice(i, i + maxWordsPerLine));
    }

    const totalDuration = segment.endTime - segment.startTime;
    const chunkDuration = totalDuration / chunks.length;

    chunks.forEach((chunk, index) => {
      const startTime = segment.startTime + index * chunkDuration;
      const endTime = startTime + chunkDuration;
      result.push({
        id: uuidv4(),
        text: chunk.join(" "),
        startTime,
        endTime,
        startFrame: secondsToFrames(startTime, fps),
        endFrame: secondsToFrames(endTime, fps),
        words: chunk.map((word, wi) => {
          const wordDuration = chunkDuration / chunk.length;
          return {
            word,
            startTime: startTime + wi * wordDuration,
            endTime: startTime + (wi + 1) * wordDuration,
          };
        }),
      });
    });
  }

  return result;
}
