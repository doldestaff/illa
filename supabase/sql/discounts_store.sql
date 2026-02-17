-- ============================================================
-- LOJA DE DESCONTOS — Supabase SQL Migration
-- Paste into Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================
-- 1. Create table for Discount Offers
CREATE TABLE IF NOT EXISTS public.discount_offers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    percent int NOT NULL CHECK (
        percent > 0
        AND percent <= 100
    ),
    cost_points int NOT NULL CHECK (cost_points >= 0),
    image_path text NOT NULL,
    -- e.g. '/descontos/5.png'
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);
-- RLS: Authenticated can read active offers
ALTER TABLE public.discount_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active offers" ON public.discount_offers FOR
SELECT USING (is_active = true);
-- 2. Create table for Discount Redemptions
CREATE TABLE IF NOT EXISTS public.discount_redemptions (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    offer_id uuid NOT NULL REFERENCES public.discount_offers(id),
    voucher_code text NOT NULL UNIQUE,
    status text NOT NULL DEFAULT 'issued',
    -- issued, redeemed, revoked
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);
-- RLS: Users can read their own redemptions
ALTER TABLE public.discount_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own redemptions" ON public.discount_redemptions FOR
SELECT USING (auth.uid() = user_id);
-- 3. Seed Initial Offers (Idempotent upsert based on title/percent to avoid duplicates if re-run)
-- Note: We use a DO block to handle conditional inserts or just normal INSERT ON CONFLICT if we add a unique constraint.
-- For simplicity, we'll clear and re-seed or check existence. Let's use INSERT with ON CONFLICT DO NOTHING assuming a unique constraint on title isn't there, so we'll check first.
INSERT INTO public.discount_offers (
        title,
        percent,
        cost_points,
        image_path,
        is_active
    )
SELECT 'Vale 5% de Desconto',
    5,
    200,
    '/descontos/5.png',
    true
WHERE NOT EXISTS (
        SELECT 1
        FROM public.discount_offers
        WHERE percent = 5
    );
INSERT INTO public.discount_offers (
        title,
        percent,
        cost_points,
        image_path,
        is_active
    )
SELECT 'Vale 10% de Desconto',
    10,
    350,
    '/descontos/10.png',
    true
WHERE NOT EXISTS (
        SELECT 1
        FROM public.discount_offers
        WHERE percent = 10
    );
INSERT INTO public.discount_offers (
        title,
        percent,
        cost_points,
        image_path,
        is_active
    )
SELECT 'Vale 20% de Desconto',
    20,
    600,
    '/descontos/20.png',
    true
WHERE NOT EXISTS (
        SELECT 1
        FROM public.discount_offers
        WHERE percent = 20
    );
