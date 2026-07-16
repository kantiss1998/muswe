'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { formatProductDescription } from '@/lib/utils'

interface ProductSizeGuideModalProps {
  isOpen: boolean
  onClose: () => void
  productSizeGuide: string | null
}

export function ProductSizeGuideModal({
  isOpen,
  onClose,
  productSizeGuide,
}: ProductSizeGuideModalProps): React.JSX.Element {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white p-6 shadow-2xl z-10 border border-t-4 border-t-brand-gold border-neutral-100"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-neutral-400 hover:text-brand-black transition-colors cursor-pointer"
              aria-label="Tutup panduan ukuran"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-sm uppercase tracking-wider font-heading font-medium text-brand-gold">
                  Detail Produk
                </span>
                <h3 className="text-sm font-heading font-bold uppercase tracking-wider text-brand-black">
                  Detail Ukuran & Bahan
                </h3>
              </div>

              {productSizeGuide ? (
                <div className="whitespace-pre-line text-xs text-neutral-600 font-sans leading-relaxed border border-neutral-100 p-4 bg-neutral-50/30">
                  {formatProductDescription(productSizeGuide)}
                </div>
              ) : (
                <div className="whitespace-pre-line text-xs text-neutral-600 font-sans leading-relaxed border border-neutral-100 p-4 bg-neutral-50/30 text-center italic">
                  Belum ada detail ukuran & bahan untuk produk ini.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
