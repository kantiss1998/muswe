import { ApiListResponse, ApiResponse, ok, paginated } from '@/lib/api-response'
import { ShippingZone, ShippingRate } from './types'

export class AdminShippingService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getShippingZones(page = 1, limit = 20): Promise<ApiListResponse<ShippingZone>> {
    return paginated([], 0, page, limit)
  }

  async createShippingZone(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    zone: Omit<ShippingZone, 'id' | 'shipping_zone_coverage'>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    provinces?: string[]
  ): Promise<ApiResponse<ShippingZone>> {
    return ok({ id: 'deprecated', name: 'Biteship Automated', description: null, is_active: true })
  }

  async updateShippingZone(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    zoneId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    zone?: Partial<Omit<ShippingZone, 'id' | 'shipping_zone_coverage'>>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    provinces?: string[]
  ): Promise<ApiResponse<void>> {
    return ok()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deleteShippingZone(zoneId: string): Promise<ApiResponse<void>> {
    return ok()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getShippingRates(page = 1, limit = 20): Promise<ApiListResponse<ShippingRate>> {
    return paginated([], 0, page, limit)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createShippingRate(rate: Omit<ShippingRate, 'id'>): Promise<ApiResponse<ShippingRate>> {
    return ok({
      id: 'deprecated',
      zone_id: '',
      courier_name: 'Biteship',
      price_per_kg: 0,
      min_weight_gram: 1000,
      base_price: 0,
      etd_days_min: 1,
      etd_days_max: 3,
      is_active: true,
    })
  }

  async updateShippingRate(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    rateId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    rate?: Partial<Omit<ShippingRate, 'id'>>
  ): Promise<ApiResponse<ShippingRate>> {
    return ok({
      id: rateId,
      zone_id: '',
      courier_name: 'Biteship',
      price_per_kg: 0,
      min_weight_gram: 1000,
      base_price: 0,
      etd_days_min: 1,
      etd_days_max: 3,
      is_active: true,
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deleteShippingRate(rateId: string): Promise<ApiResponse<void>> {
    return ok()
  }
}

export const adminShippingService = new AdminShippingService()
