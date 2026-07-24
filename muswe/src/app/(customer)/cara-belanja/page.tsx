import React from 'react'
import { Metadata } from 'next'
import { CaraBelanjaClient } from './CaraBelanjaClient'

export const metadata: Metadata = {
  title: 'Cara Belanja — Muswe',
  description:
    'Ikuti panduan mudah cara berbelanja kerudung & busana batik motif premium di toko online Muswe.',
}

export default function CaraBelanjaPage(): React.JSX.Element {
  return <CaraBelanjaClient />
}
