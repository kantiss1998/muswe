'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Heart, Plus, Minus, ShieldCheck, Truck, RefreshCw, Ruler } from 'lucide-react'
import { Button } from '@/shared/components'
import { VariantPicker } from '@/modules/products/components'
import { formatIDR, cn } from '@/lib/utils'
import type { ProductDetailItem, ProductVariant } from '@/modules/products/types'
import { useTranslation } from '@/shared/i18n/useTranslation'

interface ProductInfoSectionProps {
  product: ProductDetailItem
  selectedVariant: ProductVariant | null
  minPrice: number
  maxPrice: number
  quantity: number
  liked: boolean
  isAdding: boolean
  isBuying: boolean
  onSizeGuideOpen: () => void
  onVariantSelect: (variant: ProductVariant | null) => void
  onIncrement: () => void
  onDecrement: () => void
  onToggleWishlist: () => void
  onAddToCart: () => void
  onBuyNow: () => void
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 260, damping: 25 },
  },
}

export function ProductInfoSection({
  product,
  selectedVariant,
  minPrice,
  maxPrice,
  quantity,
  liked,
  isAdding,
  isBuying,
  onSizeGuideOpen,
  onVariantSelect,
  onIncrement,
  onDecrement,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
}: ProductInfoSectionProps): React.JSX.Element {
  const { t } = useTranslation()

  const activePrice = selectedVariant ? Number(selectedVariant.price) : minPrice
  const comparePrice = selectedVariant?.compare_price
    ? Number(selectedVariant.compare_price)
    : null

  return (
    <div className="space-y-6">
      {/* Title, Category & Price */}
      <motion.div variants={itemVariants} className="space-y-2">
        {product.categories && (
          <span className="text-xs uppercase tracking-[0.1em] font-heading font-medium text-brand-gold">
            {product.categories.name}
          </span>
        )}
        <h1 className="text-xl lg:text-2xl font-sans font-medium uppercase tracking-[0.1em] text-brand-black leading-tight">
          {product.name}
        </h1>

        {/* Price display */}
        <div className="flex items-baseline space-x-3 pt-2">
          <span className="text-lg lg:text-xl font-sans font-semibold text-brand-black">
            {formatIDR(activePrice)}
          </span>

          {/* Compare Price */}
          {comparePrice && comparePrice > activePrice && (
            <span className="text-xs text-neutral-400 line-through font-sans">
              {formatIDR(comparePrice)}
            </span>
          )}

          {!selectedVariant && minPrice !== maxPrice && (
             <span className="text-xs text-neutral-400 italic font-sans">
               (Bervariasi)
             </span>
          )}
        </div>
      </motion.div>

      {/* Description intro */}
      {product.short_description && (
        <motion.p
          variants={itemVariants}
          className="text-xs text-neutral-500 font-sans leading-relaxed whitespace-pre-line"
        >
          {product.short_description}
        </motion.p>
      )}

      {/* Varian Picker */}
      <motion.div variants={itemVariants} className="relative">
        {product.size_guide && product.size_guide.trim().length > 0 && (
          <div className="flex justify-start mb-4">
            <button
              type="button"
              onClick={onSizeGuideOpen}
              className="inline-flex items-center space-x-1.5 text-xs font-medium uppercase tracking-wider text-brand-gold hover:text-brand-black transition-colors"
            >
              <Ruler className="h-4 w-4" />
              <span>{t.product.sizeGuide}</span>
            </button>
          </div>
        )}
        <VariantPicker
          variants={product.product_variants}
          selectedVariantId={selectedVariant?.id || null}
          onVariantSelect={onVariantSelect}
        />
      </motion.div>

      {/* Varian Stock indicator */}
      {selectedVariant && (
        <motion.div variants={itemVariants} className="text-sm text-neutral-500 font-sans">
          {selectedVariant.stock > 0 ? (
            <span>
              {t.product.inStock}:{' '}
              <strong className="text-brand-black">{selectedVariant.stock} pcs</strong>
            </span>
          ) : (
            <span className="text-red-500 font-semibold">{t.product.outOfStock}</span>
          )}
        </motion.div>
      )}

      {/* Actions: Quantity & Add to Cart & Wishlist */}
      <motion.div variants={itemVariants} className="space-y-3 pt-2">
        <div className="flex items-center space-x-3">
          {/* Quantity adjustments */}
          <div className="flex items-center border border-neutral-200 bg-white gold-border-hover">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onDecrement}
              className="p-3 text-neutral-500 hover:text-brand-black transition-colors"
              disabled={!selectedVariant || selectedVariant.stock === 0}
            >
              <Minus className="h-3 w-3" />
            </motion.button>
            <span className="px-4 text-xs font-sans font-semibold text-brand-black w-8 text-center select-none">
              {quantity}
            </span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onIncrement}
              className="p-3 text-neutral-500 hover:text-brand-black transition-colors"
              disabled={!selectedVariant || selectedVariant.stock === 0}
            >
              <Plus className="h-3 w-3" />
            </motion.button>
          </div>

          {/* Wishlist Heart button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={onToggleWishlist}
            className="p-4 border border-neutral-200 hover:border-brand-gold bg-white transition-all text-neutral-500 hover:text-brand-gold relative gold-border-hover"
            aria-label={liked ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
          >
            <Heart
              className={cn(
                'h-4 w-4 transition-colors duration-300',
                liked && 'fill-red-500 text-red-500'
              )}
            />
          </motion.button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full">
          {/* Add to Cart Button */}
          <Button
            onClick={onAddToCart}
            variant="outline"
            className="flex-1"
            isLoading={isAdding}
            disabled={!selectedVariant || selectedVariant.stock === 0}
          >
            {!selectedVariant
              ? t.product.selectVariant
              : selectedVariant.stock === 0
                ? t.product.outOfStock
                : t.product.addToCart}
          </Button>

          {/* Buy Now Button */}
          <Button
            onClick={onBuyNow}
            variant="primary"
            className="flex-1 btn-shine shadow-[0_8px_24px_rgba(23,23,23,0.15)] hover:shadow-[0_12px_32px_rgba(23,23,23,0.25)] hover:-translate-y-0.5 rounded-lg"
            isLoading={isBuying}
            disabled={!selectedVariant || selectedVariant.stock === 0}
          >
            {!selectedVariant
              ? t.product.selectVariant
              : selectedVariant.stock === 0
                ? t.product.outOfStock
                : t.product.buyNow}
          </Button>
        </div>
      </motion.div>

      {/* Info Badges (Shipping / Return / Guarantee) */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-3 gap-2 py-4"
      >
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center text-center space-y-1.5 cursor-default group bg-neutral-50/80 hover:bg-neutral-100 rounded-xl p-3 transition-colors"
        >
          <Truck className="h-4 w-4 text-brand-black/70 group-hover:text-brand-black transition-colors" />
          <span className="text-[10px] uppercase tracking-wider font-heading font-semibold text-brand-black">
            Ongkir Flat
          </span>
          <span className="text-[9px] text-neutral-500 font-sans">Tarif murah per zona</span>
        </motion.div>
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center text-center space-y-1.5 cursor-default group bg-neutral-50/80 hover:bg-neutral-100 rounded-xl p-3 transition-colors"
        >
          <RefreshCw className="h-4 w-4 text-brand-black/70 group-hover:text-brand-black transition-colors" />
          <span className="text-[10px] uppercase tracking-wider font-heading font-semibold text-brand-black">
            7 Hari Retur
          </span>
          <span className="text-[9px] text-neutral-500 font-sans">Bebas tukar ukuran</span>
        </motion.div>
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center text-center space-y-1.5 cursor-default group bg-neutral-50/80 hover:bg-neutral-100 rounded-xl p-3 transition-colors"
        >
          <ShieldCheck className="h-4 w-4 text-brand-black/70 group-hover:text-brand-black transition-colors" />
          <span className="text-[10px] uppercase tracking-wider font-heading font-semibold text-brand-black">
            Kualitas Premium
          </span>
          <span className="text-[9px] text-neutral-500 font-sans">Bahan terkurasi</span>
        </motion.div>
      </motion.div>
    </div>
  )
}
