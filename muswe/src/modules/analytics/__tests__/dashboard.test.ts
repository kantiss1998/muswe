import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAdminDashboardStatsAction } from '../actions/dashboard'
import * as authGuard from '@/lib/auth-guard'

vi.mock('@/lib/auth-guard')

describe('getAdminDashboardStatsAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should enforce requireAdmin before querying dashboard stats', async () => {
    vi.spyOn(authGuard, 'requireAdmin').mockRejectedValue(new Error('Forbidden'))
    await expect(getAdminDashboardStatsAction()).rejects.toThrow('Forbidden')
  })
})
