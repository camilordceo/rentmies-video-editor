import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getAuthClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

export async function signInWithPassword(email: string, password: string) {
  const client = getAuthClient();
  return client.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string, displayName?: string) {
  const client = getAuthClient();
  return client.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName || email.split("@")[0] },
    },
  });
}

export async function signOut() {
  const client = getAuthClient();
  return client.auth.signOut();
}

export async function getSession() {
  const client = getAuthClient();
  return client.auth.getSession();
}

export async function getUser() {
  const client = getAuthClient();
  return client.auth.getUser();
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  const client = getAuthClient();
  return client.auth.onAuthStateChange(callback);
}

export async function getProfile(userId: string) {
  const client = getAuthClient();
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data;
}
