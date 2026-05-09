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
 *
 * Estrategia: signed-upload-URL + XHR PUT.
 *   - createSignedUploadUrl da una URL token-bearing válida 2h.
 *   - PUT con XHR emite onprogress real (la SDK de Supabase NO).
 *   - El usuario ve %·MB·MB/s en vivo en lugar de un spinner mudo.
 *   - Timeout de 5min con abort en caso de cuelgue.
 */
import { createClient } from './supabase/client'

export interface UploadProgress {
  loaded: number
  total: number
  percent: number    // 0..100
  speedBps: number   // bytes/s
}

export interface UploadResult {
  path: string         // path dentro del bucket
  signedUrl: string    // URL firmada de lectura (1y por default)
  publicUrl: string    // URL pública (vacía si bucket privado)
  bucket: string
  durationSeconds?: number
}

const SOURCE_BUCKET = 'source-videos'
const ASSETS_BUCKET = 'assets'
const THUMBNAIL_BUCKET = 'thumbnails'

const MAX_VIDEO_BYTES = 500 * 1024 * 1024
const MAX_ASSET_BYTES = 50 * 1024 * 1024
// 1 año — la URL se persiste en projects.scenes[].mediaElements[].src y
// projects.source_video_url. Si expira, el preview se ve negro al volver
// al proyecto al día siguiente.
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60 * 24 * 365
const ASSET_SIGNED_URL_EXPIRY_SECONDS = 60 * 60 * 24 * 365
// Hard timeout para el PUT del archivo. Si el upload no avanza en
// 5min lo abortamos y mostramos error en lugar de spinner infinito.
const UPLOAD_TIMEOUT_MS = 5 * 60 * 1000

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
    let settled = false
    const finish = (d: number | undefined) => {
      if (settled) return
      settled = true
      resolve(d)
    }

    let url: string | null = null
    try {
      url = URL.createObjectURL(file)
    } catch {
      return finish(undefined)
    }

    const v = document.createElement('video')
    v.preload = 'metadata'
    v.muted = true

    const cleanup = () => {
      try { if (url) URL.revokeObjectURL(url) } catch { /* noop */ }
      try { v.removeAttribute('src'); v.load() } catch { /* noop */ }
    }

    // Timeout: si el codec no es soportado (HEVC en iPhone) onloadedmetadata
    // nunca se dispara — no bloquear el upload por esto.
    const timer = setTimeout(() => {
      cleanup()
      finish(undefined)
    }, 4000)

    v.onloadedmetadata = () => {
      clearTimeout(timer)
      const d = isFinite(v.duration) ? v.duration : undefined
      cleanup()
      finish(d)
    }

    v.onerror = () => {
      clearTimeout(timer)
      cleanup()
      finish(undefined)
    }

    v.src = url
  })
}

async function getCurrentUserId(supabase: ReturnType<typeof createClient>): Promise<string> {
  // auth.getUser() puede colgarse si el endpoint de Supabase no responde
  // (CORS, env vars mal seteadas, red). Hard timeout 8s para que el upload
  // muestre error en lugar de spinner infinito.
  const result = await Promise.race([
    supabase.auth.getUser(),
    new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(new Error(
            'Timeout (8s) verificando sesión con Supabase. Causas: env vars NEXT_PUBLIC_SUPABASE_URL/ANON_KEY no aplicadas en este deploy, o el endpoint de Supabase no responde. Probá: GET /api/diag para diagnóstico server-side.'
          )),
        8000
      )
    ),
  ])
  const { data, error } = result
  if (error || !data?.user) {
    throw new Error(`Sesión inválida: ${error?.message ?? 'sin user'} — recarga e iniciá sesión de nuevo.`)
  }
  return data.user.id
}

/**
 * PUT a una signed upload URL con progreso real vía XHR.
 * La SDK de Supabase no expone onprogress, por eso vamos por XHR directo.
 * Resuelve cuando el server respondió 2xx; rechaza con error explícito en cualquier otro caso.
 */
