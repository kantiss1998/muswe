-- =============================================================
-- Migration: 20260725000000_flash_sale_concurrency_hardening.sql
-- Description:
-- 1. Add max_qty_per_user to flash_sale_items
-- 2. Add atomic per-user acquire_checkout_lock RPC
-- 3. Harden validate_voucher with FOR UPDATE row lock
-- 4. Harden create_order with single-loop in-memory item buffering,
--    FOR UPDATE OF fsi, strict quota check (no silent regular-price
--    fallback), and max_qty_per_user enforcement
-- 5. Fix auth.uid() IS NULL bypass in cancel_order
-- 6. Add auto_cancel_expired_orders() + pg_cron schedule (15m for
--    flash sale orders, 24h for regular orders)
-- =============================================================

-- 1. Add max_qty_per_user to flash_sale_items
ALTER TABLE public.flash_sale_items
ADD COLUMN IF NOT EXISTS max_qty_per_user INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.flash_sale_items.max_qty_per_user IS 'Maximum quantity per user across non-cancelled orders (0 = unlimited)';

-- 2. Atomic per-user checkout lock acquisition (eliminates global table-scan DELETE)
CREATE OR REPLACE FUNCTION public.acquire_checkout_lock(
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_acquired BOOLEAN := false;
BEGIN
  IF COALESCE(auth.role(), '') != 'service_role'
     AND NOT (COALESCE(current_setting('request.jwt.claims', true), '') = '' AND session_user IN ('postgres', 'supabase_admin'))
  THEN
    IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
      RETURN false;
    END IF;
  END IF;

  -- Remove stale lock only for this specific user (> 2 minutes)
  DELETE FROM public.checkout_locks
  WHERE user_id = p_user_id
    AND created_at < now() - INTERVAL '2 minutes';

  INSERT INTO public.checkout_locks (user_id, created_at)
  VALUES (p_user_id, now())
  ON CONFLICT (user_id) DO NOTHING;

  IF FOUND THEN
    v_acquired := true;
  END IF;

  RETURN v_acquired;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Harden validate_voucher with FOR UPDATE row locking
CREATE OR REPLACE FUNCTION public.validate_voucher(
  p_code TEXT,
  p_subtotal NUMERIC,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_voucher RECORD;
  v_user_usage_count INT;
  v_discount_amount NUMERIC;
BEGIN
  IF p_code IS NULL OR p_code = '' THEN
    RETURN jsonb_build_object('success', false, 'valid', false, 'message', 'Kode voucher tidak boleh kosong', 'code', 'VOUCHER_INVALID');
  END IF;

  -- Lock voucher row to prevent usage_limit overselling under high concurrency
  SELECT * INTO v_voucher
  FROM vouchers
  WHERE code = UPPER(TRIM(p_code))
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', true, 'valid', false, 'message', 'Kode voucher tidak ditemukan', 'code', 'VOUCHER_INVALID');
  END IF;

  IF NOT v_voucher.is_active THEN
    RETURN jsonb_build_object('success', true, 'valid', false, 'message', 'Voucher tidak aktif', 'code', 'VOUCHER_INVALID');
  END IF;

  IF v_voucher.starts_at > now() THEN
    RETURN jsonb_build_object('success', true, 'valid', false, 'message', 'Voucher belum berlaku', 'code', 'VOUCHER_INVALID');
  END IF;

  IF v_voucher.expires_at < now() THEN
    RETURN jsonb_build_object('success', true, 'valid', false, 'message', 'Voucher sudah kadaluarsa', 'code', 'VOUCHER_EXPIRED');
  END IF;

  IF v_voucher.usage_limit IS NOT NULL AND v_voucher.used_count >= v_voucher.usage_limit THEN
    RETURN jsonb_build_object('success', true, 'valid', false, 'message', 'Kuota voucher sudah habis', 'code', 'VOUCHER_QUOTA_EXCEEDED');
  END IF;

  SELECT COUNT(*) INTO v_user_usage_count
  FROM voucher_usages
  WHERE voucher_id = v_voucher.id
    AND user_id = p_user_id;

  IF v_user_usage_count >= v_voucher.usage_per_user THEN
    RETURN jsonb_build_object('success', true, 'valid', false, 'message', 'Anda sudah menggunakan voucher ini', 'code', 'VOUCHER_USER_LIMIT');
  END IF;

  IF p_subtotal < v_voucher.min_purchase THEN
    RETURN jsonb_build_object(
      'success', true, 'valid', false,
      'message', format('Minimum belanja Rp %s untuk voucher ini', to_char(v_voucher.min_purchase, 'FM999,999,999')),
      'code', 'VOUCHER_MIN_PURCHASE'
    );
  END IF;

  IF v_voucher.discount_type = 'fixed' THEN
    v_discount_amount := LEAST(v_voucher.value, p_subtotal);
  ELSIF v_voucher.discount_type = 'percentage' THEN
    v_discount_amount := p_subtotal * (v_voucher.value / 100);
    IF v_voucher.max_discount IS NOT NULL THEN
      v_discount_amount := LEAST(v_discount_amount, v_voucher.max_discount);
    END IF;
  ELSE
    v_discount_amount := 0;
  END IF;

  v_discount_amount := ROUND(v_discount_amount, 2);

  RETURN jsonb_build_object(
    'success', true,
    'valid', true,
    'voucher_id', v_voucher.id,
    'code', v_voucher.code,
    'discount_type', v_voucher.discount_type,
    'discount_amount', v_discount_amount,
    'final_total', GREATEST(p_subtotal - v_discount_amount, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Harden create_order RPC
CREATE OR REPLACE FUNCTION public.create_order(
  p_user_id UUID,
  p_address_id UUID,
  p_voucher_code TEXT DEFAULT NULL,
  p_courier_name TEXT DEFAULT NULL,
  p_shipping_cost NUMERIC DEFAULT 0,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_cart_id UUID;
  v_item RECORD;
  v_fsi RECORD;
  v_order_id UUID;
  v_order_number TEXT;
  v_subtotal NUMERIC := 0;
  v_discount_amount NUMERIC := 0;
  v_total_amount NUMERIC;
  v_voucher_id UUID;
  v_voucher_result JSONB;
  v_address RECORD;
  v_total_weight INT := 0;
  v_cancelled_count INT;
  v_actual_price NUMERIC;
  v_flash_sale_item_id UUID;
  v_item_subtotal NUMERIC;
  v_already_bought INT;
  v_remaining_quota INT;
  v_buffered_items JSONB := '[]'::jsonb;
  v_buf JSONB;
BEGIN
  -- ========== AUTH & OWNERSHIP CHECK ==========
  IF COALESCE(auth.role(), '') != 'service_role'
     AND NOT (COALESCE(current_setting('request.jwt.claims', true), '') = '' AND session_user IN ('postgres', 'supabase_admin'))
  THEN
    IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
      RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak', 'code', 'UNAUTHORIZED');
    END IF;
  END IF;

  -- ========== FRAUD CHECK ==========
  SELECT COUNT(*) INTO v_cancelled_count
  FROM orders
  WHERE user_id = p_user_id
    AND status = 'cancelled'
    AND cancelled_at > now() - INTERVAL '24 hours';

  IF v_cancelled_count > 3 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Terlalu banyak pesanan dibatalkan. Silakan coba lagi nanti.',
      'code', 'FRAUD_DETECTED'
    );
  END IF;

  -- ========== GET CART ==========
  SELECT id INTO v_cart_id
  FROM carts
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_cart_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Keranjang belanja kosong', 'code', 'CART_EMPTY');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cart_items WHERE cart_id = v_cart_id) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Keranjang belanja kosong', 'code', 'CART_EMPTY');
  END IF;

  -- ========== VALIDATE ADDRESS ==========
  SELECT * INTO v_address
  FROM user_addresses
  WHERE id = p_address_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Alamat pengiriman tidak ditemukan', 'code', 'ADDRESS_NOT_FOUND');
  END IF;

  -- ========== VALIDATE SHIPPING ==========
  IF p_shipping_cost < 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ongkos kirim tidak valid', 'code', 'INVALID_SHIPPING');
  END IF;

  -- ========== VALIDATE, LOCK & BUFFER ITEMS (Single DB Read Pass) ==========
  v_order_id := gen_random_uuid();
  v_order_number := public.generate_order_number();

  FOR v_item IN
    SELECT
      ci.id AS cart_item_id,
      ci.variant_id,
      ci.quantity,
      pv.id AS pv_id,
      pv.stock,
      pv.price AS regular_price,
      pv.name AS variant_name,
      pv.sku,
      pv.weight_gram AS variant_weight,
      pv.is_active AS variant_active,
      p.id AS product_id,
      p.name AS product_name,
      p.weight_gram AS product_weight,
      p.is_active AS product_active
    FROM cart_items ci
    JOIN product_variants pv ON pv.id = ci.variant_id
    JOIN products p ON p.id = pv.product_id
    WHERE ci.cart_id = v_cart_id
    ORDER BY ci.variant_id ASC -- Consistent lock order prevents deadlocks
    FOR UPDATE OF pv
  LOOP
    IF NOT v_item.product_active OR NOT v_item.variant_active THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', format('Produk "%s" tidak tersedia lagi', v_item.product_name),
        'code', 'PRODUCT_INACTIVE'
      );
    END IF;

    IF v_item.stock < v_item.quantity THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', format('Stok %s tidak mencukupi (tersedia: %s)', v_item.variant_name, v_item.stock),
        'code', 'STOCK_INSUFFICIENT'
      );
    END IF;

    -- Lock and check active flash sale item for this variant
    v_actual_price := v_item.regular_price;
    v_flash_sale_item_id := NULL;

    SELECT fsi.id, fsi.sale_price, fsi.quota, fsi.sold_count, fsi.max_qty_per_user
    INTO v_fsi
    FROM flash_sale_items fsi
    JOIN flash_sales fs ON fs.id = fsi.flash_sale_id
    WHERE fsi.variant_id = v_item.variant_id
      AND fs.is_active = true
      AND fs.starts_at <= now()
      AND fs.ends_at > now()
    LIMIT 1
    FOR UPDATE OF fsi;

    IF FOUND THEN
      -- Check per-user purchase limit for flash sale
      IF v_fsi.max_qty_per_user > 0 THEN
        SELECT COALESCE(SUM(oi.quantity), 0) INTO v_already_bought
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE oi.flash_sale_item_id = v_fsi.id
          AND o.user_id = p_user_id
          AND o.status != 'cancelled';

        IF (v_already_bought + v_item.quantity) > v_fsi.max_qty_per_user THEN
          RETURN jsonb_build_object(
            'success', false,
            'message', format(
              'Batas pembelian Flash Sale untuk "%s" maksimal %s pcs per akun',
              v_item.product_name,
              v_fsi.max_qty_per_user
            ),
            'code', 'FLASH_SALE_LIMIT_EXCEEDED'
          );
        END IF;
      END IF;

      -- Strict quota check (reject instead of silent regular-price fallback)
      IF v_fsi.quota > 0 AND (v_fsi.sold_count + v_item.quantity) > v_fsi.quota THEN
        v_remaining_quota := GREATEST(v_fsi.quota - v_fsi.sold_count, 0);
        RETURN jsonb_build_object(
          'success', false,
          'message', CASE
            WHEN v_remaining_quota = 0 THEN format('Kuota Flash Sale untuk "%s" sudah habis', v_item.product_name)
            ELSE format('Kuota Flash Sale untuk "%s" tidak mencukupi (tersisa: %s)', v_item.product_name, v_remaining_quota)
          END,
          'code', 'FLASH_SALE_QUOTA_EXCEEDED'
        );
      END IF;

      v_flash_sale_item_id := v_fsi.id;
      v_actual_price := v_fsi.sale_price;
    END IF;

    v_item_subtotal := v_actual_price * v_item.quantity;
    v_subtotal := v_subtotal + v_item_subtotal;
    v_total_weight := v_total_weight + COALESCE(v_item.variant_weight, v_item.product_weight, 0) * v_item.quantity;

    -- Buffer item in memory so we don't re-query tables later
    v_buffered_items := v_buffered_items || jsonb_build_array(
      jsonb_build_object(
        'variant_id', v_item.variant_id,
        'flash_sale_item_id', v_flash_sale_item_id,
        'product_name', v_item.product_name,
        'variant_name', v_item.variant_name,
        'sku', v_item.sku,
        'price', v_actual_price,
        'quantity', v_item.quantity,
        'subtotal', v_item_subtotal,
        'stock_before', v_item.stock
      )
    );
  END LOOP;

  -- ========== VALIDATE VOUCHER ==========
  IF p_voucher_code IS NOT NULL AND p_voucher_code != '' THEN
    v_voucher_result := public.validate_voucher(p_voucher_code, v_subtotal, p_user_id);

    IF (v_voucher_result->>'valid')::boolean = true THEN
      v_voucher_id := (v_voucher_result->>'voucher_id')::UUID;
      v_discount_amount := (v_voucher_result->>'discount_amount')::NUMERIC;
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'message', v_voucher_result->>'message',
        'code', v_voucher_result->>'code'
      );
    END IF;
  END IF;

  -- ========== CALCULATE TOTAL ==========
  v_total_amount := GREATEST(v_subtotal - v_discount_amount + p_shipping_cost, 0);

  -- ========== INSERT ORDER ==========
  INSERT INTO orders (id, order_number, user_id, voucher_id, status, subtotal, shipping_cost, discount_amount, total_amount, notes)
  VALUES (v_order_id, v_order_number, p_user_id, v_voucher_id, 'pending_payment', v_subtotal, p_shipping_cost, v_discount_amount, v_total_amount, p_notes);

  -- ========== INSERT ORDER SHIPPING ==========
  INSERT INTO order_shipping (
    order_id, recipient_name, phone, full_address, province_name, city_name,
    district_name, postal_code, country_code, country_name, courier_name
  )
  VALUES (
    v_order_id, v_address.recipient_name, v_address.phone, v_address.full_address,
    v_address.province_name, v_address.city_name, v_address.district_name,
    v_address.postal_code, COALESCE(v_address.country_code, 'ID'),
    COALESCE(v_address.country_name, 'Indonesia'), p_courier_name
  );

  -- ========== RECORD VOUCHER USAGE ==========
  IF v_voucher_id IS NOT NULL THEN
    INSERT INTO voucher_usages (voucher_id, user_id, order_id, discount_amount)
    VALUES (v_voucher_id, p_user_id, v_order_id, v_discount_amount);

    UPDATE vouchers SET used_count = used_count + 1 WHERE id = v_voucher_id;
  END IF;

  -- ========== CREATE PAYMENT RECORD ==========
  INSERT INTO payments (order_id, gateway_order_id, status, amount)
  VALUES (v_order_id, v_order_number, 'pending', v_total_amount);

  -- ========== WRITE ORDER ITEMS & DEDUCT STOCK FROM MEMORY BUFFER ==========
  FOR v_buf IN SELECT * FROM jsonb_array_elements(v_buffered_items)
  LOOP
    INSERT INTO order_items (
      order_id, variant_id, flash_sale_item_id, product_name, variant_name, sku, price, quantity, subtotal
    )
    VALUES (
      v_order_id,
      (v_buf->>'variant_id')::UUID,
      NULLIF(v_buf->>'flash_sale_item_id', '')::UUID,
      v_buf->>'product_name',
      v_buf->>'variant_name',
      v_buf->>'sku',
      (v_buf->>'price')::NUMERIC,
      (v_buf->>'quantity')::INT,
      (v_buf->>'subtotal')::NUMERIC
    );

    UPDATE product_variants
    SET stock = stock - (v_buf->>'quantity')::INT
    WHERE id = (v_buf->>'variant_id')::UUID;

    INSERT INTO stock_mutations (variant_id, type, qty, qty_before, qty_after, note)
    VALUES (
      (v_buf->>'variant_id')::UUID,
      'out',
      (v_buf->>'quantity')::INT,
      (v_buf->>'stock_before')::INT,
      (v_buf->>'stock_before')::INT - (v_buf->>'quantity')::INT,
      'Order: ' || v_order_number
    );

    IF NULLIF(v_buf->>'flash_sale_item_id', '') IS NOT NULL THEN
      UPDATE flash_sale_items
      SET sold_count = sold_count + (v_buf->>'quantity')::INT
      WHERE id = (v_buf->>'flash_sale_item_id')::UUID;
    END IF;
  END LOOP;

  -- ========== CLEAR CART ==========
  DELETE FROM cart_items WHERE cart_id = v_cart_id;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'order_id', v_order_id,
      'order_number', v_order_number,
      'subtotal', v_subtotal,
      'shipping_cost', p_shipping_cost,
      'discount_amount', v_discount_amount,
      'total_amount', v_total_amount,
      'status', 'pending_payment'
    )
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Terjadi kesalahan saat membuat pesanan: ' || SQLERRM || ' [' || SQLSTATE || ']',
    'code', 'ORDER_ERROR'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fix auth.uid() IS NULL bypass in cancel_order
