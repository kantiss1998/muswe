import React from 'react'
import { homeService } from '@/modules/home/home.service'
import { HeroSection } from '@/modules/banners/components/HeroSection'
import { MidBannerSection } from '@/modules/banners/components/MidBannerSection'
import { CategorySection } from '@/modules/categories/components/CategorySection'
import { FlashSaleSection } from '@/modules/flash-sales/components/FlashSaleSection'
import { CollectionSpotlight } from '@/modules/collections/components/CollectionSpotlight'
import { FeaturedProductsSection } from '@/modules/products/components/FeaturedProductsSection'
import { RecentlyViewedSection } from '@/modules/products/components/RecentlyViewedSection'

export async function generateMetadata() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.muswe.com'
  return {
    title: 'Muswe - Premium Printed Hijab',
    description:
      'Temukan koleksi kerudung motif terbaik dan eksklusif di Muswe. Belanja mudah, cepat, dan aman.',
    openGraph: {
      title: 'Muswe - Premium Printed Hijab',
      description: 'Temukan koleksi kerudung motif terbaik di Muswe.',
      url: baseUrl,
      type: 'website',
    },
  }
}

export default async function Homepage(): Promise<React.JSX.Element> {
  const {
    banners,
    categories,
    collections,
    flashSale,
    featuredProducts,
    newestProducts,
    col1,
    col2,
    collection1Products,
    collection2Products,
  } = await homeService.getCachedHomepageData()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.muswe.com'

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Muswe',
    url: baseUrl,
    logo: `${baseUrl}/logo/Regular.png`,
    sameAs: ['https://www.instagram.com/muswe', 'https://www.facebook.com/muswe'],
  }

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Muswe',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  const sanitizeJsonLd = (obj: Record<string, unknown>) =>
    JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(websiteJsonLd) }}
      />
      <div className="flex-1 flex flex-col min-h-screen bg-white">
        {/* 1. Banner */}
        <HeroSection banners={banners.filter(b => b.position !== 'mid_banner')} />

        {/* 2. Featured Products (Produk Pilihan) */}
        <FeaturedProductsSection products={featuredProducts} />

        {/* 3. Collection 1 */}
        {col1 && <CollectionSpotlight collection={col1} products={collection1Products} index={0} />}

        {/* Middle Banner */}
        <MidBannerSection banners={banners.filter(b => b.position === 'mid_banner')} />

        {/* 4. Collection 2 */}
        {col2 && <CollectionSpotlight collection={col2} products={collection2Products} variant="dark" index={1} />}

        {/* 2. Kategori Utama (Grid Banner) */}
        {/* <CategorySection categories={categories} /> */}
        
        {/* Additional sections */}
        <FlashSaleSection flashSale={flashSale} />
        <RecentlyViewedSection />
      </div>
    </>
  )
}
