-- ============================================================
-- PHASE 11: DROPS MANUAL BALANCE & CURRENCY SYNC
-- ============================================================
-- 1. Add 'drops' column to profiles if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS drops int DEFAULT 0;
-- 2. Update admin_grant_currency to include 'p_drops_amount'
-- We drop it first to ensure signature change is handled cleanly if needed, 
-- though CREATE OR REPLACE handles argument additions if defaults are provided.
-- To be safe with argument changes/overloading, we redefine it.
CREATE OR REPLACE FUNCTION public.admin_grant_currency(
        p_target_user_id uuid,
        p_xp_amount int,
        p_points_amount int,
        p_drops_amount int DEFAULT 0
    ) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_new_xp int;
v_new_points int;
v_new_drops int;
BEGIN -- Update the user's profile atomically
-- Bypass guard trigger for trusted RPC
PERFORM set_config('app.bypass_reward_guard', 'true', true);

UPDATE profiles
SET xp = COALESCE(xp, 0) + p_xp_amount,
    points = COALESCE(points, 0) + p_points_amount,
    drops = COALESCE(drops, 0) + p_drops_amount
WHERE id = p_target_user_id
RETURNING xp,
    points,
    drops INTO v_new_xp,
    v_new_points,
    v_new_drops;
IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'User not found');
END IF;
RETURN jsonb_build_object(
    'success',
    true,
    'new_xp',
    v_new_xp,
    'new_points',
    v_new_points,
    'new_drops',
    v_new_drops
);
END;
$$;
-- 3. Update admin_list_users_sorvetes to return real XP, Points, and Drops
CREATE OR REPLACE FUNCTION public.admin_list_users_sorvetes() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN (
        SELECT jsonb_agg(
                jsonb_build_object(
                    'id',
                    p.id,
                    'full_name',
                    p.full_name,
                    'email',
                    u.email,
                    -- Return real balances
                    'sorvetes_count',
                    COALESCE(s.cnt, 0),
                    'xp',
                    COALESCE(p.xp, 0),
                    'points',
                    COALESCE(p.points, 0),
                    'drops',
                    COALESCE(p.drops, 0)
                )
                ORDER BY COALESCE(s.cnt, 0) DESC,
                    p.full_name
            )
        FROM public.profiles p
            JOIN auth.users u ON u.id = p.id
            LEFT JOIN (
                SELECT user_id,
                    COUNT(*) as cnt
                FROM public.sorvetes_free_redemptions
                GROUP BY user_id
            ) s ON s.user_id = p.id
    );
END;
$$;
-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.admin_grant_currency(uuid, int, int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_users_sorvetes() TO authenticated;