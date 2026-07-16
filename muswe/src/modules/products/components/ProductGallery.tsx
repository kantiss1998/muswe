'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { ProductImage } from '@/modules/products/types'
import { cn } from '@/lib/utils'

interface ProductGalleryProps {
  images: ProductImage[]
  productName: string
  selectedVariantId?: string | null
}

function ZoomableImage({ src, alt, priority = false }: { src: string; alt: string; priority?: boolean }) {
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const [isZoomed, setIsZoomed] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    setZoomPos({ x, y })
  }

  return (
    <div
      className="relative w-full h-full overflow-hidden cursor-zoom-in bg-brand-cream"
      onMouseEnter={() => setIsZoomed(true)}
      onMouseLeave={() => {
        setIsZoomed(false)
        setZoomPos({ x: 50, y: 50 })
      }}
      onMouseMove={handleMouseMove}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1200px) 100vw, 50vw"
        className="object-cover transition-transform duration-300 ease-out"
        style={{
          transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
          transform: isZoomed ? 'scale(2.5)' : 'scale(1)',
        }}
        priority={priority}
      />
    </div>
  )
}

export function ProductGallery({
  images,
  productName,
  selectedVariantId,
}: ProductGalleryProps): React.JSX.Element {
  const [isMobile, setIsMobile] = useState(false)
  const prevVariantIdRef = useRef<string | null>(null)

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)')
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] w-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-400 font-sans">
        Tidak ada gambar produk
      </div>
    )
  }

  // Cari gambar yang sesuai dengan varian yang dipilih
  const selectedVariantImage = selectedVariantId 
    ? images.find(img => img.variant_id === selectedVariantId)
    : null

  // Tentukan gambar apa saja yang akan ditampilkan
  // Desktop: jika ada varian terpilih, tampilkan 1 gambar. Jika tidak, tampilkan maksimal 4 gambar di grid.
  // Mobile: sama (jika ada varian terpilih, tampilkan 1 gambar. Jika tidak, tampilkan slider).
  const displayImages = selectedVariantImage ? [selectedVariantImage] : images.slice(0, 4)

  // Mobile active image state untuk titik-titik indikator (dots)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [activeMobileImage, setActiveMobileImage] = useState<string>(displayImages[0]?.url)

  useEffect(() => {
    if (selectedVariantId !== prevVariantIdRef.current) {
      prevVariantIdRef.current = selectedVariantId || null
      if (selectedVariantImage) {
        setActiveMobileImage(selectedVariantImage.url)
      } else if (displayImages.length > 0) {
        setActiveMobileImage(displayImages[0].url)
      }
    }
  }, [selectedVariantId, selectedVariantImage, displayImages])

  return (
    <div className="flex flex-col w-full group">
      {/* Mobile Swipe Gallery */}
      <div className="md:hidden relative w-full aspect-[3/4] overflow-hidden bg-neutral-50 border border-neutral-100 rounded-xl">
        <div
          id="mobile-product-gallery"
          className={cn(
            "flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth",
            displayImages.length === 1 && "overflow-hidden pointer-events-none"
          )}
          onScroll={(e) => {
            if (displayImages.length <= 1) return
            const target = e.target as HTMLDivElement
            const index = Math.round(target.scrollLeft / target.clientWidth)
            if (displayImages[index] && displayImages[index].url !== activeMobileImage) {
              setActiveMobileImage(displayImages[index].url)
            }
          }}
        >
          {displayImages.map((img, i) => (
            <div
              key={`mob-${img.id}`}
              id={`gallery-img-${img.id}`}
              className="w-full h-full flex-shrink-0 snap-center relative"
            >
              <Image
                src={img.url}
                alt={productName}
                fill
                quality={75}
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-cover"
                priority={i === 0}
              />
            </div>
          ))}
        </div>

        {/* Mobile Swipe Indicators (Dots) */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-1.5 z-10 pointer-events-none">
            {displayImages.map((img) => (
              <div
                key={`dot-${img.id}`}
                className={cn(
                  'h-1 transition-all duration-300 rounded-full',
                  activeMobileImage === img.url ? 'w-4 bg-brand-dark' : 'w-1.5 bg-neutral-300/80'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop Gallery (Grid or Single) */}
      <div className="hidden md:block w-full">
        <div className={cn(
          "grid gap-4 transition-all duration-500",
          displayImages.length === 1 ? "grid-cols-1" : "grid-cols-2"
        )}>
          {displayImages.map((img, i) => (
            <div 
              key={`desktop-${img.id}`} 
              className={cn(
                "relative bg-brand-cream overflow-hidden rounded-xl border border-neutral-100 transition-all duration-500",
                displayImages.length === 1 ? "aspect-[3/4]" : "aspect-[3/4]" // Ensure consistent aspect ratio
              )}
            >
              <ZoomableImage 
                src={img.url} 
                alt={img.alt_text || productName} 
                priority={i === 0} 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
