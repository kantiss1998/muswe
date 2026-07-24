'use client'

import React from 'react'
import { SmartLink as Link } from '@/shared/components'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Collection } from '@/modules/collections/types'
import { ProductListItem } from '@/modules/products/types'
import { ProductCard } from '@/modules/products/components/ProductCard'
import { PageContainer } from '@/shared/components'
import { EASE_PREMIUM } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/shared/i18n/useTranslation'

interface CollectionSpotlightProps {
  collection: Collection
  products?: ProductListItem[]
  variant?: 'light' | 'dark'
  index?: number
}

export function CollectionSpotlight({
  collection,
  products = [],
  variant = 'light',
  index = 0,
}: CollectionSpotlightProps): React.JSX.Element {
  const { isEnglish } = useTranslation()
  const isReversed = index % 2 === 1
  const isDark = variant === 'dark'

  return (
    <section
      className={cn(
        'relative overflow-hidden border-b border-neutral-100',
        isDark ? 'bg-brand-black' : 'bg-brand-cream section-texture'
      )}
    >
      <div className="mx-auto w-full max-w-[1920px] px-0 lg:px-8 py-12 md:py-16">
        <div
          className={cn(
            'flex flex-col lg:flex-row gap-8 lg:gap-16',
            isReversed && 'lg:flex-row-reverse'
          )}
        >
          {/* Left Side: Large Image */}
          <motion.div
            initial={{ opacity: 0, x: isReversed ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: EASE_PREMIUM }}
            className="w-full lg:w-1/2 relative px-4 lg:px-0"
          >
            <Link
              href={`/koleksi/${collection.slug}`}
              className="group relative block aspect-[4/5] w-full overflow-hidden"
            >
              {collection.image_url ? (
                <Image
                  src={collection.image_url}
                  alt={collection.name}
                  fill
                  sizes="(max-w-7xl) 50vw, 100vw"
                  className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-neutral-200 text-xs text-neutral-400 font-sans uppercase">
                  {collection.name}
                </div>
              )}
              <div className="absolute inset-0 gradient-overlay-dark opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
            </Link>
          </motion.div>

          {/* Right Side: Content and Products */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 lg:px-0">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.15, ease: EASE_PREMIUM }}
              className="space-y-6 max-w-xl mb-10"
            >
              <div className="space-y-3">
                <h2
                  className={cn(
                    'text-3xl md:text-5xl font-heading font-medium tracking-wider',
                    isDark ? 'text-white' : 'text-brand-black'
                  )}
                >
                  {collection.name}
                </h2>
              </div>

              {collection.description && (
                <p
                  className={cn(
                    'text-sm font-sans leading-relaxed',
                    isDark ? 'text-neutral-300' : 'text-neutral-600'
                  )}
                >
                  {collection.description}
                </p>
              )}

              <Link
                href={`/koleksi/${collection.slug}`}
                className={cn(
                  'inline-flex items-center gap-2 text-xs font-sans border-b border-current pb-1 transition-all duration-300 group/link hover:opacity-70 mt-2',
                  isDark ? 'text-white' : 'text-brand-black'
                )}
              >
                <span>{isEnglish ? 'Explore' : 'Jelajahi'} {collection.name}</span>
              </Link>
            </motion.div>

            {/* Scrollable Product Carousel */}
            {products.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="w-full relative"
              >
                <div className="flex gap-4 md:gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory pr-4 lg:pr-12">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="w-[60vw] md:w-[35vw] lg:w-[22vw] flex-shrink-0 snap-start"
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
