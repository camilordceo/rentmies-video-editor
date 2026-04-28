/**
 * Upload helpers para el navegador. Usa el browser client de @supabase/ssr
 * (mismo singleton que supabase-auth) para que la sesión sea compartida
 * y RLS reconozca al usuario.
 */
import { createClient } from './supabase/client'

export async function uploadMediaToSupabase(
  file: File,
  userId?: string
): Promise<{ path: string; publicUrl: string }> {
  const supabase = createClient()
  const ext = file.name.split('.').pop() || 'bin'
  const folder = userId || 'anonymous'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const path = `media/${folder}/${filename}`

  const { error: uploadError } = await supabase.storage
    .from('content-assets')
    .upload(path, file, { contentType: file.type })

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

  const { data: urlData } = supabase.storage
    .from('content-assets')
    .getPublicUrl(path)

  return { path, publicUrl: urlData.publicUrl }
}

export function getFileType(file: File): 'video' | 'image' | 'audio' {
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  return 'image'
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
