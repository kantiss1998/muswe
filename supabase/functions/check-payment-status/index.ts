// @ts-nocheck
// =============================================================
// Edge Function: check-payment-status
// Checks payment status for an order from database
// =============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

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
      .select("id, order_number, user_id, status, total_amount, payments(status, payment_type)")
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

    const payment = Array.isArray(order.payments) ? order.payments[0] : order.payments;

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
