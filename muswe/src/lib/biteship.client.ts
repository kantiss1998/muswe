import { safeLogError } from './logger'

const BITESHIP_BASE_URL = process.env.BITESHIP_BASE_URL || 'https://api.biteship.com'
const DEFAULT_ORIGIN_POSTAL_CODE = process.env.BITESHIP_ORIGIN_POSTAL_CODE || '40295'

export interface BiteshipCourierItem {
  name: string
  description?: string
  value: number
  quantity: number
  weight: number // in grams
  length?: number // in cm
  width?: number // in cm
  height?: number // in cm
}

export interface BiteshipRatePricing {
  available_for_cash_on_delivery: boolean
  available_for_proof_of_delivery: boolean
  available_for_instant_waybill_id: boolean
  company: string
  courier_code: string
  courier_name: string
  courier_service_code: string
  courier_service_name: string
  description: string
  duration: string
  price: number
  shipment_duration_range: string
  shipment_duration_unit: string
  service_type: string
  type: string
}

export interface BiteshipRateResponse {
  success: boolean
  message: string
  object: string
  pricing: BiteshipRatePricing[]
}

export class BiteshipClient {
  private apiKey: string
  public originPostalCode: string

  constructor() {
    this.apiKey = process.env.BITESHIP_API_KEY || ''
    this.originPostalCode = DEFAULT_ORIGIN_POSTAL_CODE
  }

  async getRates(params: {
    destinationPostalCode: string
    items: BiteshipCourierItem[]
    couriers?: string
  }): Promise<BiteshipRatePricing[]> {
    if (!this.apiKey) {
      safeLogError('[BiteshipClient]', 'BITESHIP_API_KEY is not configured')
      throw new Error('Konfigurasi Biteship API Key belum tersedia')
    }

    const payload = {
      origin_postal_code: Number(this.originPostalCode),
      destination_postal_code: Number(params.destinationPostalCode),
      couriers: params.couriers || undefined,
      items: params.items.map((item) => ({
        name: item.name.substring(0, 50),
        description: item.description ? item.description.substring(0, 100) : item.name.substring(0, 50),
        value: item.value,
        quantity: item.quantity,
        weight: item.weight,
        length: item.length || 10,
        width: item.width || 10,
        height: item.height || 10,
      })),
    }

    try {
      const response = await fetch(`${BITESHIP_BASE_URL}/v1/rates/couriers`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data: BiteshipRateResponse = await response.json()

      if (!response.ok || !data.success) {
        safeLogError('[BiteshipClient] Rates error:', data)
        throw new Error(data.message || 'Gagal mengambil tarif pengiriman dari Biteship')
      }

      return data.pricing || []
    } catch (error) {
      safeLogError('[BiteshipClient] Request failed:', error)
      throw error
    }
  }
}

export const biteshipClient = new BiteshipClient()
