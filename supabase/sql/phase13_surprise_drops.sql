-- ============================================================
-- PHASE 13: SURPRISE DROPS (PER-USER TARGETED)
-- ============================================================
-- 1. Table: surprise_drops
CREATE TABLE IF NOT EXISTS public.surprise_drops (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    preset_id int NOT NULL,
    title text NOT NULL,
    description text,
    category text NOT NULL DEFAULT 'coins',
    emoji text DEFAULT '🎁',
    reward_type text DEFAULT 'custom',
    reward_value int DEFAULT 0,
    is_active boolean DEFAULT true,
    seen boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    activated_by uuid
);
-- Index for fast polling
CREATE INDEX IF NOT EXISTS idx_surprise_drops_user_pending ON public.surprise_drops(user_id, is_active, seen)
WHERE is_active = true
    AND seen = false;
-- 2. RPC: Admin activates a surprise drop for a user
CREATE OR REPLACE FUNCTION public.admin_activate_surprise_drop(
        p_user_id uuid,
        p_preset_id int,
        p_title text,
        p_description text,
        p_category text,
        p_emoji text,
        p_reward_type text,
        p_reward_value int
    ) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_drop_id uuid;
v_caller_id uuid := auth.uid();
BEGIN
INSERT INTO surprise_drops (
        user_id,
        preset_id,
        title,
        description,
        category,
        emoji,
        reward_type,
        reward_value,
        is_active,
        seen,
        activated_by
    )
VALUES (
        p_user_id,
        p_preset_id,
        p_title,
        p_description,
        p_category,
        p_emoji,
        p_reward_type,
        p_reward_value,
        true,
        false,
        v_caller_id
    )
RETURNING id INTO v_drop_id;
-- Auto-apply XP/Points rewards
IF p_reward_type = 'xp'
AND p_reward_value > 0 THEN
UPDATE profiles
SET xp = COALESCE(xp, 0) + p_reward_value
WHERE id = p_user_id;
ELSIF p_reward_type = 'points'
AND p_reward_value > 0 THEN
UPDATE profiles
SET points = COALESCE(points, 0) + p_reward_value
WHERE id = p_user_id;
END IF;
RETURN jsonb_build_object('success', true, 'id', v_drop_id);
END;
$$;
-- 3. RPC: User fetches their pending surprise drops
CREATE OR REPLACE FUNCTION public.get_pending_surprise_drops() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_id uuid := auth.uid();
BEGIN RETURN COALESCE(
    (
        SELECT jsonb_agg(
                jsonb_build_object(
                    'id',
                    id,
                    'preset_id',
                    preset_id,
                    'title',
                    title,
                    'description',
                    description,
                    'category',
                    category,
                    'emoji',
                    emoji,
                    'reward_type',
                    reward_type,
                    'reward_value',
                    reward_value,
                    'created_at',
                    created_at
                )
                ORDER BY created_at DESC
            )
        FROM surprise_drops
        WHERE user_id = v_user_id
            AND is_active = true
            AND seen = false
    ),
    '[]'::jsonb
);
END;
$$;
-- 4. RPC: User marks a surprise drop as seen/dismissed
CREATE OR REPLACE FUNCTION public.dismiss_surprise_drop(p_drop_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_id uuid := auth.uid();
BEGIN
UPDATE surprise_drops
SET seen = true
WHERE id = p_drop_id
    AND user_id = v_user_id;
IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Drop not found');
END IF;
RETURN jsonb_build_object('success', true);
END;
$$;
-- 5. RPC: Admin lists all surprise drops (with user info)
CREATE OR REPLACE FUNCTION public.admin_list_surprise_drops() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN RETURN COALESCE(
        (
            SELECT jsonb_agg(
                    jsonb_build_object(
                        'id',
                        sd.id,
                        'preset_id',
                        sd.preset_id,
                        'title',
                        sd.title,
                        'category',
                        sd.category,
                        'emoji',
                        sd.emoji,
                        'reward_type',
                        sd.reward_type,
                        'reward_value',
                        sd.reward_value,
                        'seen',
                        sd.seen,
                        'created_at',
                        sd.created_at,
                        'user_name',
                        COALESCE(p.full_name, 'Sem nome'),
                        'user_email',
                        u.email
                    )
                    ORDER BY sd.created_at DESC
                )
            FROM surprise_drops sd
                JOIN profiles p ON p.id = sd.user_id
                JOIN auth.users u ON u.id = sd.user_id
            WHERE sd.is_active = true
        ),
        '[]'::jsonb
    );
END;
$$;
-- Grant permissions
GRANT EXECUTE ON FUNCTION public.admin_activate_surprise_drop(uuid, int, text, text, text, text, text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_surprise_drops() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dismiss_surprise_drop(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_surprise_drops() TO authenticated;
-- RLS
ALTER TABLE public.surprise_drops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own surprise drops" ON public.surprise_drops FOR
SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage surprise drops" ON public.surprise_drops FOR ALL USING (true) WITH CHECK (true);