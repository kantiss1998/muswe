'use server'

export async function fetchInvoiceHtml(orderNumber: string): Promise<string> {
  const cdnUrl = `https://cdn.muswedaily.com/invoices/${orderNumber}.html`
  try {
    const res = await fetch(cdnUrl, { cache: 'no-store' })
    if (!res.ok) {
      throw new Error('Invoice not found')
    }
    const htmlString = await res.text()
    return htmlString
  } catch (error) {
    console.error('Failed to fetch invoice html via server action', error)
    throw new Error('Failed to load invoice')
  }
}
