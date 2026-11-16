'use server'

import { cacheLife, cacheTag, revalidateTag } from 'next/cache'
import { reviewService } from './review.service'
import { requireAdmin, requireAuth } from '@/lib/auth-guard'
import { SubmitReviewParams } from './types'

// Public Actions
export async function getApprovedReviewsAction(productId: string, page = 1, limit = 20) {
  'use cache'
  cacheLife('minutes')
  cacheTag('reviews', `reviews-${productId}`)
  return reviewService.getApprovedReviews(productId, page, limit)
}

// Auth Actions
export async function submitReviewAction(params: Omit<SubmitReviewParams, 'userId'>) {
  const { user } = await requireAuth()
  return reviewService.customerSubmitReview({
    ...params,
    userId: user.id,
  })
}

// Admin Actions
export async function getAdminReviewsAction(page = 1, limit = 20) {
  await requireAdmin()
  return reviewService.adminGetReviews(page, limit)
}

export async function updateAdminReviewStatusAction(
  reviewId: string,
  status: 'pending' | 'approved' | 'rejected' | 'hidden'
) {
  await requireAdmin()
  const res = await reviewService.adminUpdateReviewStatus(reviewId, status)
  if (res.success) {
    revalidateTag('reviews', 'max')
    revalidateTag('products', 'max')
  }
  return res
}

export async function adminReplyToReviewAction(reviewId: string, body: string) {
  const { user } = await requireAdmin()
  const res = await reviewService.adminReplyToReview(reviewId, body, user.id)
  if (res.success) {
    revalidateTag('reviews', 'max')
  }
  return res
}
