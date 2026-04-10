import { NextRequest, NextResponse } from "next/server";
import { loadProject, saveProject, deleteProject } from "@/lib/project-queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await loadProject(params.id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Not found";
    return NextResponse.json({ error: msg }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const project = await saveProject(params.id, body);
    return NextResponse.json(project);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteProject(params.id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
