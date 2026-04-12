import { NextRequest, NextResponse } from "next/server";
import { getVideos, createVideo, updateVideo, deleteVideo } from "@/lib/supabase-queries";

export async function GET() {
  try {
    const videos = await getVideos();
    return NextResponse.json(videos);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch videos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const video = await createVideo(body);
    return NextResponse.json(video, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create video";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const video = await updateVideo(id, updates);
    return NextResponse.json(video);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update video";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await deleteVideo(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete video";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
