-- =============================================================
-- Migration: 20260717155600_add_is_hidden_to_vouchers.sql
-- Description: Add is_hidden flag to vouchers for private codes
-- =============================================================

ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

-- Drop the old validation function if needed or just update it, but wait!
-- The validation function `validate_voucher` does not care about `is_hidden` natively,
-- it only checks `is_active` and dates. Wait, let me check the `validate_voucher` function in DB just to be sure. It might check `is_active`.
-- We actually WANT hidden vouchers to be valid if the code is typed manually. So `validate_voucher` probably doesn't need changes.