function putWithProgress(opts: {
  signedUrl: string
  file: File
  contentType: string
  onProgress?: (p: UploadProgress) => void
  signal?: AbortSignal
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now()
    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable || !opts.onProgress) return
      const elapsedSec = Math.max(0.001, (Date.now() - startedAt) / 1000)
      opts.onProgress({
        loaded: e.loaded,
        total: e.total,
        percent: Math.round((e.loaded / e.total) * 100),
        speedBps: e.loaded / elapsedSec,
      })
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        const body = (xhr.responseText || '').slice(0, 300)
        reject(new Error(
          `Upload falló — HTTP ${xhr.status} ${xhr.statusText || ''}${body ? ` · ${body}` : ''}`
        ))
      }
    }

    xhr.onerror = () => {
      reject(new Error(
        'Error de red durante el upload. Causas comunes: 1) Supabase Storage CORS no incluye este dominio, 2) sin internet, 3) el bucket source-videos no existe.'
      ))
    }

    xhr.ontimeout = () => {
      reject(new Error(
        `Upload timeout tras ${Math.round(UPLOAD_TIMEOUT_MS / 1000)}s. El archivo es muy grande para tu conexión o la red está cortada.`
      ))
    }

    xhr.onabort = () => {
      reject(new Error('Upload cancelado por el usuario'))
    }

    if (opts.signal) {
      if (opts.signal.aborted) {
        xhr.abort()
        return
      }
      opts.signal.addEventListener('abort', () => xhr.abort(), { once: true })
    }

    xhr.timeout = UPLOAD_TIMEOUT_MS
    xhr.open('PUT', opts.signedUrl)
    xhr.setRequestHeader('Content-Type', opts.contentType)
    xhr.setRequestHeader('x-upsert', 'true')
    xhr.send(opts.file)
  })
}

export interface UploadOptions {
  file: File
  projectId: string
  userId?: string
  onStep?: (step: string) => void
  onProgress?: (p: UploadProgress) => void
  signal?: AbortSignal
}