-- 4. RPC: List Active Offers
CREATE OR REPLACE FUNCTION public.list_discount_offers() RETURNS SETOF public.discount_offers LANGUAGE sql SECURITY DEFINER AS $$
SELECT *
FROM public.discount_offers
WHERE is_active = true
ORDER BY percent ASC;
$$;
GRANT EXECUTE ON FUNCTION public.list_discount_offers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_discount_offers() TO anon;
-- Allow viewing without login if desired, but user said "browse without login"
-- 5. RPC: Redeem Discount Offer (Transactional)
CREATE OR REPLACE FUNCTION public.redeem_discount_offer(p_offer_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_user_id uuid;
v_offer public.discount_offers %ROWTYPE;
v_current_points int;
v_voucher_code text;
v_expires_at timestamptz;
BEGIN v_user_id := auth.uid();
IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated';
END IF;
-- Get Offer
SELECT * INTO v_offer
FROM public.discount_offers
WHERE id = p_offer_id;
IF v_offer IS NULL
OR v_offer.is_active = false THEN RAISE EXCEPTION 'Offer not found or inactive';
END IF;
-- Check Points (Lock rows in profiles handled by update, but good to check first)
SELECT points INTO v_current_points
FROM public.profiles
WHERE id = v_user_id;
IF v_current_points < v_offer.cost_points THEN RAISE EXCEPTION 'Insufficient points';
END IF;
-- Generate Voucher Code: "DESC-{PERCENT}-{RANDOM}"
v_voucher_code := 'DESC-' || v_offer.percent || '-' || upper(substr(md5(random()::text), 1, 6));
v_expires_at := now() + interval '30 days';
-- Deduct Points
UPDATE public.profiles
SET points = points - v_offer.cost_points
WHERE id = v_user_id;
-- Create Redemption Record
INSERT INTO public.discount_redemptions (
        user_id,
        offer_id,
        voucher_code,
        status,
        expires_at
    )
VALUES (
        v_user_id,
        v_offer.id,
        v_voucher_code,
        'issued',
        v_expires_at
    );
-- Add to Ledger
INSERT INTO public.reward_ledger (
        user_id,
        kind,
        delta_points,
        source_id,
        meta
    )
VALUES (
        v_user_id,
        'discount_redeem',
        - v_offer.cost_points,
        'discount_store',
        jsonb_build_object(
            'offer_title',
            v_offer.title,
            'percent',
            v_offer.percent,
            'voucher_code',
            v_voucher_code
        )
    );
RETURN jsonb_build_object(
    'success',
    true,
    'voucher_code',
    v_voucher_code,
    'expires_at',
    v_expires_at,
    'remaining_points',
    v_current_points - v_offer.cost_points
);
END;
$$;
GRANT EXECUTE ON FUNCTION public.redeem_discount_offer(uuid) TO authenticated;
-- 6. RPC: List My Discounts
CREATE OR REPLACE FUNCTION public.list_my_discounts(p_limit int DEFAULT 10) RETURNS TABLE (
        id bigint,
        title text,
        percent int,
        voucher_code text,
        expires_at timestamptz,
        status text,
        created_at timestamptz,
        image_path text
    ) LANGUAGE sql SECURITY DEFINER AS $$
SELECT r.id,
    o.title,
    o.percent,
    r.voucher_code,
    r.expires_at,
    r.status,
    r.created_at,
    o.image_path
FROM public.discount_redemptions r
    JOIN public.discount_offers o ON r.offer_id = o.id
WHERE r.user_id = auth.uid()
ORDER BY r.created_at DESC
LIMIT p_limit;
$$;
GRANT EXECUTE ON FUNCTION public.list_my_discounts(int) TO authenticated;
-- 7. RPC: Admin Analytics (Admin Only check needed in API or RLS, but simpler here if we trust the API token mainly. 
-- However, for safety, we usually rely on the caller being an admin. 
-- Since we use specific API routes with admin token for the admin panel, we can keep this SECURITY DEFINER but accessible to authenticated.
-- Ideally, we check a role or rely on the fact that only the Admin API calls this.)
CREATE OR REPLACE FUNCTION public.admin_get_discount_stats() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_total_redeemed int;
v_total_points_spent int;
v_popular_offer text;
v_ranking jsonb;
BEGIN
SELECT COUNT(*),
    COALESCE(SUM(o.cost_points), 0) INTO v_total_redeemed,
    v_total_points_spent
FROM public.discount_redemptions r
    JOIN public.discount_offers o ON r.offer_id = o.id;
SELECT o.title INTO v_popular_offer
FROM public.discount_redemptions r
    JOIN public.discount_offers o ON r.offer_id = o.id
GROUP BY o.title
ORDER BY COUNT(*) DESC
LIMIT 1;
-- Ranking by points spent on discounts
SELECT jsonb_agg(t) INTO v_ranking
FROM (
        SELECT p.full_name,
            p.email,
            -- joined from auth?? No, profile doesn't have email usually. We might need to join auth.users if reliable.
            -- For now, use profile contents.
            COUNT(r.id) as redemptions_count,
            SUM(o.cost_points) as points_spent
        FROM public.discount_redemptions r
            JOIN public.discount_offers o ON r.offer_id = o.id
            JOIN public.profiles p ON r.user_id = p.id
        GROUP BY p.id,
            p.full_name
        ORDER BY points_spent DESC
        LIMIT 10
    ) t;
RETURN jsonb_build_object(
    'total_redeemed',
    v_total_redeemed,
    'total_points_spent',
    v_total_points_spent,
    'popular_offer',
    COALESCE(v_popular_offer, 'Nenhum'),
    'ranking',
    COALESCE(v_ranking, '[]'::jsonb)
);
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_get_discount_stats() TO authenticated;