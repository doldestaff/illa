-- ============================================================
-- P0: REAL MATH & MEMORY — Supabase SQL Migration
-- Paste into Supabase SQL Editor (Dashboard → SQL Editor)
-- Idempotent: safe to re-run.
-- ============================================================
-- ═══════════════════════════════════════════════════════
-- 1. LEVEL CURVE — Threshold Lookup (agreed L1..L12)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.level_thresholds (
    level int PRIMARY KEY,
    min_xp int NOT NULL
);
-- Seed agreed curve (upsert for idempotency)
INSERT INTO public.level_thresholds (level, min_xp)
VALUES (1, 0),
    (2, 120),
    (3, 300),
    (4, 550),
    (5, 900),
    (6, 1400),
    (7, 2100),
    (8, 3000),
    (9, 4200),
    (10, 5800),
    (11, 7800),
    (12, 10300) ON CONFLICT (level) DO
UPDATE
SET min_xp = EXCLUDED.min_xp;
-- RLS: authenticated can read thresholds
ALTER TABLE public.level_thresholds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can read level_thresholds" ON public.level_thresholds;
CREATE POLICY "Authenticated can read level_thresholds" ON public.level_thresholds FOR
SELECT USING (auth.role() = 'authenticated');
-- Replace xp_to_level: threshold-based, capped at 12
CREATE OR REPLACE FUNCTION public.xp_to_level(xp_val int) RETURNS int LANGUAGE sql STABLE AS $$
SELECT COALESCE(
        (
            SELECT level
            FROM public.level_thresholds
            WHERE min_xp <= xp_val
            ORDER BY level DESC
            LIMIT 1
        ), 1
    );
$$;
-- Replace xp_for_level: lookup from thresholds
CREATE OR REPLACE FUNCTION public.xp_for_level(lvl int) RETURNS int LANGUAGE sql STABLE AS $$
SELECT COALESCE(
        (
            SELECT min_xp
            FROM public.level_thresholds
            WHERE level = lvl
        ),
        0
    );
$$;
-- New: get_level_state — returns complete level info
CREATE OR REPLACE FUNCTION public.get_level_state(p_xp int) RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE v_level int;
v_current_min int;
v_next_min int;
v_xp_into int;
v_xp_for_next int;
v_xp_to_next int;
BEGIN -- Current level
SELECT level,
    min_xp INTO v_level,
    v_current_min
