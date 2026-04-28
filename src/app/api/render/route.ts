import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/supabase/auth-helpers'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  // 1. Auth guard
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  const { user, profile } = auth

  // 2. Parse body
  let body: { projectId?: string; compositionId?: string; outputFormat?: string; quality?: string; props?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { projectId, compositionId = 'VideoEditor', outputFormat = 'mp4', quality = 'standard', props = {} } = body

  // 3. Verificar créditos / suscripción
  const admin = createAdminClient()

  const isAdmin = profile?.rol === 'admin'

  if (!isAdmin) {
    const { data: subscription } = await admin
      .from('video_editor_subscriptions')
      .select('renders_used, renders_limit')
      .eq('user_id', user.id)
      .single()

    if (subscription && subscription.renders_used >= subscription.renders_limit) {
      return NextResponse.json(
        { error: 'Límite de renders alcanzado. Actualiza tu plan.' },
        { status: 403 }
      )
    }

    // Incrementar contador
    if (subscription) {
      await admin
        .from('video_editor_subscriptions')
        .update({ renders_used: subscription.renders_used + 1 })
        .eq('user_id', user.id)
    }
  }

  // 4. Crear registro de render en DB
  const { data: renderJob, error: renderError } = await admin
    .from('video_renders')
    .insert({
      user_id: user.id,
      empresa_id: profile?.empresa_id ?? null,
      project_id: projectId ?? null,
      composition_id: compositionId,
      status: 'queued',
      props: { ...props, outputFormat, quality },
    })
    .select()
    .single()

  if (renderError) {
    console.error('Error creando render job:', renderError.message)
    return NextResponse.json({ error: 'Error creando render job' }, { status: 500 })
  }

  // 5. Log — no bloquear si admin_logs no existe aún
  try {
    await admin.from('admin_logs').insert({
      level: 'info',
      source: 'api/render',
      message: `Render iniciado: ${compositionId}`,
      user_id: user.id,
      empresa_id: profile?.empresa_id ?? null,
      context: { render_id: renderJob.id, composition_id: compositionId, project_id: projectId },
    })
  } catch {
    // ignore
  }

  return NextResponse.json(
    {
      success: true,
      renderId: renderJob.id,
      jobId: renderJob.id,
      status: 'queued',
      message: 'Render en cola. Revisa el estado en tu dashboard.',
    },
    { status: 202 }
  )
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.error

  const { user } = auth
  const renderId = req.nextUrl.searchParams.get('id')

  if (!renderId) {
    return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: render, error } = await admin
    .from('video_renders')
    .select('*')
    .eq('id', renderId)
    .eq('user_id', user.id)
    .single()

  if (error || !render) {
    return NextResponse.json({ error: 'Render no encontrado' }, { status: 404 })
  }

  return NextResponse.json(render)
}
