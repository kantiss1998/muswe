'use client'

import React from 'react'
import { PageHero, PageContainer } from '@/shared/components'
import { useTranslation } from '@/shared/i18n/useTranslation'

export function SyaratKetentuanClient(): React.JSX.Element {
  const { isEnglish } = useTranslation()

  const sections = isEnglish
    ? [
        {
          title: '1. General Terms',
          content:
            'Welcome to Muswe. By accessing and browsing this website, you acknowledge that you have read, understood, and agreed to be bound by these Terms & Conditions. These terms may be updated periodically without prior notice.',
        },
        {
          title: '2. User Account',
          content:
            'For a smooth checkout experience, you may register an account. You remain fully responsible for keeping your password confidential. Muswe reserves the right to suspend accounts engaged in voucher abuse or fraudulent activities.',
        },
        {
          title: '3. Orders & Inventory',
          content:
            'All orders are subject to product availability. In the rare event of inventory miscalculation, we will contact you immediately for product replacement or full refund. Colors displayed on screen may slightly vary due to studio lighting and screen calibration.',
        },
        {
          title: '4. Pricing & Payment Settlement',
          content:
            'Prices are listed in Indonesian Rupiah (IDR) and exclude shipping fees. Shipping charges are calculated dynamically at checkout. Payments are settled securely via DOKU Payment Gateway (Credit Cards, QRIS, Virtual Accounts, E-Wallets).',
        },
        {
          title: '5. Order Cancellation Rights',
          content:
            'Muswe reserves the right to reject or cancel any order in cases of suspected fraud, pricing errors caused by system glitches, or failed payment authorization.',
        },
        {
          title: '6. Intellectual Property Rights',
          content:
            'All content on this website, including logos, photography, graphics, artwork, and product designs, are intellectual property of Muswe. Unauthorized reproduction or commercial distribution is strictly prohibited.',
        },
      ]
    : [
        {
          title: '1. Ketentuan Umum',
          content:
            'Selamat datang di Muswe. Dengan mengakses dan menggunakan situs ini, Anda dianggap telah membaca, memahami, dan menyetujui seluruh Syarat & Ketentuan yang berlaku. Syarat & Ketentuan ini dapat berubah sewaktu-waktu tanpa pemberitahuan terlebih dahulu.',
        },
        {
          title: '2. Akun Pengguna',
          content:
            'Untuk kemudahan bertransaksi, Anda disarankan mendaftarkan akun di situs kami. Anda bertanggung jawab penuh atas kerahasiaan password dan aktivitas akun Anda. Pihak Muswe berhak menangguhkan akun apabila ditemukan indikasi penyalahgunaan.',
        },
        {
          title: '3. Pemesanan & Ketersediaan Produk',
          content:
            'Semua pesanan tunduk pada ketersediaan produk. Jika stok habis, kami akan segera menghubungi Anda untuk penukaran produk sejenis atau pembatalan pesanan beserta refund penuh.',
        },
        {
          title: '4. Harga & Pembayaran',
          content:
            'Harga yang tertera dinyatakan dalam Rupiah (IDR) dan belum termasuk ongkos kirim. Ongkos kirim dihitung otomatis saat checkout. Pembayaran diselesaikan melalui DOKU Payment Gateway.',
        },
        {
          title: '5. Hak Pembatalan Pesanan',
          content:
            'Muswe berhak menolak atau membatalkan pesanan apabila terdapat indikasi penipuan transaksi atau kesalahan pencantuman harga produk akibat gangguan sistem.',
        },
        {
          title: '6. Hak Kekayaan Intelektual',
          content:
            'Seluruh konten di situs ini (logo, foto, grafik, desain busana) adalah hak kekayaan intelektual milik Muswe. Dilarang menggandakan tanpa izin tertulis.',
        },
      ]

  return (
    <div className="min-h-screen bg-white font-sans">
      <PageHero
        eyebrow={isEnglish ? 'Terms of Use' : 'Ketentuan Penggunaan'}
        title={isEnglish ? 'Terms & Conditions' : 'Syarat & Ketentuan'}
        subtitle={
          isEnglish
            ? 'User agreement and terms of service governing purchases and website use.'
            : 'Perjanjian lisensi dan ketentuan penggunaan situs Muswe.'
        }
      />

      <PageContainer size="md" className="py-12 page-content">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-xs leading-relaxed text-neutral-500 font-sans">
            <p className="text-neutral-400 text-xs uppercase tracking-wider mb-3">
              {isEnglish ? 'Last Updated: June 10, 2026' : 'Terakhir diperbarui: 10 Juni 2026'}
            </p>
            <p>
              {isEnglish
                ? 'Please read these terms and conditions carefully before making a transaction on our website.'
                : 'Harap baca syarat dan ketentuan ini dengan saksama sebelum mulai menggunakan situs kami atau melakukan transaksi pembelian.'}
            </p>
          </div>

          <div className="space-y-5">
            {sections.map((section, idx) => (
              <div
                key={idx}
                className="border border-neutral-200 p-6 md:p-8 card-hover-lift gold-border-hover bg-white space-y-3"
              >
                <h3 className="font-heading text-sm font-semibold text-brand-black uppercase tracking-wide">
                  {section.title}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed font-sans">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-neutral-100 pt-8 text-center text-xs text-neutral-400 uppercase tracking-[0.1em] font-heading">
            Governing fair transactions, ensuring premium experiences.
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
