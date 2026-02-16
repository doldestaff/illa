-- ============================================================
-- GAMIFIED MEMBERS HOME — Supabase SQL
-- Paste this into Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================
-- =========================
-- 1. ALTER profiles TABLE
-- =========================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS xp int DEFAULT 0;
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS points int DEFAULT 0;
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS streak_count int DEFAULT 0;
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_active_date date;
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS birth_date_updated_at timestamptz;
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id);
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_path text;
-- =========================
-- 2. CREATE TABLES
-- =========================
-- Missions (definitions)
CREATE TABLE IF NOT EXISTS public.missions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    kind text NOT NULL DEFAULT 'action',
    target int NOT NULL DEFAULT 1,
    reward_xp int NOT NULL DEFAULT 0,
    reward_points int NOT NULL DEFAULT 0,
    frequency text NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'seasonal')),
    is_active boolean NOT NULL DEFAULT true,
    sort int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);
-- Mission instances (per user per period)
CREATE TABLE IF NOT EXISTS public.mission_instances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mission_id uuid NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
    period_key text NOT NULL,
    progress int NOT NULL DEFAULT 0,
    completed_at timestamptz,
    claimed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, mission_id, period_key)
);
CREATE INDEX IF NOT EXISTS idx_mission_instances_user ON public.mission_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_mission_instances_period ON public.mission_instances(period_key);
-- Drops (flash drops)
CREATE TABLE IF NOT EXISTS public.drops (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    reward_type text NOT NULL DEFAULT 'points',
    reward_value int NOT NULL DEFAULT 0,
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL,
    max_claims_per_user int NOT NULL DEFAULT 1,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);
-- Drop claims
CREATE TABLE IF NOT EXISTS public.drop_claims (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    drop_id uuid NOT NULL REFERENCES public.drops(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    claimed_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(drop_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_drop_claims_user ON public.drop_claims(user_id);
-- Badges
CREATE TABLE IF NOT EXISTS public.badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text UNIQUE NOT NULL,
    title text NOT NULL,
    description text,
    rarity text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'legendary')),
    icon_url text,
    created_at timestamptz NOT NULL DEFAULT now()
);
-- User badges
CREATE TABLE IF NOT EXISTS public.user_badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    earned_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, badge_id)
);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
-- Secret items
CREATE TABLE IF NOT EXISTS public.secret_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    image_url text,
    min_level int NOT NULL DEFAULT 0,
    required_badge_id uuid REFERENCES public.badges(id),
    drop_only boolean NOT NULL DEFAULT false,
    active_drop_id uuid REFERENCES public.drops(id),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);
-- Recipes
CREATE TABLE IF NOT EXISTS public.recipes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    tags text [] DEFAULT '{}',
    is_locked boolean NOT NULL DEFAULT false,
    min_level int NOT NULL DEFAULT 0,
    required_badge_id uuid REFERENCES public.badges(id),
    content jsonb DEFAULT '{}',
    image_url text,
    created_at timestamptz NOT NULL DEFAULT now()
);
-- User recipes (interaction tracking)
CREATE TABLE IF NOT EXISTS public.user_recipes (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    saved boolean NOT NULL DEFAULT false,
    favorited boolean NOT NULL DEFAULT false,
    done boolean NOT NULL DEFAULT false,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, recipe_id)
);
-- VIP tokens
CREATE TABLE IF NOT EXISTS public.vip_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash text NOT NULL,
    short_code text NOT NULL,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vip_tokens_user ON public.vip_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_tokens_short_code ON public.vip_tokens(short_code);
-- Referral events
CREATE TABLE IF NOT EXISTS public.referral_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invitee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated')),
    created_at timestamptz NOT NULL DEFAULT now(),
    validated_at timestamptz,
    UNIQUE(inviter_id, invitee_id)
);
CREATE INDEX IF NOT EXISTS idx_referral_events_inviter ON public.referral_events(inviter_id);
-- =========================
-- 3. WEEKLY LEADERBOARD VIEW
-- =========================
CREATE OR REPLACE VIEW public.leaderboard_weekly AS
SELECT p.id AS user_id,
    p.full_name,
    p.avatar_path,
    COALESCE(sub.week_xp, 0)::int AS week_xp
FROM public.profiles p
    LEFT JOIN (
        SELECT mi.user_id,
            SUM(m.reward_xp) AS week_xp
        FROM public.mission_instances mi
            JOIN public.missions m ON m.id = mi.mission_id
        WHERE mi.claimed_at IS NOT NULL
            AND mi.claimed_at >= date_trunc('week', now())
        GROUP BY mi.user_id
    ) sub ON sub.user_id = p.id
ORDER BY week_xp DESC,
    p.full_name ASC;
