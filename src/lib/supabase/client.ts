import { createBrowserClient } from '@supabase/ssr'

// Estos valores son inlineados en el bundle del cliente por Next.js
// a partir de next.config.js (que resuelve aliases SUPABASE_URL/...)
// Si están vacíos al runtime es porque el build no los tenía → errror
// claro mejor que 'fetch on Window: Invalid value' críptico.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      'Supabase env vars no inlineadas en el build del cliente. ' +
        'Verificá que NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY ' +
        '(o SUPABASE_URL/SUPABASE_ANON_KEY como aliases) estén en Vercel y rebuildea.'
    )
  }
  return createBrowserClient(url, key)
}
