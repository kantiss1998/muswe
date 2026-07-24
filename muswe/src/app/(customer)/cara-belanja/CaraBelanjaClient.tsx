'use client'

import React from 'react'
import { SmartLink as Link } from '@/shared/components'
import { ShoppingBag, Tag, Truck, CreditCard, ClipboardList } from 'lucide-react'
import { PageHero, PageContainer } from '@/shared/components'
import { useTranslation } from '@/shared/i18n/useTranslation'

export function CaraBelanjaClient(): React.JSX.Element {
  const { isEnglish } = useTranslation()

  const steps = [
    {
      icon: ShoppingBag,
      title: isEnglish
        ? '1. Select Products & Add to Cart'
        : '1. Pilih Produk & Tambahkan ke Keranjang',
      desc: isEnglish
        ? 'Browse our collection, select your desired variant (size/color) and quantity, then click "Add to Cart".'
        : 'Telusuri katalog produk kami, pilih varian warna, ukuran, dan kuantitas yang diinginkan. Tekan tombol "Tambah ke Keranjang" untuk menyimpannya.',
    },
    {
      icon: Tag,
      title: isEnglish
        ? '2. Review Cart & Apply Promo Voucher'
        : '2. Periksa Keranjang & Gunakan Voucher',
      desc: isEnglish
        ? 'Click the cart icon at top right to view order summary. Enter promo voucher code in the field provided to enjoy exclusive discounts.'
        : 'Klik ikon keranjang di kanan atas untuk melihat ringkasan pesanan Anda. Masukkan kode voucher belanja di kolom yang tersedia untuk mendapatkan potongan harga eksklusif.',
    },
    {
      icon: Truck,
      title: isEnglish
        ? '3. Enter Shipping Address & Select Courier'
        : '3. Isi Alamat & Pilih Kurir Pengiriman',
      desc: isEnglish
        ? 'Click "Checkout" to enter shipping details. Fill in your domestic or international shipping destination address and pick your preferred courier service (DHL, FedEx, JNE, etc).'
        : 'Klik "Checkout" untuk masuk ke halaman pengiriman. Tentukan alamat pengiriman lengkap Anda dan pilih jasa ekspedisi/kurir yang diinginkan beserta pilihan tarifnya.',
    },
    {
      icon: CreditCard,
      title: isEnglish
        ? '4. Complete Secure Payment (DOKU Checkout)'
        : '4. Lakukan Pembayaran (DOKU Checkout)',
      desc: isEnglish
        ? 'Review total amount and click "Place Order & Pay". Secure DOKU payment portal will open automatically allowing Credit Cards, Virtual Accounts, QRIS, or E-Wallets.'
        : 'Tinjau total biaya, lalu klik tombol pembayaran. Gerbang pembayaran DOKU Checkout akan terbuka secara otomatis. Anda dapat membayar melalui Virtual Account, QRIS, E-Wallet, atau Kartu Kredit.',
    },
    {
      icon: ClipboardList,
      title: isEnglish
        ? '5. Track Order Status & Airway Bill Number'
        : '5. Pantau Status & Lacak Nomor Resi',
      desc: isEnglish
        ? 'Once payment is verified automatically, your order will be dispatched. Track real-time status and courier tracking number under "My Account" → "My Orders".'
        : 'Setelah pembayaran diverifikasi secara otomatis, pesanan Anda akan segera diproses. Pantau status pesanan dan nomor resi kurir di halaman "Akun Saya" → "Pesanan Saya".',
    },
  ]

  return (
    <div className="min-h-screen bg-white font-sans">
      <PageHero
        eyebrow={isEnglish ? 'Shopping Guide' : 'Panduan Belanja'}
        title={isEnglish ? 'How to Shop' : 'Cara Belanja'}
        subtitle={
          isEnglish
            ? 'Shopping at Muswe is fast, secure, and seamless. Follow these 5 easy steps.'
            : 'Belanja di Muswe sangatlah praktis dan aman. Ikuti 5 langkah mudah berikut.'
        }
      />

      <PageContainer size="md" className="py-12 page-content">
        <div className="max-w-3xl mx-auto space-y-6">
          {steps.map((step) => (
            <div
              key={step.title}
              className="border border-neutral-200 p-6 md:p-8 flex items-start gap-5 card-hover-lift gold-border-hover bg-white"
            >
              <div className="p-3 bg-brand-gold-muted border border-brand-gold/20 shrink-0">
                <step.icon className="h-5 w-5 text-brand-gold" strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading text-sm font-semibold text-brand-black uppercase tracking-wide">
                  {step.title}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed font-medium">{step.desc}</p>
              </div>
            </div>
          ))}

          <div className="border border-neutral-200 bg-brand-cream/50 p-6 md:p-8 text-xs text-neutral-500 leading-relaxed font-medium">
            <p className="font-heading font-semibold text-brand-black mb-2 uppercase tracking-wider text-xs">
              {isEnglish ? 'Need Further Assistance?' : 'Butuh Bantuan Lebih Lanjut?'}
            </p>
            {isEnglish ? (
              <>
                If you encounter any issues during checkout or payment, please feel free to reach our
                Customer Support via{' '}
                <Link
                  href="/kontak"
                  className="text-brand-black underline font-semibold hover:text-brand-gold transition-colors"
                >
                  Contact Us
                </Link>{' '}
                for fast response.
              </>
            ) : (
              <>
                Jika Anda mengalami kendala saat checkout atau pembayaran, silakan hubungi Customer
                Service kami melalui halaman{' '}
                <Link
                  href="/kontak"
                  className="text-brand-black underline font-semibold hover:text-brand-gold transition-colors"
                >
                  Hubungi Kami
                </Link>{' '}
                untuk respon cepat via WhatsApp.
              </>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
