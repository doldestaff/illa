-- ============================================================
-- ADD sorvetes_free_count to ensure_member_home_state()
-- Paste into Supabase SQL Editor AFTER the main migration
-- ============================================================
-- This updates the existing ensure_member_home_state() to also return
-- the count of sorvetes_free_redemptions for the current user.
-- The admin panel manages this table, so this count will always be
-- in sync with what the admin sees.
-- We need to add a variable and a query to the existing function.
-- Since we can't ALTER a function body, we need to CREATE OR REPLACE.
-- Add the variable declaration and the count query:
-- After v_drops_claimed_count, add:
--   v_sorvetes_free_count int;
-- After the drops_claimed_count query, add:
--   SELECT COUNT(*) INTO v_sorvetes_free_count FROM sorvetes_free_redemptions WHERE user_id = v_uid;
-- In the RETURN, after 'drops_claimed_count', add:
--   'sorvetes_free_count', COALESCE(v_sorvetes_free_count, 0),
-- ⚠️ Since the full function is very large (400+ lines), the complete
-- updated version is in p0_real_math_and_memory.sql.
-- Below is the MINIMAL patch approach using a simple wrapper:
-- Quick approach: Add a standalone RPC that returns just the sorvetes count
CREATE OR REPLACE FUNCTION public.get_my_sorvetes_free_count() RETURNS int LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_uid uuid := auth.uid();
v_count int;
BEGIN IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
SELECT COUNT(*) INTO v_count
FROM public.sorvetes_free_redemptions
WHERE user_id = v_uid;
RETURN COALESCE(v_count, 0);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_sorvetes_free_count() TO authenticated;