import React from 'react'
import { Metadata } from 'next'
import { KebijakanPrivasiClient } from './KebijakanPrivasiClient'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi — Muswe',
  description:
    'Informasi mengenai bagaimana Muswe mengumpulkan, menyimpan, menggunakan, dan melindungi data pribadi Anda selaku pelanggan.',
}

export default function KebijakanPrivasiPage(): React.JSX.Element {
  return <KebijakanPrivasiClient />
}
