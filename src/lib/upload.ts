/**
 * Upload helpers para Supabase Storage.
 *
 * Buckets (creados por migration 003_mvp_storage.sql):
 *   source-videos   private, hasta 500MB, mp4/webm/mov
 *   rendered-videos public, hasta 1GB, mp4
 *   thumbnails      public, hasta 5MB, jpg/png/webp
 *   assets          private, hasta 50MB, jpg/png/svg/webp
 *
 * Path convention (REQUERIDO por las RLS policies):
 *   {bucket}/{user_id}/{project_id?}/{filename}
 * El primer segmento del path debe ser el user_id — las policies
 * lo verifican vía storage.foldername(name)[1].
 */
import { createClient } from './supabase/client'

export interface UploadResult {
  path: string         // path dentro del bucket
  signedUrl: string    // URL firmada (1h por default)
  publicUrl: string    // URL pública (vacía si bucket privado)
  bucket: string
  durationSeconds?: number
}

const SOURCE_BUCKET = 'source-videos'
const ASSETS_BUCKET = 'assets'
const THUMBNAIL_BUCKET = 'thumbnails'

const MAX_VIDEO_BYTES = 500 * 1024 * 1024
const MAX_ASSET_BYTES = 50 * 1024 * 1024
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60 // 1h

const ALLOWED_VIDEO_MIME = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
])

function sanitizeFilename(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
  const base = name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  const stamp = Date.now()
  const rand = Math.random().toString(36).slice(2, 6)
  return `${stamp}-${rand}-${base || 'file'}.${ext}`
}

async function probeVideoDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file)
      const v = document.createElement('video')
      v.preload = 'metadata'
      v.muted = true
      const cleanup = () => {
        try { URL.revokeObjectURL(url) } catch { /* noop */ }
      }
      v.onloadedmetadata = () => {
        const d = isFinite(v.duration) ? v.duration : undefined
        cleanup()
        resolve(d)
      }
      v.onerror = () => { cleanup(); resolve(undefined) }
      v.src = url
    } catch {
      resolve(undefined)
    }
  })
}

export async function uploadSourceVideo(opts: {
  file: File
  userId: string
  projectId: string
}): Promise<UploadResult> {
  const { file, userId, projectId } = opts

  if (!ALLOWED_VIDEO_MIME.has(file.type)) {
    throw new Error(`Formato no soportado: ${file.type || 'desconocido'}. Usa MP4, WebM o MOV.`)
  }
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error(`El video pesa ${(file.size / 1024 / 1024).toFixed(0)}MB. Máximo 500MB.`)
  }

  const supabase = createClient()
  const filename = sanitizeFilename(file.name)
  const path = `${userId}/${projectId}/${filename}`

  const durationSeconds = await probeVideoDuration(file)

  const { error: upErr } = await supabase.storage
    .from(SOURCE_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    })

  if (upErr) throw new Error(`Error subiendo video: ${upErr.message}`)

  const { data: signed, error: signErr } = await supabase.storage
    .from(SOURCE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS)

  if (signErr || !signed?.signedUrl) {
    throw new Error(`Subida OK pero no pude firmar URL: ${signErr?.message ?? 'desconocido'}`)
  }

  const { data: pub } = supabase.storage.from(SOURCE_BUCKET).getPublicUrl(path)

  return {
    path,
    signedUrl: signed.signedUrl,
    publicUrl: pub.publicUrl,
    bucket: SOURCE_BUCKET,
    durationSeconds,
  }
}

export async function uploadAssetImage(opts: {
  file: File
  userId: string
}): Promise<UploadResult> {
  const { file, userId } = opts

  if (!file.type.startsWith('image/')) {
    throw new Error(`Esperaba imagen, recibí ${file.type || 'desconocido'}`)
  }
  if (file.size > MAX_ASSET_BYTES) {
    throw new Error(`Imagen muy grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo 50MB.`)
  }

  const supabase = createClient()
  const filename = sanitizeFilename(file.name)
  const path = `${userId}/${filename}`

  const { error: upErr } = await supabase.storage
    .from(ASSETS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (upErr) throw new Error(`Error subiendo imagen: ${upErr.message}`)

  const { data: signed } = await supabase.storage
    .from(ASSETS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS * 24)

  const { data: pub } = supabase.storage.from(ASSETS_BUCKET).getPublicUrl(path)

  return {
    path,
    signedUrl: signed?.signedUrl ?? '',
    publicUrl: pub.publicUrl,
    bucket: ASSETS_BUCKET,
  }
}

/**
 * Helper de alto nivel: rutea por tipo de archivo al bucket correcto.
 * Para videos requiere projectId; imágenes van al bucket assets.
 */
export async function uploadMedia(opts: {
  file: File
  userId: string
  projectId?: string
}): Promise<UploadResult> {
  const { file, userId, projectId } = opts

  if (file.type.startsWith('video/')) {
    if (!projectId) throw new Error('Subir videos requiere un projectId')
    return uploadSourceVideo({ file, userId, projectId })
  }

  if (file.type.startsWith('image/')) {
    return uploadAssetImage({ file, userId })
  }

  throw new Error(`Tipo de archivo no soportado: ${file.type}`)
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

export const STORAGE_BUCKETS = {
  source: SOURCE_BUCKET,
  assets: ASSETS_BUCKET,
  thumbnails: THUMBNAIL_BUCKET,
  rendered: 'rendered-videos',
} as const
