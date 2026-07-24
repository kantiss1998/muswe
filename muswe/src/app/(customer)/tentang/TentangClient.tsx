'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { PageHero, PageContainer } from '@/shared/components'
import { EASE_PREMIUM } from '@/lib/motion'

import { useTranslation } from '@/shared/i18n/useTranslation'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.6, ease: EASE_PREMIUM },
}

export function TentangClient(): React.JSX.Element {
  const { isEnglish } = useTranslation()

  return (
    <div className="min-h-screen bg-white font-sans">
      <PageHero
        eyebrow={isEnglish ? 'Story & Vision' : 'Kisah & Visi'}
        title={isEnglish ? 'About Us' : 'Tentang Kami'}
        subtitle={
          isEnglish
            ? "Discover MUSWE's journey in crafting thoughtfully designed modest fashion inspired by culture."
            : 'Kenali perjalanan MUSWE dalam menghadirkan busana modest bermakna yang terinspirasi oleh budaya.'
        }
      />

      <PageContainer size="md" className="py-12 md:py-16 page-content">
        <div className="max-w-3xl mx-auto space-y-12">
          <motion.div
            {...fadeUp}
            className="space-y-6 text-sm leading-relaxed text-neutral-600 font-medium"
          >
            {isEnglish ? (
              <>
                <p>
                  <span className="font-semibold text-brand-black">MUSWE</span> is a modest fashion brand focused on thoughtfully designed pieces inspired by culture and modern expression. Rooted in elegance with a contemporary touch, MUSWE creates collections that allow women to express themselves.
                </p>
                <p>
                  We believe that simplicity is the ultimate sophistication. Every piece in our collection is
                  thoughtfully designed with clean lines, premium fabrics, and harmonious color palettes.
                </p>
              </>
            ) : (
              <>
                <p>
                  <span className="font-semibold text-brand-black">MUSWE</span> adalah brand modest fashion yang berfokus pada rancangan busana bermakna yang terinspirasi oleh budaya dan ekspresi modern. Berakar pada keanggunan dengan sentuhan kontemporer, MUSWE menghadirkan koleksi yang membebaskan wanita untuk mengekspresikan diri.
                </p>
                <p>
                  Kami percaya bahwa kesederhanaan adalah bentuk kemewahan yang abadi. Oleh karena itu,
                  setiap koleksi kami dirancang dengan pendekatan desain minimalis modern, garis
                  potongan yang bersih, serta palet warna bumi yang netral dan menenangkan.
                </p>
              </>
            )}
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.1 }}
              className="border border-neutral-200 p-6 md:p-8 space-y-3 card-hover-lift gold-border-hover bg-brand-cream/50"
            >
              <span className="text-xs uppercase tracking-[0.1em] font-heading font-medium text-brand-gold">
                {isEnglish ? 'Quality' : 'Kualitas'}
              </span>
              <h3 className="font-heading text-brand-black font-semibold uppercase tracking-wider text-sm">
                {isEnglish ? 'Premium Selected Fabrics' : 'Bahan Premium Pilihan'}
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                {isEnglish
                  ? 'We rigorously select top-tier natural fibers, silk, and premium voal. Our garments are engineered to remain breathable, soft, and luxurious all day.'
                  : 'Kami menyeleksi bahan voal dan serat alam terbaik secara ketat. Kerudung & busana kami didesain agar tetap adem, menyerap keringat, dan nyaman dipakai.'}
              </p>
            </motion.div>

            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.2 }}
              className="border border-neutral-200 p-6 md:p-8 space-y-3 card-hover-lift gold-border-hover bg-brand-cream/50"
            >
              <span className="text-xs uppercase tracking-[0.1em] font-heading font-medium text-brand-gold">
                Craftsmanship
              </span>
              <h3 className="font-heading text-brand-black font-semibold uppercase tracking-wider text-sm">
                {isEnglish ? 'Boutique Sewing Standards' : 'Jahitan Standar Butik'}
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                {isEnglish
                  ? 'Every piece is tailored with precision by experienced master artisans. We ensure immaculate seams, precise patterns, and durable stitching for lasting elegance.'
                  : 'Setiap busana dijahit secara presisi oleh pengrajin lokal berpengalaman. Kami memastikan keliman rapi, pola presisi, serta ketahanan jahitan yang kuat.'}
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="border-t border-neutral-200 pt-10 text-center"
          >
            <p className="text-sm md:text-base font-heading font-light uppercase tracking-[0.1em] text-brand-black leading-relaxed">
              &ldquo;{isEnglish ? 'Elegance in Simplicity' : 'Elegan dalam Kesederhanaan'}&rdquo;
            </p>
            <div className="accent-line accent-line-center mt-4" />
            <p className="text-xs text-neutral-400 uppercase tracking-wider font-heading mt-4">
              — {isEnglish ? 'Muswe Philosophy' : 'Filosofi Muswe'}
            </p>
          </motion.div>
        </div>
      </PageContainer>
    </div>
  )
}