FROM public.level_thresholds
WHERE min_xp <= p_xp
ORDER BY level DESC
LIMIT 1;
IF v_level IS NULL THEN v_level := 1;
v_current_min := 0;
END IF;
-- Next level threshold (NULL if at max)
SELECT min_xp INTO v_next_min
FROM public.level_thresholds
WHERE level = v_level + 1;
IF v_next_min IS NULL THEN -- At max level (12): show XP beyond L12 threshold
v_xp_into := p_xp - v_current_min;
v_xp_for_next := 0;
-- no next level
v_xp_to_next := 0;
ELSE v_xp_into := p_xp - v_current_min;
v_xp_for_next := v_next_min - v_current_min;
v_xp_to_next := v_next_min - p_xp;
END IF;
RETURN jsonb_build_object(
    'level',
    v_level,
    'xp_into_level',
    v_xp_into,
    'xp_for_next_level',
    v_xp_for_next,
    'xp_to_next_level',
    GREATEST(0, v_xp_to_next)
);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_level_state(int) TO authenticated;
-- ═══════════════════════════════════════════════════════
-- 2. REWARD LEDGER (Audit Trail)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.reward_ledger (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    kind text NOT NULL,
    delta_xp int NOT NULL DEFAULT 0,
    delta_points int NOT NULL DEFAULT 0,
    source_id text,
    meta jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_user ON public.reward_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_created ON public.reward_ledger(user_id, created_at DESC);
ALTER TABLE public.reward_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own ledger" ON public.reward_ledger;
CREATE POLICY "Users read own ledger" ON public.reward_ledger FOR
SELECT USING (auth.uid() = user_id);
-- No INSERT/UPDATE/DELETE policy for users — only SECURITY DEFINER RPCs write.
-- ═══════════════════════════════════════════════════════
-- 3. APP SETTINGS (Configurable Values)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.app_settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.app_settings (key, value)
VALUES ('sorvetes_free_cost', '900'::jsonb) ON CONFLICT (key) DO NOTHING;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can read app_settings" ON public.app_settings;
CREATE POLICY "Authenticated can read app_settings" ON public.app_settings FOR
SELECT USING (auth.role() = 'authenticated');
-- ═══════════════════════════════════════════════════════
-- 4. SORVETES FREE REDEMPTIONS
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.sorvetes_free_redemptions (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    status text NOT NULL DEFAULT 'issued' CHECK (
        status IN ('issued', 'redeemed', 'expired', 'revoked')
    ),
    points_cost int NOT NULL,
    voucher_code text NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    redeemed_at timestamptz,
    redeemed_meta jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_sorvetes_free_user ON public.sorvetes_free_redemptions(user_id);
ALTER TABLE public.sorvetes_free_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own sorvetes redemptions" ON public.sorvetes_free_redemptions;
CREATE POLICY "Users read own sorvetes redemptions" ON public.sorvetes_free_redemptions FOR
SELECT USING (auth.uid() = user_id);
-- RPC: redeem_sorvetes_free()
CREATE OR REPLACE FUNCTION public.redeem_sorvetes_free() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
v_cost int;
v_points int;
v_code text;
v_expires timestamptz;
v_new_points int;
BEGIN IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
-- Load cost from settings (fallback 900)
SELECT COALESCE((value)::int, 900) INTO v_cost
FROM app_settings
WHERE key = 'sorvetes_free_cost';
IF v_cost IS NULL THEN v_cost := 900;
END IF;
-- Check balance
SELECT COALESCE(points, 0) INTO v_points
FROM profiles
WHERE id = v_uid;
IF v_points < v_cost THEN RAISE EXCEPTION 'Insufficient points: have %, need %',
v_points,
v_cost;
END IF;
-- Generate voucher code (human-friendly 8 chars)
v_code := upper(
    substr(
        md5(v_uid::text || now()::text || random()::text),
        1,
        4
    )
) || '-' || upper(substr(md5(random()::text || now()::text), 1, 4));
v_expires := now() + interval '30 days';
-- Deduct points (bypass guard trigger for trusted RPC)
PERFORM set_config('app.bypass_reward_guard', 'true', true);
UPDATE profiles
SET points = COALESCE(points, 0) - v_cost
WHERE id = v_uid
RETURNING points INTO v_new_points;
-- Insert redemption
INSERT INTO sorvetes_free_redemptions (user_id, points_cost, voucher_code, expires_at)
VALUES (v_uid, v_cost, v_code, v_expires);
-- Log to ledger
INSERT INTO reward_ledger (user_id, kind, delta_points, source_id, meta)
VALUES (
        v_uid,
        'sorvetes_free_redeem',
        - v_cost,
        v_code,
        jsonb_build_object('voucher_code', v_code, 'expires_at', v_expires)
    );
RETURN jsonb_build_object(
    'success',
    true,
    'voucher_code',
    v_code,
    'expires_at',
    v_expires,
    'cost',
    v_cost,
    'new_points',
    v_new_points
);
END;
$$;
GRANT EXECUTE ON FUNCTION public.redeem_sorvetes_free() TO authenticated;
-- ═══════════════════════════════════════════════════════
-- 5. CELEBRATION WINDOWS (Online Claim System)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.celebration_windows (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    window_start timestamptz NOT NULL DEFAULT now(),
    window_end timestamptz NOT NULL,
    reward_points int NOT NULL DEFAULT 0,
    claimed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_celebration_windows_user ON public.celebration_windows(user_id);
ALTER TABLE public.celebration_windows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own celebration windows" ON public.celebration_windows;
CREATE POLICY "Users read own celebration windows" ON public.celebration_windows FOR
SELECT USING (auth.uid() = user_id);
-- RPC: create_celebration_window()
-- Returns existing open window OR creates a new one (5-min cadence, 1-5 random points)
CREATE OR REPLACE FUNCTION public.create_celebration_window() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
v_existing record;
v_reward int;
v_window_end timestamptz;
v_new_id bigint;
BEGIN IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
-- Check for existing unclaimed window that hasn't expired
SELECT * INTO v_existing
FROM celebration_windows
WHERE user_id = v_uid
    AND claimed_at IS NULL
    AND window_end > now()
ORDER BY created_at DESC
LIMIT 1;
IF FOUND THEN RETURN jsonb_build_object(
    'window_id',
    v_existing.id,
    'reward_points',
    v_existing.reward_points,
    'window_end',
    v_existing.window_end,
    'status',
    'open'
);
END IF;
-- Cooldown: no new window if last one (claimed or not) was created < 30s ago
IF EXISTS (
    SELECT 1
    FROM celebration_windows
    WHERE user_id = v_uid
        AND created_at > now() - interval '30 seconds'
) THEN RETURN jsonb_build_object('status', 'cooldown');
END IF;
-- Create new window
v_reward := 1 + floor(random() * 5)::int;
-- 1-5 points
v_window_end := now() + interval '2 minutes';
INSERT INTO celebration_windows (user_id, window_end, reward_points)
VALUES (v_uid, v_window_end, v_reward)
RETURNING id INTO v_new_id;
RETURN jsonb_build_object(
    'window_id',
    v_new_id,
    'reward_points',
    v_reward,
    'window_end',
    v_window_end,
    'status',
    'open'
);
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_celebration_window() TO authenticated;
-- RPC: claim_celebration_reward(p_window_id bigint)
CREATE OR REPLACE FUNCTION public.claim_celebration_reward(p_window_id bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
v_window record;
v_new_points int;
BEGIN IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
SELECT * INTO v_window
FROM celebration_windows
WHERE id = p_window_id
    AND user_id = v_uid;
IF NOT FOUND THEN RAISE EXCEPTION 'Window not found';
END IF;
IF v_window.claimed_at IS NOT NULL THEN RAISE EXCEPTION 'Already claimed';
END IF;
IF v_window.window_end < now() THEN RAISE EXCEPTION 'Window expired';
END IF;
-- Mark claimed
UPDATE celebration_windows
SET claimed_at = now()
WHERE id = p_window_id;
-- Award points (bypass guard trigger for trusted RPC)
PERFORM set_config('app.bypass_reward_guard', 'true', true);
UPDATE profiles
SET points = COALESCE(points, 0) + v_window.reward_points
WHERE id = v_uid
RETURNING points INTO v_new_points;
-- Log to ledger
INSERT INTO reward_ledger (user_id, kind, delta_points, source_id, meta)
VALUES (
        v_uid,
        'celebration_claim',
        v_window.reward_points,
        p_window_id::text,
        jsonb_build_object('reward_points', v_window.reward_points)
    );
RETURN jsonb_build_object(
    'success',
    true,
    'points',
    v_new_points,
    'reward_points',
    v_window.reward_points
);
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_celebration_reward(bigint) TO authenticated;
-- ═══════════════════════════════════════════════════════
-- 6. UPDATE EXISTING RPCs TO WRITE LEDGER ROWS
-- ═══════════════════════════════════════════════════════
-- 6a. claim_mission_reward — add ledger write
CREATE OR REPLACE FUNCTION public.claim_mission_reward(p_instance_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
v_instance record;
v_mission record;
v_new_xp int;
v_new_points int;
v_level_state jsonb;
BEGIN IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
SELECT * INTO v_instance
FROM mission_instances
WHERE id = p_instance_id
    AND user_id = v_uid;
IF NOT FOUND THEN RAISE EXCEPTION 'Mission instance not found';
END IF;
IF v_instance.completed_at IS NULL THEN RAISE EXCEPTION 'Mission not completed';
END IF;
IF v_instance.claimed_at IS NOT NULL THEN RAISE EXCEPTION 'Already claimed';
END IF;
SELECT * INTO v_mission
FROM missions
WHERE id = v_instance.mission_id;
-- Mark claimed
UPDATE mission_instances
SET claimed_at = now()
WHERE id = p_instance_id;
-- Award XP and points (bypass guard trigger for trusted RPC)
PERFORM set_config('app.bypass_reward_guard', 'true', true);
UPDATE profiles
SET xp = COALESCE(xp, 0) + v_mission.reward_xp,
    points = COALESCE(points, 0) + v_mission.reward_points
WHERE id = v_uid
RETURNING xp,
    points INTO v_new_xp,
    v_new_points;
-- Ledger write
INSERT INTO reward_ledger (
        user_id,
        kind,
        delta_xp,
        delta_points,
        source_id,
        meta
    )
VALUES (
        v_uid,
        'mission_claim',
        v_mission.reward_xp,
        v_mission.reward_points,
        p_instance_id::text,
        jsonb_build_object(
            'mission_id',
            v_mission.id,
            'title',
            v_mission.title
        )
    );
-- Compute level state
v_level_state := get_level_state(v_new_xp);
RETURN jsonb_build_object(
    'success',
    true,
    'xp',
    v_new_xp,
    'points',
    v_new_points,
    'level',
    (v_level_state->>'level')::int,
    'xp_into_level',
    (v_level_state->>'xp_into_level')::int,
    'xp_for_next_level',
    (v_level_state->>'xp_for_next_level')::int,
    'xp_to_next_level',
    (v_level_state->>'xp_to_next_level')::int,
    'reward_xp',
    v_mission.reward_xp,
    'reward_points',
    v_mission.reward_points
);
END;
$$;
-- 6b. claim_drop — add ledger write
CREATE OR REPLACE FUNCTION public.claim_drop(p_drop_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
v_drop record;
v_claim_count int;
v_new_xp int;
v_new_points int;
BEGIN IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
SELECT * INTO v_drop
FROM drops
WHERE id = p_drop_id
    AND is_active = true;
IF NOT FOUND THEN RAISE EXCEPTION 'Drop not found';
END IF;
IF now() < v_drop.starts_at
OR now() > v_drop.ends_at THEN RAISE EXCEPTION 'Drop not in active window';
END IF;
SELECT COUNT(*) INTO v_claim_count
FROM drop_claims
WHERE drop_id = p_drop_id
    AND user_id = v_uid;
IF v_claim_count >= v_drop.max_claims_per_user THEN RAISE EXCEPTION 'Already claimed maximum times';
END IF;
INSERT INTO drop_claims (drop_id, user_id)
VALUES (p_drop_id, v_uid);
-- Bypass guard trigger for trusted RPC
PERFORM set_config('app.bypass_reward_guard', 'true', true);
IF v_drop.reward_type = 'xp' THEN
UPDATE profiles
SET xp = COALESCE(xp, 0) + v_drop.reward_value
WHERE id = v_uid
RETURNING xp,
    points INTO v_new_xp,
    v_new_points;
ELSE
UPDATE profiles
SET points = COALESCE(points, 0) + v_drop.reward_value
WHERE id = v_uid
RETURNING xp,
    points INTO v_new_xp,
    v_new_points;
END IF;
-- Ledger write
INSERT INTO reward_ledger (
        user_id,
        kind,
        delta_xp,
        delta_points,
        source_id,
        meta
    )
VALUES (
        v_uid,
        'drop_claim',
        CASE
            WHEN v_drop.reward_type = 'xp' THEN v_drop.reward_value
            ELSE 0
        END,
        CASE
            WHEN v_drop.reward_type = 'points' THEN v_drop.reward_value
            ELSE 0
        END,
        p_drop_id::text,
        jsonb_build_object(
            'title',
            v_drop.title,
            'reward_type',
            v_drop.reward_type
        )
    );
RETURN jsonb_build_object(
    'success',
    true,
    'reward_type',
    v_drop.reward_type,
    'reward_value',
    v_drop.reward_value,
    'xp',
    v_new_xp,
    'points',
    v_new_points
);
END;
$$;
-- ═══════════════════════════════════════════════════════
-- 7. UPDATE ensure_member_home_state() — use get_level_state()
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.ensure_member_home_state() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
v_profile record;
v_today date := current_date;
v_period_key text := to_char(current_date, 'YYYY-MM-DD');
v_level_state jsonb;
v_missions jsonb;
v_active_drop jsonb;
v_secret_menu jsonb;
v_recipes jsonb;
v_leaderboard jsonb;
v_user_position int;
v_vip jsonb;
v_birthday jsonb;
v_missing_fields jsonb := '[]'::jsonb;
v_referral_count int;
v_drops_claimed_count int;
v_sorvetes_free_count int;
v_user_badges_list jsonb;
v_level int;
BEGIN IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
-- Update streak
UPDATE profiles
SET streak_count = CASE
        WHEN last_active_date = v_today - 1 THEN streak_count + 1
        WHEN last_active_date = v_today THEN streak_count
        ELSE 1
    END,
    last_active_date = v_today
WHERE id = v_uid;
-- Ensure referral_code exists
UPDATE profiles
SET referral_code = substr(md5(v_uid::text || now()::text), 1, 8)
WHERE id = v_uid
    AND referral_code IS NULL;
-- Fetch updated profile
SELECT * INTO v_profile
FROM profiles
WHERE id = v_uid;
-- Compute level state using threshold lookup
v_level_state := get_level_state(COALESCE(v_profile.xp, 0));
v_level := (v_level_state->>'level')::int;
-- Missing profile fields
IF v_profile.full_name IS NULL
OR v_profile.full_name = '' THEN v_missing_fields := v_missing_fields || '"name"'::jsonb;
END IF;
IF v_profile.avatar_path IS NULL
OR v_profile.avatar_path = '' THEN v_missing_fields := v_missing_fields || '"avatar"'::jsonb;
END IF;
IF v_profile.birth_date IS NULL THEN v_missing_fields := v_missing_fields || '"birthday"'::jsonb;
END IF;
IF v_profile.whatsapp IS NULL
OR v_profile.whatsapp = '' THEN v_missing_fields := v_missing_fields || '"whatsapp"'::jsonb;
END IF;
-- Ensure daily mission instances exist
INSERT INTO mission_instances (user_id, mission_id, period_key)
SELECT v_uid,
    m.id,
    v_period_key
FROM missions m
WHERE m.is_active = true
    AND m.frequency = 'daily' ON CONFLICT (user_id, mission_id, period_key) DO NOTHING;
-- Auto-complete "visit" missions
UPDATE mission_instances mi
SET progress = m.target,
    completed_at = COALESCE(mi.completed_at, now())
FROM missions m
WHERE mi.mission_id = m.id
    AND mi.user_id = v_uid
    AND mi.period_key = v_period_key
    AND m.kind = 'visit'
    AND mi.completed_at IS NULL;
-- Auto-complete "profile" missions if profile is complete
IF jsonb_array_length(v_missing_fields) = 0 THEN
UPDATE mission_instances mi
SET progress = m.target,
    completed_at = COALESCE(mi.completed_at, now())
FROM missions m
WHERE mi.mission_id = m.id
    AND mi.user_id = v_uid
    AND mi.period_key = v_period_key
    AND m.kind = 'profile'
    AND mi.completed_at IS NULL;
END IF;
-- Fetch missions with instance data
SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'instance_id',
                mi.id,
                'mission_id',
                m.id,
                'title',
                m.title,
                'description',
                m.description,
                'kind',
                m.kind,
                'target',
                m.target,
                'reward_xp',
                m.reward_xp,
                'reward_points',
                m.reward_points,
                'progress',
                mi.progress,
                'completed',
                mi.completed_at IS NOT NULL,
                'claimed',
                mi.claimed_at IS NOT NULL
            )
            ORDER BY m.sort
        ),
        '[]'::jsonb
    ) INTO v_missions
FROM mission_instances mi
    JOIN missions m ON m.id = mi.mission_id
WHERE mi.user_id = v_uid
    AND mi.period_key = v_period_key;
-- Active drop
SELECT jsonb_build_object(
        'id',
        d.id,
        'title',
        d.title,
        'description',
        d.description,
        'reward_type',
        d.reward_type,
        'reward_value',
        d.reward_value,
        'ends_at',
        d.ends_at,
        'already_claimed',
        EXISTS(
            SELECT 1
            FROM drop_claims dc
            WHERE dc.drop_id = d.id
                AND dc.user_id = v_uid
        )
    ) INTO v_active_drop
FROM drops d
WHERE d.is_active = true
    AND d.starts_at <= now()
    AND d.ends_at > now()
ORDER BY d.starts_at DESC
LIMIT 1;
-- User badges list
SELECT COALESCE(jsonb_agg(ub.badge_id), '[]'::jsonb) INTO v_user_badges_list
FROM user_badges ub
WHERE ub.user_id = v_uid;
-- Secret menu
SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id',
                si.id,
                'title',
                si.title,
                'description',
                si.description,
                'image_url',
                si.image_url,
                'min_level',
                si.min_level,
                'required_badge_id',
                si.required_badge_id,
                'drop_only',
                si.drop_only,
                'unlocked',
                (
                    v_level >= si.min_level
                    AND (
                        si.required_badge_id IS NULL
                        OR si.required_badge_id IN (
                            SELECT ub.badge_id
                            FROM user_badges ub
                            WHERE ub.user_id = v_uid
                        )
                    )
                    AND (
                        NOT si.drop_only
                        OR v_active_drop IS NOT NULL
                    )
                ),
                'unlock_reason',
                CASE
                    WHEN v_level < si.min_level THEN 'Nível ' || si.min_level || ' necessário'
                    WHEN si.required_badge_id IS NOT NULL
                    AND NOT EXISTS(
                        SELECT 1
                        FROM user_badges ub
                        WHERE ub.user_id = v_uid
                            AND ub.badge_id = si.required_badge_id
                    ) THEN 'Badge necessário'
                    WHEN si.drop_only
                    AND v_active_drop IS NULL THEN 'Disponível apenas durante um Drop'
                    ELSE NULL
                END
            )
        ),
        '[]'::jsonb
    ) INTO v_secret_menu
