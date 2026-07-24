import React from 'react'
import { Metadata } from 'next'
import { PengirimanClient } from './PengirimanClient'

export const metadata: Metadata = {
  title: 'Informasi Pengiriman — Muswe',
  description:
    'Informasi lengkap tarif, jadwal, cakupan daerah, ekspedisi pengiriman, dan kebijakan berat paket Muswe.',
}

export default function PengirimanPage(): React.JSX.Element {
  return <PengirimanClient />
}
