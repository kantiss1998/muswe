import React from 'react'
import { motion } from 'framer-motion'
import { Key } from 'lucide-react'
import { Input, Button } from '@/shared/components'

import { useTranslation } from '@/shared/i18n/useTranslation'

interface ChangePasswordFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itemVariants: any
  newPassword: string
  setNewPassword: (val: string) => void
  confirmNewPassword: string
  setConfirmNewPassword: (val: string) => void
  handleUpdatePassword: (e: React.FormEvent) => void
  isSavingPassword: boolean
}

export function ChangePasswordForm({
  itemVariants,
  newPassword,
  setNewPassword,
  confirmNewPassword,
  setConfirmNewPassword,
  handleUpdatePassword,
  isSavingPassword,
}: ChangePasswordFormProps): React.JSX.Element {
  const { isEnglish } = useTranslation()

  return (
    <motion.div
      variants={itemVariants}
      className="border border-neutral-200 p-6 sm:p-8 rounded-none bg-white shadow-sm hover:shadow-md transition-shadow duration-300 card-hover-lift gold-border-hover relative overflow-hidden group"
    >
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand-gold to-brand-gold-light" />
      <h2 className="text-sm uppercase tracking-wider font-heading font-bold text-brand-black mb-6 flex items-center">
        <motion.div whileHover={{ y: [0, -2, 2, -2, 0] }} className="mr-2">
          <Key
            size={16}
            className="text-neutral-500 group-hover:text-brand-black transition-colors"
          />
        </motion.div>
        {isEnglish ? 'Change Password' : 'Ganti Kata Sandi'}
      </h2>

      <form onSubmit={handleUpdatePassword} className="space-y-6">
        <Input
          label={isEnglish ? 'New Password*' : 'Kata Sandi Baru*'}
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={isEnglish ? 'Minimum 8 characters' : 'Minimal 8 karakter'}
          required
        />

        <Input
          label={isEnglish ? 'Confirm New Password*' : 'Konfirmasi Kata Sandi Baru*'}
          type="password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          placeholder={isEnglish ? 'Repeat new password' : 'Ulangi kata sandi baru'}
          required
        />

        <div className="pt-4 border-t border-neutral-100 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSavingPassword}
            className="text-xs uppercase tracking-wider font-semibold py-3 px-6"
          >
            {isEnglish ? 'Update Password' : 'Perbarui Kata Sandi'}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
