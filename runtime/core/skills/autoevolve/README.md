# YAMI Autoevolução - Sistema de Evolução Contínua Assistida por IA

## Visão Geral

O sistema de **Autoevolução YAMI** transforma ideias do usuário em funcionalidades implementadas através de um pipeline completo de desenvolvimento assistido por IA (Codex, Claude Code, OpenCode).

### Ciclo de Vida Completo

```
Requisição do Usuário
    ↓
[1] Análise e Classificação
    ↓
[2] Geração de Especificação Técnica
    ↓
[3] Planejamento de Tarefas (6 fases)
    ↓
[4] Geração de Prompts Estruturados
    ↓
[5] Execução (Codex/Claude/OpenCode)
    ↓
[6] Validação de Resultados
    ↓
[7] Geração Automática de Documentação
    ↓
[8] Proposta de Integração ao YAMI
    ↓
Registrado no Histórico com Rastreabilidade Completa
```

---

## 1. Criando uma Evolução

### Comando Básico

```bash
cd ~/.yami/runtime/core
node skills/autoevolve/scripts/evolve.mjs --request "Sua ideia aqui"
```

### Exemplos

#### Integração com Serviço Externo
```bash
node skills/autoevolve/scripts/evolve.mjs --request "Criar integracao com Google Calendar para sincronizar eventos"
```

#### Melhorias de Interface
```bash
node skills/autoevolve/scripts/evolve.mjs --request "Melhorar interface de dashboard com modo escuro"
```

#### Sistema de Voz
```bash
node skills/autoevolve/scripts/evolve.mjs --request "Adicionar reconhecimento de voz em Portugues Brasileiro"
```

#### Automações
```bash
node skills/autoevolve/scripts/evolve.mjs --request "Criar automacao para responder emails automaticamente"
```

### Opções Disponíveis

| Opção | Descrição | Exemplo |
|-------|-----------|---------|
| `--request <texto>` | Descrição da funcionalidade desejada | `--request "Criar nova integracao"` |
| `--request-file <path>` | Arquivo com a descrição | `--request-file ./solicitacao.txt` |
| `--outdir <path>` | Diretório de saída personalizado | `--outdir ./minha-evolucao` |
| `--target <lista>` | Ferramentas alvo (padrão: todas) | `--target codex,opencode` |
| `--no-combined` | Não gerar prompts combinados | - |

---

## 2. Entendendo o Resultado

Cada evolução gera uma estrutura organizada:

```
evolucoes/evol-<id>/
├── spec.md                      # Especificação técnica completa
├── tasks.json                   # 6 tarefas de desenvolvimento
├── prompts/                     # Prompts prontos para execução
│   ├── codex-TASK-01.md
│   ├── codex-TASK-02.md
│   ├── codex-combinado.md       # Todos os prompts Codex
│   ├── claude-combinado.md
│   └── opencode-combinado.md
├── docs/                        # Documentação automática
│   ├── README.md                # Documentação do módulo
│   └── CHANGELOG.md             # Histórico de mudanças
├── integracao/                  # Proposta de integração
│   ├── proposal.md              # 6 passos para integrar
│   └── proposal.json            # Dados estruturados
└── execucoes/                   # Resultados de execução (após executar)
    ├── codex/TASK-01/
    ├── claude/TASK-02/
    └── opencode/TASK-03/
```

### O que é a Especificação (spec.md)?

Documento técnico estruturado contendo:

1. **Resumo Executivo** - Descrição de 1-2 parágrafos
2. **Motivação** - Por que essa funcionalidade é necessária
3. **Requisitos Funcionais** - O que o sistema deve fazer
4. **Requisitos Não-Funcionais** - Performance, modularidade, etc
5. **Arquitetura Proposta** - Como será implementado
6. **Componentes e Módulos** - Divisão técnica
7. **Dependências** - O que é necessário
8. **Interface com YAMI** - Como se integra ao YAMI
9. **Riscos e Mitigações** - Problemas potenciais
10. **Critérios de Aceite** - Como validar se está pronto

