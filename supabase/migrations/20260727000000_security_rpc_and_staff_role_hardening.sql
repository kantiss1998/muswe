-- =============================================================
-- Migration: 20260727000000_security_rpc_and_staff_role_hardening.sql
-- Description:
-- 1. Allow 'staff' role in profiles.role CHECK constraint
-- 2. Lock bulk_update_stock to service_role / is_admin()
-- 3. Enforce cart ownership in replace_cart_items
-- 4. Lock check_rate_limit to service_role and revoke anon/authenticated
-- 5. Lock get_dashboard_revenue to is_admin() / service_role
-- =============================================================

-- 1. Update profiles.role CHECK constraint to include 'staff'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('customer', 'admin', 'staff'));

-- 2. Harden bulk_update_stock
CREATE OR REPLACE FUNCTION public.bulk_update_stock(updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF COALESCE(auth.role(), '') != 'service_role'
     AND NOT (COALESCE(current_setting('request.jwt.claims', true), '') = '' AND session_user IN ('postgres', 'supabase_admin'))
     AND NOT (auth.uid() IS NOT NULL AND public.is_admin())
  THEN
    RAISE EXCEPTION 'Forbidden: insufficient privileges to update stock';
  END IF;

  UPDATE public.product_variants
  SET stock = GREATEST(u.stock, 0),
      updated_at = NOW()
  FROM jsonb_to_recordset(updates) AS u(sku text, stock int)
  WHERE public.product_variants.sku = u.sku;
END;
$$;

-- 3. Harden replace_cart_items with strict cart ownership check
CREATE OR REPLACE FUNCTION public.replace_cart_items(p_cart_id uuid, p_items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item jsonb;
BEGIN
  IF COALESCE(auth.role(), '') != 'service_role'
     AND NOT (COALESCE(current_setting('request.jwt.claims', true), '') = '' AND session_user IN ('postgres', 'supabase_admin'))
  THEN
    IF auth.uid() IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.carts
      WHERE id = p_cart_id AND user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Forbidden: cart does not belong to authenticated user';
    END IF;
  END IF;

  DELETE FROM public.cart_items WHERE cart_id = p_cart_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF COALESCE((v_item->>'quantity')::integer, 0) >= 1 THEN
      INSERT INTO public.cart_items (cart_id, variant_id, quantity)
      VALUES (
        p_cart_id,
        (v_item->>'variant_id')::uuid,
        (v_item->>'quantity')::integer
      );
    END IF;
  END LOOP;
END;
$$;

-- 4. Harden check_rate_limit to service_role only
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_ip text, p_route text, p_window_sec integer, p_max_requests integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
  v_window_start timestamp with time zone;
BEGIN
  IF COALESCE(auth.role(), '') != 'service_role'
     AND NOT (COALESCE(current_setting('request.jwt.claims', true), '') = '' AND session_user IN ('postgres', 'supabase_admin'))
  THEN
    RAISE EXCEPTION 'Forbidden: rate limit RPC is restricted to service_role';
  END IF;

  v_window_start := (now() - (p_window_sec || ' seconds')::interval);

  SELECT count(*) INTO v_count
  FROM public.rate_limit_logs
  WHERE ip_address = p_ip AND route = p_route AND created_at >= v_window_start;

  IF v_count >= p_max_requests THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limit_logs (ip_address, route, created_at)
  VALUES (p_ip, p_route, now());

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO service_role;

-- 5. Harden get_dashboard_revenue to admin / service_role only
CREATE OR REPLACE FUNCTION public.get_dashboard_revenue()
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total numeric;
BEGIN
  IF COALESCE(auth.role(), '') != 'service_role'
     AND NOT (COALESCE(current_setting('request.jwt.claims', true), '') = '' AND session_user IN ('postgres', 'supabase_admin'))
     AND NOT (auth.uid() IS NOT NULL AND public.is_admin())
  THEN
    RAISE EXCEPTION 'Forbidden: admin access required';
  END IF;

  SELECT COALESCE(SUM(total_amount), 0) INTO total
  FROM public.orders
  WHERE status = 'completed';

  RETURN total;
END;
$$;