export async function uploadSourceVideo(opts: UploadOptions): Promise<UploadResult> {
  const { file, projectId, onStep, onProgress, signal } = opts
  const step = (s: string) => {
    console.log(`[upload] ${s}`)
    onStep?.(s)
  }

  if (!ALLOWED_VIDEO_MIME.has(file.type)) {
    throw new Error(`Formato no soportado: ${file.type || 'desconocido'}. Usa MP4, WebM o MOV.`)
  }
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error(`El video pesa ${(file.size / 1024 / 1024).toFixed(0)}MB. Máximo 500MB.`)
  }

  step('Verificando sesión…')
  const supabase = createClient()
  const userId = opts.userId ?? (await getCurrentUserId(supabase))
  console.log('[upload] userId:', userId, 'projectId:', projectId, 'fileSize:', file.size)

  const filename = sanitizeFilename(file.name)
  const path = `${userId}/${projectId}/${filename}`
  console.log('[upload] target path:', path)

  step('Leyendo metadata del video…')
  const durationSeconds = await probeVideoDuration(file)
  console.log('[upload] probed duration:', durationSeconds)

  step('Solicitando URL de subida firmada…')
  const { data: signedUpload, error: sigErr } = await supabase
    .storage
    .from(SOURCE_BUCKET)
    .createSignedUploadUrl(path)

  if (sigErr || !signedUpload?.signedUrl) {
    console.error('[upload] createSignedUploadUrl error:', sigErr)
    const msg = sigErr?.message || 'No pude obtener URL de subida'
    // Pistas comunes para errores de RLS / bucket
    if (/row-level security|RLS|policy/i.test(msg)) {
      throw new Error(
        `Permiso denegado al firmar URL — la RLS del bucket ${SOURCE_BUCKET} bloquea este path. ` +
        `Verificá que el path ${path} empiece con tu user_id y que la migración 003_mvp_storage.sql esté aplicada. (${msg})`
      )
    }
    if (/bucket.*not.*found|404/i.test(msg)) {
      throw new Error(
        `Bucket "${SOURCE_BUCKET}" no existe. Aplicá supabase/migrations/003_mvp_storage.sql en el SQL Editor.`
      )
    }
    throw new Error(`Error firmando URL de subida: ${msg}`)
  }

  step(`Subiendo 0% (0 de ${formatFileSize(file.size)})…`)
  await putWithProgress({
    signedUrl: signedUpload.signedUrl,
    file,
    contentType: file.type,
    signal,
    onProgress: (p) => {
      const speed = p.speedBps > 0 ? ` · ${formatFileSize(p.speedBps)}/s` : ''
      step(`Subiendo ${p.percent}% (${formatFileSize(p.loaded)} de ${formatFileSize(p.total)})${speed}`)
      onProgress?.(p)
    },
  })

  step('Generando URL de lectura…')
  const { data: signed, error: signErr } = await supabase
    .storage
    .from(SOURCE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS)

  if (signErr || !signed?.signedUrl) {
    throw new Error(`Subida OK pero no pude firmar URL de lectura: ${signErr?.message ?? 'desconocido'}`)
  }

  const { data: pub } = supabase.storage.from(SOURCE_BUCKET).getPublicUrl(path)

  console.log('[upload] DONE', { path, signedUrl: signed.signedUrl.slice(0, 80) + '…' })

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
  userId?: string
  onStep?: (step: string) => void
  onProgress?: (p: UploadProgress) => void
  signal?: AbortSignal
}): Promise<UploadResult> {
  const { file, onStep, onProgress, signal } = opts
  const step = (s: string) => {
    console.log(`[upload-image] ${s}`)
    onStep?.(s)
  }

  if (!file.type.startsWith('image/')) {
    throw new Error(`Esperaba imagen, recibí ${file.type || 'desconocido'}`)
  }
  if (file.size > MAX_ASSET_BYTES) {
    throw new Error(`Imagen muy grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo 50MB.`)
  }

  step('Verificando sesión…')
  const supabase = createClient()
  const userId = opts.userId ?? (await getCurrentUserId(supabase))
  const filename = sanitizeFilename(file.name)
  const path = `${userId}/${filename}`

  step('Solicitando URL de subida firmada…')
  const { data: signedUpload, error: sigErr } = await supabase
    .storage
    .from(ASSETS_BUCKET)
    .createSignedUploadUrl(path)

  if (sigErr || !signedUpload?.signedUrl) {
    throw new Error(`Error firmando URL de subida: ${sigErr?.message ?? 'desconocido'}`)
  }

  step(`Subiendo 0% (0 de ${formatFileSize(file.size)})…`)
  await putWithProgress({
    signedUrl: signedUpload.signedUrl,
    file,
    contentType: file.type,
    signal,
    onProgress: (p) => {
      step(`Subiendo ${p.percent}% (${formatFileSize(p.loaded)} de ${formatFileSize(p.total)})`)
      onProgress?.(p)
    },
  })

  const { data: signed } = await supabase.storage
    .from(ASSETS_BUCKET)
    .createSignedUrl(path, ASSET_SIGNED_URL_EXPIRY_SECONDS)

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
  projectId?: string
  userId?: string
  onStep?: (step: string) => void
  onProgress?: (p: UploadProgress) => void
  signal?: AbortSignal
}): Promise<UploadResult> {
  const { file, projectId, userId, onStep, onProgress, signal } = opts

  if (file.type.startsWith('video/')) {
    if (!projectId) throw new Error('Subir videos requiere un projectId')
    return uploadSourceVideo({ file, projectId, userId, onStep, onProgress, signal })
  }

  if (file.type.startsWith('image/')) {
    return uploadAssetImage({ file, userId, onStep, onProgress, signal })
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