CREATE OR REPLACE FUNCTION public.cancel_order(
  p_order_id UUID,
  p_cancel_reason TEXT DEFAULT 'Dibatalkan oleh customer'
)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
BEGIN
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pesanan tidak ditemukan', 'code', 'ORDER_NOT_FOUND');
  END IF;

  -- Enforce strict ownership unless called by service_role (webhooks) or internal postgres/pg_cron
  IF COALESCE(auth.role(), '') != 'service_role'
     AND NOT (COALESCE(current_setting('request.jwt.claims', true), '') = '' AND session_user IN ('postgres', 'supabase_admin'))
  THEN
    IF auth.uid() IS NULL OR (v_order.user_id IS DISTINCT FROM auth.uid() AND NOT public.is_admin()) THEN
      RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak', 'code', 'FORBIDDEN');
    END IF;
  END IF;

  IF v_order.status != 'pending_payment' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Pesanan hanya bisa dibatalkan saat status menunggu pembayaran',
      'code', 'ORDER_WRONG_STATUS'
    );
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

-- 6. Auto-cancel expired orders (15m for flash sale, 24h for regular) + pg_cron
CREATE OR REPLACE FUNCTION public.auto_cancel_expired_orders()
RETURNS INT AS $$
DECLARE
  v_order RECORD;
  v_cancelled_count INT := 0;
  v_result JSONB;
BEGIN
  FOR v_order IN
    SELECT o.id
    FROM orders o
    WHERE o.status = 'pending_payment'
      AND (
        (
          EXISTS (
            SELECT 1 FROM order_items oi
            WHERE oi.order_id = o.id
              AND oi.flash_sale_item_id IS NOT NULL
          )
          AND o.created_at < now() - INTERVAL '15 minutes'
        )
        OR o.created_at < now() - INTERVAL '24 hours'
      )
    LIMIT 100
    FOR UPDATE OF o SKIP LOCKED
  LOOP
    v_result := public.cancel_order(
      v_order.id,
      'Otomatis dibatalkan - batas waktu pembayaran berakhir'
    );
    IF (v_result->>'success')::boolean THEN
      v_cancelled_count := v_cancelled_count + 1;
    END IF;
  END LOOP;

  RETURN v_cancelled_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-cancel-expired-orders') THEN
    PERFORM cron.unschedule('auto-cancel-expired-orders');
  END IF;
  PERFORM cron.schedule(
    'auto-cancel-expired-orders',
    '*/5 * * * *',
    'SELECT public.auto_cancel_expired_orders()'
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available in this environment, skipping schedule: %', SQLERRM;
END $$;
