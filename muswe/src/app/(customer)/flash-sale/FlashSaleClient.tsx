'use client'

import React from 'react'
import { FlashSaleSection } from '@/modules/flash-sales/components/FlashSaleSection'
import { PageHero, PageContainer, EmptyState } from '@/shared/components'
import { useTranslation } from '@/shared/i18n/useTranslation'

interface FlashSaleClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  flashSale: any
}

export function FlashSaleClient({ flashSale }: FlashSaleClientProps): React.JSX.Element {
  const { isEnglish } = useTranslation()

  return (
    <div className="bg-white min-h-screen">
      <PageHero
        eyebrow={isEnglish ? 'Special Offer' : 'Penawaran Spesial'}
        title="Flash Sale"
        subtitle={
          isEnglish
            ? "Limited time deals with exclusive discounts. Don't miss out!"
            : 'Diskon terbatas dengan waktu terbatas. Jangan lewatkan penawaran eksklusif ini.'
        }
        variant="dark"
      />

      {flashSale ? (
        <FlashSaleSection flashSale={flashSale} />
      ) : (
        <PageContainer>
          <EmptyState
            icon="Percent"
            title={isEnglish ? 'No Active Flash Sale' : 'Tidak Ada Flash Sale Aktif'}
            description={
              isEnglish
                ? 'There are currently no active flash sale promotions. Stay tuned for upcoming deals!'
                : 'Saat ini sedang tidak ada promo flash sale yang berlangsung. Nantikan promo menarik berikutnya dari kami!'
            }
            action={{
              label: isEnglish ? 'Shop Collections' : 'Belanja Produk',
              href: '/produk',
            }}
          />
        </PageContainer>
      )}
    </div>
  )
}
