import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchInvoiceHtml } from '../invoice-actions'
import * as authGuard from '@/lib/auth-guard'

const mockDownload = vi.fn()
const mockFromStorage = vi.fn(() => ({ download: mockDownload }))

vi.mock('@/lib/auth-guard')
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    storage: {
      from: mockFromStorage,
    },
  })),
}))

describe('fetchInvoiceHtml', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createMockSupabase(orderData: unknown, profileRole = 'customer') {
    return {
      from: vi.fn((table: string) => {
        if (table === 'orders') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: orderData, error: null }),
              })),
            })),
          }
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: { role: profileRole }, error: null }),
            })),
          })),
        }
      }),
    }
  }

  it('should reject non-owner non-admin users', async () => {
    vi.spyOn(authGuard, 'requireAuth').mockResolvedValue({
      user: { id: 'user-2' } as any,
      supabase: createMockSupabase({ id: 'ord-1', user_id: 'user-1' }, 'customer') as any,
    })

    await expect(fetchInvoiceHtml('BB-20261116-ABC123')).rejects.toThrow('Akses ditolak')
    expect(mockDownload).not.toHaveBeenCalled()
  })

  it('should allow order owner to download invoice from private bucket', async () => {
    vi.spyOn(authGuard, 'requireAuth').mockResolvedValue({
      user: { id: 'user-1' } as any,
      supabase: createMockSupabase({ id: 'ord-1', user_id: 'user-1' }, 'customer') as any,
    })

    mockDownload.mockResolvedValueOnce({
      data: { text: async () => '<html>Invoice Owner</html>' },
      error: null,
    })

    const html = await fetchInvoiceHtml('BB-20261116-ABC123')
    expect(html).toBe('<html>Invoice Owner</html>')
    expect(mockFromStorage).toHaveBeenCalledWith('invoices')
    expect(mockDownload).toHaveBeenCalledWith('BB-20261116-ABC123.html')
  })

  it('should allow admin to download invoice with fallback path', async () => {
    vi.spyOn(authGuard, 'requireAuth').mockResolvedValue({
      user: { id: 'admin-1' } as any,
      supabase: createMockSupabase({ id: 'ord-1', user_id: 'user-1' }, 'admin') as any,
    })

    mockDownload
      .mockResolvedValueOnce({ data: null, error: new Error('Not found') })
      .mockResolvedValueOnce({
        data: { text: async () => '<html>Invoice Admin</html>' },
        error: null,
      })

    const html = await fetchInvoiceHtml('BB-20261116-ABC123')
    expect(html).toBe('<html>Invoice Admin</html>')
    expect(mockDownload).toHaveBeenNthCalledWith(1, 'BB-20261116-ABC123.html')
    expect(mockDownload).toHaveBeenNthCalledWith(2, 'invoices/BB-20261116-ABC123.html')
  })
})
