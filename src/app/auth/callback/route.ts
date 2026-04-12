import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(new URL('/auth?error=missing_code', request.url))
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !user) {
    console.error('Auth callback error:', error?.message)
    return NextResponse.redirect(new URL('/auth?error=exchange_failed', request.url))
  }

  const admin = createAdminClient()

  // Verificar si ya tiene profile
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    const isAdmin =
      user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
      user.email === 'camilord@rentmies.com'

    // Crear profile automáticamente
    await admin.from('profiles').insert({
      id: user.id,
      email: user.email!,
      nombre: user.user_metadata?.nombre ?? user.email!.split('@')[0],
      rol: isAdmin ? 'admin' : 'user',
      empresa_id: isAdmin ? '00000000-0000-0000-0000-000000000001' : null,
      activo: true,
      plan: isAdmin ? 'enterprise' : 'free',
      credits_remaining: isAdmin ? 999999 : 10,
    })

    // Crear suscripción de video editor
    await admin.from('video_editor_subscriptions').insert({
      user_id: user.id,
      empresa_id: isAdmin ? '00000000-0000-0000-0000-000000000001' : null,
      plan: isAdmin ? 'enterprise' : 'free',
      renders_limit: isAdmin ? 999999 : 3,
      renders_used: 0,
    })
  }

  return NextResponse.redirect(new URL(next, request.url))
}
