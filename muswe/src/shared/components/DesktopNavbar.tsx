'use client'

import React, { useState } from 'react'
import { SmartLink as Link, LanguageSwitcher } from '@/shared/components'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Search, Heart, ShoppingBag, User as UserIcon, LogOut, ChevronDown } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'
import { Category } from '@/modules/categories/types'
import { Collection } from '@/modules/collections/types'

interface DesktopNavbarProps {
  isScrolled: boolean
  navLinks: { name: string; href: string }[]
  pathname: string
  logoUrl: string | null
  categories?: Category[]
  collections?: Collection[]
  onOpenMobileMenu: () => void
  onToggleSearch: () => void
  isSearchOpen: boolean
  wishlistCount: number
  totalQuantity: number
  animateCart: boolean
  onOpenCart: () => void
  isMounted: boolean
  isAuthenticated: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: Record<string, any> | null
  user: User | null
  onLogout: () => void
}

export function DesktopNavbar({
  isScrolled,
  navLinks,
  pathname,
  logoUrl,
  categories = [],
  collections = [],
  onOpenMobileMenu,
  onToggleSearch,
  isSearchOpen,
  wishlistCount,
  totalQuantity,
  animateCart,
  onOpenCart,
  isMounted,
  isAuthenticated,
  profile,
  user,
  onLogout,
}: DesktopNavbarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [hoveredNav, setHoveredNav] = useState<string | null>(null)
  const isTransparentHome = pathname === '/' && !isScrolled
  const isDarkText = isScrolled || !isTransparentHome || hoveredNav !== null
  
  // Get top-level categories
  const mainCategories = categories.filter(c => !c.parent_id)

  return (
    <>
      <div className="bg-gradient-to-r from-brand-cream via-brand-beige to-brand-cream text-brand-black px-4 py-2 text-xs text-center md:flex md:justify-between md:items-center relative z-50 bg-[length:200%_auto] animate-pulse-glow">
        <div className="flex-1 hidden md:block"></div>
        <div className="font-sans font-medium flex-1 text-center">
          Dapatkan diskon 10% untuk pesanan pertama Anda. <Link href="/masuk" className="underline font-bold text-brand-black hover:text-brand-gold transition-colors">Daftar sekarang</Link>
        </div>
        <div className="flex-1 hidden md:block"></div>
      </div>
      <header
        onMouseLeave={() => setHoveredNav(null)}
        className={cn(
          'sticky top-0 z-40 w-full transition-all duration-300 border-b',
          isDarkText
            ? 'bg-white/80 backdrop-blur-xl border-neutral-200 shadow-sm'
            : 'bg-transparent border-transparent'
        )}
      >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center flex-1 justify-start">
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className={cn(
                'md:hidden p-2 -ml-2 mr-2',
                !isDarkText
                  ? 'text-white/90 hover:text-white'
                  : 'text-neutral-500 hover:text-brand-black'
              )}
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link
              href="/"
              className={cn(
                'font-heading text-base md:text-lg font-bold tracking-[0.1em] uppercase select-none transition-colors duration-300 flex items-center justify-center',
                !isDarkText
                  ? 'text-white hover:text-neutral-200'
                  : 'text-brand-black hover:text-brand-gold'
              )}
            >
              <div className="relative h-8 md:h-10 w-[100px] sm:w-[120px] md:w-[150px]">
                <Image
                  src={'/logo/Alternate.png'}
                  alt="Muswe Logo"
                  fill
                  priority
                  sizes="(max-width: 768px) 150px, 200px"
                  className={cn(
                    'object-contain text-transparent transition-all duration-300',
                    !isDarkText && 'brightness-0 invert'
                  )}
                />
              </div>
            </Link>
          </div>

          <div className="hidden md:flex justify-center flex-shrink-0 px-4 h-full">
            <nav className="flex space-x-8 h-full">
              {navLinks.map((link) => {
                const hasMegaMenu = (link.name === 'Kategori' && categories.length > 0) || (link.name === 'Koleksi' && collections.length > 0)
                return (
                  <div 
                    key={link.name} 
                    className="flex h-full items-center"
                    onMouseEnter={() => hasMegaMenu && setHoveredNav(link.name)}
                  >
                    <Link
                      href={link.href}
                      className={cn(
                        'text-xs flex items-center gap-1 font-sans font-medium uppercase tracking-wider transition-colors duration-200 nav-link-underline',
                        pathname === link.href || hoveredNav === link.name
                          ? 'text-brand-gold font-bold'
                          : !isDarkText
                            ? 'text-white/90 hover:text-white'
                            : 'text-neutral-500 hover:text-brand-gold'
                      )}
                    >
                      {link.name}
                      {hasMegaMenu && <ChevronDown className="w-3 h-3" />}
                    </Link>
                  </div>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center justify-end space-x-1 sm:space-x-2 md:space-x-4 flex-1">
            <button
              onClick={onToggleSearch}
              className={cn(
                'p-2',
                !isDarkText
                  ? 'text-white/90 hover:text-white'
                  : 'text-neutral-500 hover:text-brand-black'
              )}
              aria-label="Cari produk"
              aria-expanded={isSearchOpen}
            >
              <div className="flex items-center gap-1.5">
                <Search className="h-4 w-4 md:h-5 md:w-5" />
                <kbd className="hidden lg:inline-flex items-center gap-1 rounded border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </button>

            <Link
              href="/wishlist"
              className={cn(
                'p-2 relative group',
                !isDarkText
                  ? 'text-white/90 hover:text-white'
                  : 'text-neutral-500 hover:text-brand-black'
              )}
              aria-label="Wishlist"
            >
              <Heart className="h-4 w-4 md:h-5 md:w-5 transition-transform duration-200 group-hover:scale-110" />
              {isMounted && wishlistCount > 0 && (
                <motion.span
                  key={`wishlist-badge-${wishlistCount}`}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring' as const, stiffness: 500, damping: 15 }}
                  className="absolute -top-0.5 -right-0.5 bg-brand-gold text-white text-xs font-sans font-bold h-4 w-4 flex items-center justify-center rounded-full leading-none shadow-sm shadow-[0_0_10px_rgba(154,123,79,0.3)]"
                >
                  {wishlistCount}
                </motion.span>
              )}
            </Link>

            <button
              onClick={onOpenCart}
              className={cn(
                'p-2 relative group cursor-pointer',
                !isDarkText
                  ? 'text-white/90 hover:text-white'
                  : 'text-neutral-500 hover:text-brand-black'
              )}
              aria-label="Keranjang"
            >
              <motion.div
                animate={animateCart ? { scale: [1, 1.25, 0.95, 1], rotate: [0, -8, 8, 0] } : {}}
                transition={{ duration: 0.45 }}
                className="relative"
              >
                <ShoppingBag className="h-4 w-4 md:h-5 md:w-5 transition-transform duration-200 group-hover:scale-110" />
              </motion.div>
              {isMounted && totalQuantity > 0 && (
                <motion.span
                  key={`cart-badge-${totalQuantity}`}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring' as const, stiffness: 500, damping: 15 }}
                  className="absolute -top-0.5 -right-0.5 bg-brand-gold text-white text-xs font-sans font-bold h-4 w-4 flex items-center justify-center rounded-full leading-none shadow-sm shadow-[0_0_10px_rgba(154,123,79,0.3)]"
                >
                  {totalQuantity}
                </motion.span>
              )}
            </button>

            <LanguageSwitcher />

            <div className="relative">
              {isMounted && isAuthenticated ? (
                <div>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={cn(
                      'p-2 flex items-center',
                      !isDarkText
                        ? 'text-white/90 hover:text-white'
                        : 'text-neutral-500 hover:text-brand-black'
                    )}
                    aria-label="Menu pengguna"
                    aria-expanded={isUserMenuOpen}
                    aria-haspopup="menu"
                  >
                    <UserIcon className="h-4 w-4 md:h-5 md:w-5" />
                  </button>

                  {isUserMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 border-t-2 border-t-brand-gold rounded-none shadow-lg py-1 z-20"
                      >
                        <div className="px-4 py-2 border-b border-neutral-100">
                          <p className="text-xs text-neutral-400 font-heading uppercase tracking-wider">
                            Halo,
                          </p>
                          <p className="text-xs font-semibold text-brand-black truncate">
                            {profile?.name || user?.email}
                          </p>
                        </div>

                        <Link
                          href="/akun"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block px-4 py-2 text-xs text-neutral-600 hover:bg-neutral-50 hover:text-brand-black font-medium"
                        >
                          Akun Saya
                        </Link>

                        {profile?.role === 'admin' && (
                          <Link
                            href="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-4 py-2 text-xs text-neutral-600 hover:bg-neutral-50 hover:text-brand-black font-semibold border-t border-neutral-50"
                          >
                            Admin Panel
                          </Link>
                        )}

                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false)
                            onLogout()
                          }}
                          className="w-full text-left block px-4 py-2 text-xs text-red-600 hover:bg-neutral-50 font-medium border-t border-neutral-100"
                        >
                          <div className="flex items-center space-x-1">
                            <LogOut className="h-3 w-3" />
                            <span>Keluar</span>
                          </div>
                        </button>
                      </motion.div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  href="/masuk"
                  className={cn(
                    'text-xs font-sans font-medium uppercase tracking-wider py-2 hidden sm:block',
                    !isDarkText
                      ? 'text-white/90 hover:text-white'
                      : 'text-neutral-500 hover:text-brand-black'
                  )}
                >
                  Masuk
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mega Menu Dropdown */}
        <AnimatePresence>
          {hoveredNav && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: -10, originY: 0 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-t border-neutral-100 shadow-xl overflow-hidden z-40"
              onMouseEnter={() => setHoveredNav(hoveredNav)}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {hoveredNav === 'Kategori' && (
                  <div className="grid grid-cols-4 gap-8">
                    <div className="col-span-1">
                      <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-brand-black mb-6">Belanja Berdasarkan</h3>
                      <ul className="space-y-4">
                        {mainCategories.map((cat) => (
                          <li key={cat.id}>
                            <Link href={`/kategori/${cat.slug}`} className="text-sm font-sans text-neutral-600 hover:text-brand-gold transition-colors">
                              {cat.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-8 pt-6 border-t border-neutral-100">
                        <Link href="/kategori" className="text-xs font-heading font-medium uppercase tracking-wider text-brand-gold hover:text-brand-gold-light flex items-center gap-2">
                          Lihat Semua Kategori &rarr;
                        </Link>
                      </div>
                    </div>
                    <div className="col-span-3 grid grid-cols-3 gap-6">
                      {mainCategories.slice(0, 3).map((cat) => (
                        <Link key={cat.id} href={`/kategori/${cat.slug}`} className="group block">
                          <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100 mb-4">
                            {cat.image_url && (
                              <Image 
                                src={cat.image_url} 
                                alt={cat.name} 
                                fill 
                                className="object-cover transition-transform duration-700 group-hover:scale-105" 
                              />
                            )}
                          </div>
                          <span className="text-xs font-heading font-medium uppercase tracking-wider text-brand-black group-hover:text-brand-gold transition-colors">
                            {cat.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {hoveredNav === 'Koleksi' && (
                  <div className="grid grid-cols-4 gap-8">
                    <div className="col-span-1">
                      <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-brand-black mb-6">Koleksi Terbatas</h3>
                      <ul className="space-y-4">
                        {collections.map((col) => (
                          <li key={col.id}>
                            <Link href={`/koleksi/${col.slug}`} className="text-sm font-sans text-neutral-600 hover:text-brand-gold transition-colors">
                              {col.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-8 pt-6 border-t border-neutral-100">
                        <Link href="/koleksi" className="text-xs font-heading font-medium uppercase tracking-wider text-brand-gold hover:text-brand-gold-light flex items-center gap-2">
                          Jelajahi Semua &rarr;
                        </Link>
                      </div>
                    </div>
                    <div className="col-span-3 grid grid-cols-3 gap-6">
                      {collections.slice(0, 3).map((col) => (
                        <Link key={col.id} href={`/koleksi/${col.slug}`} className="group block">
                          <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 mb-4">
                            {col.image_url && (
                              <Image 
                                src={col.image_url} 
                                alt={col.name} 
                                fill 
                                className="object-cover transition-transform duration-700 group-hover:scale-105" 
                              />
                            )}
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                            <div className="absolute inset-0 flex items-center justify-center">
                               <span className="text-white font-heading font-medium uppercase tracking-wider text-lg drop-shadow-md">
                                 {col.name}
                               </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
    </>
  )
}
