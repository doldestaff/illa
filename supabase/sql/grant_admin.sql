-- Step 1: Find the user ID for orkutpirata@gmail.com from auth.users
-- Step 2: Insert that ID into public.admin_users
DO $$
DECLARE target_user_id UUID;
BEGIN -- Obter o ID do usuário do auth.users (Supabase Auth)
SELECT id INTO target_user_id
FROM auth.users
WHERE email = 'orkutpirata@gmail.com'
LIMIT 1;
IF target_user_id IS NOT NULL THEN -- Inserir ou ignorar se já existir (ON CONFLICT)
INSERT INTO public.admin_users (user_id)
VALUES (target_user_id) ON CONFLICT (user_id) DO NOTHING;
RAISE NOTICE 'Usuário % adicionado como Administrador com sucesso.',
target_user_id;
ELSE RAISE EXCEPTION 'Usuário com o email orkutpirata@gmail.com não foi encontrado no Supabase Auth.';
END IF;
END $$;