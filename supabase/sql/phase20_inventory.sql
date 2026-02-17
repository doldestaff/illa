-- ============================================================
-- PHASE 20: VISUAL POLISH & INVENTORY SYSTEM
-- ============================================================
-- 1. RPC to fetch member inventory (Sorvetes + Drops History)
CREATE OR REPLACE FUNCTION public.get_member_inventory() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
v_sorvetes jsonb;
v_drops jsonb;
BEGIN IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
-- Fetch Sorvetes (Vouchers)
SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id',
                id,
                'voucher_code',
                voucher_code,
                'expires_at',
                expires_at,
                'created_at',
                created_at,
                'is_valid',
                (expires_at > now())
            )
            ORDER BY created_at DESC
        ),
        '[]'::jsonb
    ) INTO v_sorvetes
FROM sorvetes_free_redemptions
WHERE user_id = v_uid;
-- Fetch Drops History
SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id',
                dc.id,
                'title',
                d.title,
                'reward_type',
                d.reward_type,
                'reward_value',
                d.reward_value,
                'claimed_at',
                dc.claimed_at
            )
            ORDER BY dc.claimed_at DESC
        ),
        '[]'::jsonb
    ) INTO v_drops
FROM drop_claims dc
    JOIN drops d ON d.id = dc.drop_id
WHERE dc.user_id = v_uid;
RETURN jsonb_build_object(
    'sorvetes',
    v_sorvetes,
    'drops',
    v_drops
);
END;
$$;
-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_member_inventory() TO authenticated;