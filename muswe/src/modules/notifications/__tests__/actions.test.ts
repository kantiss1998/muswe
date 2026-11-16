import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getUserNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from '../actions'
import * as authGuard from '@/lib/auth-guard'
import { notificationService } from '../notification.service'

vi.mock('@/lib/auth-guard')
vi.mock('../notification.service', () => ({
  notificationService: {
    getUserNotifications: vi.fn().mockResolvedValue({ success: true, data: [] }),
    markNotificationRead: vi.fn().mockResolvedValue({ success: true, data: null }),
    markAllNotificationsRead: vi.fn().mockResolvedValue({ success: true, data: null }),
  },
}))

describe('notifications actions auth guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(authGuard, 'requireAuth').mockResolvedValue({
      user: { id: 'user-1' } as any,
      supabase: {} as any,
    })
  })

  it('should reject cross-user notification access', async () => {
    await expect(getUserNotificationsAction('user-2')).rejects.toThrow('Unauthorized')
    await expect(markNotificationReadAction('notif-1', 'user-2')).rejects.toThrow('Unauthorized')
    await expect(markAllNotificationsReadAction('user-2')).rejects.toThrow('Unauthorized')
  })

  it('should allow owner notification access', async () => {
    await getUserNotificationsAction('user-1')
    expect(notificationService.getUserNotifications).toHaveBeenCalledWith('user-1', 1, 20)

    await markNotificationReadAction('notif-1', 'user-1')
    expect(notificationService.markNotificationRead).toHaveBeenCalledWith('notif-1', 'user-1')

    await markAllNotificationsReadAction('user-1')
    expect(notificationService.markAllNotificationsRead).toHaveBeenCalledWith('user-1')
  })
})
