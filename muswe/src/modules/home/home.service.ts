import { cacheLife, cacheTag } from 'next/cache'
import { createStaticClient } from '@/lib/supabase/static'
import { getActiveBannersAction } from '@/modules/banners/actions'
import { getActiveCategoriesAction } from '@/modules/categories/actions'
import {
  getActiveCollectionsAction,
  getCollectionBySlugAction,
} from '@/modules/collections/actions'
import { flashSaleService } from '@/modules/flash-sales/flash-sale.service'
import { getProductsAction } from '@/modules/products/actions'
import { settingsService } from '@/modules/settings/settings.service'

export class HomeService {
  getCachedHomepageData = async () => {
    // 'use cache'
    // cacheLife('hours')
    // cacheTag(
    //   'banners',
    //   'categories',
    //   'collections',
    //   'flash-sales',
    //   'products',
    //   'settings',
    //   'homepage-data'
    // )


    const supabase = createStaticClient()

    const [
      bannersRes,
      categoriesRes,
      collectionsRes,
      flashSaleRes,
      featuredResponse,
      newestResponse,
      settingsRes,
    ] = await Promise.all([
      getActiveBannersAction(),
      getActiveCategoriesAction(),
      getActiveCollectionsAction(),
      flashSaleService.getActiveFlashSale(supabase),
      getProductsAction({ sortBy: 'featured', limit: 4 }),
      getProductsAction({ sortBy: 'newest', limit: 4 }),
      settingsService.getSiteSettings(),
    ])

    const settings = settingsRes.data || []
    const collections = collectionsRes.data || []
    const flashSale = flashSaleRes.data || null
    const spotlight1Slug =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      settings.find((s: any) => s.key === 'homepage_spotlight_collection_1')?.value || ''
    const spotlight2Slug =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      settings.find((s: any) => s.key === 'homepage_spotlight_collection_2')?.value || ''

    const [col1Res, col2Res] = await Promise.all([
      spotlight1Slug ? getCollectionBySlugAction(spotlight1Slug) : Promise.resolve(null),
      spotlight2Slug ? getCollectionBySlugAction(spotlight2Slug) : Promise.resolve(null),
    ])

    const col1 = col1Res?.data || collections[0] || null
    const col2 = col2Res?.data || collections[1] || null

    const [collection1Products, collection2Products] = await Promise.all([
      col1
        ? getProductsAction({ collectionSlug: col1.slug, limit: 4 })
        : Promise.resolve({ data: [], success: true }),
      col2
        ? getProductsAction({ collectionSlug: col2.slug, limit: 4 })
        : Promise.resolve({ data: [], success: true }),
    ])

      const mockProducts = [
        {
          id: 'mock-1',
          slug: 'gamis-arabian-black',
          name: 'Gamis Arabian Black',
          price: 499000,
          compare_at_price: null,
          minPrice: 499000,
          maxPrice: 499000,
          comparePrice: null,
          primaryImage: 'https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?q=80&w=600&auto=format&fit=crop',
          hoverImage: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?q=80&w=600&auto=format&fit=crop',
          discountPercent: null,
          hasMultipleColors: false,
          sizeVariants: [{ id: 'v1', name: 'All Size', price: 499000, stock: 10, sku: 'GAM-01', compare_price: null, weight_gram: 500, is_active: true }],
          product_variants: [{ id: 'v1', name: 'All Size', price: 499000, stock: 10, sku: 'GAM-01', compare_price: null, weight_gram: 500, is_active: true }],
          product_images: [],
          status: 'published',
          stock_status: 'in_stock',
          is_new: true,
          is_featured: true,
          category_id: 'c1',
          created_at: '2024-01-01T00:00:00.000Z',
          categories: { name: 'Gamis', slug: 'gamis' }
        },
        {
          id: 'mock-2',
          slug: 'hijab-silk-gold',
          name: 'Hijab Silk Premium Gold',
          price: 199000,
          compare_at_price: 249000,
          minPrice: 199000,
          maxPrice: 199000,
          comparePrice: 249000,
          primaryImage: 'https://images.unsplash.com/photo-1616428800262-601e309fc665?q=80&w=600&auto=format&fit=crop',
          hoverImage: 'https://images.unsplash.com/photo-1616428800537-883aeb0b5c1f?q=80&w=600&auto=format&fit=crop',
          discountPercent: 20,
          hasMultipleColors: false,
          sizeVariants: [{ id: 'v2', name: 'Standard', price: 199000, stock: 5, sku: 'HIJ-01', compare_price: 249000, weight_gram: 200, is_active: true }],
          product_variants: [{ id: 'v2', name: 'Standard', price: 199000, stock: 5, sku: 'HIJ-01', compare_price: 249000, weight_gram: 200, is_active: true }],
          product_images: [],
          status: 'published',
          stock_status: 'in_stock',
          is_new: true,
          is_featured: false,
          category_id: 'c2',
          created_at: '2024-01-01T00:00:00.000Z',
          categories: { name: 'Hijab', slug: 'hijab' }
        },
        {
          id: 'mock-3',
          slug: 'mukena-sutra-white',
          name: 'Mukena Sutra Putih',
          price: 799000,
          compare_at_price: null,
          minPrice: 799000,
          maxPrice: 799000,
          comparePrice: null,
          primaryImage: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?q=80&w=600&auto=format&fit=crop',
          hoverImage: null,
          discountPercent: null,
          hasMultipleColors: false,
          sizeVariants: [{ id: 'v3', name: 'All Size', price: 799000, stock: 15, sku: 'MUK-01', compare_price: null, weight_gram: 800, is_active: true }],
          product_variants: [{ id: 'v3', name: 'All Size', price: 799000, stock: 15, sku: 'MUK-01', compare_price: null, weight_gram: 800, is_active: true }],
          product_images: [],
          status: 'published',
          stock_status: 'in_stock',
          is_new: false,
          is_featured: true,
          category_id: 'c3',
          created_at: '2024-01-01T00:00:00.000Z',
          categories: { name: 'Mukena', slug: 'mukena' }
        },
        {
          id: 'mock-4',
          slug: 'khimar-syari-maroon',
          name: 'Khimar Syari Maroon',
          price: 299000,
          compare_at_price: null,
          minPrice: 299000,
          maxPrice: 299000,
          comparePrice: null,
          primaryImage: 'https://images.unsplash.com/photo-1598555811796-03c00473e3bc?q=80&w=600&auto=format&fit=crop',
          hoverImage: null,
          discountPercent: null,
          hasMultipleColors: false,
          sizeVariants: [{ id: 'v4', name: 'All Size', price: 299000, stock: 8, sku: 'KHI-01', compare_price: null, weight_gram: 300, is_active: true }],
          product_variants: [{ id: 'v4', name: 'All Size', price: 299000, stock: 8, sku: 'KHI-01', compare_price: null, weight_gram: 300, is_active: true }],
          product_images: [],
          status: 'published',
          stock_status: 'in_stock',
          is_new: true,
          is_featured: false,
          category_id: 'c4',
          created_at: '2024-01-01T00:00:00.000Z',
          categories: { name: 'Khimar', slug: 'khimar' }
        }
      ]

      const mockBanners = [
        {
          id: 'banner-1',
          title: 'Lebaran Collection 2026',
          subtitle: 'Koleksi Terbaru',
          image_url: 'https://images.unsplash.com/photo-1598555811796-03c00473e3bc?q=80&w=1920&auto=format&fit=crop',
          link_url: '/collections/lebaran-2026',
          is_active: true,
          position: 'hero',
          sort_order: 1,
          created_at: '2024-01-01T00:00:00.000Z',
          ends_at: null,
          image_mobile_url: null,
          starts_at: null
        },
        {
          id: 'banner-2',
          title: 'Premium Silk Hijab',
          subtitle: 'Mewah & Bold',
          image_url: 'https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?q=80&w=1920&auto=format&fit=crop',
          link_url: '/kategori/hijab',
          is_active: true,
          position: 'hero',
          sort_order: 2,
          created_at: '2024-01-01T00:00:00.000Z',
          ends_at: null,
          image_mobile_url: null,
          starts_at: null
        }
      ]

      const mockCategories = [
        { id: 'cat-1', name: 'Hijab', slug: 'hijab', image_url: 'https://images.unsplash.com/photo-1621251912999-5285fb70c8c4?q=80&w=800&auto=format&fit=crop', parent_id: null, description: null, is_active: true, sort_order: 1 },
        { id: 'cat-2', name: 'Gamis', slug: 'gamis', image_url: 'https://images.unsplash.com/photo-1620010398687-0b1a0302dcce?q=80&w=800&auto=format&fit=crop', parent_id: null, description: null, is_active: true, sort_order: 2 },
        { id: 'cat-3', name: 'Mukena', slug: 'mukena', image_url: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?q=80&w=800&auto=format&fit=crop', parent_id: null, description: null, is_active: true, sort_order: 3 },
        { id: 'cat-4', name: 'Khimar', slug: 'khimar', image_url: 'https://images.unsplash.com/photo-1598555811796-03c00473e3bc?q=80&w=800&auto=format&fit=crop', parent_id: null, description: null, is_active: true, sort_order: 4 }
      ]

      return {
        banners: bannersRes.data?.length ? bannersRes.data : mockBanners,
        categories: categoriesRes.data?.length ? categoriesRes.data : mockCategories,
        collections,
        flashSale,
        featuredProducts: featuredResponse.data?.length ? featuredResponse.data : mockProducts,
        newestProducts: newestResponse.data?.length ? newestResponse.data : mockProducts,
        col1,
        col2,
        collection1Products: collection1Products.data?.length ? collection1Products.data : mockProducts,
        collection2Products: collection2Products.data?.length ? collection2Products.data : mockProducts,
      }
  }
}

export const homeService = new HomeService()
