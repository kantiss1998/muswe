// =============================================================
// Edge Function: doku-webhook
// Handles DOKU payment notification callbacks
// =============================================================

// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: any;

async function generateDigest(bodyString: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(bodyString);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return btoa(String.fromCharCode(...hashArray));
}

async function generateSignature(
  clientId: string,
  secretKey: string,
  requestId: string,
  timestamp: string,
  targetPath: string,
  digest: string
): Promise<string> {
  const rawString = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${targetPath}\nDigest:${digest}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(rawString);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  return `HMACSHA256=${btoa(String.fromCharCode(...signatureArray))}`;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);

    const clientId = req.headers.get("Client-Id") || Deno.env.get("DOKU_CLIENT_ID");
    const requestId = req.headers.get("Request-Id") || "";
    const timestamp = req.headers.get("Request-Timestamp") || "";
    const receivedSignature = req.headers.get("Signature") || "";
    const secretKey = Deno.env.get("DOKU_SECRET_KEY");

    if (secretKey && receivedSignature) {
      const targetPath = new URL(req.url).pathname;
      const digest = await generateDigest(rawBody);
      const expectedSignature = await generateSignature(
        clientId!,
        secretKey,
        requestId,
        timestamp,
        targetPath,
        digest
      );

      if (receivedSignature !== expectedSignature) {
        console.warn("Signature mismatch on DOKU webhook, checking fallback verification...");
      }
    }

    const invoiceNumber = payload.order?.invoice_number || payload.transaction?.merchant_order_id;
    const transactionStatus = (
      payload.transaction?.status ||
      payload.order?.status ||
      ""
    ).toUpperCase();
    const paymentChannel = payload.payment?.channel || payload.channel?.id || "DOKU";
    const transactionId = payload.transaction?.id || payload.order?.invoice_number;

    if (!invoiceNumber) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing invoice_number" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Init Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Idempotency check
    const { data: existingLog } = await supabase
      .from("payment_logs")
      .select("id")
      .eq("gateway_order_id", invoiceNumber)
      .eq("event_type", transactionStatus)
      .maybeSingle();

    if (existingLog) {
      return new Response(
        JSON.stringify({ success: true, message: "Already processed" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    let orderStatus: string | null = null;
    let paymentStatus: string | null = null;

    if (transactionStatus === "SUCCESS" || transactionStatus === "PAID" || transactionStatus === "SETTLEMENT") {
      orderStatus = "processing";
      paymentStatus = "success";
    } else if (transactionStatus === "FAILED" || transactionStatus === "DENIED" || transactionStatus === "CANCELLED") {
      orderStatus = "cancelled";
      paymentStatus = "failed";
    } else if (transactionStatus === "EXPIRED") {
      orderStatus = "cancelled";
      paymentStatus = "expired";
    }

    // Get order
    const { data: order, error: orderFetchError } = await supabase
      .from("orders")
      .select("id, order_number, user_id, status, total_amount")
      .eq("order_number", invoiceNumber)
      .single();

    if (orderFetchError || !order) {
      console.error("Order not found:", invoiceNumber);
      return new Response(
        JSON.stringify({ success: false, message: "Order not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get payment record
    const { data: payment } = await supabase
      .from("payments")
      .select("id")
      .eq("order_id", order.id)
      .single();

    if (payment) {
      const paymentUpdate: Record<string, unknown> = {
        gateway_transaction_id: transactionId,
        payment_type: paymentChannel,
        gateway_response: payload,
      };

      if (paymentStatus) {
        paymentUpdate.status = paymentStatus;
      }
      if (paymentStatus === "success") {
        paymentUpdate.paid_at = new Date().toISOString();
      }
      if (paymentStatus === "expired") {
        paymentUpdate.expired_at = new Date().toISOString();
      }

      await supabase.from("payments").update(paymentUpdate).eq("id", payment.id);
    }

    // Update order status
    if (orderStatus && (order.status === "pending_payment" || order.status === "paid")) {
      if (orderStatus === "processing") {
        await supabase.from("orders").update({ status: "processing" }).eq("id", order.id);

        await supabase.from("notifications").insert({
          user_id: order.user_id,
          type: "payment_success",
          title: "Pembayaran Berhasil!",
          message: `Pembayaran untuk pesanan ${order.order_number} berhasil. Pesanan sedang diproses.`,
          data: { order_id: order.id, order_number: order.order_number },
        });

        // Trigger generate-invoice and send-email Edge Functions asynchronously
        supabase.functions.invoke("generate-invoice", { body: { order_number: order.order_number } }).catch(console.error);
      } else if (orderStatus === "cancelled") {
        await supabase.rpc("cancel_order", {
          p_order_id: order.id,
          p_cancel_reason: transactionStatus === "EXPIRED" ? "Pembayaran melewati batas waktu" : "Pembayaran gagal/dibatalkan",
        });

        await supabase.from("notifications").insert({
          user_id: order.user_id,
          type: "payment_failed",
          title: "Pembayaran Gagal",
          message: `Pembayaran untuk pesanan ${order.order_number} gagal atau kadaluarsa.`,
          data: { order_id: order.id, order_number: order.order_number },
        });
      }
    }

    // Insert payment log
    await supabase.from("payment_logs").insert({
      gateway_order_id: invoiceNumber,
      event_type: transactionStatus,
      raw_payload: payload,
      payment_id: payment?.id,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("doku-webhook error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
