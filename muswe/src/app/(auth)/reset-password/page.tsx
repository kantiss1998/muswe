'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button, Input, Card } from '@/shared/components'
import toast from 'react-hot-toast'

import { useTranslation } from '@/shared/i18n/useTranslation'

export default function ResetPasswordPage(): React.JSX.Element {
  const router = useRouter()
  const supabase = createBrowserClient()
  const { t } = useTranslation()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Ensure user has a valid session (arrived from recovery flow)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const searchParams = new URLSearchParams(window.location.search)

      const error = hashParams.get('error') || searchParams.get('error')
      const errorDescription =
        hashParams.get('error_description') || searchParams.get('error_description')

      if (error) {
        toast.error(
          errorDescription
            ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
            : 'Tautan reset password sudah tidak berlaku atau kadaluarsa.'
        )
        router.push('/lupa-password')
        return
      }
    }

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Sesi tidak valid atau telah kadaluarsa. Silakan minta tautan baru.')
        router.push('/lupa-password')
      }
    }
    checkSession()
  }, [supabase, router])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password || !confirmPassword) {
      toast.error('Semua kolom wajib diisi.')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok.')
      return
    }

    if (password.length < 6) {
      toast.error('Kata sandi harus minimal 6 karakter.')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      toast.success('Kata sandi Anda berhasil diperbarui! Silakan masuk kembali.')

      // Log out to clear recovery session and force login
      await supabase.auth.signOut()

      router.push('/masuk')
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Gagal memperbarui kata sandi. Silakan coba lagi.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card bordered={true} className="w-full max-w-md shadow-lg p-8 md:p-10 border-neutral-200">
          <div className="flex flex-col space-y-2 text-center mb-8">
            <span className="text-xs font-heading font-medium uppercase tracking-[0.3em] text-neutral-400 mb-2">
              MUSWE
            </span>
            <h2 className="text-xl md:text-2xl font-heading font-semibold uppercase tracking-wider text-brand-black">
              {t.auth.resetPasswordTitle}
            </h2>
            <p className="text-sm md:text-xs text-neutral-400 font-sans">
              {t.auth.resetPasswordSubtitle}
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-4">
            <Input
              label={t.auth.newPassword}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
            />

            <Input
              label={t.auth.confirmNewPassword}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t.auth.confirmPasswordPlaceholder}
              required
            />

            <Button type="submit" variant="primary" className="w-full mt-4" isLoading={isLoading}>
              {t.auth.updatePasswordButton}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
