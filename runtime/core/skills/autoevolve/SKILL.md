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

## Uso Rápido

```bash
# Criar uma evolução
node scripts/evolve.mjs --request "Criar integracao com Google Calendar"

# Consultar evolucoes
node scripts/query.mjs list
node scripts/query.mjs stats
node scripts/query.mjs evol-abc123-xyz

# Executar com Codex
node scripts/execute.mjs --id evol-abc123 --task TASK-01 --tool codex

# Rollback/Snapshot
node scripts/rollback.mjs --id evol-abc123 --snapshot
```

## Estrutura de Saída

```
evolucoes/
├── HISTORY.md                    # Histórico central
├── .registry.json                # Banco de dados estruturado
└── evol-<id>/
    ├── spec.md                   # Especificação técnica (10 seções)
    ├── tasks.json                # 6 tarefas de desenvolvimento
    ├── prompts/                  # Prompts prontos para execução
    │   ├── codex-TASK-01.md
    │   ├── codex-combinado.md
    │   ├── claude-combinado.md
    │   └── opencode-combinado.md
    ├── docs/                     # Documentação automática
    │   ├── README.md
    │   └── CHANGELOG.md
    ├── integracao/               # Proposta de integração
    │   ├── proposal.md
    │   └── proposal.json
    └── execucoes/                # Resultados de execução
        ├── codex/TASK-01/
        ├── claude/TASK-02/
        └── opencode/TASK-03/
```

## Scripts Disponíveis

- `evolve.mjs` - Criar nova evolução
- `query.mjs` - Consultar, listar, buscar evoluções
- `execute.mjs` - Executar tarefas com Codex/Claude/OpenCode
- `rollback.mjs` - Gerenciar snapshots e reverter fases

## Opções Principais

### evolve.mjs
- `--request <texto>` - Descrição da funcionalidade
- `--request-file <path>` - Arquivo com descrição
- `--outdir <path>` - Diretório de saída
- `--target <lista>` - Ferramentas alvo (codex,claude,opencode)

### query.mjs
- `list` - Listar evoluções
- `stats` - Estatísticas
- `<id>` - Detalhes de evolução
- `--status <valor>` - Filtrar por status
- `--category <valor>` - Filtrar por categoria
- `--search <texto>` - Buscar

### execute.mjs
- `--id <id>` - ID da evolução
- `--task <TASK-01>` - Tarefa específica
- `--tool <codex|claude|opencode>` - Ferramenta
- `--all-tasks` - Executar todas as 6 tarefas
- `--background` - Executar sem esperar

### rollback.mjs
- `--snapshot` - Criar backup do estado atual
- `--revert --to <fase>` - Voltar para fase anterior
