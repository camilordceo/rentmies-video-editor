/**
 * requireAuth(): guard estándar para API routes.
 *
 * Uso:
 *   const auth = await requireAuth()
 *   if (!auth.ok) return auth.error
 *   const { user, profile } = auth
 *
 * El discriminador `ok` permite a TS narrowing seguro:
 * cuando ok=true, user/profile/supabase están garantizados.
 */
import { createServerSupabaseClient, createAdminClient } from './server'
import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface UserProfileWithEmpresa {
  id: string
  email: string
  nombre: string | null
  rol: 'admin' | 'empresa' | 'agente' | 'user'
  empresa_id: string | null
  avatar_url: string | null
  activo: boolean
  credits_remaining: number
  plan: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  empresas: any | null
}

export interface AuthSuccess {
  ok: true
  user: { id: string; email: string }
  profile: UserProfileWithEmpresa | null
  supabase: SupabaseClient
  error: null
}

export interface AuthFailure {
  ok: false
  user: null
  profile: null
  supabase: null
  error: NextResponse
}

export type AuthResult = AuthSuccess | AuthFailure

export async function requireAuth(): Promise<AuthResult> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return {
        ok: false,
        user: null,
        profile: null,
        supabase: null,
        error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }),
      }
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('*, empresas(*)')
      .eq('id', user.id)
      .single()

    return {
      ok: true,
      user: { id: user.id, email: user.email ?? '' },
      profile: profile as UserProfileWithEmpresa | null,
      supabase: supabase as unknown as SupabaseClient,
      error: null,
    }
  } catch {
    return {
      ok: false,
      user: null,
      profile: null,
      supabase: null,
      error: NextResponse.json({ error: 'Error de autenticación' }, { status: 500 }),
    }
  }
}
