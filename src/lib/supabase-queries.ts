import { supabase, getServiceClient } from "./supabase";

// ===== VIDEOS =====

export async function getVideos() {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getVideo(id: string) {
  const { data, error } = await supabase
    .from("videos")
    .select("*, hooks(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createVideo(video: {
  title: string;
  composition_type: string;
  grade?: string;
  props?: Record<string, unknown>;
  duration_seconds?: number;
}) {
  const { data, error } = await supabase
    .from("videos")
    .insert(video)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateVideo(
  id: string,
  updates: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from("videos")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteVideo(id: string) {
  const { error } = await supabase.from("videos").delete().eq("id", id);
  if (error) throw error;
}

// ===== CONTENT IDEAS =====

export async function getContentIdeas(status?: string) {
  let query = supabase
    .from("content_ideas")
    .select("*")
    .order("score", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createContentIdea(idea: {
  hook_text: string;
  hook_type: string;
  angle?: string;
  composition_suggestion?: string;
  youtube_references?: string[];
  score?: number;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from("content_ideas")
    .insert(idea)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateContentIdea(
  id: string,
  updates: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from("content_ideas")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ===== ASSETS =====

export async function getAssets(type?: string) {
  let query = supabase
    .from("assets")
    .select("*")
    .order("created_at", { ascending: false });
  if (type) query = query.eq("type", type);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createAsset(asset: {
  name: string;
  type: string;
  storage_path: string;
  public_url?: string;
  tags?: string[];
}) {
  const { data, error } = await supabase
    .from("assets")
    .insert(asset)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function uploadAsset(file: File, folder: string = "assets") {
  const ext = file.name.split(".").pop();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("content-assets")
    .upload(path, file);
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from("content-assets")
    .getPublicUrl(path);

  return { path, publicUrl: urlData.publicUrl };
}

// ===== HOOKS =====

export async function getHooksForVideo(videoId: string) {
  const { data, error } = await supabase
    .from("hooks")
    .select("*")
    .eq("video_id", videoId)
    .order("score", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createHook(hook: {
  video_id?: string;
  idea_id?: string;
  hook_text: string;
  hook_type: string;
  score?: number;
}) {
  const { data, error } = await supabase
    .from("hooks")
    .insert(hook)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function selectHook(id: string) {
  const { data, error } = await supabase
    .from("hooks")
    .update({ selected: true })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
