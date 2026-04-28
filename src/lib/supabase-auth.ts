/**
 * Cliente del navegador para auth y queries client-side.
 *
 * SINGLETON: una sola instancia compartida en toda la app.
 * Esto es crítico: si onAuthStateChange y signInWithPassword
 * operan sobre instancias distintas, el listener no se entera
 * del login y el estado de auth queda desincronizado.
 *
 * Usa createBrowserClient de @supabase/ssr — la sesión vive en
 * cookies (no solo localStorage) para que el middleware del
 * servidor pueda leerla.
 */
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getBrowserClient(): SupabaseClient {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase env vars not set')
  _client = createBrowserClient(url, key)
  return _client
}

// ---------------------------------------------------------------------------
// Auth methods
// ---------------------------------------------------------------------------

export async function signInWithPassword(email: string, password: string) {
  return getBrowserClient().auth.signInWithPassword({ email, password })
}

export async function signUp(email: string, password: string, nombre?: string) {
  return getBrowserClient().auth.signUp({
    email,
    password,
    options: { data: { nombre: nombre || email.split('@')[0] } },
  })
}

export async function signOut() {
  return getBrowserClient().auth.signOut()
}

export async function getSession() {
  return getBrowserClient().auth.getSession()
}

export async function getUser() {
  return getBrowserClient().auth.getUser()
}

export function onAuthStateChange(
  callback: (event: string, session: unknown) => void
) {
  return getBrowserClient().auth.onAuthStateChange(callback)
}

export async function getProfile(userId: string) {
  const { data, error } = await getBrowserClient()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) return null
  return data
}
