'use server'

import { revalidateTag, revalidatePath } from 'next/cache'
import { collectionService } from './collection.service'
import { requireAdmin } from '@/lib/auth-guard'

function revalidateCollectionCache() {
  try {
    revalidateTag('collections', 'hours')
    revalidateTag('mega-menu', 'hours')
    revalidateTag('homepage-data', 'hours')
    revalidatePath('/', 'layout')
  } catch (err) {
    console.error('Failed to revalidate collection cache:', err)
  }
}

// Public Actions
export async function getActiveCollectionsAction(page = 1, limit = 20) {
  return collectionService.getActiveCollections(page, limit)
}

export async function getCollectionBySlugAction(slug: string) {
  return collectionService.getCollectionBySlug(slug)
}

// Admin Actions
export async function getAdminCollectionsAction(page = 1, limit = 20) {
  await requireAdmin()
  return collectionService.adminGetCollections(page, limit)
}

export async function createAdminCollectionAction(
  collectionData: {
    name: string
    slug: string
    description: string | null
    image_url: string | null
    sort_order: number
    is_active: boolean
    starts_at: string | null
    ends_at: string | null
  },
  productIds: string[]
) {
  await requireAdmin()
  const res = await collectionService.adminCreateCollection(collectionData, productIds)
  if (res.success) revalidateCollectionCache()
  return res
}

export async function updateAdminCollectionAction(
  collectionId: string,
  collectionData: {
    name: string
    slug: string
    description: string | null
    image_url: string | null
    sort_order: number
    is_active: boolean
    starts_at: string | null
    ends_at: string | null
  },
  productIds: string[]
) {
  await requireAdmin()
  const res = await collectionService.adminUpdateCollection(collectionId, collectionData, productIds)
  if (res.success) revalidateCollectionCache()
  return res
}

export async function deleteAdminCollectionAction(collectionId: string) {
  await requireAdmin()
  const res = await collectionService.adminDeleteCollection(collectionId)
  if (res.success) revalidateCollectionCache()
  return res
}
