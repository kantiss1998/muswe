'use client'

import React, { useState } from 'react'
import { SmartLink as Link } from '@/shared/components'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button, Input, Card } from '@/shared/components'
import { staggerContainer, fadeUpItem } from '@/lib/motion'
import { useGoogleLogin } from '@react-oauth/google'
import toast from 'react-hot-toast'

export default function RegisterPage(): React.JSX.Element {
  const router = useRouter()
  const supabase = createBrowserClient()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !email || !password || !confirmPassword) {
      toast.error('Semua kolom wajib diisi.')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok.')
      return
    }

    if (password.length < 8) {
      toast.error('Kata sandi harus minimal 8 karakter.')
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            phone: phone || null,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      if (data.user) {
        toast.success('Registrasi berhasil! Selamat datang di Muswe')
        router.push('/')
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gagal mendaftar. Silakan coba lagi.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    setIsGoogleLoading(true)
    try {
      const callbackUrl = `${window.location.origin}/auth/callback?next=/`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      })
      if (error) throw error
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mendaftar dengan Google.'
      toast.error(msg)
      setIsGoogleLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card bordered={true} className="w-full max-w-md shadow-lg p-8 md:p-10 border-neutral-200">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div variants={fadeUpItem} className="flex flex-col space-y-2 text-center mb-8">
            <span className="text-xs font-heading font-medium uppercase tracking-[0.3em] text-neutral-400 mb-2">
              MUSWE
            </span>
            <h2 className="text-xl md:text-2xl font-heading font-semibold uppercase tracking-wider text-brand-black">
              Daftar Akun
            </h2>
            <p className="text-sm md:text-xs text-neutral-400 font-sans">
              Lengkapi data di bawah ini untuk bergabung dengan Muswe.
            </p>
          </motion.div>

          <form onSubmit={handleRegister} className="space-y-4">
            <motion.div variants={fadeUpItem}>
              <Input
                label="Nama Lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap Anda"
                required
                autoComplete="name"
              />
            </motion.div>

            <motion.div variants={fadeUpItem}>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                autoComplete="email"
              />
            </motion.div>

            <motion.div variants={fadeUpItem}>
              <Input
                label="Nomor Telepon (Optional)"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812xxxxxxxx"
                autoComplete="tel"
              />
            </motion.div>

            <motion.div variants={fadeUpItem}>
              <Input
                label="Kata Sandi"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                required
                autoComplete="new-password"
              />
            </motion.div>

            <motion.div variants={fadeUpItem}>
              <Input
                label="Konfirmasi Kata Sandi"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi"
                required
                autoComplete="new-password"
              />
            </motion.div>

            <motion.div variants={fadeUpItem}>
              <Button type="submit" variant="primary" className="w-full mt-4" isLoading={isLoading}>
                Daftar
              </Button>
            </motion.div>
          </form>

          <motion.div variants={fadeUpItem} className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider font-heading">
              <span className="bg-white px-3 text-neutral-400">Atau daftar dengan</span>
            </div>
          </motion.div>

          <motion.div variants={fadeUpItem} className="flex justify-center">
            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-neutral-300 rounded-lg text-xs font-heading font-bold uppercase tracking-wider text-brand-black hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isGoogleLoading ? 'Menghubungkan...' : 'Daftar dengan Google'}</span>
            </button>
          </motion.div>

          {/* Footer Link */}
          <motion.div
            variants={fadeUpItem}
            className="text-center mt-8 pt-4 border-t border-neutral-100"
          >
            <p className="text-xs text-neutral-500 font-sans">
              Sudah memiliki akun?{' '}
              <Link href="/masuk" className="text-brand-black font-semibold hover:underline">
                Masuk disini
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </Card>
    </motion.div>
  )
}
