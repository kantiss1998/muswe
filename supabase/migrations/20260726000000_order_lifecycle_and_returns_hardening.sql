-- =============================================================
-- Migration: 20260726000000_order_lifecycle_and_returns_hardening.sql
-- Description:
-- 1. Allow Admin (via is_admin()) and service_role in confirm_delivery,
--    fix auth.uid() IS NULL check, and update order_shipping.delivered_at
-- 2. Allow Admin (via is_admin()) to cancel orders in 'pending_payment',
--    'paid', or 'processing' status while keeping customer cancellation
--    restricted to 'pending_payment'
-- 3. Add atomic submit_return_request RPC for return_requests +
--    return_items + return_media in a single transaction
-- =============================================================

-- 1. Fix confirm_delivery to support Admin + update order_shipping timestamps
CREATE OR REPLACE FUNCTION public.confirm_delivery(
  p_order_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
BEGIN
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pesanan tidak ditemukan', 'code', 'ORDER_NOT_FOUND');
  END IF;

  -- Enforce ownership unless called by admin, service_role, or internal postgres/cron
  IF COALESCE(auth.role(), '') != 'service_role'
     AND NOT (COALESCE(current_setting('request.jwt.claims', true), '') = '' AND session_user IN ('postgres', 'supabase_admin'))
  THEN
    IF auth.uid() IS NULL OR (v_order.user_id IS DISTINCT FROM auth.uid() AND NOT public.is_admin()) THEN
      RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak', 'code', 'FORBIDDEN');
    END IF;
  END IF;

  IF v_order.status NOT IN ('shipped', 'delivered') THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Pesanan hanya dapat diselesaikan setelah dikirim',
      'code', 'ORDER_WRONG_STATUS'
    );
  END IF;

  UPDATE orders
  SET status = 'completed',
      updated_at = now()
  WHERE id = p_order_id;

  UPDATE order_shipping
  SET status = 'delivered',
      delivered_at = COALESCE(delivered_at, now())
  WHERE order_id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'order_id', p_order_id,
      'status', 'completed'
    )
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Terjadi kesalahan saat mengonfirmasi penerimaan barang',
    'code', 'CONFIRM_ERROR'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update cancel_order so Admin can also cancel 'paid' and 'processing' orders
CREATE OR REPLACE FUNCTION public.cancel_order(
  p_order_id UUID,
  p_cancel_reason TEXT DEFAULT 'Dibatalkan oleh customer'
)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_is_privileged BOOLEAN := false;
BEGIN
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pesanan tidak ditemukan', 'code', 'ORDER_NOT_FOUND');
  END IF;

  IF COALESCE(auth.role(), '') = 'service_role'
     OR (COALESCE(current_setting('request.jwt.claims', true), '') = '' AND session_user IN ('postgres', 'supabase_admin'))
  THEN
    v_is_privileged := true;
  ELSIF auth.uid() IS NOT NULL AND public.is_admin() THEN
    v_is_privileged := true;
  ELSIF auth.uid() IS NULL OR v_order.user_id IS DISTINCT FROM auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak', 'code', 'FORBIDDEN');
  END IF;

  IF v_is_privileged THEN
    IF v_order.status NOT IN ('pending_payment', 'paid', 'processing') THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Pesanan yang sudah dikirim atau selesai tidak dapat dibatalkan',
        'code', 'ORDER_WRONG_STATUS'
      );
    END IF;
  ELSE
    IF v_order.status != 'pending_payment' THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Pesanan hanya bisa dibatalkan saat status menunggu pembayaran',
        'code', 'ORDER_WRONG_STATUS'
      );
    END IF;
  END IF;

  FOR v_item IN
    SELECT oi.*, pv.stock AS current_stock
    FROM order_items oi
    JOIN product_variants pv ON pv.id = oi.variant_id
    WHERE oi.order_id = p_order_id
    FOR UPDATE OF pv
  LOOP
    UPDATE product_variants
    SET stock = stock + v_item.quantity
    WHERE id = v_item.variant_id;

    INSERT INTO stock_mutations (variant_id, order_item_id, type, qty, qty_before, qty_after, note)
    VALUES (
      v_item.variant_id,
      v_item.id,
      'released',
      v_item.quantity,
      v_item.current_stock,
      v_item.current_stock + v_item.quantity,
      'Order cancelled: ' || v_order.order_number
    );

    IF v_item.flash_sale_item_id IS NOT NULL THEN
      UPDATE flash_sale_items
      SET sold_count = GREATEST(sold_count - v_item.quantity, 0)
      WHERE id = v_item.flash_sale_item_id;
    END IF;
  END LOOP;

  UPDATE orders
  SET status = 'cancelled',
      cancel_reason = p_cancel_reason,
      cancelled_at = now()
  WHERE id = p_order_id;

  UPDATE payments
  SET status = 'expired'
  WHERE order_id = p_order_id AND status = 'pending';

  IF v_order.voucher_id IS NOT NULL THEN
    DELETE FROM voucher_usages WHERE order_id = p_order_id;
    UPDATE vouchers SET used_count = GREATEST(used_count - 1, 0) WHERE id = v_order.voucher_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'order_id', p_order_id,
      'order_number', v_order.order_number,
      'status', 'cancelled'
    )
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Terjadi kesalahan saat membatalkan pesanan',
    'code', 'CANCEL_ERROR'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Atomic RPC for customer return request submission
