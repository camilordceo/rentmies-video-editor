import { NextRequest, NextResponse } from "next/server";
import { getContentIdeas, createContentIdea, updateContentIdea } from "@/lib/supabase-queries";

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status") || undefined;
    const ideas = await getContentIdeas(status);
    return NextResponse.json(ideas);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch ideas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idea = await createContentIdea(body);
    return NextResponse.json(idea, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create idea";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const idea = await updateContentIdea(id, updates);
    return NextResponse.json(idea);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update idea";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
