import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getAuthClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  _client = createClient(url, key, {
    auth: {
      persistSession: true,
      storageKey: "sb-auth-token",
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
  });
  return _client;
}

export async function signInWithPassword(email: string, password: string) {
  return getAuthClient().auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string, nombre?: string) {
  return getAuthClient().auth.signUp({
    email,
    password,
    options: {
      data: { nombre: nombre || email.split("@")[0] },
    },
  });
}

export async function signOut() {
  return getAuthClient().auth.signOut();
}

export async function getSession() {
  return getAuthClient().auth.getSession();
}

export async function getUser() {
  return getAuthClient().auth.getUser();
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return getAuthClient().auth.onAuthStateChange(callback);
}

export async function getProfile(userId: string) {
  const { data, error } = await getAuthClient()
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data;
}
