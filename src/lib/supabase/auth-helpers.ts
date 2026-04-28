/**
 * requireAuth(): guard estándar para API routes.
 *
 * Uso:
 *   const auth = await requireAuth()
 *   if (!auth.ok) return auth.error
 *   const { user, profile } = auth
 *
 * También auto-crea el profile si no existe (idempotente). Esto es
 * crítico porque el signup con password NO pasa por /auth/callback,
 * así que sin esto los usuarios autenticados quedarían sin profile.
 */
import { createServerSupabaseClient, createAdminClient } from './server'
import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

const RENTMIES_EMPRESA_ID = '00000000-0000-0000-0000-000000000001'

const ADMIN_EMAILS = new Set(
  [
    process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    'camilo@rentmies.com',
    'camilord@rentmies.com',
  ].filter(Boolean) as string[]
)

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureProfile(userId: string, email: string, admin: any) {
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (existing) return

  const isAdmin = ADMIN_EMAILS.has(email)
  const empresaId = isAdmin ? RENTMIES_EMPRESA_ID : null

  const baseProfile: Record<string, unknown> = {
    id: userId,
    rol: isAdmin ? 'admin' : 'user',
    empresa_id: empresaId,
    plan: isAdmin ? 'enterprise' : 'free',
    credits_remaining: isAdmin ? 999999 : 10,
    activo: true,
  }

  // Intento incluir email + nombre. Si la tabla no las tiene, reintento sin ellas.
  const profileWithEmail = {
    ...baseProfile,
    email,
    nombre: email.split('@')[0],
  }

  const { error: insertErr } = await admin.from('profiles').insert(profileWithEmail)

  if (insertErr) {
    console.error('[ensureProfile] insert error:', insertErr.message)
    // Reintento sin columnas opcionales
    const { error: retryErr } = await admin.from('profiles').insert(baseProfile)
    if (retryErr) {
      console.error('[ensureProfile] retry error:', retryErr.message)
      return
    }
  }

  // Crear suscripción del editor (idempotente — UNIQUE en user_id)
  try {
    await admin.from('video_editor_subscriptions').insert({
      user_id: userId,
      empresa_id: empresaId,
      plan: isAdmin ? 'enterprise' : 'free',
      renders_limit: isAdmin ? 999999 : 3,
      renders_used: 0,
    })
  } catch (e) {
    // duplicate key es esperado si ya existe — ignorar
    const msg = e instanceof Error ? e.message : String(e)
    if (!msg.includes('duplicate')) {
      console.error('[ensureProfile] subscription error:', msg)
    }
  }
}

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

    // Auto-crear profile si no existe — idempotente y no bloquea si falla
    try {
      await ensureProfile(user.id, user.email ?? '', admin)
    } catch (e) {
      console.error('[requireAuth] ensureProfile threw:', e)
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('*, empresas(*)')
      .eq('id', user.id)
      .maybeSingle()

    return {
      ok: true,
      user: { id: user.id, email: user.email ?? '' },
      profile: profile as UserProfileWithEmpresa | null,
      supabase: supabase as unknown as SupabaseClient,
      error: null,
    }
  } catch (e) {
    console.error('[requireAuth] unexpected error:', e)
    return {
      ok: false,
      user: null,
      profile: null,
      supabase: null,
      error: NextResponse.json({ error: 'Error de autenticación' }, { status: 500 }),
    }
  }
}
