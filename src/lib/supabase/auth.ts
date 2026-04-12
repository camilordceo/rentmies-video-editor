import { createServerSupabaseClient } from './server'
import { createAdminClient } from './server'
import { NextResponse } from 'next/server'

export type AuthResult =
  | { user: null; profile: null; supabase: null; error: ReturnType<typeof NextResponse.json> }
  | { user: { id: string; email: string }; profile: UserProfileWithEmpresa | null; supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>; error: null }

interface UserProfileWithEmpresa {
  id: string
  email: string
  nombre: string | null
  rol: 'admin' | 'empresa' | 'agente' | 'user'
  empresa_id: string | null
  avatar_url: string | null
  activo: boolean
  credits_remaining: number
  plan: string
  empresas: { id: string; nombre: string; plan: string; activa: boolean } | null
}

export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return {
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
    user: { id: user.id, email: user.email! },
    profile: profile as UserProfileWithEmpresa | null,
    supabase,
    error: null,
  }
}
