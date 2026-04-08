import { getSupabase } from "./supabase";
import type { Project, Scene } from "./types";

export interface DBProject {
  id: string;
  user_id: string;
  name: string;
  description: string;
  aspect_ratio: string;
  fps: number;
  scenes: Scene[];
  template_id: string | null;
  status: string;
  output_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

function dbToProject(row: DBProject): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    aspectRatio: row.aspect_ratio as Project["aspectRatio"],
    fps: row.fps,
    scenes: row.scenes,
    templateId: row.template_id,
    status: row.status as Project["status"],
    outputUrl: row.output_url,
  };
}

function projectToDB(
  project: Project,
  userId: string
): Omit<DBProject, "created_at" | "updated_at"> {
  return {
    id: project.id,
    user_id: userId,
    name: project.name,
    description: project.description,
    aspect_ratio: project.aspectRatio,
    fps: project.fps,
    scenes: project.scenes,
    template_id: project.templateId,
    status: project.status,
    output_url: project.outputUrl,
    thumbnail_url: null,
  };
}

export async function listUserProjects(): Promise<Project[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as DBProject[]).map(dbToProject);
}

export async function loadProject(id: string): Promise<Project | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return dbToProject(data as DBProject);
}

export async function createProject(
  project: Project,
  userId: string
): Promise<Project> {
  const supabase = getSupabase();
  const row = projectToDB(project, userId);
  const { data, error } = await supabase
    .from("projects")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return dbToProject(data as DBProject);
}

export async function saveProject(
  id: string,
  updates: Partial<{
    name: string;
    description: string;
    scenes: Scene[];
    status: string;
    output_url: string;
    thumbnail_url: string;
  }>
): Promise<Project> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return dbToProject(data as DBProject);
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

export async function duplicateProject(
  id: string,
  userId: string
): Promise<Project> {
  const original = await loadProject(id);
  if (!original) throw new Error("Project not found");
  const copy: Project = {
    ...original,
    id: crypto.randomUUID(),
    name: `${original.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "draft",
    outputUrl: null,
  };
  return createProject(copy, userId);
}
