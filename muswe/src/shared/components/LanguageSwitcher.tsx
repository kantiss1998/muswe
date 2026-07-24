'use client'

import React, { useEffect, useState } from 'react'
import { useTranslation } from '@/shared/i18n/useTranslation'
import { Globe } from 'lucide-react'

export function LanguageSwitcher(): React.JSX.Element {
  const { locale, setLocale } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center space-x-1 text-xs text-neutral-500 font-sans px-2 py-1 border border-neutral-200">
        <Globe size={13} className="text-neutral-400" />
        <span>ID</span>
      </div>
    )
  }

  return (
    <div className="flex items-center border border-neutral-200 text-xs font-sans rounded-none overflow-hidden bg-white shadow-xs">
      <button
        type="button"
        onClick={() => setLocale('id')}
        className={`px-2 py-1 flex items-center space-x-1 transition-colors ${
          locale === 'id'
            ? 'bg-brand-black text-white font-bold'
            : 'text-neutral-600 hover:text-brand-black hover:bg-neutral-100'
        }`}
        title="Bahasa Indonesia"
      >
        <span>🇮🇩</span>
        <span>ID</span>
      </button>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`px-2 py-1 flex items-center space-x-1 transition-colors ${
          locale === 'en'
            ? 'bg-brand-black text-white font-bold'
            : 'text-neutral-600 hover:text-brand-black hover:bg-neutral-100'
        }`}
        title="English"
      >
        <span>🇺🇸</span>
        <span>EN</span>
      </button>
    </div>
  )
}
