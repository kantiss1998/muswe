import { createServerClient } from '@/lib/supabase/server'
import { UserAddress } from './types'

export class ShippingRepository {
  async getUserAddresses(userId: string) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('user_addresses')
      .select(
        'id, user_id, label, recipient_name, phone, province_name, city_name, district_name, postal_code, full_address, country_code, country_name, zone_id, is_default, created_at'
      )
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async addUserAddress(address: Omit<UserAddress, 'id' | 'created_at'>) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('user_addresses')
      .insert([address])
      .select()
      .single()
    if (error) throw error
    return data
  }

  async updateUserAddress(
    addressId: string,
    userId: string,
    address: Partial<Omit<UserAddress, 'id' | 'user_id' | 'created_at'>>
  ) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('user_addresses')
      .update(address)
      .eq('id', addressId)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async deleteUserAddress(addressId: string, userId: string) {
    const supabase = await createServerClient()
    const { error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId)
    if (error) throw error
  }

  async setDefaultAddress(addressId: string, userId: string) {
    const supabase = await createServerClient()
    const { error } = await supabase
      .from('user_addresses')
      .update({ is_default: true })
      .eq('id', addressId)
      .eq('user_id', userId)
    if (error) throw error
  }

  async searchDistricts(searchQuery: string) {
    const supabase = await createServerClient()
    const raw = searchQuery.trim()
    if (!raw) return []

    const clean = (str: string) =>
      str
        .replace(/"/g, '""')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')

    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean)

    if (parts.length >= 2) {
      const p0 = `%${clean(parts[0])}%`
      const p1 = `%${clean(parts[1])}%`

      const { data, error } = await supabase
        .from('districts')
        .select('id, province_name, city_name, district_name, postal_code, zone_id')
        .ilike('district_name', p0)
        .ilike('city_name', p1)
        .limit(15)

      if (!error && data && data.length > 0) {
        return data
      }
    }

    const firstPart = parts[0] || raw
    const pattern = `"%${clean(firstPart)}%"`

    const { data, error } = await supabase
      .from('districts')
      .select('id, province_name, city_name, district_name, postal_code, zone_id')
      .or(`district_name.ilike.${pattern},city_name.ilike.${pattern}`)
      .limit(15)

    if (error) throw error
    return data || []
  }
}

export const shippingRepository = new ShippingRepository()
