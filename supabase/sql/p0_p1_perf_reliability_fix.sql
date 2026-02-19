-- P0: Leaderboard Scalability - Add Index for XP sorting
CREATE INDEX IF NOT EXISTS idx_profiles_xp_desc ON public.profiles (xp DESC);
-- P1: Active Drops Window - Add Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_drops_active_window ON public.drops (is_active, starts_at, ends_at);
-- P0: Leaderboard Decoupling
-- Create a lightweight function/view for just the top 10 weekly (or all-time if that's what it is)
-- This avoids the heavy view/sort inside the ensuring home state transaction if we were to use it there.
-- Usage: supabase.rpc('get_weekly_leaderboard', { limit_count: 10 })
CREATE OR REPLACE FUNCTION get_weekly_leaderboard(limit_count INT DEFAULT 10) RETURNS TABLE (
        user_id UUID,
        full_name TEXT,
        avatar_url TEXT,
        xp BIGINT,
        username TEXT
    ) AS $$ BEGIN RETURN QUERY
SELECT p.id as user_id,
    p.full_name,
    p.avatar_url,
    p.xp,
    p.username
FROM profiles p
ORDER BY xp DESC
LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;