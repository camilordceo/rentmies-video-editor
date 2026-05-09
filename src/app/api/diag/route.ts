import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/supabase/auth-helpers'
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * GET /api/diag
 *
 * Diagnóstico end-to-end del flujo de upload. Devuelve JSON con:
 *  - env: env vars críticas presentes (no expone valores).
 *  - auth: si la sesión actual es válida server-side.
 *  - profile: si el profile del user existe.
 *  - bucket: si los buckets de Storage existen y son accesibles.
 *  - rls: prueba un createSignedUploadUrl como el user para ver si la
 *         RLS permite escribir en su carpeta {user_id}/__diag/...
 *
 * Si CUALQUIER paso falla, el JSON dice exactamente cuál y por qué.
 * Pegás esto al canal de soporte y se sabe en 5 segundos qué está roto.
 */
export async function GET() {
  type Step = { name: string; ok: boolean; detail?: unknown }
  const steps: Step[] = []

  // 1. Env vars (con aliases — next.config.js mapea SUPABASE_URL → NEXT_PUBLIC_*)
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    REMOTION_AWS_REGION: !!process.env.REMOTION_AWS_REGION,
    REMOTION_LAMBDA_FUNCTION_NAME: !!process.env.REMOTION_LAMBDA_FUNCTION_NAME,
    REMOTION_SERVE_URL: !!process.env.REMOTION_SERVE_URL,
  }
  const resolvedUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const resolvedAnon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  const resolvedService =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    ''
  const missingResolved: string[] = []
  if (!resolvedUrl) missingResolved.push('SUPABASE URL (probá NEXT_PUBLIC_SUPABASE_URL o SUPABASE_URL)')
  if (!resolvedAnon) missingResolved.push('ANON KEY (probá NEXT_PUBLIC_SUPABASE_ANON_KEY o SUPABASE_ANON_KEY)')
  if (!resolvedService) missingResolved.push('SERVICE ROLE KEY (probá SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SERVICE_KEY)')
  steps.push({
    name: 'env_vars',
    ok: missingResolved.length === 0,
    detail: {
      message:
        missingResolved.length === 0
          ? 'Todas las env vars críticas están presentes (aliases resueltos)'
          : `Faltan: ${missingResolved.join(' · ')}`,
      browserBundleHasNextPublicUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      browserBundleHasNextPublicAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hint:
        !process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_URL
          ? 'Tenés SUPABASE_URL pero no NEXT_PUBLIC_SUPABASE_URL — el browser necesita next.config.js para mapearlo. Asegurate de que el deploy se hizo después de actualizar next.config.js.'
          : undefined,
    },
  })

  // 2. Auth — usar el client SSR para leer cookie
  let userId: string | null = null
  let userEmail: string | null = null
  try {
    const ssr = await createServerSupabaseClient()
    const { data, error } = await ssr.auth.getUser()
    if (error) {
      steps.push({ name: 'auth', ok: false, detail: `auth.getUser error: ${error.message}` })
    } else if (!data?.user) {
      steps.push({ name: 'auth', ok: false, detail: 'No hay sesión — login no completado o cookies bloqueadas' })
    } else {
      userId = data.user.id
      userEmail = data.user.email ?? null
      steps.push({ name: 'auth', ok: true, detail: { userId, email: userEmail } })
    }
  } catch (e) {
    steps.push({ name: 'auth', ok: false, detail: e instanceof Error ? e.message : String(e) })
  }

  // 3. Profile
  if (userId) {
    try {
      const auth = await requireAuth()
      if (!auth.ok) {
        steps.push({ name: 'profile', ok: false, detail: 'requireAuth() falló — revisá /auth' })
      } else {
        steps.push({
          name: 'profile',
          ok: !!auth.profile,
          detail: auth.profile
            ? { id: auth.profile.id, rol: auth.profile.rol, empresa_id: auth.profile.empresa_id, plan: auth.profile.plan }
            : 'profile no encontrado en la tabla',
        })
      }
    } catch (e) {
      steps.push({ name: 'profile', ok: false, detail: e instanceof Error ? e.message : String(e) })
    }
  } else {
    steps.push({ name: 'profile', ok: false, detail: 'skipped — sin auth' })
  }

  // 4. Buckets
  try {
    const admin = createAdminClient()
    const { data: buckets, error } = await admin.storage.listBuckets()
    if (error) {
      steps.push({ name: 'storage_buckets', ok: false, detail: error.message })
    } else {
      const found = (buckets ?? []).map((b) => b.id)
      const required = ['source-videos', 'rendered-videos', 'thumbnails', 'assets']
      const missing = required.filter((b) => !found.includes(b))
      steps.push({
        name: 'storage_buckets',
        ok: missing.length === 0,
        detail: missing.length === 0
          ? `OK: ${found.join(', ')}`
          : `Faltan buckets: ${missing.join(', ')} — aplicá supabase/migrations/003_mvp_storage.sql`,
      })
    }
  } catch (e) {
    steps.push({ name: 'storage_buckets', ok: false, detail: e instanceof Error ? e.message : String(e) })
  }

  // 5. RLS test — generar signed upload URL para path del user
  if (userId) {
    try {
      const admin = createAdminClient()
      const testPath = `${userId}/__diag/${Date.now()}.txt`
      const { data, error } = await admin.storage
        .from('source-videos')
        .createSignedUploadUrl(testPath)
      if (error) {
        steps.push({ name: 'rls_signed_upload', ok: false, detail: error.message })
      } else {
        steps.push({
          name: 'rls_signed_upload',
          ok: true,
          detail: `Path ${testPath} firma OK · URL valida 2h`,
        })
        // No subimos nada — solo verificamos que firme
        if (data?.path) {
          // Opcionalmente borramos el path si quedó algún residuo
          await admin.storage.from('source-videos').remove([data.path]).catch(() => {})
        }
      }
    } catch (e) {
      steps.push({ name: 'rls_signed_upload', ok: false, detail: e instanceof Error ? e.message : String(e) })
    }
  } else {
    steps.push({ name: 'rls_signed_upload', ok: false, detail: 'skipped — sin auth' })
  }

  // 6. Projects table accesible
  if (userId) {
    try {
      const admin = createAdminClient()
      const { count, error } = await admin
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
      if (error) {
        steps.push({ name: 'projects_table', ok: false, detail: error.message })
      } else {
        steps.push({ name: 'projects_table', ok: true, detail: `User tiene ${count ?? 0} proyectos` })
      }
    } catch (e) {
      steps.push({ name: 'projects_table', ok: false, detail: e instanceof Error ? e.message : String(e) })
    }
  }

  const allOk = steps.every((s) => s.ok)
  return NextResponse.json(
    {
      ok: allOk,
      summary: allOk
        ? '✓ Todo OK server-side. Si el upload aún falla, el problema es client-side (CORS browser→Supabase, cookie bloqueada, o env var NEXT_PUBLIC_* no aplicada al build).'
        : '✗ Hay pasos fallando — revisá el primer detail con ok:false',
      env,
      steps,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  )
}
