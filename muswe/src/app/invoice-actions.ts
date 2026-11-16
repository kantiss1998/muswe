'use server'

import { requireAuth } from '@/lib/auth-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeLogError } from '@/lib/logger'

export async function fetchInvoiceHtml(orderNumber: string): Promise<string> {
  if (!orderNumber || typeof orderNumber !== 'string') {
    throw new Error('Nomor pesanan tidak valid')
  }

  const { user, supabase } = await requireAuth()

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, user_id')
    .eq('order_number', orderNumber)
    .maybeSingle()

  if (orderError || !order) {
    throw new Error('Pesanan tidak ditemukan')
  }

  if (order.user_id !== user.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role !== 'admin') {
      throw new Error('Akses ditolak')
    }
  }

  const adminClient = createAdminClient()
  const candidatePaths = [`${orderNumber}.html`, `invoices/${orderNumber}.html`]

  for (const path of candidatePaths) {
    const { data, error } = await adminClient.storage.from('invoices').download(path)
    if (!error && data) {
      return await data.text()
    }
  }

  safeLogError('Failed to download invoice from private bucket', { orderNumber })
  throw new Error('Failed to load invoice')
}