### O que são as Tarefas (tasks.json)?

6 tarefas estruturadas em fases do ciclo de desenvolvimento:

| ID | Fase | Descrição | Estimativa |
|----|----|-----------|------------|
| TASK-01 | Análise | Entender requisitos, mapear componentes | 2h |
| TASK-02 | Planejamento | Definir arquitetura, dividir em módulos | 1h |
| TASK-03 | Implementação | Codificar a funcionalidade | 8h |
| TASK-04 | Testes | Criar testes unitários e de integração | 3h |
| TASK-05 | Validação | Verificar contra critérios de aceite | 2h |
| TASK-06 | Integração | Registrar skill/plugin e documentação | 2h |

### O que são os Prompts?

Descrições estruturadas para ferramentas de IA gerar código:

- **Contexto** - Informação sobre o projeto YAMI
- **Objetivo** - O que deve ser implementado
- **Especificação** - Requisitos técnicos
- **Arquivos** - Quais arquivos serão afetados
- **Restrições** - Limitações e convenções
- **Validação** - Como saber se está correto

Cada ferramenta tem seu próprio prompt (Codex, Claude, OpenCode).

---

## 3. Consultando Evoluções

### Listar Todas
```bash
node skills/autoevolve/scripts/query.mjs list
```

### Filtrar por Status
```bash
node skills/autoevolve/scripts/query.mjs list --status gerado
node skills/autoevolve/scripts/query.mjs list --status implementado
```

### Filtrar por Categoria
```bash
node skills/autoevolve/scripts/query.mjs list --category integration
node skills/autoevolve/scripts/query.mjs list --category voice
```

### Buscar Texto
```bash
node skills/autoevolve/scripts/query.mjs list --search "Google"
node skills/autoevolve/scripts/query.mjs list --search "Dashboard"
```

### Ver Detalhes
```bash
node skills/autoevolve/scripts/query.mjs evol-abc123-xyz
```

### Estatísticas
```bash
node skills/autoevolve/scripts/query.mjs stats
```

**Output:**
```
Total de evoluções:        15
Score médio validacao:     97%
Por Status: gerado(8), implementado(5), validado(2)
Por Categoria: integration(6), feature(4), voice(3), ui(2)
```

---

## 4. Executando uma Evolução

### Executar uma Tarefa com Codex
```bash
node skills/autoevolve/scripts/execute.mjs \
  --id evol-abc123-xyz \
  --task TASK-03 \
  --tool codex
```

### Executar em Background
```bash
node skills/autoevolve/scripts/execute.mjs \
  --id evol-abc123-xyz \
  --task TASK-03 \
  --tool codex \
  --background
```

### Executar Todas as Tarefas (Sequencial)
```bash
node skills/autoevolve/scripts/execute.mjs \
  --id evol-abc123-xyz \
  --tool opencode \
  --all-tasks
```

### Ferramentas Disponíveis
- **codex** - OpenAI Codex (requer `codex` CLI)
- **claude** - Anthropic Claude Code (requer `claude` CLI)
- **opencode** - OpenCode Agent (requer `opencode` CLI)

---

## 5. Gerenciando Snapshots e Rollback

### Criar Snapshot (Backup)
```bash
node skills/autoevolve/scripts/rollback.mjs \
  --id evol-abc123-xyz \
  --snapshot
```

Cria backup automático antes de qualquer mudança importante.

### Reverter para Fase Anterior
```bash
node skills/autoevolve/scripts/rollback.mjs \
  --id evol-abc123-xyz \
  --revert \
  --to planning
```

Volta a evolução para uma fase anterior, preservando um backup.

---

## 6. Configuração

### Arquivo de Configuração

Localizar em: `~/.yami/autoevolve.json`

```json
{
  "version": "1.0",
  "autoevolve": {
    "defaultTarget": "codex",
    "validateBeforeExecute": true,
    "autoGenerateDocs": true,
    "keepSnapshots": 10
  },
  "codex": {
    "enabled": true,
    "model": "gpt-4",
    "temperature": 0.7
  },
  "notifications": {
    "enabled": true,
    "onComplete": true
  }
}
```

