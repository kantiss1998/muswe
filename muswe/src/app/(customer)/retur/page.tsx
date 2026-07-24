import React from 'react'
import { Metadata } from 'next'
import { ReturClient } from './ReturClient'

export const metadata: Metadata = {
  title: 'Kebijakan Pengembalian (Retur) — Muswe',
  description:
    'Syarat dan panduan pengajuan retur barang, tukar ukuran, klaim produk cacat, dan proses pengembalian dana (refund) di Muswe.',
}

export default function ReturPage(): React.JSX.Element {
  return <ReturClient />
}
