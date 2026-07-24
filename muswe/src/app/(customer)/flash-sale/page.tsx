import React from 'react'
import { cacheLife, cacheTag } from 'next/cache'
import { createStaticClient } from '@/lib/supabase/static'
import { flashSaleService } from '@/modules/flash-sales/flash-sale.service'
import { FlashSaleSection } from '@/modules/flash-sales/components/FlashSaleSection'
import { PageHero, PageContainer, EmptyState } from '@/shared/components'

async function getCachedFlashSale() {
  'use cache'
  cacheLife('minutes')
  cacheTag('flash-sales')

  const supabase = createStaticClient()
  return flashSaleService.getActiveFlashSale(supabase)
}

import { FlashSaleClient } from './FlashSaleClient'

export default async function FlashSalePage(): Promise<React.JSX.Element> {
  const flashSaleResponse = await getCachedFlashSale()
  const flashSale = flashSaleResponse.data

  return <FlashSaleClient flashSale={flashSale} />
}
