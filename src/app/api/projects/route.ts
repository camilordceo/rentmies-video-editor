import { NextRequest, NextResponse } from "next/server";
import { listUserProjects, createProject } from "@/lib/project-queries";
import type { Project } from "@/lib/types";

export async function GET() {
  try {
    const projects = await listUserProjects();
    return NextResponse.json(projects);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch projects";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project, userId } = body as { project: Project; userId: string };
    if (!project || !userId) {
      return NextResponse.json({ error: "project and userId required" }, { status: 400 });
    }
    const created = await createProject(project, userId);
    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create project";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