-- =========================
-- 4. ENABLE RLS
-- =========================
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drop_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secret_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;
-- =========================
-- 5. RLS POLICIES (idempotent: drop then create)
-- =========================
-- Missions: authenticated can read
DROP POLICY IF EXISTS "Authenticated can read missions" ON public.missions;
CREATE POLICY "Authenticated can read missions" ON public.missions FOR
SELECT USING (auth.role() = 'authenticated');
-- Mission instances: users own their rows
DROP POLICY IF EXISTS "Users read own mission instances" ON public.mission_instances;
CREATE POLICY "Users read own mission instances" ON public.mission_instances FOR
SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert own mission instances" ON public.mission_instances;
CREATE POLICY "Users insert own mission instances" ON public.mission_instances FOR
INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own mission instances" ON public.mission_instances;
CREATE POLICY "Users update own mission instances" ON public.mission_instances FOR
UPDATE USING (auth.uid() = user_id);
-- Drops: authenticated can read
DROP POLICY IF EXISTS "Authenticated can read drops" ON public.drops;
CREATE POLICY "Authenticated can read drops" ON public.drops FOR
SELECT USING (auth.role() = 'authenticated');
-- Drop claims: users own their rows
DROP POLICY IF EXISTS "Users read own drop claims" ON public.drop_claims;
CREATE POLICY "Users read own drop claims" ON public.drop_claims FOR
SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert own drop claims" ON public.drop_claims;
CREATE POLICY "Users insert own drop claims" ON public.drop_claims FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- Badges: authenticated can read
DROP POLICY IF EXISTS "Authenticated can read badges" ON public.badges;
CREATE POLICY "Authenticated can read badges" ON public.badges FOR
SELECT USING (auth.role() = 'authenticated');
-- User badges: users own their rows
DROP POLICY IF EXISTS "Users read own badges" ON public.user_badges;
CREATE POLICY "Users read own badges" ON public.user_badges FOR
SELECT USING (auth.uid() = user_id);
-- Secret items: authenticated can read active items
DROP POLICY IF EXISTS "Authenticated can read secret items" ON public.secret_items;
CREATE POLICY "Authenticated can read secret items" ON public.secret_items FOR
SELECT USING (
        auth.role() = 'authenticated'
        AND is_active = true
    );
-- Recipes: authenticated can read
DROP POLICY IF EXISTS "Authenticated can read recipes" ON public.recipes;
CREATE POLICY "Authenticated can read recipes" ON public.recipes FOR
SELECT USING (auth.role() = 'authenticated');
-- User recipes: users own their rows
DROP POLICY IF EXISTS "Users read own recipe status" ON public.user_recipes;
CREATE POLICY "Users read own recipe status" ON public.user_recipes FOR
SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users upsert own recipe status" ON public.user_recipes;
CREATE POLICY "Users upsert own recipe status" ON public.user_recipes FOR
INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own recipe status" ON public.user_recipes;
CREATE POLICY "Users update own recipe status" ON public.user_recipes FOR
UPDATE USING (auth.uid() = user_id);
-- VIP tokens: users own their rows
DROP POLICY IF EXISTS "Users read own vip tokens" ON public.vip_tokens;
CREATE POLICY "Users read own vip tokens" ON public.vip_tokens FOR
SELECT USING (auth.uid() = user_id);
-- Referral events: users can see where they are inviter
DROP POLICY IF EXISTS "Users read own referrals" ON public.referral_events;
CREATE POLICY "Users read own referrals" ON public.referral_events FOR
SELECT USING (auth.uid() = inviter_id);
-- =========================
-- 6. RPC FUNCTIONS
-- =========================
-- Helper: compute level from XP (100 XP per level, exponential curve)
CREATE OR REPLACE FUNCTION public.xp_to_level(xp_val int) RETURNS int LANGUAGE sql IMMUTABLE AS $$
SELECT GREATEST(1, floor(sqrt(xp_val::numeric / 50))::int);
$$;
CREATE OR REPLACE FUNCTION public.xp_for_level(lvl int) RETURNS int LANGUAGE sql IMMUTABLE AS $$
SELECT (lvl * lvl * 50)::int;
$$;
-- -------------------------------------------------------
-- ensure_member_home_state()
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_member_home_state() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
v_profile record;
v_today date := current_date;
v_period_key text := to_char(current_date, 'YYYY-MM-DD');
v_level int;
v_next_level_xp int;
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
v_user_badges_list jsonb;
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
-- Compute level
v_level := xp_to_level(COALESCE(v_profile.xp, 0));
v_next_level_xp := xp_for_level(v_level + 1);
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
-- Auto-complete "visit" missions (user is visiting the panel right now)
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
                'week_xp',
                lw.week_xp
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
                ORDER BY week_xp DESC
            ) AS rn
        FROM leaderboard_weekly
    ) sub
