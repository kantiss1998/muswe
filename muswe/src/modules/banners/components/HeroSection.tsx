'use client'

import React, { useState, useEffect } from 'react'
import { getImageProps } from 'next/image'
import { SmartLink as Link } from '@/shared/components'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Banner } from '@/modules/banners/types'
import { Button } from '@/shared/components'
import { cn } from '@/lib/utils'

import { useTranslation } from '@/shared/i18n/useTranslation'

interface HeroSectionProps {
  banners: Banner[]
}

export function HeroSection({ banners: allBanners }: HeroSectionProps): React.JSX.Element {
  const { isEnglish } = useTranslation()
  const banners = React.useMemo(() => allBanners.filter(b => !!b.image_url), [allBanners])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (banners.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 6000) // 6 seconds auto-rotate

    return () => clearInterval(interval)
  }, [banners])

  if (banners.length === 0) {
    // Elegant premium hijab fallback placeholder banner
    return (
      <div className="relative w-full bg-brand-cream flex items-center justify-center aspect-[21/9] md:aspect-[16/9]">
        <div className="text-center space-y-4 max-w-lg px-4">
          <span className="text-xs uppercase tracking-wider font-heading font-medium text-neutral-400">
            {isEnglish ? 'New Arrival' : 'Koleksi Baru'}
          </span>
          <h2 className="text-3xl md:text-5xl font-heading font-light uppercase tracking-wider text-brand-black leading-tight">
            {isEnglish ? 'Elegance in Simplicity' : 'Elegan dalam Kesederhanaan'}
          </h2>
          <p className="text-xs text-neutral-500 font-sans max-w-sm mx-auto">
            {isEnglish
              ? 'Discover luxury modest apparel designed with modern minimalism and ultimate comfort.'
              : 'Temukan paduan gaya modest modern yang minimalis, nyaman, dan premium untuk aktivitas sehari-hari Anda.'}
          </p>
          <div className="pt-4">
            <Link href="/produk">
              <Button variant="primary" size="md">
                {isEnglish ? 'Shop Now' : 'Belanja Sekarang'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const currentBanner = banners[currentIndex]

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length)
  }

  const commonProps = {
    alt: currentBanner.title || '',
    fill: true,
    sizes: '100vw',
    priority: true,
    quality: 100,
    className: 'object-cover',
    style: {
      width: '100%',
      height: '100%',
      position: 'absolute' as const,
      inset: 0,
    },
  }

  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({
    ...commonProps,
    src: currentBanner.image_url,
  })

  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    props: { srcSet: mobileSrcSet, alt, ...restMobile },
  } = getImageProps({
    ...commonProps,
    src: currentBanner.image_mobile_url || currentBanner.image_url,
  })

  return (
    <div
      className="relative w-full h-[85vh] lg:h-screen min-h-[600px] overflow-hidden bg-brand-black"
      role="region"
      aria-roledescription="carousel"
      aria-label="Koleksi Banner Utama"
    >
      {/* Banner Slide */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.8 } }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          className="relative w-full h-full"
          role="group"
          aria-roledescription="slide"
          aria-label={`Slide ${currentIndex + 1} dari ${banners.length}`}
        >
          <picture className="block w-full h-auto">
            <source media="(min-width: 768px)" srcSet={desktopSrcSet} sizes="100vw" />
            <img
              src={restMobile.src}
              srcSet={mobileSrcSet}
              sizes="100vw"
              alt={alt || 'Banner'}
              className="block w-full h-auto"
            />
          </picture>

          {/* Elegant overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/60 via-neutral-900/25 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/40 via-transparent to-neutral-900/10" />

          <div className="absolute inset-0 flex items-end pb-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-md md:max-w-xl text-left space-y-4 md:space-y-6">
                <motion.span
                  initial={{ y: 20, opacity: 0 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    transition: { delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                  }}
                  className="inline-block text-xs font-sans font-semibold uppercase tracking-[0.1em] text-white"
                >
                  {currentBanner.subtitle || 'Koleksi Terbaru'}
                </motion.span>

                <motion.h1
                  initial={{ y: 30, opacity: 0 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    transition: { delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                  }}
                  className="text-4xl md:text-6xl lg:text-7xl font-heading font-medium tracking-wide text-white leading-tight"
                >
                  {currentBanner.title}
                </motion.h1>

                {currentBanner.link_url && (
                  <motion.div
                    initial={{ y: 25, opacity: 0 }}
                    animate={{
                      y: 0,
                      opacity: 1,
                      transition: { delay: 0.7, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                    }}
                    className="pt-4"
                  >
                    <Link href={currentBanner.link_url}>
                      <Button variant="outline" size="md" className="border-white text-white hover:bg-white hover:text-brand-black">
                        Shop Now
                      </Button>
                    </Link>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slider Controls (Bottom Right) */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 flex space-x-3 z-20">
          <button
            onClick={handlePrev}
            className="p-3 bg-brand-gold hover:bg-brand-gold-light text-white shadow-lg transition-all duration-300 rounded-full"
            aria-label="Slide sebelumnya"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            onClick={handleNext}
            className="p-3 bg-brand-gold hover:bg-brand-gold-light text-white shadow-lg transition-all duration-300 rounded-full"
            aria-label="Slide berikutnya"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}
