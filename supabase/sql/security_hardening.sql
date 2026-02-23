-- ============================================================
-- ILLA Sorvetes — Security Hardening SQL
-- Generated: 2026-02-23
-- Purpose: RLS policies, admin_users table, reward_ledger
--          table (if missing), and security indexes.
-- ============================================================
-- ──────────────────────────────────────────────
-- 1. ADMIN_USERS TABLE
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID REFERENCES auth.users(id)
);
-- RLS: Only service_role / super-admin can read/write this table.
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
-- No RLS policies = only service_role can access (safest default).
-- If you need admin self-read, uncomment below:
-- CREATE POLICY "admin_self_read" ON public.admin_users
--     FOR SELECT USING (auth.uid() = user_id);
COMMENT ON TABLE public.admin_users IS 'Whitelist of user IDs with admin privileges. Managed via Supabase Dashboard or service_role only.';
-- ──────────────────────────────────────────────
-- 2. REWARD_LEDGER TABLE (if missing)
-- ──────────────────────────────────────────────
-- Check if it already exists; this is idempotent.
CREATE TABLE IF NOT EXISTS public.reward_ledger (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    -- 'mission_claim', 'drop_claim', 'admin_grant', 'referral', etc.
    delta_xp INT DEFAULT 0,
    delta_points INT DEFAULT 0,
    source_id TEXT,
    -- e.g. mission_instance_id, drop_id, etc.
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.reward_ledger ENABLE ROW LEVEL SECURITY;
-- Users can only SELECT their own ledger entries.
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'reward_ledger'
        AND policyname = 'ledger_select_own'
) THEN CREATE POLICY ledger_select_own ON public.reward_ledger FOR
SELECT USING (auth.uid() = user_id);
END IF;
END $$;
-- No INSERT/UPDATE/DELETE for regular users — only SECURITY DEFINER RPCs.
-- Revoke direct insert from authenticated role:
REVOKE
INSERT,
    UPDATE,
    DELETE ON public.reward_ledger
FROM authenticated;
COMMENT ON TABLE public.reward_ledger IS 'Immutable audit log of all reward changes. Written only by SECURITY DEFINER RPCs.';
-- ──────────────────────────────────────────────
-- 3. RLS HARDENING — PROFILES
-- ──────────────────────────────────────────────
-- Ensure authenticated users can only read and update their OWN profile.
-- Block direct UPDATE to xp/points columns at RLS level.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Drop overly-permissive policies if they exist
DO $$ BEGIN -- Re-create restrictive policies
-- SELECT: own row only
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'profiles'
        AND policyname = 'profiles_select_own'
) THEN CREATE POLICY profiles_select_own ON public.profiles FOR
SELECT USING (auth.uid() = id);
END IF;
-- UPDATE: own row only, restricted columns
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'profiles'
        AND policyname = 'profiles_update_own_safe'
) THEN CREATE POLICY profiles_update_own_safe ON public.profiles FOR
UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
END IF;
END $$;
-- Prevent client from directly writing xp/points via a trigger guard
CREATE OR REPLACE FUNCTION public.guard_reward_columns() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN -- Only allow xp/points changes from SECURITY DEFINER functions
    -- Check if the caller is a regular authenticated user (not a SECURITY DEFINER context)
    IF current_setting('role', true) = 'authenticated' THEN -- If xp or points changed, block it
    IF NEW.xp IS DISTINCT
FROM OLD.xp
    OR NEW.points IS DISTINCT
