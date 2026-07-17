'use client'

import React from 'react'
import Image from 'next/image'
import { SmartLink as Link } from '@/shared/components'
import { Banner } from '@/modules/banners/types'
import { PageContainer } from '@/shared/components'

interface MidBannerSectionProps {
  banners: Banner[]
}

export function MidBannerSection({ banners }: MidBannerSectionProps): React.JSX.Element | null {
  if (!banners || banners.length === 0) return null

  // For simplicity, we just display the first active mid banner, or map them all.
  // We will map them in a simple grid if there's multiple, or just full width if one.
  return (
    <div className="w-full py-8 md:py-12 bg-white">
      <PageContainer>
        <div className="grid grid-cols-1 gap-6">
          {banners.map((banner) => (
            <Link 
              key={banner.id} 
              href={banner.link_url || '#'} 
              className="block relative w-full h-48 md:h-[400px] rounded-sm overflow-hidden group"
            >
              <Image
                src={banner.image_url}
                alt={banner.title || 'Banner Promo'}
                fill
                sizes="(max-width: 768px) 100vw, 1200px"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
              
              {/* Optional: Render Title & Subtitle if provided and desired over the image */}
              {(banner.title || banner.subtitle) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
                  {banner.subtitle && (
                    <span className="text-white text-xs md:text-sm font-heading tracking-widest uppercase mb-2 drop-shadow-md">
                      {banner.subtitle}
                    </span>
                  )}
                  {banner.title && (
                    <h3 className="text-white text-2xl md:text-4xl font-heading font-bold uppercase tracking-wider drop-shadow-lg">
                      {banner.title}
                    </h3>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      </PageContainer>
    </div>
  )
}