FROM secret_items si
WHERE si.is_active = true
    AND (
        NOT si.drop_only
        OR v_active_drop IS NOT NULL
    );
-- Recipes
SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id',
                r.id,
                'title',
                r.title,
                'description',
                r.description,
                'tags',
                r.tags,
                'image_url',
                r.image_url,
                'is_locked',
                r.is_locked
                AND (
                    v_level < r.min_level
                    OR (
                        r.required_badge_id IS NOT NULL
                        AND NOT EXISTS(
                            SELECT 1
                            FROM user_badges ub
                            WHERE ub.user_id = v_uid
                                AND ub.badge_id = r.required_badge_id
                        )
                    )
                ),
                'min_level',
                r.min_level,
                'saved',
                COALESCE(ur.saved, false),
                'favorited',
                COALESCE(ur.favorited, false),
                'done',
                COALESCE(ur.done, false)
            )
        ),
        '[]'::jsonb
    ) INTO v_recipes
FROM recipes r
    LEFT JOIN user_recipes ur ON ur.recipe_id = r.id
    AND ur.user_id = v_uid;
-- Leaderboard top 10
SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'user_id',
                lw.user_id,
                'full_name',
                lw.full_name,
                'avatar_path',
                lw.avatar_path,
                'xp',
                lw.xp
            )
        ),
        '[]'::jsonb
    ) INTO v_leaderboard
