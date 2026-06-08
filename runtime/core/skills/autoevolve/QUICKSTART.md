# YAMI Autoevolução - Guia Rápido

## 5 Passos para Evoluir o YAMI

### 1️⃣ Criar uma Evolução

```bash
cd ~/.yami/runtime/core
node skills/autoevolve/scripts/evolve.mjs --request "Sua ideia aqui"
```

**Resultado:** Gerado um ID como `evol-abc123-xyz`

### 2️⃣ Consultar o Resultado

```bash
node skills/autoevolve/scripts/query.mjs evol-abc123-xyz
```

**Arquivos gerados:**
- `spec.md` - Especificação técnica
- `tasks.json` - 6 tarefas de desenvolvimento
- `prompts/` - Prompts para Codex, Claude, OpenCode
- `docs/` - Documentação automática
- `integracao/` - Proposta de integração

### 3️⃣ Revisar Especificação

```bash
cat evolucoes/evol-abc123-xyz/spec.md
cat evolucoes/evol-abc123-xyz/tasks.json
```

### 4️⃣ Executar uma Tarefa

```bash
node skills/autoevolve/scripts/execute.mjs \
  --id evol-abc123-xyz \
  --task TASK-01 \
  --tool codex
```

**Ferramentas:** `codex` | `claude` | `opencode`

### 5️⃣ Acompanhar Progresso

```bash
# Ver todas as evoluções
node skills/autoevolve/scripts/query.mjs list

# Ver estatísticas
node skills/autoevolve/scripts/query.mjs stats

# Filtrar por status
node skills/autoevolve/scripts/query.mjs list --status gerado
```

---

## Casos Comuns

### Integração com Google Calendar
```bash
node evolve.mjs --request "Integrar Google Calendar para sincronizar eventos"
```

### Melhorar Sistema de Voz
```bash
node evolve.mjs --request "Melhorar reconhecimento de voz em Portugues"
```

### Dashboard com Dark Mode
```bash
node evolve.mjs --request "Adicionar modo escuro ao dashboard"
```

### Automação de Emails
```bash
node evolve.mjs --request "Criar automacao para responder emails"
```

### Nova Skill
```bash
node evolve.mjs --request "Criar skill para integrar com Notion"
```

---

## Monitorar Progresso

### Listar Todas as Evoluções
```bash
node query.mjs list
```

### Ver Detalhes Completos
```bash
node query.mjs <id>
```

### Ver Estatísticas
```bash
node query.mjs stats
```

### Buscar por Texto
```bash
node query.mjs list --search "Google"
```

### Filtrar por Categoria
```bash
node query.mjs list --category integration
```

---

## Se Algo Deu Errado

### Criar Backup (Snapshot)
```bash
node rollback.mjs --id evol-abc123 --snapshot
```

### Reverter para Fase Anterior
```bash
node rollback.mjs --id evol-abc123 --revert --to planning
```

---

## Estrutura de Saída

```
evolucoes/evol-abc123-xyz/
├── spec.md                 📄 Especificação técnica
├── tasks.json              📋 Tarefas de desenvolvimento
├── prompts/                🤖 Prompts para IA
│   ├── codex-TASK-01.md
│   ├── claude-combinado.md
│   └── opencode-combinado.md
├── docs/                   📚 Documentação
│   ├── README.md
│   └── CHANGELOG.md
├── integracao/             🔧 Proposta de integração
│   └── proposal.md
└── execucoes/              ✅ Resultados (após executar)
    ├── codex/TASK-01/
    └── claude/TASK-02/
```

---

## Dicas e Truques

### 🚀 Usar Diferentes Ferramentas
```bash
# Apenas Codex
node evolve.mjs --request "..." --target codex

# Codex + OpenCode
node evolve.mjs --request "..." --target codex,opencode
```

### 📁 Salvar em Local Personalizado
```bash
node evolve.mjs --request "..." --outdir ~/meu-projeto
```

### 🔄 Executar Todas as Tarefas Automaticamente
```bash
node execute.mjs --id evol-abc123 --tool codex --all-tasks
```

### 🌙 Modo Background (Não Esperar)
```bash
node execute.mjs --id evol-abc123 --task TASK-03 --background
```

### 📊 Estatísticas Detalhadas
```bash
node query.mjs stats
```

### 🔎 Procurar por Texto
```bash
node query.mjs list --search "calendario"
```

---

## Arquitetura em 3 Minutos

1. **User Request** → Descreve a funcionalidade desejada
2. **Analysis** → Sistema classifica em 9 categorias
3. **Spec Generation** → Cria especificação técnica
4. **Task Planning** → Divide em 6 fases (análise → integração)
5. **Prompt Building** → Cria prompts para Codex/Claude/OpenCode
6. **Execution** → Executa com a ferramenta escolhida
7. **Validation** → Verifica qualidade (7 critérios)
8. **Documentation** → Gera docs automáticas
9. **Integration** → Propõe como integrar ao YAMI
10. **History** → Registra tudo com rastreabilidade

---

## Próximas Ações

Após uma evolução ser gerada:

1. **Revisar** a especificação: `cat evolucoes/<id>/spec.md`
2. **Entender** as tarefas: `cat evolucoes/<id>/tasks.json`
3. **Escolher** ferramenta: Codex, Claude ou OpenCode
4. **Executar**: `node execute.mjs --id <id> --task TASK-03 --tool codex`
5. **Monitorar**: `node query.mjs <id>` para ver status
6. **Integrar**: Seguir passos em `evolucoes/<id>/integracao/proposal.md`

---

## Comandos Principais (Cheat Sheet)

```bash
# Criar
node evolve.mjs --request "..."

# Consultar
node query.mjs list
node query.mjs stats
node query.mjs <id>

# Executar
node execute.mjs --id <id> --task TASK-01 --tool codex
node execute.mjs --id <id> --all-tasks --tool codex

# Rollback
node rollback.mjs --id <id> --snapshot
node rollback.mjs --id <id> --revert --to planning
```

---

**Pronto para evoluir? Comece com:**

```bash
node evolve.mjs --request "Sua primeira ideia YAMI"
```
