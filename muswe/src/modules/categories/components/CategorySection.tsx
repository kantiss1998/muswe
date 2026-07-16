'use client'

import React from 'react'
import { SmartLink as Link } from '@/shared/components'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Category } from '@/modules/categories/types'
import { PageContainer, SectionHeader } from '@/shared/components'
import { staggerContainer, fadeUpItem } from '@/lib/motion'

interface CategorySectionProps {
  categories: Category[]
}

export function CategorySection({ categories }: CategorySectionProps): React.JSX.Element | null {
  if (categories.length === 0) return null

  const mainCategories = categories.filter((c) => !c.parent_id).slice(0, 4)

  return (
    <section className="bg-white py-16 md:py-20 border-b border-neutral-100">
      <PageContainer>
        <SectionHeader eyebrow="Kategori Pilihan" title="Kategori Belanja" />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
        >
          {mainCategories.map((cat, index) => (
            <motion.div key={cat.id} variants={fadeUpItem} className="flex flex-col items-center">
              <Link
                href={`/kategori/${cat.slug}`}
                className="group relative w-32 h-32 md:w-48 md:h-48 overflow-hidden bg-brand-cream rounded-full mb-4 shadow-sm hover:shadow-md transition-shadow duration-300 block"
              >
                {cat.image_url ? (
                  <Image
                    src={cat.image_url}
                    alt={cat.name}
                    fill
                    sizes="(max-w-7xl) 25vw, 50vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-xs text-neutral-400 font-sans uppercase">
                    {cat.name}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/5 transition-opacity duration-500 group-hover:bg-black/10 rounded-full" />
              </Link>
              <Link href={`/kategori/${cat.slug}`}>
                <span className="text-sm md:text-base font-heading font-medium uppercase tracking-wider text-brand-black hover:text-brand-gold transition-colors text-center">
                  {cat.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </PageContainer>
    </section>
  )
}
