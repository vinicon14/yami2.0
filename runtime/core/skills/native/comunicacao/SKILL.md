---
name: comunicacao
description: "Gerenciamento nativo de comunicação pessoal — mensagens, leitura, resposta assistida, organização de conversas e lembretes de contato."
metadata:
  {
    "openclaw":
      {
        "emoji": "💬",
        "os": ["win32", "darwin"],
        "requires": {},
        "native": true,
      },
  }
---

# Comunicação Nativa

Este módulo define as capacidades nativas de comunicação do YAMI. Ele integra todos os canais de mensagem disponíveis (WhatsApp, iMessage, Discord, Telegram, etc.) em uma camada unificada de gerenciamento pessoal.

## Quando Usar

Use quando o usuário pedir para:

- Enviar mensagens para contatos em qualquer canal disponível
- Ler mensagens recebidas ou histórico de conversas
- Organizar conversas por contato, assunto ou prioridade
- Criar lembretes relacionados a contatos específicos ("me lembre de falar com João amanhã")
- Responder mensagens com assistência de contexto
- Gerenciar comunicação pessoal de forma centralizada

## Quando NÃO Usar

- Comunicação que exija autenticação adicional não configurada
- Mensagens em massa ou spam — sempre exigir confirmação explícita
- Compartilhamento não solicitado de arquivos ou mídia
- Acessar conversas de terceiros sem permissão explícita

## Capacidades

### Envio de Mensagens

Usar os canais configurados para envio:

- **WhatsApp**: Usar o plugin WhatsApp configurado em `channels.whatsapp`. Preferir resposta textual; anexar mídia somente quando o contato pedir explicitamente.
- **iMessage/SMS** (macOS): Usar `imsg` skill quando disponível.
- **Discord**: Usar `message` tool com `channel:discord`.
- **Slack**: Usar `message` tool com `channel:slack`.

Sempre confirmar destinatário e conteúdo antes de enviar.

### Leitura de Mensagens

- Histórico recente das conversas ativas está disponível automaticamente no contexto da sessão
- Para histórico mais antigo, usar `exec` com as ferramentas CLI de cada canal (wacli, imsg, etc.)
- Organizar visualização por contato, data ou relevância

### Resposta Assistida

Ao ajudar o usuário a responder mensagens:

1. Analisar o histórico recente da conversa
2. Identificar o tom e estilo natural do usuário (ver USER.md)
3. Respeitar preferências de formatação do canal alvo
4. Nunca enviar sem confirmação explícita do usuário

### Organização de Conversas

- Manter conversas organizadas por contato no sistema de sessões do runtime
- Poder arquivar, silenciar ou priorizar conversas por comando do usuário
- Usar `cron` para lembretes periódicos de verificação de mensagens

### Lembretes de Contato

Criar lembretes vinculados a contatos específicos:

```bash
# Formato: lembrete em N minutos/horas
# Usar cron para agendar o lembrete
# Incluir nome do contato e contexto no lembrete
```

## Workflow Padrão

1. Usuário pede ação de comunicação
2. Identificar canal disponível e destinatário
3. Confirmar com o usuário antes de enviar
4. Executar a ação
5. Relatar resultado de forma concisa

## Segurança

- Sempre exigir confirmação para envio de mensagens
- Não expor mensagens de outros contatos sem contexto
- Respeitar a política de privacidade definida em `channels.*.dmPolicy`
- Não compartilhar informações entre canais sem permissão
