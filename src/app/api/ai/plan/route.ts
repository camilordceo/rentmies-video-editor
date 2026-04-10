import { NextRequest, NextResponse } from "next/server";
import { generateVideoPlan } from "@/lib/ai-provider";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }
    const { prompt, aspectRatio } = await request.json();
    if (!prompt) return NextResponse.json({ error: "prompt required" }, { status: 400 });
    const plan = await generateVideoPlan(prompt, aspectRatio);
    return NextResponse.json(plan);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "AI planning failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
