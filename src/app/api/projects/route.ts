import { NextRequest, NextResponse } from "next/server";
import { listUserProjects, createProjectFromFields } from "@/lib/project-queries";
import { getUser } from "@/lib/supabase-auth";

export async function GET() {
  try {
    const { data: { user } } = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const projects = await listUserProjects(user.id);
    return NextResponse.json(projects);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch projects";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const project = await createProjectFromFields({ ...body, user_id: user.id });
    return NextResponse.json(project, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create project";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
