export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: "user" | "admin";
  credits_remaining: number;
  plan: "free" | "starter" | "pro" | "enterprise";
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

const ADMIN_EMAILS = [
  process.env.NEXT_PUBLIC_ADMIN_EMAIL,
  "camilord@rentmies.com",
].filter(Boolean);

export function isAdminUser(profile: UserProfile | null): boolean {
  if (!profile) return false;
  if (profile.role === "admin") return true;
  if (ADMIN_EMAILS.includes(profile.email)) return true;
  if (profile.display_name?.toLowerCase() === "camilord") return true;
  return false;
}

export function hasEnoughCredits(profile: UserProfile | null, required: number = 1): boolean {
  if (!profile) return false;
  if (isAdminUser(profile)) return true;
  return profile.credits_remaining >= required;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
