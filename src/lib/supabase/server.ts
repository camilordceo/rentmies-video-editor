import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

type CookieToSet = { name: string; value: string; options?: CookieOptions }

// Resolver aliases server-side. Soportamos:
//   URL:           NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL
//   anon key:      NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY
//   service role:  SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_KEY
function getSupabaseEnv() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    ''
  return { url, anonKey, serviceKey }
}

export async function createServerSupabaseClient() {
  const { url, anonKey } = getSupabaseEnv()
  if (!url || !anonKey) {
    throw new Error(
      'Supabase URL o ANON_KEY no configuradas. Setealas en Vercel como ' +
        'NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY o como ' +
        'SUPABASE_URL/SUPABASE_ANON_KEY.'
    )
  }
  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Llamado desde un Server Component — ignorar
        }
      },
    },
  })
}

export function createAdminClient() {
  const { url, serviceKey } = getSupabaseEnv()
  if (!url || !serviceKey) {
    throw new Error(
      'Supabase URL o SERVICE_ROLE_KEY no configuradas. Setealas en Vercel como ' +
        'SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SERVICE_KEY (acepta ambos aliases).'
    )
  }
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
