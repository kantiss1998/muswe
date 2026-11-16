'use server'

import { revalidateTag, revalidatePath } from 'next/cache'
import { categoryService } from './category.service'
import { requireAdmin } from '@/lib/auth-guard'

function revalidateCategoryCache() {
  try {
    revalidateTag('categories', 'hours')
    revalidateTag('mega-menu', 'hours')
    revalidateTag('homepage-data', 'hours')
    revalidatePath('/', 'layout')
  } catch (err) {
    console.error('Failed to revalidate category cache:', err)
  }
}

// Public Actions
export async function getActiveCategoriesAction() {
  return categoryService.getActiveCategories()
}

export async function getCategoryBySlugAction(slug: string) {
  return categoryService.getCategoryBySlug(slug)
}

// Admin Actions
export async function getAdminCategoriesAction() {
  await requireAdmin()
  return categoryService.adminGetCategories()
}

export async function createAdminCategoryAction(categoryData: {
  parent_id: string | null
  name: string
  slug: string
  description: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
}) {
  await requireAdmin()
  const res = await categoryService.adminCreateCategory(categoryData)
  if (res.success) revalidateCategoryCache()
  return res
}

export async function updateAdminCategoryAction(
  categoryId: string,
  categoryData: {
    parent_id: string | null
    name: string
    slug: string
    description: string | null
    image_url: string | null
    sort_order: number
    is_active: boolean
  }
) {
  await requireAdmin()
  const res = await categoryService.adminUpdateCategory(categoryId, categoryData)
  if (res.success) revalidateCategoryCache()
  return res
}

export async function deleteAdminCategoryAction(categoryId: string) {
  await requireAdmin()
  const res = await categoryService.adminDeleteCategory(categoryId)
  if (res.success) revalidateCategoryCache()
  return res
}
