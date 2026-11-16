import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Bulk in-memory cache for database-driven redirects (reduces DB queries to <= 1 per 5 mins per isolate)
const REDIRECT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
let redirectMapCache: {
  map: Map<string, { to_path: string; status_code: number }>
  expiresAt: number
} | null = null
let redirectInFlight: Promise<Map<string, { to_path: string; status_code: number }>> | null = null

export function clearRedirectsCache(): void {
  redirectMapCache = null
}

async function getActiveRedirectsMap(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<Map<string, { to_path: string; status_code: number }>> {
  if (redirectMapCache && redirectMapCache.expiresAt > Date.now()) {
    return redirectMapCache.map
  }

  if (redirectInFlight) {
    return redirectInFlight
  }

  redirectInFlight = (async () => {
    const map = new Map<string, { to_path: string; status_code: number }>()
    const { data, error } = await supabase
      .from('redirects')
      .select('from_path, to_path, status_code')
      .eq('is_active', true)

    if (!error && Array.isArray(data)) {
      for (const row of data) {
        if (row.from_path && row.to_path) {
          map.set(row.from_path, {
            to_path: row.to_path,
            status_code: row.status_code || 301,
          })
        }
      }
      redirectMapCache = {
        map,
        expiresAt: Date.now() + REDIRECT_CACHE_TTL,
      }
    }
    return map
  })().finally(() => {
    redirectInFlight = null
  })

  return redirectInFlight
}

export async function updateSession(request: NextRequest): Promise<NextResponse<unknown>> {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))

          // Preserve cookies that were already set on the response by prior
          // setAll calls (Supabase auth may call setAll multiple times when
          // chunking large session tokens — common on mobile).
          const existingCookies = supabaseResponse.cookies.getAll()

          supabaseResponse = NextResponse.next({
            request,
          })

          // Restore previously-set cookies on the new response
          existingCookies.forEach(({ name, value }) => {
            // Don't restore if the current batch will overwrite it
            if (!cookiesToSet.some((c) => c.name === name)) {
              supabaseResponse.cookies.set(name, value)
            }
          })

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname

  // Skip database checks for static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // like favicon.ico, images, etc
  ) {
    return supabaseResponse
  }

  // Database-driven redirects check via bulk 5-minute cache
  try {
    const redirectsMap = await getActiveRedirectsMap(supabase)
    const redirectEntry = redirectsMap.get(pathname)
    if (redirectEntry) {
      const url = request.nextUrl.clone()
      url.pathname = redirectEntry.to_path
      return NextResponse.redirect(url, redirectEntry.status_code)
    }
  } catch (error) {
    console.error('Redirect check error:', error)
  }

  // Fast-path for guests: skip GoTrue auth.getUser() network call if no Supabase session cookie exists
  const hasAuthCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith('sb-') && cookie.value.length > 0)

  let user = null
  if (hasAuthCookie) {
    // Refresh session - important for Server Components
    const { data } = await supabase.auth.getUser()
    user = data.user
  }

  // Protected routes: redirect to login if not authenticated
  const protectedPaths = ['/akun', '/checkout', '/pesanan', '/wishlist']
  const isProtected = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/masuk'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Admin routes: redirect if not admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/masuk'
      url.searchParams.set('redirect', '/admin')
      return NextResponse.redirect(url)
    }

    // Check admin role (fetched from profiles)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Auth pages: redirect to home if already logged in
  const authPaths = ['/masuk', '/daftar', '/lupa-password']
  const isAuthPage = authPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isAuthPage && user) {
    let redirect = request.nextUrl.searchParams.get('redirect') || '/'
    // Safe redirect validation: must start with / and not //
    if (!redirect.startsWith('/') || redirect.startsWith('//')) {
      redirect = '/'
    }
    try {
      const redirectUrl = new URL(redirect, 'http://localhost')
      const url = request.nextUrl.clone()
      url.pathname = redirectUrl.pathname
      url.search = redirectUrl.search
      return NextResponse.redirect(url)
    } catch {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
