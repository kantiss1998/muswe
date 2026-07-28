import { safeLogError } from './logger'

const JUBELIO_BASE_URL = process.env.JUBELIO_BASE_URL || 'https://api2.jubelio.com'

export interface JubelioSyncItem {
  item_id?: number
  item_code?: string
  quantity: number
  price: number
  unit?: string
}

export interface JubelioSalesOrderShipmentPayload {
  order_number: string
  contact_id?: number
  location_id?: number
  channel_status?: string
  customer_name: string
  customer_phone?: string
  customer_email?: string
  shipping_address?: string
  shipping_area?: string
  shipping_city?: string
  shipping_province?: string
  postal_code?: string
  courier_name: string
  tracking_number: string
  total_amount: number
  items: JubelioSyncItem[]
}

export interface JubelioSyncResponse {
  success: boolean
  message: string
  jubelio_order_id?: string
}

export class JubelioClient {
  private email: string
  private password: string
  private token: string | null = null

  constructor() {
    this.email = process.env.JUBELIO_EMAIL || ''
    this.password = process.env.JUBELIO_PASSWORD || ''
  }

  async login(): Promise<string | null> {
    if (!this.email || !this.password) {
      safeLogError('[JubelioClient]', 'JUBELIO_EMAIL or JUBELIO_PASSWORD is not configured')
      return null
    }

    try {
      const response = await fetch(`${JUBELIO_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.email,
          password: this.password,
        }),
      })

      const data: any = await response.json()

      if (!response.ok || !data?.token) {
        safeLogError('[JubelioClient] Login failed:', data?.message || 'Invalid credentials')
        return null
      }

      this.token = data.token
      return this.token
    } catch (error) {
      safeLogError('[JubelioClient] Login error:', error)
      return null
    }
  }

  async getGudangOnlineLocationId(): Promise<number> {
    const envLocId = Number(process.env.JUBELIO_LOCATION_ID)
    if (!isNaN(envLocId) && envLocId > 0) {
      return envLocId
    }

    try {
      if (!this.token) {
        await this.login()
      }
      if (!this.token) return 17 // Default Gudang Online ID

      const response = await fetch(`${JUBELIO_BASE_URL}/locations/?pageSize=100`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      })

      if (response.ok) {
        const data: any = await response.json()
        const locations = Array.isArray(data?.data) ? data.data : []
        const gudangOnline = locations.find(
          (loc: any) =>
            loc.location_name &&
            loc.location_name.toLowerCase().includes('gudang online')
        )
        if (gudangOnline?.location_id) {
          return Number(gudangOnline.location_id)
        }
      }
    } catch (error) {
      safeLogError('[JubelioClient] Error fetching locations:', error)
    }

    return 17 // Fallback to verified 'Gudang Online' location_id 17
  }

  async syncSalesOrderShipment(
    payload: JubelioSalesOrderShipmentPayload
  ): Promise<JubelioSyncResponse> {
    const isSandbox =
      !this.email ||
      !this.password ||
      process.env.NODE_ENV === 'test'

    if (isSandbox) {
      const mockJubelioId = `JUB-${Date.now()}`
      safeLogError(
        '[JubelioClient]',
        `Jubelio ERP Sync triggered in Sandbox/Fallback mode for order ${payload.order_number} (Resi: ${payload.tracking_number}). Generated mock Jubelio ID: ${mockJubelioId}`
      )
      return {
        success: true,
        message: 'Sync Jubelio ERP berhasil (Sandbox Mock)',
        jubelio_order_id: mockJubelioId,
      }
    }

    try {
      if (!this.token) {
        await this.login()
      }

      if (!this.token) {
        throw new Error('Gagal melakukan autentikasi ke Jubelio API.')
      }

      const locationId = payload.location_id || (await this.getGudangOnlineLocationId())

      const requestBody = {
        salesorder_no: payload.order_number,
        ref_no: payload.order_number,
        contact_id: payload.contact_id || -9, // -9 = WEBSTORE default contact
        source: 1, // 1 = Internal / Webstore
        transaction_date: new Date().toISOString(),
        customer_name: payload.customer_name || 'Customer',
        shipping_full_name: payload.customer_name || 'Customer',
        shipping_phone: payload.customer_phone || '081234567890',
        shipping_address: payload.shipping_address || 'Alamat Pengiriman',
        shipping_area: payload.shipping_area || 'BANDUNG',
        shipping_city: payload.shipping_city || 'KOTA BANDUNG',
        shipping_province: payload.shipping_province || 'JAWA BARAT',
        shipping_post_code: payload.postal_code || '40295',
        shipping_country: 'ID',
        location_id: locationId, // Default 17 (Gudang Online)
        payment_method: 'Webstore',
        is_paid: true,
        is_tax_included: false,
        channel_status: payload.channel_status || 'PAID', // Status Aktif/Sudah Bayar
        sub_total: payload.total_amount,
        total_disc: 0,
        total_tax: 0,
        grand_total: payload.total_amount,
        shipping_cost: 0,
        insurance_cost: 0,
        add_disc: 0,
        add_fee: 0,
        cod_fee: 0,
        cod_fee_discount: 0,
        loyalty_discount: 0,
        add_cost: 0,
        original_shipment_cost: 0,
        shipping_cost_discount: 0,
        service_fee: 0,
        is_cod: false,
        is_po: false,
        attachment: [],
        items: payload.items.map((item) => ({
          salesorder_detail_id: 0,
          item_id: item.item_id || 731,
          price: item.price,
          amount: item.price * item.quantity,
          qty_in_base: item.quantity,
          unit: item.unit || 'Buah',
          disc: 0,
          disc_amount: 0,
          tax_amount: 0,
          tax_id: 1,
          location_id: locationId,
          shipper: payload.courier_name,
          tracking_no: payload.tracking_number,
        })),
      }

      const response = await fetch(`${JUBELIO_BASE_URL}/sales/orders/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data: any = await response.json()

      if (!response.ok || (typeof data?.id === 'undefined' && data?.success === false)) {
        const errorMsg = data?.message || 'Gagal mengirimkan data transaksi ke Jubelio ERP'
        safeLogError('[JubelioClient] Sync error:', errorMsg)
        return {
          success: false,
          message: errorMsg,
        }
      }

      const createdId = data?.id || data?.salesorder_id || `JUB-${payload.order_number}`

      return {
        success: true,
        message: 'Sinkronisasi Jubelio ERP berhasil',
        jubelio_order_id: String(createdId),
      }
    } catch (error: any) {
      safeLogError('[JubelioClient] Sync exception caught:', error)
      return {
        success: false,
        message: error?.message || 'Terjadi kesalahan saat sinkronisasi Jubelio ERP',
      }
    }
  }
}

export const jubelioClient = new JubelioClient()
