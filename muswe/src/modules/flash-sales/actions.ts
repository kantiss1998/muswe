'use server'

import { revalidateTag, revalidatePath } from 'next/cache'
import { flashSaleService } from './flash-sale.service'
import { requireAdmin } from '@/lib/auth-guard'

function revalidateFlashSaleCache() {
  try {
    revalidateTag('flash-sales', 'seconds')
    revalidatePath('/', 'layout')
    revalidatePath('/flash-sale', 'page')
  } catch (err) {
    console.error('Failed to revalidate flash sale cache:', err)
  }
}

export async function adminGetFlashSalesAction(page = 1, limit = 20) {
  await requireAdmin()
  return flashSaleService.adminGetFlashSales(page, limit)
}

export async function adminCreateFlashSaleAction(
  saleData: {
    name: string
    description: string | null
    banner_url: string | null
    starts_at: string
    ends_at: string
    is_active: boolean
  },
  items: {
    variant_id: string
    original_price: number
    sale_price: number
    quota: number
  }[]
) {
  await requireAdmin()
  const res = await flashSaleService.adminCreateFlashSale(saleData, items)
  if (res.success) revalidateFlashSaleCache()
  return res
}

export async function adminUpdateFlashSaleAction(
  saleId: string,
  saleData: {
    name: string
    description: string | null
    banner_url: string | null
    starts_at: string
    ends_at: string
    is_active: boolean
  },
  items: {
    variant_id: string
    original_price: number
    sale_price: number
    quota: number
  }[]
) {
  await requireAdmin()
  const res = await flashSaleService.adminUpdateFlashSale(saleId, saleData, items)
  if (res.success) revalidateFlashSaleCache()
  return res
}

export async function adminDeleteFlashSaleAction(saleId: string) {
  await requireAdmin()
  const res = await flashSaleService.adminDeleteFlashSale(saleId)
  if (res.success) revalidateFlashSaleCache()
  return res
}
