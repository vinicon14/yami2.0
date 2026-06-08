# Integrações - Autoevolução YAMI

## Integração com Skill coding-agent

O sistema de autoevolução trabalha em conjunto com a skill `coding-agent` para executar tarefas de desenvolvimento.

### Fluxo de Integração

```
autoevolve/evolve.mjs
    ↓
Gera prompts estruturados
    ↓
execute.mjs
    ↓
Dispatch para coding-agent
    ↓
coding-agent lança Codex/Claude/OpenCode
    ↓
Resultado retorna a evolução
```

### Usar coding-agent Diretamente

Se você quer usar a skill `coding-agent` existente do YAMI:

```bash
# 1. Gerar evolução (obtém prompts)
node skills/autoevolve/scripts/evolve.mjs --request "..."

# 2. Usar o prompt com coding-agent
openclaw skill invoke coding-agent \
  --prompt-file evolucoes/<id>/prompts/codex-TASK-03.md \
  --workdir ~/Projects/novo-modulo \
  --tool codex \
  --background true
```

### Registro de Resultado

O resultado será automaticamente:

1. Registrado no histórico de evolução
2. Atualizado no registry
3. Documentado em `execucoes/<tool>/TASK-XX/`

---

## Integração com Histórico YAMI

### Sincronizar Histórico de Evolução

Evoluções são automaticamente registradas em dois lugares:

1. **Markdown History** - `evolucoes/HISTORY.md`
2. **JSON Registry** - `evolucoes/.registry.json`

### Consultar Histórico via SQL (Futuro)

```sql
SELECT * FROM evolutions 
WHERE category='integration' 
AND created_date > '2026-06-01'
ORDER BY validation_score DESC
```

---

## Integração com Dashboard YAMI

Proposta de Widget para Dashboard Yami:

```javascript
// Componente React para Dashboard
<EvolutionWidget
  recentCount={5}
  showStats={true}
  onLaunchEvolution={handleLaunch}
/>
```

Exibiria:
- Últimas 5 evoluções
- Estatísticas (total, por categoria, sucesso rate)
- Botão para criar nova evolução
- Links para gerenciar evoluções

---

## Integração com Gateway YAMI

### Endpoint: Consultar Evoluções

```bash
GET /api/evolution/list
GET /api/evolution/<id>
GET /api/evolution/stats
```

### Endpoint: Criar Evolução

```bash
POST /api/evolution
{
  "request": "Descrição da funcionalidade",
  "target": ["codex", "opencode"]
}
```

### Endpoint: Executar Tarefa

```bash
POST /api/evolution/<id>/execute
{
  "task": "TASK-03",
  "tool": "codex",
  "background": false
}
```

---

## Integração com Sistema de Voz (Voz YAMI)

### Comandos de Voz Planejados

```bash
# "Acorda, cria uma evolução para integrar com Google Calendar"
voice-command: "cria evolucao para [descrição]"

# "Acorda, mostra o status de evoluções"
voice-command: "mostra status evolucoes"

# "Acorda, execute a tarefa 3 com Codex"
voice-command: "execute tarefa [numero] com [ferramenta]"
```

Implementação futura em `Voz YAMI` (voice.mjs integration).

---

## Integração com Sistema de Plugins

### Plugin API para Autoevolução

```typescript
// Novo plugin: evolution-hooks.ts
interface EvolutionPlugin {
  onEvolutionCreated(evolution: Evolution): Promise<void>;
  onTaskExecuted(task: Task, result: ExecutionResult): Promise<void>;
  onEvolutionCompleted(evolution: Evolution): Promise<void>;
}
```

Permite plugins customizados reagirem a eventos de evolução.

---

## Integração com Sistema de Notificações

### Notificar quando Evolução Completa

```bash
# Notificar via WhatsApp
openclaw message send \
  --channel whatsapp \
  --target "+55 35 99620901" \
  --message "Evolução evol-abc123 completada com sucesso!"

# Notificar via Discord
openclaw message send \
  --channel discord \
  --target "#dev-channel" \
  --message "Nova evolução: Google Calendar Integration"
```

---

## Integração com CI/CD

### GitHub Actions Workflow

```yaml
name: YAMI Evolution Test

on:
  workflow_dispatch:
    inputs:
      request:
        description: 'Evolution request'
        required: true

jobs:
  evolve:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Create Evolution
        run: |
          node skills/autoevolve/scripts/evolve.mjs \
            --request "${{ github.event.inputs.request }}"
      
      - name: Execute with Codex
        run: |
          # Obter ID da evolução
          # Executar tarefas
          # Validar resultados
      
      - name: Create Pull Request
        run: |
          # Criar PR com código gerado
```

---

## Integração com Repositório Git

