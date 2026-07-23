'use client'

import React, { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/modules/users/stores/authStore'
import { useCartStore } from '@/modules/cart/stores/cartStore'
import { useWishlistStore } from '@/modules/products/stores/wishlistStore'

import { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { safeLogError } from '@/lib/logger'

export function SupabaseProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const supabase = createBrowserClient()
  const router = useRouter()
  const { setUser, setProfile, setLoading, clearAuth } = useAuthStore()
  const lastProcessedUserIdRef = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    setLoading(true)

    const handleUserSession = async (user: User | null) => {
      const userId = user?.id ?? null
      if (lastProcessedUserIdRef.current === userId) {
        setLoading(false)
        return
      }
      lastProcessedUserIdRef.current = userId

      if (user) {
        setUser(user)
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, name, phone, avatar_url, role, is_active, created_at, updated_at')
            .eq('id', user.id)
            .single()

          if (profile) {
            const role = profile.role === 'admin' ? 'admin' : 'customer'
            setProfile({ ...profile, role })
          }
        } catch (error) {
          safeLogError('Error fetching user profile:', error)
        }

        // Non-blocking background sync for cart & wishlist so loading finishes instantly
        useCartStore.getState().syncCart(user.id, true)
        useWishlistStore.getState().syncWishlist(user.id)
      } else {
        clearAuth()
        useWishlistStore.getState().clearWishlist()
        useCartStore.getState().resetCart()
      }
      setLoading(false)
    }

    // Single source of truth auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.push('/reset-password')
      }
      await handleUserSession(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router, setUser, setProfile, setLoading, clearAuth])

  return <>{children}</>
}
