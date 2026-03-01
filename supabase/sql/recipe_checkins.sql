-- Supabase SQL Script para Check-ins de Mídia das Missões (Receitas)
-- Executar no painel do Supabase -> SQL Editor
-- 1. Tabela de Check-ins (Fotos/Vídeos de receitas)
CREATE TABLE IF NOT EXISTS public.recipe_checkins (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id TEXT NOT NULL,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    approved BOOLEAN DEFAULT true,
    -- se precisa de moderação manual, por padrão liberado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Ativar RLS
ALTER TABLE public.recipe_checkins ENABLE ROW LEVEL SECURITY;
-- 2. Políticas de Acesso
-- Permitir que os usuários insiram seus próprios check-ins
CREATE POLICY "Usuários podem criar seus próprios check-ins" ON public.recipe_checkins FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- Permitir que o usuário leia seus próprios check-ins
CREATE POLICY "Usuários podem ler seus próprios check-ins" ON public.recipe_checkins FOR
SELECT USING (auth.uid() = user_id);
-- Permitir visualização pública de check-ins aprovados para o mural da comunidade (opcional)
CREATE POLICY "Check-ins aprovados são públicos" ON public.recipe_checkins FOR
SELECT USING (approved = true);
-- 3. Configuração do Storage (Se ainda não existir, crie o bucket manualmente na interface e ajuste as políticas)
-- Bucket: recipe-media
-- O ideal é ajustar na interface do Supabase Storage:
-- - Bucket Public? Depende (se o mural for aberto). Se sim, defina as políticas de INSERT para autenticados e SELECT para public.