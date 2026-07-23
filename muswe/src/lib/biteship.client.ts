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

    const cleanOrigin = String(this.originPostalCode).replace(/\D/g, '')
    const cleanDestination = String(params.destinationPostalCode).replace(/\D/g, '')

    if (!cleanDestination) {
      throw new Error('Kode pos alamat tujuan tidak valid (harus berupa 5 digit angka).')
    }

    const payload = {
      origin_postal_code: Number(cleanOrigin),
      destination_postal_code: Number(cleanDestination),
      couriers: params.couriers || 'jne,sicepat,jnt,pos,tiki,anteraja',
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

      const data: any = await response.json()

      if (!response.ok || !data.success) {
        const errorMsg =
          (typeof data.error === 'string' ? data.error : null) ||
          data.message ||
          'Gagal mengambil tarif pengiriman dari Biteship'

        // If using test key (biteship_test...) and sandbox balance is 0, fallback to mock rates for testing
        if (this.apiKey.startsWith('biteship_test') && errorMsg.toLowerCase().includes('balance')) {
          safeLogError('[BiteshipClient]', 'Biteship test balance is empty. Falling back to Sandbox Mock Rates.')
          return [
            {
              available_for_cash_on_delivery: false,
              available_for_proof_of_delivery: true,
              available_for_instant_waybill_id: true,
              company: 'jne',
              courier_code: 'jne',
              courier_name: 'JNE',
              courier_service_code: 'reg',
              courier_service_name: 'Regular',
              description: 'Layanan Reguler JNE (Sandbox Mock)',
              duration: '1-2 hari',
              price: 12000,
              shipment_duration_range: '1 - 2',
              shipment_duration_unit: 'days',
              service_type: 'standard',
              type: 'courier',
            },
            {
              available_for_cash_on_delivery: false,
              available_for_proof_of_delivery: true,
              available_for_instant_waybill_id: true,
              company: 'sicepat',
              courier_code: 'sicepat',
              courier_name: 'SiCepat',
              courier_service_code: 'reg',
              courier_service_name: 'Regular Package',
              description: 'Layanan Reguler SiCepat (Sandbox Mock)',
              duration: '1-3 hari',
              price: 10000,
              shipment_duration_range: '1 - 3',
              shipment_duration_unit: 'days',
              service_type: 'standard',
              type: 'courier',
            },
            {
              available_for_cash_on_delivery: false,
              available_for_proof_of_delivery: true,
              available_for_instant_waybill_id: true,
              company: 'jnt',
              courier_code: 'jnt',
              courier_name: 'J&T Express',
              courier_service_code: 'ez',
              courier_service_name: 'EZ',
              description: 'Layanan EZ J&T (Sandbox Mock)',
              duration: '2-3 hari',
              price: 11000,
              shipment_duration_range: '2 - 3',
              shipment_duration_unit: 'days',
              service_type: 'standard',
              type: 'courier',
            },
          ]
        }

        safeLogError('[BiteshipClient] Rates error:', errorMsg)
        throw new Error(errorMsg)
      }

      return data.pricing || []
    } catch (error) {
      safeLogError('[BiteshipClient] Request failed:', error)
      throw error
    }
  }
}

export const biteshipClient = new BiteshipClient()