WHERE sub.user_id = v_uid;
-- Referral count
SELECT COUNT(*) INTO v_referral_count
FROM referral_events
WHERE inviter_id = v_uid
    AND status = 'validated';
-- Total drops claimed by this user
SELECT COUNT(*) INTO v_drops_claimed_count
FROM drop_claims
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
        v_level,
        'next_level_xp',
        v_next_level_xp,
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
    'birthday',
    v_birthday
);
END;
$$;
-- -------------------------------------------------------
-- claim_mission_reward(mission_instance_id uuid)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_mission_reward(p_instance_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
v_instance record;
v_mission record;
v_new_xp int;
v_new_points int;
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
-- Award XP and points
UPDATE profiles
SET xp = COALESCE(xp, 0) + v_mission.reward_xp,
    points = COALESCE(points, 0) + v_mission.reward_points
WHERE id = v_uid
RETURNING xp,
    points INTO v_new_xp,
    v_new_points;
RETURN jsonb_build_object(
    'success',
    true,
    'xp',
    v_new_xp,
    'points',
    v_new_points,
    'level',
    xp_to_level(v_new_xp),
    'reward_xp',
    v_mission.reward_xp,
    'reward_points',
    v_mission.reward_points
);
END;
$$;
-- -------------------------------------------------------
-- claim_drop(p_drop_id uuid)
-- -------------------------------------------------------
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
-- Check max claims
SELECT COUNT(*) INTO v_claim_count
FROM drop_claims
WHERE drop_id = p_drop_id
    AND user_id = v_uid;
IF v_claim_count >= v_drop.max_claims_per_user THEN RAISE EXCEPTION 'Already claimed maximum times';
END IF;
-- Insert claim
INSERT INTO drop_claims (drop_id, user_id)
VALUES (p_drop_id, v_uid);
-- Award reward
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
-- -------------------------------------------------------
-- update_birth_date(p_date date)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_birth_date(p_date date) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
v_profile record;
BEGIN IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
SELECT * INTO v_profile
FROM profiles
WHERE id = v_uid;
-- Anti-abuse: only allow if never set or last update older than 6 months
IF v_profile.birth_date IS NOT NULL
AND v_profile.birth_date_updated_at IS NOT NULL THEN IF v_profile.birth_date_updated_at > now() - interval '6 months' THEN RAISE EXCEPTION 'Birth date can only be updated once every 6 months';
END IF;
END IF;
UPDATE profiles
SET birth_date = p_date,
    birth_date_updated_at = now()
WHERE id = v_uid;
RETURN jsonb_build_object('success', true, 'birth_date', p_date);
END;
$$;
-- -------------------------------------------------------
-- get_or_rotate_vip_token()
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_or_rotate_vip_token() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
v_token record;
v_new_code text;
v_new_hash text;
v_expires timestamptz;
BEGIN IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
-- Check for existing valid token
SELECT * INTO v_token
FROM vip_tokens
WHERE user_id = v_uid
    AND revoked_at IS NULL
    AND expires_at > now()
ORDER BY created_at DESC
LIMIT 1;
IF FOUND THEN RETURN jsonb_build_object(
    'short_code',
    v_token.short_code,
    'expires_at',
    v_token.expires_at,
    'token_id',
    v_token.id
);
END IF;
-- Revoke old tokens
UPDATE vip_tokens
SET revoked_at = now()
WHERE user_id = v_uid
    AND revoked_at IS NULL;
-- Generate new token
v_new_code := upper(
    substr(
        md5(v_uid::text || now()::text || random()::text),
        1,
        8
    )
);
v_new_hash := md5(v_new_code || v_uid::text);
v_expires := now() + interval '30 days';
INSERT INTO vip_tokens (user_id, token_hash, short_code, expires_at)
VALUES (v_uid, v_new_hash, v_new_code, v_expires);
RETURN jsonb_build_object(
    'short_code',
    v_new_code,
    'expires_at',
    v_expires,
    'token_id',
    (
        SELECT id
        FROM vip_tokens
        WHERE user_id = v_uid
            AND revoked_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
    )
);
END;
$$;
-- =========================
-- 7. GRANT EXECUTE ON FUNCTIONS
-- =========================
GRANT EXECUTE ON FUNCTION public.ensure_member_home_state() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_mission_reward(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_drop(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_birth_date(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_rotate_vip_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.xp_to_level(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.xp_for_level(int) TO authenticated;
-- Grant select on view
GRANT SELECT ON public.leaderboard_weekly TO authenticated;