import { describe, it, expect, beforeEach } from 'vitest'
import { biteshipClient } from '@/lib/biteship.client'
import { shippingService } from '../shipping.service'

describe('International Shipping Integration', () => {
  beforeEach(() => {
    process.env.BITESHIP_API_KEY = 'biteship_test_mock_key'
    // Re-assign apiKey for test
    ;(biteshipClient as any).apiKey = 'biteship_test_mock_key'
  })

  it('should return international mock rates when destination country is SG (Singapore)', async () => {
    const rates = await biteshipClient.getRates({
      destinationPostalCode: '238801',
      destinationCountryCode: 'SG',
      items: [{ name: 'Muswe Batik Premium', value: 350000, quantity: 1, weight: 500 }],
    })

    expect(rates).toBeDefined()
    expect(rates.length).toBeGreaterThan(0)
    const courierCodes = rates.map((r) => r.courier_code)
    expect(courierCodes).toContain('dhl')
    expect(courierCodes).toContain('pos')
  })

  it('should call shippingService.calculateShippingRates with countryCode', async () => {
    const res = await shippingService.calculateShippingRates('90210', 1000, [], 'US')
    expect(res.success).toBe(true)
    expect(res.data).toBeDefined()
    expect(res.data!.length).toBeGreaterThan(0)
    expect(res.data![0].courier_name).toContain('DHL Express')
  })
})
