import OpenAI from "openai";

function getAI(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function generateVideoPlan(prompt: string, aspectRatio?: string): Promise<{
  title: string;
  description: string;
  scenes: Array<{
    name: string;
    description: string;
    durationSeconds: number;
    textOverlays: Array<{ text: string; type: string; animation: string }>;
    transition: string;
  }>;
  suggestedComposition: string;
  hookSuggestion: string;
}> {
  const ai = getAI();
  const systemPrompt = `You are a video production planner. Given a user's description, generate a structured video plan as JSON.
The plan should follow this script structure: Hook (0-3s) → Problem (3-15s) → Solution (main content) → Proof → CTA.
Available compositions: skill-breakdown (vertical, terminal-style), talking-head (landscape, overlays), hook-card (15s vertical hook).
Available transitions: fade, slide-left, slide-right, wipe, zoom, none.
Available text animations: fade-in, slide-up, slide-down, scale-in, bounce, typewriter.
Aspect ratio: ${aspectRatio || "16:9"}.
Respond ONLY with valid JSON matching this schema:
{
  "title": "string",
  "description": "string",
  "scenes": [{ "name": "string", "description": "string", "durationSeconds": number, "textOverlays": [{"text":"string","type":"title|subtitle|cta","animation":"string"}], "transition": "string" }],
  "suggestedComposition": "skill-breakdown|talking-head|hook-card|video-editor",
  "hookSuggestion": "string (max 12 words)"
}`;

  const response = await ai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");
  return JSON.parse(content);
}

export async function generateHooks(topic: string, count: number = 5): Promise<Array<{
  text: string;
  type: string;
  score: number;
}>> {
  const ai = getAI();
  const response = await ai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `Generate ${count} video hooks for the topic. Types: stat, story, contrarian, list, question, transformation. Score each 1-10 on viral potential. Max 12 words each. Respond as JSON array: [{"text":"string","type":"string","score":number}]` },
      { role: "user", content: topic },
    ],
    temperature: 0.8,
    response_format: { type: "json_object" },
  });
  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");
  const parsed = JSON.parse(content);
  return Array.isArray(parsed) ? parsed : parsed.hooks || [];
}
