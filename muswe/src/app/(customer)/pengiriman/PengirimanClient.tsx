'use client'

import React from 'react'
import { Truck, ShieldCheck, Scale, MapPin } from 'lucide-react'
import { PageHero, PageContainer } from '@/shared/components'
import { useTranslation } from '@/shared/i18n/useTranslation'

export function PengirimanClient(): React.JSX.Element {
  const { isEnglish } = useTranslation()

  const deliveryPartners = isEnglish
    ? [
        {
          name: 'DHL Express (Worldwide Air Freight)',
          area: 'International (180+ Countries)',
          timeline: '3 – 5 business days',
        },
        {
          name: 'FedEx International Economy',
          area: 'International (Worldwide)',
          timeline: '4 – 7 business days',
        },
        {
          name: 'JNE (Reguler / Oke / Yes)',
          area: 'Indonesia (Nationwide)',
          timeline: '1 – 3 business days (YES), 2 – 5 business days (REG)',
        },
        { name: 'J&T Express', area: 'Indonesia (Nationwide)', timeline: '2 – 4 business days' },
        {
          name: 'SiCepat (Best / Reg)',
          area: 'Indonesia (Nationwide)',
          timeline: '1 – 3 business days (BEST), 2 – 4 business days (REG)',
        },
        {
          name: 'POS Indonesia Air Parcel',
          area: 'Domestic & Global Shipping',
          timeline: '3 – 10 business days',
        },
      ]
    : [
        {
          name: 'DHL Express (International Air)',
          area: 'Mancanegara / Internasional (180+ Negara)',
          timeline: '3 – 5 hari kerja',
        },
        {
          name: 'FedEx International',
          area: 'Mancanegara / Internasional',
          timeline: '4 – 7 hari kerja',
        },
        {
          name: 'JNE (Reguler / Oke / Yes)',
          area: 'Seluruh Indonesia',
          timeline: '1 – 3 hari kerja (YES), 2 – 5 hari kerja (REG)',
        },
        { name: 'J&T Express', area: 'Seluruh Indonesia', timeline: '2 – 4 hari kerja' },
        {
          name: 'SiCepat (Reg / Best)',
          area: 'Seluruh Indonesia',
          timeline: '1 – 3 hari kerja (BEST), 2 – 4 hari kerja (REG)',
        },
        {
          name: 'POS Indonesia International',
          area: 'Seluruh Indonesia & Mancanegara',
          timeline: '3 – 10 hari kerja',
        },
      ]

  return (
    <div className="min-h-screen bg-white font-sans">
      <PageHero
        eyebrow={isEnglish ? 'Logistics & Dispatch' : 'Logistik & Pengiriman'}
        title={isEnglish ? 'Shipping Policy & Rates' : 'Informasi Pengiriman'}
        subtitle={
          isEnglish
            ? 'Domestic and international shipping carriers, dispatch schedules, and tracking details.'
            : 'Kebijakan, jadwal, dan mitra ekspedisi pengiriman domestic maupun internasional Muswe.'
        }
      />
      <PageContainer size="md" className="py-12 page-content">
        <div className="max-w-3xl mx-auto space-y-10">
          {/* Delivery Terms Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="border border-neutral-200 p-6 space-y-3 card-hover-lift bg-brand-cream/30">
              <div className="p-2 bg-brand-gold-muted border border-brand-gold/20 w-max">
                <Scale className="h-4 w-4 text-brand-gold" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-neutral-950 font-bold uppercase tracking-wider text-xs">
                {isEnglish ? 'Weight Calculation' : 'Perhitungan Berat'}
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                {isEnglish
                  ? 'Product weight is calculated in grams. Total package weight is rounded up per 1,000 grams (1 kg) according to courier partner regulations.'
                  : 'Berat produk dihitung dalam satuan gram. Setiap total berat pesanan akan dibulatkan ke atas per 1.000 gram (1 kg) sesuai regulasi ekspedisi.'}
              </p>
            </div>

            <div className="border border-neutral-200 p-6 rounded-none space-y-3">
              <div className="p-2 bg-neutral-100/80 rounded-none w-max">
                <Truck className="h-4 w-4 text-neutral-800" />
              </div>
              <h3 className="font-serif text-neutral-950 font-bold uppercase tracking-wider text-xs">
                {isEnglish ? 'Dispatch Schedule' : 'Jadwal Kirim'}
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                {isEnglish
                  ? 'Orders verified before 15:00 (GMT+7) are dispatched on the same business day. After cut-off, orders are dispatched on the next working day.'
                  : 'Pesanan dengan pembayaran terverifikasi sebelum pukul 15:00 WIB akan dikirim pada hari yang sama. Setelah jam tersebut, paket dikirim hari kerja berikutnya.'}
              </p>
            </div>

            <div className="border border-neutral-200 p-6 rounded-none space-y-3">
              <div className="p-2 bg-neutral-100/80 rounded-none w-max">
                <ShieldCheck className="h-4 w-4 text-neutral-800" />
              </div>
              <h3 className="font-serif text-neutral-950 font-bold uppercase tracking-wider text-xs">
                {isEnglish ? 'Transit Protection' : 'Garansi Asuransi'}
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                {isEnglish
                  ? 'Every shipment includes transit loss protection. If a parcel is confirmed lost during shipping, a replacement package will be dispatched free of charge.'
                  : 'Setiap pengiriman dilengkapi dengan asuransi kehilangan. Jika paket terbukti hilang selama pengiriman, kami akan mengirimkan produk pengganti secara gratis.'}
              </p>
            </div>
          </div>

          {/* Courier Table Section */}
          <div className="space-y-4 pt-4">
            <h3 className="font-serif text-sm font-bold text-neutral-950 uppercase tracking-wider">
              {isEnglish ? 'Courier Partners & Estimated Delivery Time (ETD)' : 'Mitra Ekspedisi & Estimasi Waktu (ETD)'}
            </h3>

            <div className="border border-neutral-200 overflow-hidden rounded-none">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-900 font-bold uppercase tracking-wider text-xs">
                    <th className="p-4">{isEnglish ? 'Carrier Service' : 'Ekspedisi'}</th>
                    <th className="p-4">{isEnglish ? 'Coverage Area' : 'Cakupan Wilayah'}</th>
                    <th className="p-4">{isEnglish ? 'Estimated Transit' : 'Estimasi Pengiriman'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium text-neutral-600">
                  {deliveryPartners.map((partner, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="p-4 font-bold text-neutral-900">{partner.name}</td>
                      <td className="p-4">{partner.area}</td>
                      <td className="p-4">{partner.timeline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Shipping details text */}
          <div className="space-y-4 text-xs text-neutral-600 leading-relaxed font-medium">
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
              <p>
                <span className="font-semibold text-neutral-900">
                  {isEnglish ? 'Tracking Note:' : 'Catatan Pelacakan:'}
                </span>{' '}
                {isEnglish
                  ? 'Your Airway Bill (AWB) tracking number will automatically update under "My Orders" within 24 hours after courier pickup from our fulfillment center.'
                  : 'Nomor Resi (AWB) akan diperbarui secara otomatis di halaman riwayat pesanan Anda selambat-lambatnya 1x24 jam setelah kurir melakukan pick-up paket dari gudang kami.'}
              </p>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