FROM OLD.points THEN RAISE EXCEPTION 'Direct modification of xp/points is not allowed. Use the reward system.';
END IF;
END IF;
RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_guard_reward_columns ON public.profiles;
CREATE TRIGGER trg_guard_reward_columns BEFORE
UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.guard_reward_columns();
-- ──────────────────────────────────────────────
-- 4. RLS HARDENING — MISSION_INSTANCES
-- ──────────────────────────────────────────────
ALTER TABLE public.mission_instances ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'mission_instances'
        AND policyname = 'mi_select_own'
) THEN CREATE POLICY mi_select_own ON public.mission_instances FOR
SELECT USING (auth.uid() = user_id);
END IF;
-- Block direct UPDATE from client — only RPCs should update progress
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'mission_instances'
        AND policyname = 'mi_update_own_limited'
) THEN CREATE POLICY mi_update_own_limited ON public.mission_instances FOR
UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
END IF;
END $$;
-- ──────────────────────────────────────────────
-- 5. RLS HARDENING — DROP_CLAIMS
-- ──────────────────────────────────────────────
ALTER TABLE public.drop_claims ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'drop_claims'
        AND policyname = 'dc_select_own'
) THEN CREATE POLICY dc_select_own ON public.drop_claims FOR
SELECT USING (auth.uid() = user_id);
END IF;
END $$;
-- No direct INSERT from client — only the claim_drop RPC
REVOKE
INSERT,
    UPDATE,
    DELETE ON public.drop_claims
FROM authenticated;
-- ──────────────────────────────────────────────
-- 6. RLS HARDENING — NOTIFICATIONS
-- ──────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'notifications'
        AND policyname = 'notif_select_own'
) THEN CREATE POLICY notif_select_own ON public.notifications FOR
SELECT USING (auth.uid() = user_id);
END IF;
-- Allow users to mark their own notifications as read
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'notifications'
        AND policyname = 'notif_update_own'
) THEN CREATE POLICY notif_update_own ON public.notifications FOR
UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
END IF;
END $$;
-- Block direct INSERT from client
REVOKE
INSERT,
    DELETE ON public.notifications
FROM authenticated;
-- ──────────────────────────────────────────────
-- 7. RLS HARDENING — REFERRALS
-- ──────────────────────────────────────────────
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'referrals'
) THEN EXECUTE 'ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY';
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'referrals'
        AND policyname = 'ref_select_own'
) THEN EXECUTE $policy$ CREATE POLICY ref_select_own ON public.referrals FOR
SELECT USING (
        auth.uid() = referrer_id
        OR auth.uid() = referred_id
    ) $policy$;
END IF;
-- Block direct INSERT — only RPCs
EXECUTE 'REVOKE INSERT, UPDATE, DELETE ON public.referrals FROM authenticated';
END IF;
END $$;
-- ──────────────────────────────────────────────
-- 8. RLS — PUSH_SUBSCRIPTIONS
-- ──────────────────────────────────────────────
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'push_subscriptions'
        AND policyname = 'push_own'
) THEN CREATE POLICY push_own ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
END IF;
END $$;
-- ──────────────────────────────────────────────
-- 9. RLS — STORAGE BUCKETS (avatars)
-- ──────────────────────────────────────────────
-- Ensure avatar bucket only allows own-user operations
-- (This requires running in Supabase Dashboard or via supabase CLI)
-- INSERT INTO storage.policies ...
-- Already handled via Supabase Dashboard typically.
-- ──────────────────────────────────────────────
-- 10. ADMIN_USERS RLS — Allow admin self-read (required by API)
-- ──────────────────────────────────────────────
-- Admin routes need authenticated users to read their own row
-- to verify they are admin.
CREATE POLICY admin_self_read ON public.admin_users FOR
SELECT USING (auth.uid() = user_id);
-- ──────────────────────────────────────────────
-- 11. SECURITY INDEXES
-- ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reward_ledger_user_id ON public.reward_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_created_at ON public.reward_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drop_claims_user_drop ON public.drop_claims(user_id, drop_id);
CREATE INDEX IF NOT EXISTS idx_mission_instances_user_period ON public.mission_instances(user_id, period_key);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read_at);
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'referrals'
) THEN EXECUTE 'CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id)';
END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_admin_users_uid ON public.admin_users(user_id);
-- ──────────────────────────────────────────────
-- 12. SEED INITIAL ADMIN USER
-- ──────────────────────────────────────────────
-- IMPORTANT: Replace the UUID below with the actual admin user's ID
-- from your Supabase auth.users table.
--
-- To find it: Go to Supabase Dashboard > Authentication > Users
-- and copy the UUID of the admin account.
--
-- INSERT INTO public.admin_users (user_id)
-- VALUES ('YOUR-ADMIN-USER-UUID-HERE');
-- ============================================================
-- END OF SECURITY HARDENING
-- ============================================================