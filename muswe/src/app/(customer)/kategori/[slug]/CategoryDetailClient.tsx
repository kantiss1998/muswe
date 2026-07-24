'use client'

import React from 'react'
import Image from 'next/image'
import { PageContainer, PageHero, EmptyState } from '@/shared/components'
import { ProductCard } from '@/modules/products/components/ProductCard'
import { useTranslation } from '@/shared/i18n/useTranslation'
import type { Category } from '@/modules/categories/types'
import type { ProductListItem } from '@/modules/products/types'

interface CategoryDetailClientProps {
  category: Category
  products: ProductListItem[]
}

export function CategoryDetailClient({
  category,
  products,
}: CategoryDetailClientProps): React.JSX.Element {
  const { isEnglish } = useTranslation()

  return (
    <div className="bg-white min-h-screen">
      {category.image_url ? (
        <div className="relative h-[35vh] md:h-[45vh] w-full bg-neutral-100 overflow-hidden border-b border-neutral-200">
          <Image
            src={category.image_url}
            alt={category.name}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 gradient-overlay-dark" />
          <div
            className="absolute inset-0 section-texture opacity-20 pointer-events-none"
            aria-hidden
          />
          <div className="absolute inset-0 flex items-end">
            <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pb-10 md:pb-14">
              <span className="inline-block text-xs uppercase tracking-[0.1em] font-heading font-medium text-brand-gold-light">
                {isEnglish ? 'Curated Category' : 'Kategori Pilihan'}
              </span>
              <h1 className="text-2xl md:text-4xl font-heading font-light uppercase tracking-wider text-white mt-2 leading-tight">
                {category.name}
              </h1>
              <div className="w-12 h-px bg-brand-gold-light mt-3" />
              {category.description && (
                <p className="text-xs text-neutral-300 font-sans max-w-lg leading-relaxed mt-3">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <PageHero
          eyebrow={isEnglish ? 'Curated Category' : 'Kategori Pilihan'}
          title={category.name}
          subtitle={category.description || undefined}
        />
      )}

      <PageContainer className="py-12 md:py-16 page-content">
        {products.length === 0 ? (
          <EmptyState
            icon="PackageSearch"
            title={isEnglish ? 'No Products Available' : 'Belum Ada Produk'}
            description={
              isEnglish
                ? 'There are no products in this category yet. Try exploring other categories.'
                : 'Belum ada produk dalam kategori ini. Coba jelajahi kategori lain.'
            }
            action={{
              label: isEnglish ? 'View All Products' : 'Lihat Semua Produk',
              href: '/produk',
            }}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 animate-fade-in">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  )
}
