---
name: autoevolve
description: "Transforma ideias do usuario em especificacoes tecnicas, tarefas, prompts Codex e documentacao automatica para evolucao continua do YAMI."
metadata:
  openclaw:
    emoji: "\u{1F9E0}"
    requires:
      config: ["skills.entries.autoevolve.enabled"]
---

# Autoevolucao YAMI

Orquestra o ciclo completo de evolucao assistida: ideia -> especificacao -> tarefas -> prompts -> validacao -> integracao.

## Fluxo

1. **Analise** - Recebe e classifica a solicitacao do usuario
2. **Especificacao** - Gera documento tecnico estruturado
3. **Planejamento** - Decompoe em tarefas atomicas
4. **Prompts** - Produz prompts prontos para Codex/Claude/OpenCode
5. **Execucao** - Encaminha para o sistema de codigo designado
6. **Validacao** - Verifica resultados contra a especificacao
7. **Documentacao** - Gera docs automaticos + changelog
8. **Integracao** - Propoe integracao ao projeto YAMI

## Uso

```bash
node skills/autoevolve/scripts/evolve.mjs --request "Criar integracao com Google Calendar"
node skills/autoevolve/scripts/evolve.mjs --request "Adicionar comando de voz para abrir aplicativos" --outdir ./evolucoes
node skills/autoevolve/scripts/evolve.mjs --request-file ./solicitacao.txt --target codex
```

## Estrutura de saida

```
evolucoes/<id>/
  spec.md              - Especificacao tecnica
  tasks.json           - Tarefas de desenvolvimento
  prompts/             - Prompts prontos para cada ferramenta
    codex.md
    claude.md
    opencode.md
  docs/                - Documentacao gerada
  HISTORY.md           - Historico da evolucao
```

## Diretorios

- `evolucoes/` - saida gerada (criado sob demanda)
- `scripts/evolve.mjs` - orquestrador principal
- `scripts/lib/` - modulos internos
