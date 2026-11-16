import { cacheLife, cacheTag } from 'next/cache'
import { createStaticClient } from '@/lib/supabase/static'
import { flashSaleService } from './flash-sale.service'

/**
 * Cached active flash sale reader for high-concurrency pages.
 * Uses 'seconds' profile to absorb traffic spikes without hammering Supabase.
 */
export async function getCachedActiveFlashSale() {
  'use cache'
  cacheLife('seconds')
  cacheTag('flash-sales')

  const supabase = createStaticClient()
  return flashSaleService.getActiveFlashSale(supabase)
}
