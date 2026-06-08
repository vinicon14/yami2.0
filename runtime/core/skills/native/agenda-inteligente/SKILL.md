---
name: agenda-inteligente
description: "Agenda inteligente nativa — compromissos, lembretes, rotinas, sugestão de horários e sincronização de calendários autorizados."
metadata:
  {
    "openclaw":
      {
        "emoji": "📅",
        "os": ["win32", "darwin"],
        "requires": {},
        "native": true,
      },
  }
---

# Agenda Inteligente Nativa

Este módulo define as capacidades nativas de agenda do YAMI. Ele gerencia compromissos, rotinas e sincronização de calendários como parte do núcleo da plataforma.

## Quando Usar

Use quando o usuário pedir para:

- Criar, editar ou remover compromissos na agenda
- Definir lembretes para eventos futuros
- Organizar rotinas diárias, semanais ou mensais
- Sincronizar com Google Calendar, Outlook Calendar ou Apple Calendar
- Sugerir horários livres com base na agenda atual
- Verificar disponibilidade antes de agendar algo

## Capacidades

### Criar Compromissos

Quando o usuário pedir para criar um compromisso:

1. Extrair: título, data, horário, duração, descrição, participantes
2. Se dados estiverem incompletos, perguntar ao usuário
3. Armazenar localmente em formato estruturado

Local de armazenamento padrão:
```
~/.yami/agenda/compromissos.json
```

Formato de cada compromisso:
```json
{
  "id": "uuid",
  "titulo": "string",
  "data": "YYYY-MM-DD",
  "horaInicio": "HH:MM",
  "horaFim": "HH:MM",
  "duracaoMinutos": 60,
  "descricao": "string (opcional)",
  "local": "string (opcional)",
  "participantes": ["email ou nome"],
  "lembreteMinutosAntes": 30,
  "recorrencia": "none|diaria|semanal|mensal",
  "calendarioOrigem": "local|google|apple|outlook",
  "criadoEm": "ISO timestamp",
  "atualizadoEm": "ISO timestamp"
}
```

### Editar Compromissos

- Buscar compromisso por ID, título ou data
- Alterar campos específicos
- Confirmar alterações com o usuário
- Salvar atualização no arquivo

### Remover Compromissos

- Confirmar exclusão com o usuário
- Remover do arquivo de compromissos
- Remover lembretes associados (cron jobs)

### Definir Lembretes

Usar `cron` do runtime para agendar lembretes:

```bash
# Exemplo: cada compromisso com lembrete ativo ganha um cron job
# O cron job envia mensagem ao usuário no horário configurado
```

### Organizar Rotinas

- Rotinas diárias recorrentes (acordar, trabalhar, exercício, etc.)
- Rotinas semanais (reuniões, aulas, compromissos fixos)
- Gerenciar via arquivo de rotinas: `~/.yami/agenda/rotinas.json`

### Sincronizar Calendários

Quando o usuário autorizar:

- **Google Calendar**: Usar API Google Calendar via plugin/integração
- **Apple Calendar** (macOS): Usar `icalbuddy` ou scripts osascript
- **Outlook Calendar**: Usar API Microsoft Graph via plugin

Regras de sincronização:
- Sincronização bidirecional apenas com permissão explícita
- Conflitos resolvem a favor do calendário remoto
- Manter log de sincronização em `~/.yami/agenda/sync-log.json`

### Sugerir Horários Livres

Para sugerir horários disponíveis:

1. Ler compromissos existentes no período solicitado
2. Considerar rotinas fixas do usuário (horário de trabalho, almoço, etc.)
3. Identificar janelas disponíveis
4. Sugerir opções ordenadas por proximidade

## Workflow Padrão

1. Usuário pede ação de agenda
2. Extrair dados estruturados da solicitação
3. Se ambiguidade, perguntar antes de agir
4. Executar ação (criar/editar/remover/consultar)
5. Confirmar resultado e oferecer próximos passos

## Armazenamento

Toda a agenda local fica em `~/.yami/agenda/`:
- `compromissos.json` — compromissos ativos
- `rotinas.json` — rotinas recorrentes
- `sync-log.json` — log de sincronização
- `lembretes.json` — mapeamento de lembretes ativos

## Privacidade

- Dados de agenda permanecem locais por padrão
- Sincronização com serviços externos só ocorre com autorização explícita
- Informações de compromissos não são compartilhadas entre canais
