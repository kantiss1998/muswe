import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: { orderNumber: string } }) {
  const { orderNumber } = params
  
  const cdnUrl = `https://cdn.muswedaily.com/invoices/${orderNumber}.html`
  
  try {
    const res = await fetch(cdnUrl)
    
    if (!res.ok) {
      return new NextResponse('Invoice not found', { status: 404 })
    }
    
    const text = await res.text()
    
    return new NextResponse(text, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Failed to fetch invoice:', error)
    return new NextResponse('Failed to load invoice', { status: 500 })
  }
}
