'use server'

import { revalidateTag, revalidatePath } from 'next/cache'
import { settingsService } from './settings.service'
import { requireAdmin } from '@/lib/auth-guard'
import type { SiteSetting } from './types'

function revalidateSettingsCache() {
  try {
    revalidateTag('settings', 'hours')
    revalidateTag('mega-menu', 'hours')
    revalidateTag('homepage-data', 'hours')
    revalidatePath('/', 'layout')
  } catch (err) {
    console.error('Failed to revalidate settings cache:', err)
  }
}

export async function adminGetSettingsAction() {
  await requireAdmin()
  return settingsService.adminGetSettings()
}

export async function adminUpdateSettingsAction(settings: Record<string, string>) {
  await requireAdmin()
  const res = await settingsService.adminUpdateSettings(settings)
  if (res.success) revalidateSettingsCache()
  return res
}

export async function adminUpsertSettingsAction(settings: SiteSetting[]) {
  await requireAdmin()
  const res = await settingsService.adminUpsertSettings(settings)
  if (res.success) revalidateSettingsCache()
  return res
}

export async function getSiteSettingsAction() {
  return settingsService.getSiteSettings()
}
