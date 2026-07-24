import React from 'react'
import { Metadata } from 'next'
import { getActiveCategoriesAction } from '@/modules/categories/actions'
import { CategoriesClient } from './CategoriesClient'

export const metadata: Metadata = {
  title: 'Kategori Produk | Ansania',
  description: 'Jelajahi berbagai kategori produk terbaik dari Ansania',
}

async function getCategories() {
  return await getActiveCategoriesAction()
}

export default async function CategoriesIndexPage(): Promise<React.JSX.Element> {
  const categoriesRes = await getCategories()
  const categories = categoriesRes.data || []
  const parentCategories = categories.filter((cat) => !cat.parent_id)

  return <CategoriesClient parentCategories={parentCategories} />
}
