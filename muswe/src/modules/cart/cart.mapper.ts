import { LocalCartItem } from './cart.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDbCartItemToLocal(item: any): LocalCartItem {
  const pv = item.product_variants
  let prod = null
  let imagesList: Array<{ url: string; is_primary: boolean }> = []

  if (pv && !Array.isArray(pv)) {
    prod = pv.products
    if (prod && !Array.isArray(prod)) {
      imagesList = Array.isArray(prod.product_images) ? prod.product_images : []
    }
  }

  const primaryImg =
    imagesList.find((img) => img.is_primary) || (imagesList.length > 0 ? imagesList[0] : null)

  let pvStock = pv && !Array.isArray(pv) && typeof pv.stock === 'number' ? pv.stock : 0
  const pvSku = pv && !Array.isArray(pv) && typeof pv.sku === 'string' ? pv.sku : ''
  let pvPrice = pv && !Array.isArray(pv) && typeof pv.price === 'number' ? pv.price : Number(pv?.price) || 0
  let pvComparePrice =
    pv && !Array.isArray(pv) && pv.compare_price != null ? Number(pv.compare_price) : null
  const pvName = pv && !Array.isArray(pv) && typeof pv.name === 'string' ? pv.name : ''

  // Preserve active flash sale pricing and cap stock to remaining flash sale quota
  if (pv && !Array.isArray(pv) && Array.isArray(pv.flash_sale_items)) {
    const now = Date.now()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeSale = pv.flash_sale_items.find((fsi: any) => {
      const fs = Array.isArray(fsi.flash_sales) ? fsi.flash_sales[0] : fsi.flash_sales
      if (!fs || !fs.is_active) return false
      const startsAt = new Date(fs.starts_at).getTime()
      const endsAt = new Date(fs.ends_at).getTime()
      const hasQuota = Number(fsi.quota) === 0 || Number(fsi.sold_count) < Number(fsi.quota)
      return now >= startsAt && now <= endsAt && hasQuota
    })

    if (activeSale) {
      pvComparePrice = Number(activeSale.original_price) || pvPrice
      pvPrice = Number(activeSale.sale_price)
      if (Number(activeSale.quota) > 0) {
        const remainingQuota = Math.max(0, Number(activeSale.quota) - Number(activeSale.sold_count))
        pvStock = Math.min(pvStock, remainingQuota)
      }
    }
  }

  const prodName = prod && typeof prod.name === 'string' ? prod.name : ''
  const prodSlug = prod && typeof prod.slug === 'string' ? prod.slug : ''

  return {
    id: item.id,
    variantId: item.variant_id,
    productName: prodName,
    variantName: pvName,
    name: `${prodName} - ${pvName}`, // Keep for backward compatibility
    sku: pvSku,
    price: pvPrice,
    comparePrice: pvComparePrice,
    quantity: Math.min(item.quantity, pvStock), // Cap to max stock available
    imageUrl: primaryImg ? primaryImg.url : null,
    slug: prodSlug,
    stock: pvStock,
  }
}
