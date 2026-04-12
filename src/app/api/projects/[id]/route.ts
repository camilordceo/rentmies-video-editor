import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/server'
import type { Scene } from '@/lib/types'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { user } = auth
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    id: data.id,
    name: data.name,
    description: data.description,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    aspectRatio: data.aspect_ratio,
    fps: data.fps,
    scenes: data.scenes,
    templateId: data.template_id,
    status: data.status,
    outputUrl: data.output_url,
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { user } = auth

  let body: Partial<{
    name: string
    description: string
    scenes: Scene[]
    status: string
    output_url: string
    thumbnail_url: string
  }>

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('projects')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Error actualizando proyecto' }, { status: 500 })
  }

  return NextResponse.json({
    id: data.id,
    name: data.name,
    description: data.description,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    aspectRatio: data.aspect_ratio,
    fps: data.fps,
    scenes: data.scenes,
    templateId: data.template_id,
    status: data.status,
    outputUrl: data.output_url,
  })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { user } = auth
  const admin = createAdminClient()

  const { error } = await admin
    .from('projects')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Error eliminando proyecto' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
