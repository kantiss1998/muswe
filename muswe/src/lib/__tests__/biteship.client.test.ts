import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('BiteshipClient caching and deduplication', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv, BITESHIP_API_KEY: 'biteship_live_test_key' }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  it('should deduplicate concurrent getRates calls and serve subsequent calls from cache', async () => {
    const mockPricing = [
      {
        company: 'jne',
        courier_code: 'jne',
        courier_name: 'JNE',
        courier_service_code: 'reg',
        courier_service_name: 'Reguler',
        price: 15000,
      },
    ]

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, pricing: mockPricing }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { BiteshipClient } = await import('../biteship.client')
    const client = new BiteshipClient()

    const params = {
      destinationPostalCode: '12345',
      destinationCountryCode: 'ID',
      items: [{ name: 'Hijab', value: 50000, quantity: 1, weight: 500 }],
    }

    // Fire 20 concurrent calls at the exact same time
    const results = await Promise.all(
      Array.from({ length: 20 }, () => client.getRates(params))
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)
    for (const res of results) {
      expect(res).toEqual(mockPricing)
    }

    // Subsequent call within TTL should hit cache
    const cachedResult = await client.getRates(params)
    expect(cachedResult).toEqual(mockPricing)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
