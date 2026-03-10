-- ============================================================
-- SCRIPT DE CORREÇÃO: Receitas e Missão "Fan Exclusive"
-- Copie e cole este código no SQL Editor do Supabase Dashboard
-- ============================================================

-- 1. Inserir as 9 Receitas Oficiais para que funcionem corretamente no Dashboard e Favoritos
-- Usando os mesmos UUIDs estáticos configurados no código frontend para garantir a sincronia.
INSERT INTO public.recipes (id, title, description, tags, is_locked, min_level, image_url) VALUES
('11111111-1111-1111-1111-111111111111', 'Milkshake "Cinema de Pipoca"', 'Fazer em dupla e brindar (sem álcool)', '{"7 min", "Fácil"}', false, 1, null),
('22222222-2222-2222-2222-222222222222', 'Affogato "Café Gelado + ILLA"', 'Sobremesa chique em 2 minutos (perfeita pra date)', '{"3 min", "Fácil"}', false, 1, null),
('33333333-3333-3333-3333-333333333333', 'Sanduíche de Sorvete "Cookie Smash"', 'Fazer 4 mini-sanduíches e dividir com amigos', '{"10 min", "Fácil"}', false, 1, null),
('44444444-4444-4444-4444-444444444444', '"Banana Split" Turbo em Casa', 'Montar a taça mais bonita', '{"12 min", "Fácil"}', false, 1, null),
('55555555-5555-5555-5555-555555555555', 'Brownie de Caneca + Bola ILLA', 'Sobremesa quente-frio em 1 caneca', '{"8 min", "Fácil"}', false, 1, null),
('66666666-6666-6666-6666-666666666666', '"Float" de Guaraná (Refrigerante + ILLA)', '1 litro vira 4 copos com cara de festa', '{"5 min", "Fácil"}', false, 1, null),
('77777777-7777-7777-7777-777777777777', 'Parfait de Açaí ILLA "Camadas"', 'Montar camadas e escolher "topping oficial do casal"', '{"10 min", "Fácil"}', false, 1, null),
('88888888-8888-8888-8888-888888888888', '"Torta Gelada" de Biscoito', 'Sobremesa de bandeja pra galera (Sem Forno)', '{"20 min", "Fácil"}', false, 1, null),
('99999999-9999-9999-9999-999999999999', 'Picolé ILLA "DIP & CRUNCH"', 'Transformar picolé em sobremesa premium', '{"15 min", "Fácil"}', false, 1, null)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

-- 2. Garantir que a Missão "Fan Exclusive" exista e esteja ativa como diária
INSERT INTO public.missions (id, title, description, kind, target, reward_xp, reward_points, frequency, is_active, sort)
VALUES 
('aaaa1111-bbbb-cccc-dddd-eeee22223333', 'Acesso Fan Exclusive', 'Descubra os benefícios exclusivos para membros VIP!', 'view_exclusive', 1, 30, 30, 'daily', true, 2)
ON CONFLICT (id) DO UPDATE SET is_active = true, frequency = 'daily', sort = 2;
