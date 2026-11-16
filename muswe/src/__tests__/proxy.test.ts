import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy, getClientIp } from '../proxy'

// Mock NextResponse
vi.mock('next/server', () => {
  return {
    NextRequest: vi.fn(),
    NextResponse: {
      json: vi.fn((body, init) => ({ body, init })),
      next: vi.fn(() => ({ type: 'next', headers: new Headers() })),
    },
  }
})

describe('proxy middleware', () => {
  it('should allow API requests without API key if not ERP', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test'

    const req = {
      nextUrl: { pathname: '/api/v1/products', clone: () => ({ searchParams: { set: vi.fn() } }) },
      headers: new Headers(),
      cookies: { getAll: vi.fn().mockReturnValue([]) },
    } as any

    const res = await proxy(req)
    expect(res.type).toBe('next')
  })

  describe('getClientIp', () => {
    it('should prioritize cf-connecting-ip over x-forwarded-for', () => {
      const req = {
        headers: new Headers({
          'cf-connecting-ip': '203.0.113.10',
          'x-forwarded-for': '198.51.100.1, 10.0.0.1',
          'x-real-ip': '192.0.2.1',
        }),
      } as unknown as NextRequest

      expect(getClientIp(req)).toBe('203.0.113.10')
    })

    it('should extract first IP from comma-separated x-forwarded-for', () => {
      const req = {
        headers: new Headers({
          'x-forwarded-for': ' 198.51.100.2 , 10.0.0.1 ',
        }),
      } as unknown as NextRequest

      expect(getClientIp(req)).toBe('198.51.100.2')
    })

    it('should fallback to x-real-ip or unknown', () => {
      const reqWithRealIp = {
        headers: new Headers({ 'x-real-ip': '192.0.2.5' }),
      } as unknown as NextRequest
      expect(getClientIp(reqWithRealIp)).toBe('192.0.2.5')

      const reqEmpty = { headers: new Headers() } as unknown as NextRequest
      expect(getClientIp(reqEmpty)).toBe('unknown')
    })
  })
})
