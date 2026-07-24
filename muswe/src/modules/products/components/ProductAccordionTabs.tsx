'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatProductDescription, cn } from '@/lib/utils'
import type { ProductDetailItem, ProductVariant } from '@/modules/products/types'
import { useTranslation } from '@/shared/i18n/useTranslation'

interface ProductAccordionTabsProps {
  product: ProductDetailItem
  selectedVariant: ProductVariant | null
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 260, damping: 25 },
  },
}

export function ProductAccordionTabs({
  product,
  selectedVariant,
}: ProductAccordionTabsProps): React.JSX.Element {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'details' | 'shipping' | 'care'>('details')

  return (
    <motion.div variants={itemVariants} className="space-y-2 pt-2">
      <div className="flex border-b border-neutral-200 font-heading text-xs font-medium uppercase tracking-wider relative">
        <button
          onClick={() => setActiveTab('details')}
          className={cn(
            'pb-2 pr-4 transition-colors relative z-10',
            activeTab === 'details' ? 'text-brand-black' : 'text-neutral-400'
          )}
        >
          {t.product.description}
          {activeTab === 'details' && (
            <motion.div
              layoutId="activeTabUnderline"
              className="absolute bottom-0 left-0 right-4 h-[2px] bg-brand-gold"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('shipping')}
          className={cn(
            'pb-2 px-4 transition-colors relative z-10',
            activeTab === 'shipping' ? 'text-brand-black' : 'text-neutral-400'
          )}
        >
          {t.product.sizeGuide}
          {activeTab === 'shipping' && (
            <motion.div
              layoutId="activeTabUnderline"
              className="absolute bottom-0 left-4 right-4 h-[2px] bg-brand-gold"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('care')}
          className={cn(
            'pb-2 px-4 transition-colors relative z-10',
            activeTab === 'care' ? 'text-brand-black' : 'text-neutral-400'
          )}
        >
          {t.product.materialCare}
          {activeTab === 'care' && (
            <motion.div
              layoutId="activeTabUnderline"
              className="absolute bottom-0 left-4 right-4 h-[2px] bg-brand-gold"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </button>
      </div>

      <div className="pt-2 text-xs text-neutral-500 font-sans leading-relaxed min-h-[80px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'details' && (
              <div className="space-y-2">
                <p className="whitespace-pre-line">
                  {formatProductDescription(product.description)}
                </p>
                {selectedVariant && (
                  <p className="text-xs text-neutral-400 font-sans">
                    SKU: {selectedVariant.sku}
                  </p>
                )}
              </div>
            )}
            {activeTab === 'shipping' && (
              <div className="space-y-1 whitespace-pre-line">
                {product.size_guide ? (
                  formatProductDescription(product.size_guide)
                ) : (
                  <p className="italic">
                    {t.product.emptySizeGuide}
                  </p>
                )}
              </div>
            )}
            {activeTab === 'care' && (
              <div className="space-y-1 whitespace-pre-line">
                {product.care_guide ? (
                  product.care_guide.replace(/<br\s*\/?>/gi, '\n')
                ) : (
                  <ul className="list-disc pl-4 space-y-1">
                    <li>{t.product.defaultCare1}</li>
                    <li>{t.product.defaultCare2}</li>
                    <li>{t.product.defaultCare3}</li>
                  </ul>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
