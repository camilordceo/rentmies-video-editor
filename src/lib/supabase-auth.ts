/**
 * Cliente de autenticación del BROWSER.
 * USA createBrowserClient de @supabase/ssr — esto es crítico:
 * guarda la sesión en cookies además de localStorage, lo que
 * permite que el middleware del servidor pueda leer la sesión.
 *
 * NO usar createClient de @supabase/supabase-js aquí — ese cliente
 * solo guarda en localStorage y el middleware nunca lo ve.
 */
import { createBrowserClient } from '@supabase/ssr'

function getAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase env vars not set')
  // createBrowserClient sincroniza la sesión en cookies automáticamente
  return createBrowserClient(url, key)
}

export async function signInWithPassword(email: string, password: string) {
  return getAuthClient().auth.signInWithPassword({ email, password })
}

export async function signUp(email: string, password: string, nombre?: string) {
  return getAuthClient().auth.signUp({
    email,
    password,
    options: {
      data: { nombre: nombre || email.split('@')[0] },
    },
  })
}

export async function signOut() {
  return getAuthClient().auth.signOut()
}

export async function getSession() {
  return getAuthClient().auth.getSession()
}

export async function getUser() {
  return getAuthClient().auth.getUser()
}

export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  return getAuthClient().auth.onAuthStateChange(callback)
}

export async function getProfile(userId: string) {
  const { data, error } = await getAuthClient()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) return null
  return data
}
