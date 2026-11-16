import React, { Suspense } from 'react'
import { cacheLife, cacheTag } from 'next/cache'
import { CustomerLayout } from '@/shared/components/CustomerLayout'

import { categoryService } from '@/modules/categories/category.service'
import { collectionService } from '@/modules/collections/collection.service'

async function getCachedMegaMenuData() {
  'use cache'
  cacheLife('hours')
  cacheTag('mega-menu', 'categories', 'collections')

  const [categoriesRes, collectionsRes] = await Promise.all([
    categoryService.getActiveCategories(),
    collectionService.getActiveCollections(1, 4), // Limit collections for mega menu
  ])

  return {
    categories: categoriesRes?.data || [],
    collections: collectionsRes?.data || [],
  }
}

export default async function CustomerGroupLayout({
  children,
}: {
  children: React.ReactNode
}): Promise<React.JSX.Element> {
  const { categories, collections } = await getCachedMegaMenuData()

  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50" />}>
      <CustomerLayout categories={categories} collections={collections}>
        {children}
      </CustomerLayout>
    </Suspense>
  )
}
