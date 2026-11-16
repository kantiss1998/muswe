-- =============================================================================
-- Migration: 20260728000000_schedule_prune_audit_logs.sql
-- Purpose:
--   1. Harden prune_audit_logs & cleanup_checkout_locks against unauthorized RPC calls
--   2. Schedule weekly pruning of old logs & stale checkout locks to preserve
--      Supabase Free Tier 500 MB database storage quota.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.prune_audit_logs(days_old integer DEFAULT 30)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('postgres', 'supabase_admin')
     AND COALESCE(auth.role(), '') <> 'service_role'
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Only service_role, cron, or admin can prune audit logs';
  END IF;

  DELETE FROM public.search_logs
  WHERE created_at < (now() - make_interval(days => GREATEST(days_old, 7)));

  DELETE FROM public.admin_activity_logs
  WHERE created_at < (now() - make_interval(days => GREATEST(days_old * 3, 30)));

  DELETE FROM public.payment_logs
  WHERE created_at < (now() - make_interval(days => GREATEST(days_old * 3, 30)));

  DELETE FROM public.rate_limit_logs
  WHERE created_at < (now() - interval '1 hour');

  DELETE FROM public.checkout_locks
  WHERE created_at < (now() - interval '10 minutes');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prune_audit_logs(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_audit_logs(integer) TO service_role;

CREATE OR REPLACE FUNCTION public.cleanup_checkout_locks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('postgres', 'supabase_admin')
     AND COALESCE(auth.role(), '') <> 'service_role'
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Only service_role, cron, or admin can cleanup checkout locks';
  END IF;

  DELETE FROM public.checkout_locks
  WHERE created_at < (now() - interval '5 minutes');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_checkout_locks() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_checkout_locks() TO service_role;

-- Schedule weekly audit log pruning every Sunday at 20:00 UTC (Monday 03:00 WIB)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'prune-audit-logs-weekly') THEN
      PERFORM cron.unschedule('prune-audit-logs-weekly');
    END IF;
    PERFORM cron.schedule(
      'prune-audit-logs-weekly',
      '0 20 * * 0',
      'SELECT public.prune_audit_logs(30)'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron schedule skipped: %', SQLERRM;
END;
$$;
