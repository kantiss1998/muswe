import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeLogError } from '@/lib/logger'
import type { Database } from '@/shared/types/database'

function generateDigest(bodyString: string): string {
  return crypto.createHash('sha256').update(bodyString, 'utf8').digest('base64')
}

function generateSignature(
  clientId: string,
  secretKey: string,
  requestId: string,
  timestamp: string,
  targetPath: string,
  digest: string
): string {
  const rawString = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${targetPath}\nDigest:${digest}`
  const hmac = crypto.createHmac('sha256', secretKey)
  hmac.update(rawString)
  return `HMACSHA256=${hmac.digest('base64')}`
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch (parseError) {
      safeLogError('DOKU webhook invalid JSON body', parseError)
      return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 })
    }

    const clientId = req.headers.get('Client-Id') || process.env.DOKU_CLIENT_ID
    const requestId = req.headers.get('Request-Id') || ''
    const timestamp = req.headers.get('Request-Timestamp') || ''
    const receivedSignature = req.headers.get('Signature') || ''
    const secretKey = process.env.DOKU_SECRET_KEY

    if (secretKey && receivedSignature) {
      const url = new URL(req.url)
      const targetPath = url.pathname
      const digest = generateDigest(rawBody)
      let expectedSignature = generateSignature(clientId || '', secretKey, requestId, timestamp, targetPath, digest)

      // Also try canonical route if path has proxy or subpath differences
      if (receivedSignature !== expectedSignature) {
        const altPath = '/api/webhooks/doku'
        const altSignature = generateSignature(clientId || '', secretKey, requestId, timestamp, altPath, digest)
        if (receivedSignature === altSignature) {
          expectedSignature = altSignature
        }
      }

      if (receivedSignature !== expectedSignature) {
        safeLogError('DOKU webhook signature mismatch. Request blocked.', new Error('Invalid signature'))
        return NextResponse.json({ success: false, message: 'Unauthorized: Invalid Signature' }, { status: 401 })
      }
    }

    const invoiceNumber = payload.order?.invoice_number || payload.transaction?.merchant_order_id
    const transactionStatus = (
      payload.transaction?.status ||
      payload.order?.status ||
      ''
    ).toUpperCase()
    const paymentChannel = payload.payment?.channel || payload.channel?.id || 'DOKU'
    const transactionId =
      payload.transaction?.id ||
      payload.transaction?.original_request_id ||
      payload.virtual_account_payment?.reference_number ||
      payload.order?.invoice_number

    if (!invoiceNumber) {
      return NextResponse.json({ success: false, message: 'Missing invoice_number' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Idempotency check
    const { data: existingLog } = await supabase
      .from('payment_logs')
      .select('id')
      .eq('gateway_order_id', invoiceNumber)
      .eq('event_type', transactionStatus)
      .maybeSingle()

    if (existingLog) {
      return NextResponse.json({ success: true, message: 'Already processed' }, { status: 200 })
    }

    let orderStatus: 'processing' | 'cancelled' | null = null
    let paymentStatus: string | null = null

    if (transactionStatus === 'SUCCESS' || transactionStatus === 'PAID' || transactionStatus === 'SETTLEMENT') {
      orderStatus = 'processing'
      paymentStatus = 'success'
    } else if (transactionStatus === 'FAILED' || transactionStatus === 'DENIED' || transactionStatus === 'CANCELLED') {
      orderStatus = 'cancelled'
      paymentStatus = 'failed'
    } else if (transactionStatus === 'EXPIRED') {
      orderStatus = 'cancelled'
      paymentStatus = 'expired'
    }

    // Get order
    const { data: order, error: orderFetchError } = await supabase
      .from('orders')
      .select('id, order_number, user_id, status, total_amount')
      .eq('order_number', invoiceNumber)
      .single()

    if (orderFetchError || !order) {
      safeLogError(`Order not found for DOKU webhook: ${invoiceNumber}`, orderFetchError)
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 })
    }

    // Get payment record
    const { data: payment } = await supabase
      .from('payments')
      .select('id')
      .eq('order_id', order.id)
      .single()

    if (payment) {
      const paymentUpdate: Database['public']['Tables']['payments']['Update'] = {
        gateway_transaction_id: transactionId,
        payment_type: paymentChannel,
        gateway_response: payload,
      }

      if (paymentStatus) {
        paymentUpdate.status = paymentStatus
      }
      if (paymentStatus === 'success') {
        paymentUpdate.paid_at = new Date().toISOString()
      }
      if (paymentStatus === 'expired') {
        paymentUpdate.expired_at = new Date().toISOString()
      }

      await supabase.from('payments').update(paymentUpdate).eq('id', payment.id)
    }

    // Update order status if order was still pending
    if (orderStatus && (order.status === 'pending_payment' || order.status === 'paid')) {
      if (orderStatus === 'processing') {
        await supabase.from('orders').update({ status: 'processing' }).eq('id', order.id)

        await supabase.from('notifications').insert({
          user_id: order.user_id,
          type: 'payment_success',
          title: 'Pembayaran Berhasil!',
          message: `Pembayaran untuk pesanan ${order.order_number} berhasil. Pesanan sedang diproses.`,
          data: { order_id: order.id, order_number: order.order_number },
        })

        // Await generate-invoice before serverless runtime returns HTTP response
        try {
          await supabase.functions.invoke('generate-invoice', {
            body: { order_number: order.order_number },
          })
        } catch (err) {
          safeLogError('Error invoking generate-invoice from DOKU webhook', err)
        }
      } else if (orderStatus === 'cancelled') {
        await supabase.rpc('cancel_order', {
          p_order_id: order.id,
          p_cancel_reason:
            transactionStatus === 'EXPIRED' ? 'Pembayaran melewati batas waktu' : 'Pembayaran gagal/dibatalkan',
        })

        await supabase.from('notifications').insert({
          user_id: order.user_id,
          type: 'payment_failed',
          title: 'Pembayaran Gagal',
          message: `Pembayaran untuk pesanan ${order.order_number} gagal atau kadaluarsa.`,
          data: { order_id: order.id, order_number: order.order_number },
        })
      }
    }

    // Insert audit log
    await supabase.from('payment_logs').insert({
      gateway_order_id: invoiceNumber,
      event_type: transactionStatus,
      raw_payload: payload,
      payment_id: payment?.id || null,
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    safeLogError('DOKU webhook unhandled error', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
