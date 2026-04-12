import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/server'
import type { Scene } from '@/lib/types'

export async function GET() {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { user } = auth
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Error cargando proyectos' }, { status: 500 })
  }

  // Mapear snake_case → camelCase para el cliente
  const projects = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    aspectRatio: row.aspect_ratio,
    fps: row.fps,
    scenes: row.scenes,
    templateId: row.template_id,
    status: row.status,
    outputUrl: row.output_url,
  }))

  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { user, profile } = auth

  let body: {
    name: string
    description?: string
    aspect_ratio: string
    fps: number
    scenes: Scene[]
    template_id?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'name requerido' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('projects')
    .insert({
      user_id: user.id,
      empresa_id: profile?.empresa_id ?? null,
      name: body.name.trim(),
      description: body.description ?? '',
      aspect_ratio: body.aspect_ratio,
      fps: body.fps,
      scenes: body.scenes,
      template_id: body.template_id ?? null,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creando proyecto:', error.message)
    return NextResponse.json({ error: 'Error creando proyecto' }, { status: 500 })
  }

  return NextResponse.json(
    {
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
    },
    { status: 201 }
  )
}
