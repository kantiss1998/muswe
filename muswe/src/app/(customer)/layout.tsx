import React, { Suspense } from 'react'
import { CustomerLayout } from '@/shared/components/CustomerLayout'

import { getActiveCategoriesAction } from '@/modules/categories/actions'
import { getActiveCollectionsAction } from '@/modules/collections/actions'

export default async function CustomerGroupLayout({
  children,
}: {
  children: React.ReactNode
}): Promise<React.JSX.Element> {
  // Fetch data for Mega Menu
  const [categoriesRes, collectionsRes] = await Promise.all([
    getActiveCategoriesAction(),
    getActiveCollectionsAction(1, 4), // Limit collections for mega menu
  ])

  const categories = categoriesRes?.data || []
  const collections = collectionsRes?.data || []

  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50" />}>
      <CustomerLayout categories={categories} collections={collections}>
        {children}
      </CustomerLayout>
    </Suspense>
  )
}
