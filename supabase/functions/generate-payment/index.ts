// @ts-nocheck
// =============================================================
// Edge Function: generate-payment
// Generates DOKU Checkout payment link for an order
// =============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

async function generateDigest(bodyString: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(bodyString);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const base64 = btoa(String.fromCharCode(...hashArray));
  return base64;
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
  const base64Signature = btoa(String.fromCharCode(...signatureArray));
  return `HMACSHA256=${base64Signature}`;
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

    // Get order + user data
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        profiles!inner(name, phone),
        order_items(*),
        payments(id, status, payment_url, updated_at, created_at)
      `)
      .eq("order_number", order_number)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ success: false, message: "Pesanan tidak ditemukan", code: "ORDER_NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate order status
    if (order.status !== "pending_payment") {
      return new Response(
        JSON.stringify({ success: false, message: "Pesanan tidak dalam status menunggu pembayaran", code: "ORDER_WRONG_STATUS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get auth user from request and validate JWT
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

    // Check order ownership
    if (order.user_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, message: "Akses ditolak: Anda bukan pemilik pesanan ini" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check payment record
    let payment = Array.isArray(order.payments) ? order.payments[0] : order.payments;

    if (!payment) {
      console.log(`Creating missing payment record for order ${order.order_number}`);
      const { data: newPayment, error: insertPayError } = await supabase
        .from("payments")
        .insert({
          order_id: order.id,
          gateway_order_id: order.order_number,
          status: "pending",
          amount: order.total_amount,
        })
        .select("id, status, payment_url")
        .single();

      if (insertPayError || !newPayment) {
        console.error("Failed to create missing payment record:", insertPayError);
        return new Response(
          JSON.stringify({ success: false, message: "Gagal membuat data pembayaran", code: "PAYMENT_CREATE_ERROR" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      payment = newPayment;
    }

    if (payment.status === "pending" && payment.payment_url) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            redirect_url: payment.payment_url,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DOKU API Credentials
    const clientId = Deno.env.get("DOKU_CLIENT_ID")!;
    const secretKey = Deno.env.get("DOKU_SECRET_KEY")!;
    const dokuMode = Deno.env.get("DOKU_MODE") || "sandbox";
    const baseUrl = dokuMode === "production" ? "https://api.doku.com" : "https://api-sandbox.doku.com";
    const targetPath = "/checkout/v1/payment";

    const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || Deno.env.get("APP_URL") || "http://localhost:3000";

    const lineItems = order.order_items.map((item: any) => ({
      name: `${item.product_name} - ${item.variant_name}`.substring(0, 50),
      price: Math.round(Number(item.price)),
      quantity: Number(item.quantity),
    }));

    if (Number(order.shipping_cost) > 0) {
      lineItems.push({
        name: "Ongkos Kirim",
        price: Math.round(Number(order.shipping_cost)),
        quantity: 1,
      });
    }

    const payload = {
      order: {
        amount: Math.round(Number(order.total_amount)),
        invoice_number: order.order_number,
        currency: "IDR",
        callback_url: `${appUrl}/pesanan/${order.order_number}`,
        callback_url_cancel: `${appUrl}/pesanan/${order.order_number}`,
        callback_url_result: `${appUrl}/pesanan/${order.order_number}`,
        line_items: lineItems,
      },
      payment: {
        payment_due_date: 60, // 60 minutes as requested by user
      },
    };

    const bodyString = JSON.stringify(payload);
    const digest = await generateDigest(bodyString);
    const requestId = crypto.randomUUID();
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const signature = await generateSignature(clientId, secretKey, requestId, timestamp, targetPath, digest);

    const dokuResponse = await fetch(`${baseUrl}${targetPath}`, {
      method: "POST",
      headers: {
        "Client-Id": clientId,
        "Request-Id": requestId,
        "Request-Timestamp": timestamp,
        Signature: signature,
        "Content-Type": "application/json",
      },
      body: bodyString,
    });

    const dokuData = await dokuResponse.json();

    if (!dokuResponse.ok || !dokuData.response?.payment?.url) {
      console.error("DOKU error:", JSON.stringify(dokuData));
      return new Response(
        JSON.stringify({ success: false, message: "Gagal membuat link pembayaran DOKU", code: "PAYMENT_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentUrl = dokuData.response.payment.url;

    // Save payment_url to payments table
    await supabase
      .from("payments")
      .update({
        payment_url: paymentUrl,
        gateway_response: dokuData,
      })
      .eq("id", payment.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          redirect_url: paymentUrl,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-payment error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error", code: "INTERNAL_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
