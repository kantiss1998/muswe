import { describe, it, expect } from 'vitest'
import { mapDbCartItemToLocal } from '../cart.mapper'

describe('cart.mapper', () => {
  const now = Date.now()
  const activeStart = new Date(now - 60_000).toISOString()
  const activeEnd = new Date(now + 60_000).toISOString()
  const expiredEnd = new Date(now - 10_000).toISOString()

  const baseDbItem = {
    id: 'ci-1',
    variant_id: 'var-1',
    quantity: 2,
    product_variants: {
      id: 'var-1',
      sku: 'SKU-001',
      name: 'Hitam - All Size',
      price: 150000,
      compare_price: null,
      stock: 10,
      products: {
        name: 'Hijab Muswe',
        slug: 'hijab-muswe',
        product_images: [{ url: 'https://cdn.muswe.com/1.jpg', is_primary: true }],
      },
      flash_sale_items: [],
    },
  }

  it('should use active flash sale price and original_price as comparePrice', () => {
    const item = {
      ...baseDbItem,
      product_variants: {
        ...baseDbItem.product_variants,
        flash_sale_items: [
          {
            id: 'fsi-1',
            sale_price: 50000,
            original_price: 150000,
            quota: 20,
            sold_count: 5,
            flash_sales: {
              is_active: true,
              starts_at: activeStart,
              ends_at: activeEnd,
            },
          },
        ],
      },
    }

    const mapped = mapDbCartItemToLocal(item)
    expect(mapped.price).toBe(50000)
    expect(mapped.comparePrice).toBe(150000)
    expect(mapped.quantity).toBe(2)
  })

  it('should fallback to regular price if flash sale quota is exhausted', () => {
    const item = {
      ...baseDbItem,
      product_variants: {
        ...baseDbItem.product_variants,
        flash_sale_items: [
          {
            id: 'fsi-1',
            sale_price: 50000,
            original_price: 150000,
            quota: 20,
            sold_count: 20,
            flash_sales: {
              is_active: true,
              starts_at: activeStart,
              ends_at: activeEnd,
            },
          },
        ],
      },
    }

    const mapped = mapDbCartItemToLocal(item)
    expect(mapped.price).toBe(150000)
    expect(mapped.comparePrice).toBeNull()
  })

  it('should fallback to regular price if flash sale is expired', () => {
    const item = {
      ...baseDbItem,
      product_variants: {
        ...baseDbItem.product_variants,
        flash_sale_items: [
          {
            id: 'fsi-1',
            sale_price: 50000,
            original_price: 150000,
            quota: 20,
            sold_count: 0,
            flash_sales: {
              is_active: true,
              starts_at: activeStart,
              ends_at: expiredEnd,
            },
          },
        ],
      },
    }

    const mapped = mapDbCartItemToLocal(item)
    expect(mapped.price).toBe(150000)
  })

  it('should cap quantity and stock to remaining flash sale quota when quota > 0', () => {
    const item = {
      ...baseDbItem,
      quantity: 5,
      product_variants: {
        ...baseDbItem.product_variants,
        stock: 100,
        flash_sale_items: [
          {
            id: 'fsi-1',
            sale_price: 50000,
            original_price: 150000,
            quota: 10,
            sold_count: 8, // remaining quota = 2
            flash_sales: {
              is_active: true,
              starts_at: activeStart,
              ends_at: activeEnd,
            },
          },
        ],
      },
    }

    const mapped = mapDbCartItemToLocal(item)
    expect(mapped.price).toBe(50000)
    expect(mapped.stock).toBe(2)
    expect(mapped.quantity).toBe(2)
  })
})