### Modificar Configuração

```bash
# Via opção de linha de comando (futuro)
node skills/autoevolve/scripts/evolve.mjs --config-set "codex.temperature=0.5"
```

---

## 7. Histórico e Rastreabilidade

### Registro Central

Arquivo: `evolucoes/HISTORY.md`

Mantém registro de TODAS as evoluções com:
- Data e hora
- Categoria
- Status
- Arquivos gerados
- Metadados

### Registry (Banco de Dados)

Arquivo: `evolucoes/.registry.json`

Banco de dados estruturado com:
```json
{
  "version": "1.0",
  "evolutions": [
    {
      "id": "evol-abc123",
      "request": "Criar integracao com Google Calendar",
      "category": "integration",
      "status": "gerado",
      "createdAt": "2026-06-08T16:13:00Z",
      "updatedAt": "2026-06-08T16:13:00Z",
      "phase": "spec",
      "taskCount": 6,
      "validationScore": 100,
      "tags": ["integration", "autogerado"]
    }
  ]
}
```

Permite consultas avançadas, filtros e análises.

---

## 8. Categorias de Evolução

O sistema classifica automaticamente sua solicitação:

| Categoria | Exemplos | Prioridade |
|-----------|----------|-----------|
| **integration** | Google Calendar, Spotify, APIs | 1 |
| **feature** | Novo recurso, funcionalidade | 2 |
| **automation** | Rotinas automáticas, triggers | 3 |
| **agent** | Novo agente interno, skill | 4 |
| **ui** | Interface, dashboard, visual | 5 |
| **productivity** | Atalhos, otimizações | 6 |
| **voice** | Sistema de voz, TTS, STT | 7 |
| **sync** | Sincronização entre dispositivos | 8 |

---

## 9. Validação de Qualidade

Cada evolução é validada contra 7 critérios:

- ✅ Especificação existe e não está vazia
- ✅ Tarefas definidas em JSON válido
- ✅ Prompts gerados para todas as ferramentas
- ✅ Documentação criada
- ✅ Proposta de integração presente
- ✅ Histórico registrado
- ✅ Registry atualizado

**Score:** Percentual de critérios atendidos (mínimo 80% = aprovado)

---

## 10. Fluxo Completo (Passo a Passo)

### Exemplo: Integração com Google Calendar

```bash
# 1. Criar evolução
node evolve.mjs --request "Integrar Google Calendar para sincronizar eventos"

# Output: evol-mq5jm8ii-mw59

# 2. Consultar detalhes
node query.mjs evol-mq5jm8ii-mw59

# 3. Revisar especificação
cat evolucoes/evol-mq5jm8ii-mw59/spec.md

# 4. Revisar tarefas
cat evolucoes/evol-mq5jm8ii-mw59/tasks.json

# 5. Executar Tarefa 1 (Análise) com Codex
node execute.mjs --id evol-mq5jm8ii-mw59 --task TASK-01 --tool codex

# 6. Ver resultado
cat evolucoes/evol-mq5jm8ii-mw59/execucoes/codex/TASK-01/stdout.txt

# 7. Se necessário, reverter
node rollback.mjs --id evol-mq5jm8ii-mw59 --revert --to spec

# 8. Executar próximas tarefas
node execute.mjs --id evol-mq5jm8ii-mw59 --task TASK-02 --tool codex
node execute.mjs --id evol-mq5jm8ii-mw59 --task TASK-03 --tool codex
# ... etc
```

---

## 11. Casos de Uso Avançados

### Usar Múltiplas Ferramentas

Gerar prompts para várias ferramentas:
```bash
node evolve.mjs --request "..." --target codex,claude,opencode
```

### Salvar em Local Personalizado
```bash
node evolve.mjs --request "..." --outdir ~/meus-projetos/nova-feature
```

