import crypto from 'crypto'
import { safeLogError } from './logger'

const DOKU_MODE = process.env.DOKU_MODE || 'sandbox'
const DOKU_BASE_URL =
  DOKU_MODE === 'production' ? 'https://api.doku.com' : 'https://api-sandbox.doku.com'

export interface DokuOrderDetails {
  amount: number
  invoice_number: string
  currency?: string
  callback_url: string
  callback_url_cancel?: string
  callback_url_result?: string
  line_items?: Array<{
    name: string
    price: number
    quantity: number
  }>
}

export interface DokuPaymentConfig {
  payment_due_date?: number // in minutes (e.g. 60)
}

export interface DokuCheckoutResponse {
  message: string[]
  response: {
    order: {
      invoice_number: string
      amount: number
    }
    payment: {
      url: string
      token?: string
    }
  }
}

export class DokuClient {
  private clientId: string
  private secretKey: string

  constructor() {
    this.clientId = process.env.DOKU_CLIENT_ID || ''
    this.secretKey = process.env.DOKU_SECRET_KEY || ''
  }

  generateDigest(bodyString: string): string {
    const hash = crypto.createHash('sha256').update(bodyString, 'utf8').digest('base64')
    return hash
  }

  generateSignature(params: {
    clientId: string
    requestId: string
    timestamp: string
    targetPath: string
    digest?: string
  }): string {
    let rawString = `Client-Id:${params.clientId}\nRequest-Id:${params.requestId}\nRequest-Timestamp:${params.timestamp}\nRequest-Target:${params.targetPath}`
    if (params.digest) {
      rawString += `\nDigest:${params.digest}`
    }

    const hmac = crypto.createHmac('sha256', this.secretKey)
    hmac.update(rawString)
    const signature = `HMACSHA256=${hmac.digest('base64')}`
    return signature
  }

  async createCheckoutPayment(order: DokuOrderDetails, paymentConfig?: DokuPaymentConfig): Promise<{ payment_url: string; invoice_number: string }> {
    if (!this.clientId || !this.secretKey) {
      safeLogError('[DokuClient]', 'DOKU_CLIENT_ID or DOKU_SECRET_KEY is not configured')
      throw new Error('Konfigurasi DOKU Payment Gateway belum lengkap')
    }

    const targetPath = '/checkout/v1/payment'
    const requestId = crypto.randomUUID()
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z') // ISO8601 UTC+0 format

    const payload = {
      order: {
        amount: Math.round(order.amount),
        invoice_number: order.invoice_number,
        currency: order.currency || 'IDR',
        callback_url: order.callback_url,
        callback_url_cancel: order.callback_url_cancel || order.callback_url,
        callback_url_result: order.callback_url_result || order.callback_url,
        line_items: order.line_items,
      },
      payment: {
        payment_due_date: paymentConfig?.payment_due_date || 60,
      },
    }

    const bodyString = JSON.stringify(payload)
    const digest = this.generateDigest(bodyString)
    const signature = this.generateSignature({
      clientId: this.clientId,
      requestId,
      timestamp,
      targetPath,
      digest,
    })

    try {
      const response = await fetch(`${DOKU_BASE_URL}${targetPath}`, {
        method: 'POST',
        headers: {
          'Client-Id': this.clientId,
          'Request-Id': requestId,
          'Request-Timestamp': timestamp,
          Signature: signature,
          'Content-Type': 'application/json',
        },
        body: bodyString,
      })

      const data = await response.json()

      if (!response.ok || !data.response?.payment?.url) {
        safeLogError('[DokuClient] Checkout payment error:', data)
        throw new Error(
          Array.isArray(data.message) ? data.message.join(', ') : 'Gagal membuat sesi pembayaran DOKU'
        )
      }

      return {
        payment_url: data.response.payment.url,
        invoice_number: data.response.order.invoice_number,
      }
    } catch (error) {
      safeLogError('[DokuClient] Request failed:', error)
      throw error
    }
  }

  verifyNotificationSignature(headers: {
    clientId: string
    requestId: string
    timestamp: string
    targetPath: string
    receivedSignature: string
    rawBody: string
  }): boolean {
    const digest = this.generateDigest(headers.rawBody)
    const expectedSignature = this.generateSignature({
      clientId: headers.clientId,
      requestId: headers.requestId,
      timestamp: headers.timestamp,
      targetPath: headers.targetPath,
      digest,
    })

    return expectedSignature === headers.receivedSignature
  }
}

export const dokuClient = new DokuClient()