### Auto-commit de Evoluções

```bash
# Script para auto-commit
git add -A
git commit -m "feat: evolucao evol-abc123 - Google Calendar integration"
git push origin feature/evolucao-abc123
```

### Branch por Evolução

```bash
git checkout -b evolution/evol-abc123-google-calendar
# Trabalhar na evolução
git push origin evolution/evol-abc123-google-calendar
# Abrir PR
```

---

## Integração com Sistema de Testes

### Executar Testes Automáticos

```bash
# Após implementação com Codex
node skills/autoevolve/scripts/test.mjs --id evol-abc123

# Resultado:
# ✅ 45 testes passaram
# ❌ 2 testes falharam
# ⏭️  3 testes pulados
```

### Coverage Report

```
Google Calendar Integration Coverage: 87%
├── integration.test.mjs: 92%
├── sync.test.mjs: 85%
└── auth.test.mjs: 78%
```

---

## Integração com Documentação

### Gerar Documentação em Múltiplos Formatos

```bash
# Markdown (padrão)
node doc-generator.mjs --id evol-abc123 --format md

# HTML
node doc-generator.mjs --id evol-abc123 --format html

# PDF
node doc-generator.mjs --id evol-abc123 --format pdf

# Docusaurus
node doc-generator.mjs --id evol-abc123 --format docusaurus
```

### Publicar em Docs YAMI

```bash
# Copiar documentação para docs/
cp evolucoes/evol-abc123/docs/* docs/integraciones/google-calendar/

# Rebuild docs
npm run docs:build
```

---

## Integração com Model Lifecycle

### Versioning de Evoluções

```json
{
  "id": "evol-abc123",
  "request": "Integrar Google Calendar",
  "versions": [
    {
      "version": "0.1.0",
      "status": "draft",
      "date": "2026-06-08",
      "tasks": ["TASK-01", "TASK-02"]
    },
    {
      "version": "0.2.0",
      "status": "implemented",
      "date": "2026-06-10",
      "tasks": ["TASK-01", "TASK-02", "TASK-03"]
    }
  ]
}
```

---

## Integração com Memory YAMI

### Armazenar Contexto em Memory

Quando uma evolução é completada, seus insights podem ser armazenados:

```
memory:
├── evolution/evol-abc123
│   ├── request: "Integrar Google Calendar"
│   ├── lessons_learned: ["OAuth flow", "Rate limiting", "Error handling"]
│   ├── code_patterns: ["Promise-based", "Error retry"]
│   └── references: ["Google Calendar API v3", "oauth2"]
```

Permite que futuras evoluções reutilizem conhecimento.

---

## Integração com Analytics

### Rastrear Métricas

```
Evolution Metrics:
├── Total: 15
├── Success Rate: 93%
├── Avg Time to Complete: 4.2 hours
├── Most Common Category: integration (40%)
└── Success by Tool:
    ├── Codex: 95%
    ├── Claude: 92%
    └── OpenCode: 88%
```

---

## Roadmap de Integrações

- [ ] Dashboard Widget
- [ ] Gateway REST API
- [ ] Voice Commands
- [ ] Plugin System
- [ ] Notification Hooks
- [ ] GitHub Actions
- [ ] GitLab CI/CD
- [ ] Auto-commit to Git
- [ ] Test Runner Integration
- [ ] Multi-format Documentation
- [ ] Memory Storage
- [ ] Analytics Dashboard
- [ ] Slack Integration
- [ ] Discord Bot
- [ ] Webhook Support

---

## Exemplo Completo: Integração com GitHub

```bash
#!/bin/bash
# Script: evolucao-to-pr.sh

# 1. Criar evolução
RESULT=$(node scripts/evolve.mjs --request "$1")
EVOLUTION_ID=$(echo $RESULT | grep "ID:" | cut -d' ' -f2)

# 2. Executar com Codex
node scripts/execute.mjs \
  --id $EVOLUTION_ID \
  --tool codex \
  --all-tasks

# 3. Criar branch
BRANCH_NAME="evolution/$EVOLUTION_ID"
git checkout -b $BRANCH_NAME

# 4. Adicionar código gerado
cp -r evolucoes/$EVOLUTION_ID/src/* .

# 5. Commit
git add -A
git commit -m "feat($EVOLUTION_ID): Autoevolução - $(cat evolucoes/$EVOLUTION_ID/request.txt)"

# 6. Push
git push origin $BRANCH_NAME

# 7. Criar PR
gh pr create \
  --title "Evolution: $EVOLUTION_ID" \
  --body "$(cat evolucoes/$EVOLUTION_ID/spec.md)" \
  --assignee @me
```

---

**Documentação de Integrações YAMI Autoevolução v0.2.0**