### Executar Apenas Prompts (Sem Execução)

Gerar prompts sem executar (depois executar manualmente):
```bash
node evolve.mjs --request "..." 
# Revisar em evolucoes/<id>/prompts/
# Depois: node execute.mjs --id <id> --task TASK-03
```

### Integração em Scripts

```bash
#!/bin/bash
# Script que cria evolução automaticamente

EVOLUTION_ID=$(node scripts/evolve.mjs --request "$1" | grep "ID:" | cut -d' ' -f2)
echo "Evolução criada: $EVOLUTION_ID"

# Executar automaticamente
node scripts/execute.mjs --id "$EVOLUTION_ID" --tool codex --all-tasks
```

---

## 12. Troubleshooting

### Ferramenta não disponível
```
Erro: Ferramenta nao disponivel: codex
```
**Solução:** Instale a ferramenta:
```bash
npm install -g @openai/codex
```

### Prompt não encontrado
```
Erro: Prompt nao encontrado: /path/to/prompts/codex-TASK-01.md
```
**Solução:** Assegure que a evolução foi gerada corretamente:
```bash
node query.mjs <id>  # Verificar se existe
```

### Snapshot não encontrado
```
Erro: Snapshot nao encontrado: <snapshot-id>
```
**Solução:** Criar novo snapshot antes de reverter:
```bash
node rollback.mjs --id <id> --snapshot
```

---

## 13. Arquitetura Interna

### Módulos Principais

```
scripts/
├── evolve.mjs              # Orquestrador principal
├── query.mjs               # Consultas e listagem
├── execute.mjs             # Execução de tarefas
├── rollback.mjs            # Gestão de snapshots
└── lib/
    ├── spec-generator.mjs        # Gera especificações
    ├── task-planner.mjs          # Cria tarefas
    ├── prompt-builder.mjs        # Monta prompts
    ├── validator.mjs             # Valida resultados
    ├── history.mjs               # Histórico em Markdown
    ├── documenter.mjs            # Gera documentação
    ├── integration-proposer.mjs   # Propõe integração
    ├── registry.mjs              # Banco de dados JSON
    ├── executor.mjs              # Executa prompts
    ├── rollback.mjs              # Snapshots
    ├── config.mjs                # Configurações
    └── templates/                # Templates Markdown
```

### Fluxo de Dados

```
User Request
  ↓
spec-generator (classifica + cria spec)
  ↓
task-planner (divide em 6 tarefas)
  ↓
prompt-builder (cria prompts para cada ferramenta)
  ↓
registry (registra no banco de dados)
  ↓
history (adiciona ao histórico)
  ↓
documenter (gera docs automáticas)
  ↓
integration-proposer (cria proposta de integração)
  ↓
validator (valida todos os critérios)
  ↓
[Ready for execution]
```

---

## 14. Próximos Passos (Roadmap)

- [ ] Interface web para gerenciar evoluções
- [ ] Integração direta com Codex API
- [ ] Sistema de recomendações (sugerir melhorias)
- [ ] Métricas de sucesso/falha por categoria
- [ ] Retry automático com backoff exponencial
- [ ] Suporte a multi-evolução paralela
- [ ] Integração com CI/CD para testes automáticos
- [ ] Análise de conflitos (detectar overlaps)
- [ ] Learning system (melhorar prompts baseado em histórico)

---

## 15. Contribuindo

Para adicionar novas categorias, fases ou funcionalidades:

1. Editar `spec-generator.mjs` para novas categorias
2. Adicionar templates em `templates/`
3. Atualizar `task-planner.mjs` para novas fases
4. Testar com: `node evolve.mjs --request "seu teste"`

---

## 16. Support

### Contato
- Abrir issue no repositório YAMI
- Consultar documentação: `runtime/core/docs/`

### Exemplos Completos
Veja pasta: `evolucoes/` para histórico de evoluções anteriores

---

**YAMI Autoevolução v0.2.0** - Evoluir continuamente com IA
