import { safeLogError } from '@/lib/logger'
import { UserAddress, District, ShippingOption, ShippingCalculationItem } from './types'
import { ApiResponse, ok, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'
import { shippingRepository } from './shipping.repository'
import { biteshipClient } from '@/lib/biteship.client'

export class ShippingService {
  async getUserAddresses(userId: string): Promise<ApiResponse<UserAddress[]>> {
    try {
      const data = await shippingRepository.getUserAddresses(userId)
      if (!data) return ok([])

      return ok(
        data.map((row) => ({
          id: row.id,
          user_id: row.user_id,
          label: row.label,
          recipient_name: row.recipient_name,
          phone: row.phone,
          province_name: row.province_name,
          city_name: row.city_name,
          district_name: row.district_name,
          postal_code: row.postal_code,
          full_address: row.full_address,
          country_code: (row as any).country_code || 'ID',
          country_name: (row as any).country_name || 'Indonesia',
          zone_id: row.zone_id,
          is_default: row.is_default,
          created_at: row.created_at,
        }))
      )
    } catch (error) {
      safeLogError('Error fetching user addresses:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil alamat pengguna')
    }
  }

  async addUserAddress(
    address: Omit<UserAddress, 'id' | 'created_at'>
  ): Promise<ApiResponse<UserAddress>> {
    try {
      const data = await shippingRepository.addUserAddress(address)
      return ok({
        id: data.id,
        user_id: data.user_id,
        label: data.label,
        recipient_name: data.recipient_name,
        phone: data.phone,
        province_name: data.province_name,
        city_name: data.city_name,
        district_name: data.district_name,
        postal_code: data.postal_code,
        full_address: data.full_address,
        country_code: (data as any).country_code || 'ID',
        country_name: (data as any).country_name || 'Indonesia',
        zone_id: data.zone_id,
        is_default: data.is_default,
        created_at: data.created_at,
      })
    } catch (error) {
      safeLogError('Error adding user address:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menambahkan alamat.')
    }
  }

  async updateUserAddress(
    addressId: string,
    userId: string,
    address: Partial<Omit<UserAddress, 'id' | 'user_id' | 'created_at'>>
  ): Promise<ApiResponse<UserAddress>> {
    try {
      const data = await shippingRepository.updateUserAddress(addressId, userId, address)
      return ok({
        id: data.id,
        user_id: data.user_id,
        label: data.label,
        recipient_name: data.recipient_name,
        phone: data.phone,
        province_name: data.province_name,
        city_name: data.city_name,
        district_name: data.district_name,
        postal_code: data.postal_code,
        full_address: data.full_address,
        country_code: (data as any).country_code || 'ID',
        country_name: (data as any).country_name || 'Indonesia',
        zone_id: data.zone_id,
        is_default: data.is_default,
        created_at: data.created_at,
      })
    } catch (error) {
      safeLogError('Error updating user address:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memperbarui alamat.')
    }
  }

  async deleteUserAddress(addressId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      await shippingRepository.deleteUserAddress(addressId, userId)
      return ok()
    } catch (error) {
      safeLogError('Error deleting user address:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menghapus alamat.')
    }
  }

  async setDefaultAddress(addressId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      await shippingRepository.setDefaultAddress(addressId, userId)
      return ok()
    } catch (error) {
      safeLogError('Error setting default address:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengatur alamat utama.')
    }
  }

  async searchDistricts(searchQuery: string): Promise<ApiResponse<District[]>> {
    if (!searchQuery || searchQuery.trim().length < 2) return ok([])

    try {
      const data = await shippingRepository.searchDistricts(searchQuery)
      if (!data) return ok([])

      return ok(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.map((row: any) => ({
          id: row.id,
          province_name: row.province_name,
          city_name: row.city_name,
          district_name: row.district_name,
          postal_code: row.postal_code,
          zone_id: row.zone_id,
        }))
      )
    } catch (error) {
      safeLogError('Error searching districts:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mencari kecamatan')
    }
  }

  async calculateShippingRates(
    destinationPostalCode: string,
    weightGram: number,
    items?: ShippingCalculationItem[],
    destinationCountryCode?: string
  ): Promise<ApiResponse<ShippingOption[]>> {
    if (!destinationPostalCode && (!destinationCountryCode || destinationCountryCode === 'ID')) {
      return ok([])
    }

    try {
      const calcItems = items && items.length > 0
        ? items.map(i => ({
            name: i.name,
            value: i.value,
            quantity: i.quantity,
            weight: i.weight,
          }))
        : [
            {
              name: 'Paket Produk Muswe',
              value: 100000,
              quantity: 1,
              weight: Math.max(weightGram, 100),
            },
          ]

      const pricing = await biteshipClient.getRates({
        destinationPostalCode,
        destinationCountryCode,
        items: calcItems,
      })

      const options: ShippingOption[] = pricing.map((p) => {
        // Parse duration like "2 - 3" or "1"
        let etd_min = 1
        let etd_max = 3
        if (p.shipment_duration_range) {
          const parts = p.shipment_duration_range.split('-').map((s) => parseInt(s.trim()))
          if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            etd_min = parts[0]
            etd_max = parts[1]
          } else if (parts.length === 1 && !isNaN(parts[0])) {
            etd_min = parts[0]
            etd_max = parts[0]
          }
        }

        return {
          id: `${p.courier_code}_${p.courier_service_code}`,
          courier_code: p.courier_code,
          courier_name: `${p.courier_name} (${p.courier_service_name})`,
          courier_service_code: p.courier_service_code,
          courier_service_name: p.courier_service_name,
          price: p.price,
          etd_min,
          etd_max,
          weight_used_gram: weightGram,
          description: p.description,
        }
      })

      return ok(options)
    } catch (error: any) {
      safeLogError('Error calculating shipping rates via Biteship:', error)
      return fail(
        ApiErrorCode.INTERNAL_ERROR,
        error.message || 'Gagal menghitung ongkos kirim. Silakan coba lagi.'
      )
    }
  }

  async createShipmentForOrder(orderId: string): Promise<ApiResponse<{ tracking_number: string }>> {
    try {
      const { createServerClient } = await import('@/lib/supabase/server')
      const supabase = await createServerClient()

      const { data: order, error } = await supabase
        .from('orders')
        .select(
          `
          id, order_number, user_id,
          order_items (product_name, variant_name, price, quantity),
          order_shipping (recipient_name, phone, full_address, postal_code, courier_name),
          profiles (email)
        `
        )
        .eq('id', orderId)
        .single()

      if (error || !order) {
        throw new Error('Data pesanan tidak ditemukan')
      }

      const shipping = Array.isArray(order.order_shipping)
        ? order.order_shipping[0]
        : order.order_shipping
      if (!shipping) {
        throw new Error('Data pengiriman pesanan tidak ditemukan')
      }

      const itemsList = Array.isArray(order.order_items) ? order.order_items : []
      const profile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles

      // Infer courier company code from courier_name
      let courierCompany = 'jne'
      const lowerCourier = (shipping.courier_name || '').toLowerCase()
      if (lowerCourier.includes('sicepat')) courierCompany = 'sicepat'
      else if (lowerCourier.includes('j&t') || lowerCourier.includes('jnt')) courierCompany = 'jnt'
      else if (lowerCourier.includes('pos')) courierCompany = 'pos'
      else if (lowerCourier.includes('tiki')) courierCompany = 'tiki'
      else if (lowerCourier.includes('anteraja')) courierCompany = 'anteraja'
      else if (lowerCourier.includes('dhl')) courierCompany = 'dhl'

      let courierType = 'reg'
      if (lowerCourier.includes('ez')) courierType = 'ez'
      else if (lowerCourier.includes('yes') || lowerCourier.includes('express')) courierType = 'express'

      const items = itemsList.map((item: any) => ({
        name: `${item.product_name || 'Produk'} ${item.variant_name ? `(${item.variant_name})` : ''}`.trim(),
        value: Number(item.price || 50000),
        quantity: Number(item.quantity || 1),
        weight: 500, // Default 500g per item
      }))

      const biteshipRes = await biteshipClient.createOrder({
        destination_contact_name: shipping.recipient_name || 'Customer',
        destination_contact_phone: shipping.phone || '081234567890',
        destination_contact_email: profile?.email || undefined,
        destination_address: shipping.full_address || 'Alamat tujuan',
        destination_postal_code: Number(shipping.postal_code || 10110),
        courier_company: courierCompany,
        courier_type: courierType,
        items: items.length > 0 ? items : [{ name: 'Produk Muswe', value: 100000, quantity: 1, weight: 500 }],
      })

      if (!biteshipRes.waybill_id) {
        throw new Error('Biteship tidak mengembalikan nomor resi valid.')
      }

      return ok({ tracking_number: biteshipRes.waybill_id })
    } catch (error: any) {
      safeLogError('Error creating Biteship shipment:', error)
      return fail(
        ApiErrorCode.INTERNAL_ERROR,
        error.message || 'Gagal membuat order pengiriman ke Biteship.'
      )
    }
  }
}

export const shippingService = new ShippingService()
