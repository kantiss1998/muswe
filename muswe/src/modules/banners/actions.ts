'use server'

import { revalidateTag, revalidatePath } from 'next/cache'
import { bannerService } from './banner.service'
import { requireAdmin } from '@/lib/auth-guard'

function revalidateBannerCache() {
  try {
    revalidateTag('banners', 'hours')
    revalidateTag('homepage-data', 'hours')
    revalidatePath('/', 'page')
  } catch (err) {
    console.error('Failed to revalidate banner cache:', err)
  }
}

// Public Actions
export async function getActiveBannersAction(page = 1, limit = 20) {
  return bannerService.getActiveBanners(page, limit)
}

// Admin Actions
export async function getAdminBannersAction(page = 1, limit = 20) {
  await requireAdmin()
  return bannerService.adminGetBanners(page, limit)
}

export async function createAdminBannerAction(bannerData: {
  title: string
  subtitle: string | null
  image_url: string
  image_mobile_url: string | null
  link_url: string | null
  position: string
  sort_order: number
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
}) {
  await requireAdmin()
  const res = await bannerService.adminCreateBanner(bannerData)
  if (res.success) revalidateBannerCache()
  return res
}

export async function updateAdminBannerAction(
  bannerId: string,
  bannerData: {
    title?: string
    subtitle: string | null
    image_url: string
    image_mobile_url: string | null
    link_url: string | null
    position: string
    sort_order: number
    is_active: boolean
    starts_at: string | null
    ends_at: string | null
  }
) {
  await requireAdmin()
  const res = await bannerService.adminUpdateBanner(bannerId, bannerData)
  if (res.success) revalidateBannerCache()
  return res
}

export async function deleteAdminBannerAction(bannerId: string) {
  await requireAdmin()
  const res = await bannerService.adminDeleteBanner(bannerId)
  if (res.success) revalidateBannerCache()
  return res
}
