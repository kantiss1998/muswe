'use client'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useProducts } from '@/modules/products/hooks/useProducts'
import { ProductCard } from '@/modules/products/components/ProductCard'
import { PageContainer, ProductGridSkeleton, EmptyState, PageHero } from '@/shared/components'

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 260, damping: 25 },
  },
}

import { useTranslation } from '@/shared/i18n/useTranslation'

function SearchResultsContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const { t, isEnglish } = useTranslation()

  const {
    data: dataRes,
    isLoading,
    isError,
  } = useProducts({
    searchQuery: query || undefined,
    limit: 40,
  })

  const products = dataRes?.data || []
  const totalCount = dataRes?.pagination?.total_count || 0

  if (isError) {
    return (
      <div className="bg-white min-h-screen">
        <PageHero
          eyebrow={t.searchPage.eyebrow}
          title={query ? `"${query}"` : t.searchPage.title}
          subtitle={isEnglish ? 'Failed to load search results' : 'Gagal memuat hasil pencarian'}
        />
        <PageContainer className="py-10 page-content">
          <EmptyState
            icon={Search}
            title={t.searchPage.errorTitle}
            description={t.searchPage.errorDesc}
            action={{
              label: t.searchPage.tryAgain,
              onClick: () => window.location.reload(),
            }}
          />
        </PageContainer>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen">
      <PageHero
        eyebrow={t.searchPage.eyebrow}
        title={query ? `"${query}"` : t.searchPage.title}
        subtitle={
          isEnglish
            ? `Found ${totalCount} matching product${totalCount !== 1 ? 's' : ''}.`
            : `Ditemukan ${totalCount} produk yang cocok.`
        }
      />
      <PageContainer className="py-10 page-content">
        {isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={Search}
            title={t.searchPage.notFoundTitle}
            description={
              isEnglish
                ? `No products matched the keyword "${query}".`
                : `Tidak ditemukan produk yang cocok dengan kata kunci "${query}".`
            }
            action={{ label: t.searchPage.browseCatalog, href: '/produk' }}
          />
        ) : (
          <motion.div
            variants={gridVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8"
          >
            {products.map((product) => (
              <motion.div key={product.id} variants={cardVariants}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </PageContainer>
    </div>
  )
}

export default function SearchPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="bg-white min-h-screen py-12">
          <PageContainer>
            <ProductGridSkeleton count={8} />
          </PageContainer>
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  )
}
