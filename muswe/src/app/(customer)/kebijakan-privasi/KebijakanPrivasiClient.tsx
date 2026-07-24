'use client'

import React from 'react'
import { PageHero, PageContainer } from '@/shared/components'
import { useTranslation } from '@/shared/i18n/useTranslation'

export function KebijakanPrivasiClient(): React.JSX.Element {
  const { isEnglish } = useTranslation()

  const sections = isEnglish
    ? [
        {
          title: '1. Personal Information Collection',
          content:
            'We collect personal information voluntarily provided by you during account registration, checkout, or customer service inquiries, including full name, delivery address, phone number, email address, and shipping destination details.',
        },
        {
          title: '2. Use of Collected Data',
          content:
            'Your personal information is used exclusively to fulfill purchase transactions, deliver orders via courier partners, perform automated payment verification (DOKU), provide order status updates, and send promotional newsletters if opted-in.',
        },
        {
          title: '3. Data Security & Storage',
          content:
            'We implement industry-standard encryption and security measures to protect your information against unauthorized access or disclosure. Financial transactions are securely encrypted by PCI-DSS certified gateway (DOKU). We do not store raw credit card credentials.',
        },
        {
          title: '4. Cookie Usage Policy',
          content:
            'Our website uses cookies to maintain shopping cart items, remember login sessions, and compile anonymous website analytics to optimize web performance and user experience.',
        },
        {
          title: '5. Third-Party Disclosure',
          content:
            'We never sell, rent, or trade your personal information to third parties for marketing purposes. Data is shared strictly with delivery carriers (e.g. DHL, FedEx, JNE) to fulfill order delivery.',
        },
        {
          title: '6. User Data Rights',
          content:
            'You have the right to access, edit, or request deletion of your personal information at any time via your account profile page or by contacting our customer care team.',
        },
      ]
    : [
        {
          title: '1. Pengumpulan Informasi Pribadi',
          content:
            'Kami mengumpulkan informasi pribadi yang Anda berikan secara sukarela saat pendaftaran akun, checkout produk, atau saat berkomunikasi dengan customer service kami. Informasi ini mencakup nama lengkap, alamat pengiriman, nomor telepon, dan email.',
        },
        {
          title: '2. Penggunaan Data Anda',
          content:
            'Data pribadi Anda digunakan semata-mata untuk memproses transaksi pesanan, mengirimkan paket melalui ekspedisi mitra, verifikasi pembayaran otomatis (DOKU), dan pembaruan status pesanan.',
        },
        {
          title: '3. Keamanan & Penyimpanan Data',
          content:
            'Kami mengambil langkah-langkah keamanan teknis untuk melindungi informasi Anda. Transaksi keuangan diproses secara terenkripsi oleh payment gateway bersertifikasi PCI-DSS (DOKU).',
        },
        {
          title: '4. Penggunaan Cookies',
          content:
            'Situs kami menggunakan cookie untuk melacak isi keranjang belanja, merawat sesi login Anda, serta mengumpulkan data analitik situs guna meningkatkan kenyamanan navigasi.',
        },
        {
          title: '5. Pengungkapan Kepada Pihak Ketiga',
          content:
            'Kami tidak akan pernah menjual atau menyewakan data pribadi Anda kepada pihak ketiga untuk kepentingan pemasaran. Informasi hanya dibagikan kepada mitra logistik untuk pemenuhan pesanan.',
        },
        {
          title: '6. Hak Akses & Perubahan Data',
          content:
            'Anda memiliki hak untuk melihat, mengedit, atau menghapus informasi pribadi Anda kapan saja melalui halaman profil akun Anda di situs web Muswe.',
        },
      ]

  return (
    <div className="min-h-screen bg-white font-sans">
      <PageHero
        eyebrow={isEnglish ? 'Data Protection' : 'Perlindungan Data'}
        title={isEnglish ? 'Privacy Policy' : 'Kebijakan Privasi'}
        subtitle={
          isEnglish
            ? 'Customer data protection statement and Muswe digital privacy commitments.'
            : 'Pernyataan perlindungan data pelanggan dan komitmen privasi Muswe.'
        }
      />

      <PageContainer size="md" className="py-12 page-content">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-xs leading-relaxed text-neutral-500 font-sans">
            <p className="text-neutral-400 text-xs uppercase tracking-wider mb-3">
              {isEnglish ? 'Last Updated: July 13, 2026' : 'Terakhir diperbarui: 13 Juli 2026'}
            </p>
            <p>
              {isEnglish
                ? 'Muswe deeply values your privacy and trust. We commit to protecting your personal information in compliance with international data privacy standards.'
                : 'Muswe sangat menghargai privasi dan kepercayaan Anda. Kami berkomitmen untuk melindungi informasi pribadi Anda dan menggunakannya sesuai dengan kebijakan perlindungan data.'}
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
            Your data is safe with us. We respect your digital privacy.
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
