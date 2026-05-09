import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type CookieToSet = { name: string; value: string; options?: CookieOptions }

/**
 * Refresca la sesión de Supabase en cada request y sincroniza
 * cookies entre request y response. Devuelve la response final
 * y el user actual (o null) para que el middleware decida si
 * redirigir o continuar.
 *
 * Usar SIEMPRE createServerClient de @supabase/ssr aquí — el
 * cliente de @supabase/supabase-js no maneja cookies y rompe
 * la sesión cross-request.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  return { response, user }
}
