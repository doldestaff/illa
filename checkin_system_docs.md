# Sistema de Autenticação e Check-in de Missões da ILLA

Este documento detalha o fluxo completo de interação entre usuário, front-end e back-end para viabilizar as funcionalidades de "Registro de Experiência" e "Cashback/Recompensas" do Clube ILLA.

## 1. Arquitetura do Banco de Dados (Supabase PostgreSQL)

Para que o sistema de check-in seja devidamente integrado, precisamos contar com tabelas-chave. Idealmente:

- **`users` (Tabela padrão do Supabase Auth)**: Gerencia o login.
- **`profiles`**: Extensão do user com campos como `pontos_atuais`, `nivel`, `xp_total`, `nome`.
- **`missions`**: Catálogo de missões (ex: "Receita de Pipoca Gourmet").
- **`user_missions`**: Tabela pivô para o status da missão por usuário.
  - Campos: `user_id`, `mission_id`, `status` (pending, under_review, completed, rejected), `media_url`, `created_at`, `reviewed_at`.
- **`transactions` (Opcional, mas recomendado)**: Histórico de fluxo de caixa (ex: "+50 Moedas por Missão X").

## 2. Fluxo do Check-in (O Caminho do Usuário)

O modal "Registre a Experiência" deve ser o gatilho final que conecta todas as partes do sistema. Abaixo, descrevemos o passo a passo técnico:

### A. Upload do Arquivo (Foto ou Vídeo)
O componente React lidará com um `<input type="file" accept="image/*,video/*" />`. O arquivo é temporariamente guardado no estado local.
Quando o usuário clica em "CONCLUIR & GANHAR", a função dispara.

```typescript
// Fluxo lógico simplificado:
const fileName = `${user.id}/${Date.now()}-${file.name}`;
const { data, error } = await supabase
  .storage
  .from('mission-proofs') // Bucket público ou restrito no Supabase
  .upload(fileName, file);

if (error) throw new Error("Falha no upload");
const publicUrl = supabase.storage.from('mission-proofs').getPublicUrl(fileName).data.publicUrl;
```

### B. Registro no Banco (Ação Pendente)
O arquivo subiu. Agora inserimos/atualizamos a linha em `user_missions` avisando ao sistema que aquele jogador tentou a missão.

```typescript
const { error: dbError } = await supabase
  .from('user_missions')
  .upsert({
    user_id: user.id,
    mission_id: activeMissionId,
    status: 'under_review', // ou 'completed' se a aprovação for automática
    media_url: publicUrl
  });
```

### C. Validação e Moedas
Há duas formas de lidar a partir de `"under_review"`:

**Abordagem 1: Aprovação Automática (Recomendada para MVPs rápidos)**
Assim que o banco registrar o link da mídia, uma `Server Action` ou `Edge Function` pode depositar a recompensa imediatamente. 
- O front-end consulta a recompensa da missão (ex: 50 moedas).
- O banco atualiza o saldo do perfil com Segurança via RPC (Remote Procedure Call no banco) ou API restrita (`/api/missions/claim`).

**Abordagem 2: Verificação Humana (Recomendada no Longo Prazo)**
Os checks caem em um painel Admin oculto (como o seu `AdminDashboard`).
- Um moderador analisa a foto.
- Clica em "Aprovar".
- A API de administração muda o status para `completed` e injeta as moedas + dispara notificação na conta do jogador.

## 3. Segurança e Autenticação (Auth)

O sistema de missões só pode acontecer se o usuário possuir a sessão validada.
O Next.js com App Router e Supabase utiliza cookies criptografados:

1. As imagens devem ir para o Bucket associadas ao UserID (`auth.uid()`).
2. Apenas usuários logados podem requisitar `POST /api/missions/claim`. As rotas API têm que implementar checagens rigorosas (`const supabase = createClient()`, `const { data: { user } } = await supabase.auth.getUser()`).
3. NUNCA somar saldo diretamente injetando de um componente SSR pelo lado do cliente. Faça isso somente via Endpoints Protegidos (`route.ts`) ou Supabase Database Functions (RPC's) com Row Level Security (RLS) habilitado no próprio painel do Postgres.

## 4. O Sistema "Apenas Para Membros"

Os Modais em `page.tsx` recebem o estado de `user`.
Sem sessão ativa:
- O botão "Iniciar Sessão" / "Apenas para Membros" abre o Modal de Login Mágico em vez do Modal de Receita.

Com a sessão validada:
- A tela revela o componente secreto interativo.

## Resumo dos Passos para Implementar Isso:
1. Ir no painel do Supabase, aba de _Storage_, criar o Bucket `"mission-proofs"`.
2. Criar a política (Policy RLS): *Só usuários autenticados fazem upload e apenas inserem arquivos no diretório com seu PRÓPRIO User ID.*
3. Conectar a chamada assíncrona do upload no botão laranja do Modal "Registre a Experiência".
4. Substituir os botões e links de navegação fictícios para rotas reais que verificam a sessão.
