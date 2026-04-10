/**
 * UserProfile matches the existing Supabase `profiles` table schema.
 * Key columns from existing DB: nombre, rol, empresa_id, activo, metadata
 * Added by ContentOS addon: credits_remaining, plan, onboarding_completed
 */
export interface UserProfile {
  id: string;
  email: string;
  nombre: string | null;
  rol: "admin" | "empresa" | "agente" | "user";
  empresa_id: string | null;
  avatar_url: string | null;
  activo: boolean;
  metadata: Record<string, unknown>;
  // ContentOS addon columns
  credits_remaining: number;
  plan: string;
  onboarding_completed: boolean;
  created_at: string;
}

const ADMIN_EMAILS = [
  process.env.NEXT_PUBLIC_ADMIN_EMAIL,
  "camilord@rentmies.com",
].filter(Boolean);

export function isAdminUser(profile: UserProfile | null): boolean {
  if (!profile) return false;
  if (profile.rol === "admin") return true;
  if (ADMIN_EMAILS.includes(profile.email)) return true;
  if (profile.nombre?.toLowerCase() === "camilord") return true;
  return false;
}

export function hasEnoughCredits(profile: UserProfile | null, required: number = 1): boolean {
  if (!profile) return false;
  if (isAdminUser(profile)) return true;
  return (profile.credits_remaining ?? 0) >= required;
}

export function getDisplayName(profile: UserProfile | null): string {
  if (!profile) return "";
  return profile.nombre || profile.email.split("@")[0];
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
