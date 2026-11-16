import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null } })
const mockEq = vi.fn().mockResolvedValue({
  data: [{ from_path: '/promo-lama', to_path: '/flash-sale', status_code: 301 }],
  error: null,
})
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    from: mockFrom,
    auth: { getUser: mockGetUser },
  })),
}))

vi.mock('next/server', () => ({
  NextResponse: {
    next: vi.fn(() => ({ cookies: { getAll: () => [], set: vi.fn() } })),
    redirect: vi.fn((url: { pathname: string }, status?: number) => ({
      type: 'redirect',
      url: url.pathname,
      status,
    })),
  },
}))

describe('supabase middleware optimization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
  })

  it('should skip auth.getUser() for guests without sb-* cookies and reuse bulk redirect cache', async () => {
    const { updateSession } = await import('../supabase/middleware')

    const makeReq = (pathname: string, cookies: Array<{ name: string; value: string }> = []) =>
      ({
        nextUrl: {
          pathname,
          clone: () => ({ pathname, search: '', searchParams: { set: vi.fn(), get: vi.fn() } }),
        },
        cookies: {
          getAll: () => cookies,
          set: vi.fn(),
        },
      }) as any

    // First guest request fetches bulk redirects once, skips auth.getUser()
    await updateSession(makeReq('/produk'))
    expect(mockFrom).toHaveBeenCalledTimes(1)
    expect(mockGetUser).not.toHaveBeenCalled()

    // Second guest request reuses bulk redirect cache (0 DB queries, 0 auth calls)
    const redirectRes = (await updateSession(makeReq('/promo-lama'))) as any
    expect(mockFrom).toHaveBeenCalledTimes(1)
    expect(mockGetUser).not.toHaveBeenCalled()
    expect(redirectRes.type).toBe('redirect')
    expect(redirectRes.url).toBe('/flash-sale')

    // Authenticated request with sb-* cookie DOES call auth.getUser()
    await updateSession(makeReq('/akun', [{ name: 'sb-test-auth-token', value: 'jwt-token' }]))
    expect(mockGetUser).toHaveBeenCalledTimes(1)
  })
})
