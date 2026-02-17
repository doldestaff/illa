-- ============================================================
-- PHASE 12: ADMIN DROPS MANAGEMENT (EVENTS)
-- ============================================================
-- 1. RPC: List all drops (active and past)
CREATE OR REPLACE FUNCTION public.admin_list_all_drops() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN (
        SELECT jsonb_agg(
                jsonb_build_object(
                    'id',
                    id,
                    'title',
                    title,
                    'description',
                    description,
                    'reward_type',
                    reward_type,
                    'reward_value',
                    reward_value,
                    'starts_at',
                    starts_at,
                    'ends_at',
                    ends_at,
                    'is_active',
                    is_active,
                    'created_at',
                    created_at,
                    'claims_count',
                    (
                        SELECT COUNT(*)
                        FROM public.drop_claims
                        WHERE drop_id = drops.id
                    )
                )
                ORDER BY created_at DESC
            )
        FROM public.drops
    );
END;
$$;
-- 2. RPC: Create a new drop
CREATE OR REPLACE FUNCTION public.admin_create_drop(
        p_title text,
        p_description text,
        p_reward_type text,
        p_reward_value int,
        p_duration_minutes int
    ) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_new_drop_id uuid;
BEGIN
INSERT INTO public.drops (
        title,
        description,
        reward_type,
        reward_value,
        starts_at,
        ends_at,
        is_active
    )
VALUES (
        p_title,
        p_description,
        p_reward_type,
        p_reward_value,
        now(),
        now() + (p_duration_minutes || ' minutes')::interval,
        true
    )
RETURNING id INTO v_new_drop_id;
RETURN jsonb_build_object('success', true, 'id', v_new_drop_id);
END;
$$;
-- 3. RPC: Delete a drop (and its claims)
CREATE OR REPLACE FUNCTION public.admin_delete_drop(p_drop_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN
DELETE FROM public.drops
WHERE id = p_drop_id;
-- Claims are deleted automatically via ON DELETE CASCADE if configured, 
-- but let's ensure we return success even if no claims existed.
RETURN jsonb_build_object('success', true);
END;
$$;
-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.admin_list_all_drops() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_drop(text, text, text, int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_drop(uuid) TO authenticated;