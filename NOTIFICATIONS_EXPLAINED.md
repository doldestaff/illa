# Funcionamento das Notificações

## As notificações funcionam no MOBILE? 📱

**SIM!** O sistema foi projetado para funcionar como um aplicativo nativo no seu celular.

### Android
- **Funciona direto no navegador** (Chrome, Samsung Internet, etc).
- Você recebe a notificação na barra de status, igual a um WhatsApp ou iFood.
- Pode instalar o site como App se quiser.

### iPhone (iOS) - *Importante* 🍎
- A Apple tem uma regra de segurança: **Você deve adicionar o site à Tela de Início** para receber notificações.
1.  Abra o Safari.
2.  Toque em **Compartilhar** (quadrado com seta).
3.  Escolha **"Adicionar à Tela de Início"**.
4.  Abra o novo ícone criado -> Agora você pode ativar o sininho!

> **O que fizemos:** Adicionamos um arquivo especial (`manifest.json`) que permite essa "instalação".
>
> ⚠️ **Atenção:** As imagens dos ícones (`/public/icons/`) ainda precisam ser criadas. O sistema tentou gerar automaticamente mas falhou temporariamente. Por enquanto, o ícone será genérico ou a captura de tela do site.

---

## Dúvida Comum: Preciso abrir o browser?

A resposta depende do dispositivo, mas no geral: **Elas já estão ativas**.

### Como funciona (Técnico)

1.  **Browser ABERTO (mesmo em outra aba):**
    *   O "Service Worker" (`sw.js`) recebe a notificação **instantaneamente** e a exibe.
    *   Você não precisa estar com a aba da Loja ILLA ativa.

2.  **Browser FECHADO:**
    *   **Celular (Android/iOS):** O sistema operacional mantém um canal direto com o serviço de push (Google/Apple). Quando chega uma notificação, o sistema "acorda" o navegador em segundo plano para exibi-la.
    *   **Computador (Windows/Mac):** Depende do navegador.
        *   Se o navegador estiver rodando em segundo plano (comum no Chrome/Edge), você recebe.
        *   Se você fechar *totalmente* (Encerrar Processo), você receberá as notificações pendentes assim que **abrir o navegador** novamente.

### O que acontece ao abrir o site?

Quando você entra na Dashboard (`/members`), nosso sistema (`usePushNotifications`):
1.  Verifica se a inscrição ainda é válida.
2.  Sincroniza com o servidor (se necessário).
3.  Atualiza o estado do "sininho" e do botão de toggle.

**Resumo:** Você **não precisa** entrar no site todo dia para receber os alertas. Basta ter aceitado a permissão e manter o navegador instalado (e rodando em segundo plano no PC).
