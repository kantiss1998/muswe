import React from 'react'
import { SmartLink as Link } from '@/shared/components'
import Image from 'next/image'
import { Button, Input, CurrentYear } from '@/shared/components'
import { useTranslation } from '@/shared/i18n/useTranslation'
import toast from 'react-hot-toast'
import { useSiteSettings } from '@/shared/hooks/useSiteSettings'

export function Footer(): React.JSX.Element {
  const { t, isEnglish } = useTranslation()
  const { logoUrl, instagramUrl, tiktokUrl, whatsappUrl, shopeeUrl } = useSiteSettings()

  return (
    <footer className="bg-brand-cream border-t border-neutral-200">
      {/* Newsletter CTA band */}
      <div className="border-b border-neutral-200 bg-brand-cream py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h3 className="text-2xl md:text-3xl font-heading font-normal tracking-wide text-brand-black">
            {t.footer.followUs}
          </h3>
          <p className="text-sm text-neutral-600 font-sans max-w-md mx-auto">
            {t.footer.aboutText}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              toast.success(isEnglish ? 'Thank you! Newsletter subscription saved.' : 'Terima kasih! Newsletter subscription saved.')
            }}
            className="flex flex-col sm:flex-row gap-0 max-w-md mx-auto mt-6"
          >
            <input
              type="email"
              placeholder="Email"
              required
              className="flex-1 bg-transparent border-b border-brand-black text-brand-black placeholder:text-neutral-400 py-3 px-2 text-sm focus:outline-none focus:border-brand-gold transition-colors"
            />
            <button
              type="submit"
              className="text-brand-black p-3 border-b border-brand-black hover:text-brand-gold hover:border-brand-gold transition-colors flex items-center justify-center"
              aria-label="Submit"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
        </div>
      </div>

      <div className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
            {/* Col 1: Brand Info */}
            <div className="flex flex-col space-y-4">
              <div className="relative h-10 md:h-14 w-full max-w-[200px] animate-fade-in">
                <Image
                  src={'/logo/Alternate.png'}
                  alt="Muswe Logo"
                  fill
                  sizes="200px"
                  className="object-contain object-left"
                />
              </div>
              <p className="text-sm text-neutral-500 leading-relaxed max-w-xs font-sans">
                {t.footer.aboutText}
              </p>
            </div>

            {/* Col 2: Pelayanan Pelanggan */}
            <div className="flex flex-col space-y-3">
              <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-brand-black">
                {t.footer.customerService}
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/cara-belanja"
                    className="text-sm text-neutral-500 hover:text-brand-gold transition-colors font-sans"
                  >
                    {isEnglish ? 'How to Shop' : 'Cara Belanja'}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pengiriman"
                    className="text-sm text-neutral-500 hover:text-brand-gold transition-colors font-sans"
                  >
                    {isEnglish ? 'Shipping Information' : 'Informasi Pengiriman'}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/retur"
                    className="text-sm text-neutral-500 hover:text-brand-gold transition-colors font-sans"
                  >
                    {isEnglish ? 'Return & Refund Policy' : 'Kebijakan Pengembalian (Retur)'}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/kontak"
                    className="text-sm text-neutral-500 hover:text-brand-gold transition-colors font-sans"
                  >
                    {isEnglish ? 'Contact Us' : 'Hubungi Kami'}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Kebijakan & Hukum */}
            <div className="flex flex-col space-y-3">
              <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-brand-black">
                {isEnglish ? 'Information' : 'Informasi'}
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/syarat-ketentuan"
                    className="text-sm text-neutral-500 hover:text-brand-gold transition-colors font-sans"
                  >
                    {isEnglish ? 'Terms & Conditions' : 'Syarat & Ketentuan'}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/kebijakan-privasi"
                    className="text-sm text-neutral-500 hover:text-brand-gold transition-colors font-sans"
                  >
                    {isEnglish ? 'Privacy Policy' : 'Kebijakan Privasi'}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tentang"
                    className="text-sm text-neutral-500 hover:text-brand-gold transition-colors font-sans"
                  >
                    {isEnglish ? 'About Us' : 'Tentang Kami'}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Social */}
            <div className="flex flex-col space-y-4">
              <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-brand-black">
                {isEnglish ? 'Follow Us' : 'Ikuti Kami'}
              </h4>
              <p className="text-sm text-neutral-500 font-sans">
                {isEnglish
                  ? 'Discover modern modest apparel inspiration on our official channels.'
                  : 'Temukan inspirasi gaya modest di media sosial kami.'}
              </p>
              <div className="flex space-x-3 pt-1">
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-neutral-200 text-neutral-500 hover:border-brand-gold hover:text-brand-gold hover:bg-brand-gold-muted/35 transition-all duration-250 rounded-lg flex items-center justify-center"
                    aria-label="Instagram"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </a>
                )}
                {tiktokUrl && (
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-neutral-200 text-neutral-500 hover:border-brand-gold hover:text-brand-gold hover:bg-brand-gold-muted/35 transition-all duration-250 rounded-lg flex items-center justify-center"
                    aria-label="TikTok"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                    </svg>
                  </a>
                )}
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-neutral-200 text-neutral-500 hover:border-brand-gold hover:text-brand-gold hover:bg-brand-gold-muted/35 transition-all duration-250 rounded-lg flex items-center justify-center"
                    aria-label="WhatsApp"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                  </a>
                )}
                {shopeeUrl && (
                  <a
                    href={shopeeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-neutral-200 text-neutral-500 hover:border-brand-gold hover:text-brand-gold hover:bg-brand-gold-muted/35 transition-all duration-250 rounded-lg flex items-center justify-center"
                    aria-label="Shopee"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.2 7h-2.12c-.52-2.76-2.58-4.8-5.08-4.8s-4.56 2.04-5.08 4.8H4.8c-.99 0-1.8.81-1.8 1.8v10.4c0 .99.81 1.8 1.8 1.8h14.4c.99 0 1.8-.81 1.8-1.8V8.8c0-.99-.81-1.8-1.8-1.8zm-7.2-3c1.47 0 2.7 1.25 3.08 3H8.92c.38-1.75 1.61-3 3.08-3zm7.2 15.2H4.8V8.8h14.4v10.4zm-10.2-7.2c0-.99.81-1.8 1.8-1.8s1.8.81 1.8 1.8v1.2c0 .99-.81 1.8-1.8 1.8s-1.8-.81-1.8-1.8v-1.2z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-xs text-neutral-400 font-sans">
              &copy; <CurrentYear /> Muswe Store. {t.footer.rightsReserved}
            </p>
            <div className="flex space-x-6 text-xs text-neutral-400 font-heading uppercase tracking-wider">
              <Link href="/syarat-ketentuan" className="hover:text-brand-gold transition-colors">
                {isEnglish ? 'Terms' : 'Syarat'}
              </Link>
              <Link href="/kebijakan-privasi" className="hover:text-brand-gold transition-colors">
                {isEnglish ? 'Privacy' : 'Privasi'}
              </Link>
              <Link href="/kontak" className="hover:text-brand-gold transition-colors">
                {isEnglish ? 'Contact' : 'Kontak'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
