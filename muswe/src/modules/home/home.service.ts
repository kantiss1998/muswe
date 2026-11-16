import { cacheLife, cacheTag } from 'next/cache'
import { bannerService } from '@/modules/banners/banner.service'
import { categoryService } from '@/modules/categories/category.service'
import { collectionService } from '@/modules/collections/collection.service'
import { getCachedActiveFlashSale } from '@/modules/flash-sales/flash-sale.cache'
import { productService } from '@/modules/products/product.service'
import { settingsService } from '@/modules/settings/settings.service'
import { paginated } from '@/lib/api-response'

async function getCachedStaticHomepageData() {
  'use cache'
  cacheLife('hours')
  cacheTag('homepage-data', 'banners', 'categories', 'collections', 'products', 'settings')

  const [
    bannersRes,
    categoriesRes,
    collectionsRes,
    featuredResponse,
    newestResponse,
    settingsRes,
  ] = await Promise.all([
    bannerService.getActiveBanners(),
    categoryService.getActiveCategories(),
    collectionService.getActiveCollections(),
    productService.getProducts({ sortBy: 'featured', limit: 4 }),
    productService.getProducts({ sortBy: 'newest', limit: 4 }),
    settingsService.getSiteSettings(),
  ])

  const settings = settingsRes.data || []
  const collections = collectionsRes.data || []
  const spotlight1Slug =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings.find((s: any) => s.key === 'homepage_spotlight_collection_1')?.value || ''
  const spotlight2Slug =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings.find((s: any) => s.key === 'homepage_spotlight_collection_2')?.value || ''

  const [col1Res, col2Res] = await Promise.all([
    spotlight1Slug ? collectionService.getCollectionBySlug(spotlight1Slug) : Promise.resolve(null),
    spotlight2Slug ? collectionService.getCollectionBySlug(spotlight2Slug) : Promise.resolve(null),
  ])

  const col1 = col1Res?.data || collections[0] || null
  const col2 = col2Res?.data || collections[1] || null

  const [collection1Products, collection2Products] = await Promise.all([
    col1
      ? productService.getProducts({ collectionSlug: col1.slug, limit: 4 })
      : Promise.resolve(paginated([], 1, 4, 0)),
    col2
      ? productService.getProducts({ collectionSlug: col2.slug, limit: 4 })
      : Promise.resolve(paginated([], 1, 4, 0)),
  ])

  return {
    banners: bannersRes.data || [],
    categories: categoriesRes.data || [],
    collections,
    featuredProducts: featuredResponse.data || [],
    newestProducts: newestResponse.data || [],
    col1,
    col2,
    collection1Products: collection1Products.data || [],
    collection2Products: collection2Products.data || [],
  }
}

export class HomeService {
  getCachedHomepageData = async () => {
    const [staticData, flashSaleRes] = await Promise.all([
      getCachedStaticHomepageData(),
      getCachedActiveFlashSale(),
    ])

    return {
      ...staticData,
      flashSale: flashSaleRes.data || null,
    }
  }
}

export const homeService = new HomeService()
