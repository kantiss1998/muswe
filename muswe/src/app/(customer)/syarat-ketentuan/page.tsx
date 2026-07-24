import React from 'react'
import { Metadata } from 'next'
import { SyaratKetentuanClient } from './SyaratKetentuanClient'

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan — Muswe',
  description:
    'Syarat dan ketentuan umum penggunaan situs, pendaftaran akun, pembelian produk, dan keamanan transaksi di Muswe.',
}

export default function SyaratKetentuanPage(): React.JSX.Element {
  return <SyaratKetentuanClient />
}
