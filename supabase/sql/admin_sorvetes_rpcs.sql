-- ============================================================
-- ADMIN PANEL — RPCs for Sorvetes Free Management
-- Paste into Supabase SQL Editor
-- ============================================================
-- 1. List all users with sorvetes count
CREATE OR REPLACE FUNCTION public.admin_list_users_sorvetes() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN (
        SELECT jsonb_agg(
                jsonb_build_object(
                    'id',
                    p.id,
                    'full_name',
                    p.full_name,
                    'email',
                    u.email,
                    'sorvetes_count',
                    COALESCE(s.cnt, 0)
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
-- 2. Add or subtract sorvetes for a user
CREATE OR REPLACE FUNCTION public.admin_manage_sorvetes(p_user_id uuid, p_action text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count int;
BEGIN IF p_action = 'add' THEN
INSERT INTO public.sorvetes_free_redemptions (user_id, points_cost, voucher_code, expires_at)
VALUES (
        p_user_id,
        0,
        -- admin grant, no points cost
        'ADMIN-' || substr(md5(random()::text), 1, 8),
        NOW() + interval '30 days'
    );
ELSIF p_action = 'subtract' THEN
DELETE FROM public.sorvetes_free_redemptions
WHERE id = (
        SELECT id
        FROM public.sorvetes_free_redemptions
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT 1
    );
ELSE RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
END IF;
SELECT COUNT(*) INTO v_count
FROM public.sorvetes_free_redemptions
WHERE user_id = p_user_id;
RETURN jsonb_build_object('success', true, 'sorvetes_count', v_count);
END;
$$;
-- Grant execute to authenticated (API routes use authenticated context)
GRANT EXECUTE ON FUNCTION public.admin_list_users_sorvetes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_manage_sorvetes(uuid, text) TO authenticated;