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
  const prevVariantIdRef = useRef<string | null>(null)
  const mobileGalleryRef = useRef<HTMLDivElement>(null)

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] w-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-400 font-sans">
        Tidak ada gambar produk
      </div>
    )
  }

  // Determine which images to display (always up to 4 images)
  // If variant is selected, place matching variant image(s) first, then fill up to 4 with other images.
  // If variant is unselected (null), revert back to the main 4 product images.
  let displayImages: ProductImage[] = []

  if (selectedVariantId) {
    const variantImages = images.filter((img) => img.variant_id === selectedVariantId)
    if (variantImages.length > 0) {
      const otherImages = images.filter((img) => img.variant_id !== selectedVariantId)
      displayImages = [...variantImages, ...otherImages].slice(0, 4)
    } else {
      displayImages = images.slice(0, 4)
    }
  } else {
    displayImages = images.slice(0, 4)
  }

  // Mobile active image state for dots indicator
  const [activeMobileImage, setActiveMobileImage] = useState<string>(displayImages[0]?.url || '')

  useEffect(() => {
    if (selectedVariantId !== prevVariantIdRef.current) {
      prevVariantIdRef.current = selectedVariantId || null

      if (displayImages.length > 0) {
        setActiveMobileImage(displayImages[0].url)
      }

      // Reset mobile scroll position to beginning when variant selection changes
      if (mobileGalleryRef.current) {
        mobileGalleryRef.current.scrollLeft = 0
      }
    }
  }, [selectedVariantId, displayImages])

  return (
    <div className="flex flex-col w-full group">
      {/* Mobile Swipe Gallery Slider (4 Images) */}
      <div className="md:hidden relative w-full aspect-[3/4] overflow-hidden bg-neutral-50 border border-neutral-100 rounded-xl">
        <div
          ref={mobileGalleryRef}
          id="mobile-product-gallery"
          className={cn(
            'flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth',
            displayImages.length <= 1 && 'overflow-hidden pointer-events-none'
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
              key={`mob-${img.id || i}-${img.url}`}
              id={`gallery-img-${img.id || i}`}
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

        {/* Mobile Swipe Indicators (Dots for 4 images) */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-1.5 z-10 pointer-events-none">
            {displayImages.map((img, i) => (
              <div
                key={`dot-${img.id || i}`}
                className={cn(
                  'h-1 transition-all duration-300 rounded-full',
                  activeMobileImage === img.url ? 'w-4 bg-brand-dark' : 'w-1.5 bg-neutral-300/80'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop Gallery (2x2 Grid for 4 Images) */}
      <div className="hidden md:block w-full">
        <div
          className={cn(
            'grid gap-4 transition-all duration-500',
            displayImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
          )}
        >
          {displayImages.map((img, i) => (
            <div
              key={`desktop-${img.id || i}-${img.url}`}
              className="relative bg-brand-cream overflow-hidden rounded-xl border border-neutral-100 aspect-[3/4] transition-all duration-500"
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
