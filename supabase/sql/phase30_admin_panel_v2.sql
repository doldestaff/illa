-- ============================================================
-- PHASE 30: ADMIN PANEL V2 - BUSINESS LOGIC & RISK LIMITS
-- ============================================================

-- 1. Configurações centralizadas do admin (Key-Value)
CREATE TABLE IF NOT EXISTS public.admin_settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL DEFAULT '{}',
    updated_at timestamptz DEFAULT now()
);

-- Inserir configurações padrão
INSERT INTO public.admin_settings (key, value)
VALUES 
    ('rewards_limits', '{"max_per_day": 100, "active": true}'::jsonb),
    ('coins_config', '{"brl_per_coin": 0.05}'::jsonb),
    ('risk_limiter', '{"max_coins_per_week": 10000, "paused": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- RLS para admin_settings (somente admins podem ler/escrever)
-- Assumindo bypass no código do admin (usando service_role)
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- 2. Colunas extras em discount_offers para controle de limites estimativa de custos
ALTER TABLE public.discount_offers
    ADD COLUMN IF NOT EXISTS estimated_cost_brl numeric(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS max_per_week int DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS max_per_month int DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS validity_hours int DEFAULT 168; -- 7 dias padrão

-- 3. Tabela de logs de validação na loja (QR Code)
CREATE TABLE IF NOT EXISTS public.redemption_logs (
    id bigserial PRIMARY KEY,
    admin_user_id uuid NOT NULL REFERENCES auth.users(id),
    customer_user_id uuid NOT NULL REFERENCES auth.users(id),
    voucher_code text NOT NULL,
    voucher_type text NOT NULL, -- 'discount' | 'sorvete' | 'drop'
    validated_at timestamptz DEFAULT now()
);

-- Opcional: RLS para redemption_logs
ALTER TABLE public.redemption_logs ENABLE ROW LEVEL SECURITY;