CREATE OR REPLACE FUNCTION public.submit_return_request(
  p_order_id UUID,
  p_reason TEXT,
  p_customer_notes TEXT DEFAULT NULL,
  p_bank_name TEXT DEFAULT NULL,
  p_account_number TEXT DEFAULT NULL,
  p_account_name TEXT DEFAULT NULL,
  p_items JSONB DEFAULT '[]'::jsonb,
  p_media_urls TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_return_id UUID;
  v_elem JSONB;
  v_order_item RECORD;
  v_qty INT;
  v_media_url TEXT;
  v_idx INT := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Silakan login terlebih dahulu', 'code', 'UNAUTHORIZED');
  END IF;

  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pesanan tidak ditemukan', 'code', 'ORDER_NOT_FOUND');
  END IF;

  IF v_order.user_id IS DISTINCT FROM auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak', 'code', 'FORBIDDEN');
  END IF;

  IF v_order.status != 'completed' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Retur hanya bisa diajukan untuk pesanan berstatus Selesai', 'code', 'ORDER_WRONG_STATUS');
  END IF;

  IF EXISTS (SELECT 1 FROM return_requests WHERE order_id = p_order_id) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pengajuan retur untuk pesanan ini sudah pernah dikirim', 'code', 'RETURN_EXISTS');
  END IF;

  IF NULLIF(TRIM(COALESCE(p_bank_name, '')), '') IS NULL
     OR NULLIF(TRIM(COALESCE(p_account_number, '')), '') IS NULL
     OR NULLIF(TRIM(COALESCE(p_account_name, '')), '') IS NULL
  THEN
    RETURN jsonb_build_object('success', false, 'message', 'Detail rekening pengembalian dana wajib diisi', 'code', 'VALIDATION_ERROR');
  END IF;

  IF jsonb_typeof(p_items) != 'array' OR jsonb_array_length(p_items) = 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pilih minimal satu item untuk diretur', 'code', 'VALIDATION_ERROR');
  END IF;

  INSERT INTO return_requests (
    order_id,
    user_id,
    reason,
    customer_notes,
    refund_bank_name,
    refund_account_number,
    refund_account_name,
    status
  )
  VALUES (
    p_order_id,
    auth.uid(),
    p_reason,
    NULLIF(TRIM(COALESCE(p_customer_notes, '')), ''),
    TRIM(p_bank_name),
    TRIM(p_account_number),
    TRIM(p_account_name),
    'pending'
  )
  RETURNING id INTO v_return_id;

  FOR v_elem IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := COALESCE((v_elem->>'quantity')::INT, 0);

    SELECT id, quantity INTO v_order_item
    FROM order_items
    WHERE id = (v_elem->>'order_item_id')::UUID
      AND order_id = p_order_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Item pesanan tidak valid untuk retur';
    END IF;

    IF v_qty < 1 OR v_qty > v_order_item.quantity THEN
      RAISE EXCEPTION 'Jumlah item retur tidak valid';
    END IF;

    INSERT INTO return_items (return_request_id, order_item_id, quantity)
    VALUES (v_return_id, v_order_item.id, v_qty);
  END LOOP;

  IF p_media_urls IS NOT NULL AND array_length(p_media_urls, 1) > 0 THEN
    FOREACH v_media_url IN ARRAY p_media_urls
    LOOP
      IF NULLIF(TRIM(COALESCE(v_media_url, '')), '') IS NOT NULL THEN
        INSERT INTO return_media (return_request_id, url, sort_order)
        VALUES (v_return_id, TRIM(v_media_url), v_idx);
        v_idx := v_idx + 1;
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object('return_request_id', v_return_id)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Gagal menyimpan pengajuan retur: ' || SQLERRM,
    'code', 'RETURN_ERROR'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