FROM (
        SELECT *
        FROM leaderboard_weekly
        LIMIT 10
    ) lw;
-- User's leaderboard position
SELECT rn INTO v_user_position
FROM (
        SELECT user_id,
            row_number() OVER (
                ORDER BY xp DESC
            ) AS rn
        FROM leaderboard_weekly
    ) sub
WHERE sub.user_id = v_uid;
-- Referral count
SELECT COUNT(*) INTO v_referral_count
FROM referral_events
WHERE inviter_id = v_uid
    AND status = 'validated';
-- Total drops claimed
SELECT COUNT(*) INTO v_drops_claimed_count
FROM drop_claims
WHERE user_id = v_uid;
-- Sorvetes free count (managed by admin)
SELECT COUNT(*) INTO v_sorvetes_free_count
FROM sorvetes_free_redemptions
WHERE user_id = v_uid;
-- Birthday module
IF v_profile.birth_date IS NOT NULL THEN
DECLARE v_bday_this_year date := make_date(
        extract(
            year
            FROM v_today
        )::int,
        extract(
            month
            FROM v_profile.birth_date
        )::int,
        extract(
            day
            FROM v_profile.birth_date
        )::int
    );
v_days_diff int := v_today - v_bday_this_year;
BEGIN IF v_days_diff BETWEEN -3 AND 3 THEN v_birthday := jsonb_build_object(
    'active',
    true,
    'birth_date',
    v_profile.birth_date,
    'days_until',
    - v_days_diff
);
ELSE v_birthday := jsonb_build_object('active', false);
END IF;
END;
ELSE v_birthday := jsonb_build_object('active', false);
END IF;
RETURN jsonb_build_object(
    'profile',
    jsonb_build_object(
        'full_name',
        v_profile.full_name,
        'email',
        v_profile.email,
        'avatar_path',
        v_profile.avatar_path,
        'xp',
        COALESCE(v_profile.xp, 0),
        'points',
        COALESCE(v_profile.points, 0),
        'streak_count',
        COALESCE(v_profile.streak_count, 0),
        'level',
        (v_level_state->>'level')::int,
        'xp_into_level',
        (v_level_state->>'xp_into_level')::int,
        'xp_for_next_level',
        (v_level_state->>'xp_for_next_level')::int,
        'xp_to_next_level',
        (v_level_state->>'xp_to_next_level')::int,
        'referral_code',
        v_profile.referral_code,
        'missing_fields',
        v_missing_fields
    ),
    'missions',
    v_missions,
    'active_drop',
    v_active_drop,
    'secret_menu',
    v_secret_menu,
    'recipes',
    v_recipes,
    'leaderboard',
    jsonb_build_object(
        'top10',
        v_leaderboard,
        'user_position',
        v_user_position
    ),
    'referral_count',
    COALESCE(v_referral_count, 0),
    'drops_claimed_count',
    COALESCE(v_drops_claimed_count, 0),
    'sorvetes_free_count',
    COALESCE(v_sorvetes_free_count, 0),
    'birthday',
    v_birthday
);
END;
$$;
-- ═══════════════════════════════════════════════════════
-- 8. GRANTS (ensure all new functions are accessible)
-- ═══════════════════════════════════════════════════════
GRANT EXECUTE ON FUNCTION public.ensure_member_home_state() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_mission_reward(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_drop(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_sorvetes_free() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_celebration_window() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_celebration_reward(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_level_state(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.xp_to_level(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.xp_for_level(int) TO authenticated;
GRANT SELECT ON public.level_thresholds TO authenticated;
GRANT SELECT ON public.app_settings TO authenticated;