import { DEFAULT_WEIGHT_GRAM } from '@/lib/constants'
import { shippingService } from './shipping.service'
import type { CreateOrderParams } from '@/modules/orders/types'

export type CartItemWithWeight = {
  quantity: number
  product_variants?: {
    weight_gram?: number
    products?: { weight_gram?: number } | { weight_gram?: number }[]
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function validateAndGetShippingRate(
  postalCode: string,
  totalWeight: number,
  params: CreateOrderParams,
  countryCode?: string
) {
  const shippingRes = await shippingService.calculateShippingRates(
    postalCode,
    totalWeight,
    undefined,
    countryCode
  )
  if (!shippingRes.success || !shippingRes.data) return undefined
  const validRates = shippingRes.data

  // Try matching by shippingRateId first (exact match, most reliable)
  if (params.shippingRateId) {
    const byId = validRates.find((r) => r.id === params.shippingRateId)
    if (byId) return byId
  }

  // Fallback: match by courierName. The stored courierName may be in various formats
  // (e.g. "jne_reg", "JNE", "JNE (Regular)"). Try multiple strategies.
  if (params.courierName) {
    const lowerParam = params.courierName.toLowerCase()

    // 1. Exact match on id (composite key like "jne_reg")
    const byServiceCode = validRates.find((r) => r.id.toLowerCase() === lowerParam)
    if (byServiceCode) return byServiceCode

    // 2. Exact courier_service_code match
    const byCode = validRates.find(
      (r) => r.courier_service_code.toLowerCase() === lowerParam
    )
    if (byCode) return byCode

    // 3. courier_name contains the stored param or vice versa
    const byPartial = validRates.find(
      (r) =>
        r.courier_name.toLowerCase().includes(lowerParam) ||
        lowerParam.includes(r.courier_code.toLowerCase())
    )
    if (byPartial) return byPartial
  }

  return undefined
}

export function calculateCartWeight(cartItems: CartItemWithWeight[]): number {
  return cartItems.reduce((acc, item) => {
    const variant = item.product_variants
    const product = Array.isArray(variant?.products) ? variant.products[0] : variant?.products

    const weight = variant?.weight_gram ?? product?.weight_gram ?? DEFAULT_WEIGHT_GRAM
    const parsedWeight = Number(weight) || DEFAULT_WEIGHT_GRAM

    return acc + parsedWeight * (item.quantity || 1)
  }, 0)
}
