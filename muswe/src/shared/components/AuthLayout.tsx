import { SmartLink as Link } from '@/shared/components'
import React from 'react'
import Image from 'next/image'
import { CurrentYear } from '@/shared/components/CurrentYear'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps): React.JSX.Element {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative bg-brand-black overflow-hidden">
        <Image
          src="/login-bg.jpg"
          alt="Muswe Background"
          fill
          className="object-cover"
          quality={100}
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center bg-brand-cream py-12 px-4 sm:px-6 lg:px-8 section-texture">
        <Link
          href="/"
          className="mb-8 lg:hidden font-heading text-sm font-bold tracking-[0.1em] text-brand-black uppercase hover:text-brand-gold transition-colors"
        >
          MUSWE
        </Link>
        {children}
      </div>
    </div>
  )
}
