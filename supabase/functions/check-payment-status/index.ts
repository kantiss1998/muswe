// @ts-nocheck
// =============================================================
// Edge Function: check-payment-status
// Checks payment status for an order from database and DOKU API
// =============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

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
  digest?: string
): Promise<string> {
  const rawString = digest
    ? `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${targetPath}\nDigest:${digest}`
    : `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${targetPath}`;
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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_number } = await req.json();

    if (!order_number) {
      return new Response(
        JSON.stringify({ success: false, message: "Order number diperlukan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Init Supabase admin client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get order & payment
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, user_id, status, total_amount, payments(id, status, payment_type)")
      .eq("order_number", order_number)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ success: false, message: "Pesanan tidak ditemukan" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify ownership
    if (order.user_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, message: "Akses ditolak" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let payment = Array.isArray(order.payments) ? order.payments[0] : order.payments;

    // If order status is still pending_payment, query DOKU Order Status API to sync
    if (order.status === "pending_payment") {
      const clientId = Deno.env.get("DOKU_CLIENT_ID")?.trim();
      const secretKey = Deno.env.get("DOKU_SECRET_KEY")?.trim();
      const dokuMode = (Deno.env.get("DOKU_MODE") || "sandbox").trim();

      if (clientId && secretKey) {
        const baseUrl = dokuMode === "production" ? "https://api.doku.com" : "https://api-sandbox.doku.com";
        const targetPath = `/orders/v1/status/${order.order_number}`;
        const requestId = crypto.randomUUID();
        const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
        const digestEmpty = await generateDigest("");

        // Try signature with digest first, fallback to without digest if needed
        const signatureWithDigest = await generateSignature(clientId, secretKey, requestId, timestamp, targetPath, digestEmpty);
        const signatureNoDigest = await generateSignature(clientId, secretKey, requestId, timestamp, targetPath);

        try {
          console.log(`Checking payment status with DOKU (${baseUrl}${targetPath}) for order ${order.order_number}`);
          let dokuRes = await fetch(`${baseUrl}${targetPath}`, {
            method: "GET",
            headers: {
              "Client-Id": clientId,
              "Request-Id": requestId,
              "Request-Timestamp": timestamp,
              "Signature": signatureWithDigest,
              "Digest": digestEmpty,
            },
          });

          if (!dokuRes.ok && (dokuRes.status === 401 || dokuRes.status === 400)) {
            // Try without Digest header
            dokuRes = await fetch(`${baseUrl}${targetPath}`, {
              method: "GET",
              headers: {
                "Client-Id": clientId,
                "Request-Id": requestId,
                "Request-Timestamp": timestamp,
                "Signature": signatureNoDigest,
              },
            });
          }

          if (dokuRes.ok) {
            const dokuData = await dokuRes.json();
            console.log("DOKU Status Response:", JSON.stringify(dokuData));

            const transactionStatus = (
              dokuData.transaction?.status ||
              dokuData.order?.status ||
              dokuData.status ||
              ""
            ).toUpperCase();

            const paymentChannel = dokuData.payment?.channel || dokuData.channel?.id || "DOKU";
            const transactionId = dokuData.transaction?.id || order.order_number;

            let newOrderStatus: string | null = null;
            let newPaymentStatus: string | null = null;

            if (["SUCCESS", "PAID", "SETTLEMENT"].includes(transactionStatus)) {
              newOrderStatus = "processing";
              newPaymentStatus = "success";
            } else if (["FAILED", "DENIED", "CANCELLED"].includes(transactionStatus)) {
              newOrderStatus = "cancelled";
              newPaymentStatus = "failed";
            } else if (transactionStatus === "EXPIRED") {
              newOrderStatus = "cancelled";
              newPaymentStatus = "expired";
            }

            if (newOrderStatus === "processing") {
              if (payment) {
                await supabase.from("payments").update({
                  gateway_transaction_id: transactionId,
                  payment_type: paymentChannel,
                  status: "success",
                  paid_at: new Date().toISOString(),
                  gateway_response: dokuData,
                }).eq("id", payment.id);
              }

              await supabase.from("orders").update({ status: "processing" }).eq("id", order.id);

              await supabase.from("notifications").insert({
                user_id: order.user_id,
                type: "payment_success",
                title: "Pembayaran Berhasil!",
                message: `Pembayaran untuk pesanan ${order.order_number} berhasil. Pesanan sedang diproses.`,
                data: { order_id: order.id, order_number: order.order_number },
              });

              supabase.functions.invoke("generate-invoice", { body: { order_number: order.order_number } }).catch(console.error);

              order.status = "processing";
              if (payment) payment.status = "success";
            } else if (newOrderStatus === "cancelled") {
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

              order.status = "cancelled";
              if (payment) payment.status = newPaymentStatus;
            }
          } else {
            console.warn(`DOKU status check failed with HTTP ${dokuRes.status}`);
          }
        } catch (dokuErr) {
          console.error("Error fetching DOKU status API:", dokuErr);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          order_status: order.status,
          payment_status: payment?.status || "pending",
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("check-payment-status error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

