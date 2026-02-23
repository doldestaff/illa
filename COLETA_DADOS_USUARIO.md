# Documento de Coleta de Dados do Usuário (ILLA Sorvetes)

Este documento lista todas as informações coletadas dos usuários através da plataforma, que podem ser utilizadas para segmentação e otimização de **Tráfego Pago** (Meta Ads, Google Ads, etc.).

---

## 1. Dados de Identificação e Contato
Coletados no cadastro (`AuthModal.tsx`) e atualizados no perfil.

*   **Nome Completo**: Identificação primária para personalização de campanhas.
*   **E-mail**: Utilizado para criação de *Audiences* (Públicos Personalizados) no Meta/Google e campanhas de retargeting via CRM.
*   **Whatsapp (Telefone)**: Dado valioso para campanhas direto para o Whats e segmentação por lista de contatos.
*   **Data de Nascimento**: Permite campanhas de "Aniversariantes do Mês" com ofertas exclusivas.

## 2. Dados de Engajamento e Fidelidade (Psicográficos)
Gerados dinamicamente via sistema de gamificação (`profiles` table).

*   **Nível e XP (Experiência)**: Identifica os usuários mais ativos (Power Users). Útil para criar públicos *Lookalike* (Semelhantes) dos usuários mais engajados.
*   **Streak Count (Sequência)**: Identifica a frequência de retorno. Usuários com baixo streak podem receber anúncios de "Sentimos sua falta".
*   **Moedas e Pontos**: Indica o poder de resgate e interesse em recompensas.
*   **Data da Última Atividade**: Métrica para cálculo de LTV (Lifetime Value) e Churn.

## 3. Comportamento e Preferências de Produto
Coletados via interações com módulos específicos.

*   **Receitas (Salvas, Favoritadas, Concluídas)**: Indica preferências de sabor e interesse em produtos específicos. Permite anúncios dinâmicos baseados no que o usuário curtiu.
*   **Itens do "Menu Secreto"**: Indica interesse em exclusividade e produtos premium.
*   **Cupons e Descontos Resgatados**: Define o perfil de "Caçador de Ofertas", permitindo segmentação por sensibilidade ao preço.

## 4. Dados de Rede e Viralidade
Coletados via sistema de indicações (`referral_events`).

*   **Código de Indicação**: Identifica usuários que são "Influenciadores de Círculo" (que geram novos leads).
*   **Origem (Quem Indicou)**: Permite mapear a árvore de crescimento orgânico e premiar top referrers via tráfego pago.

## 5. Próximos Passos Sugeridos para Tráfego Pago
Para que estas informações sejam enviadas em tempo real para as plataformas de anúncio, recomenda-se:

1.  **API de Conversões (Meta)**: Enviar eventos de `Cadastro Concluído`, `Missão Cumprida` e `Resgate de Cupom` diretamente do servidor para o Facebook.
2.  **Google Analytics 4 (GA4)**: Configurar eventos personalizados para cada interação gamificada.
3.  **Pixel de Rastreamento**: Implementação do Pixel no cabeçalho para tracking de visualização de receitas e produtos.

---
**Nota**: O uso destes dados deve estar em conformidade com a LGPD, garantindo que o usuário aceitou os termos de uso e política de privacidade.
