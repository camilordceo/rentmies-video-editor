import { NextRequest, NextResponse } from "next/server";
import { generateHooks } from "@/lib/ai-provider";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }
    const { topic, count } = await request.json();
    if (!topic) return NextResponse.json({ error: "topic required" }, { status: 400 });
    const hooks = await generateHooks(topic, count || 5);
    return NextResponse.json({ hooks });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Hook generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
