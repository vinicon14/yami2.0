# OS Agent YAMI — Controle Total do Sistema Operacional

Arquitetura modular que transforma comandos do usuário em ações executáveis sobre o sistema operacional e serviços conectados.

## Visão Geral

O OS Agent funciona em um ciclo contínuo:

```
Comando do Usuário
    ↓
┌─ PLANEJAR ─────────────────────────────────┐
│ • Decompor intenção em passos               │
│ • Identificar dependências e paralelismo    │
│ • Validar pré-requisitos                    │
└────────────────┬────────────────────────────┘
                 ↓
┌─ AUTORIZAR ────────────────────────────────┐
│ • Verificar permissões (4 níveis)           │
│ • Solicitar confirmação se sensível         │
│ • Registrar aprovações (sessão/permanente)  │
└────────────────┬────────────────────────────┘
                 ↓
┌─ EXECUTAR ─────────────────────────────────┐
│ • Dispatch para executor apropriado         │
│ • Monitorar tempo, recursos                 │
│ • Capturar resultado e erros                │
└────────────────┬────────────────────────────┘
                 ↓
┌─ OBSERVAR ─────────────────────────────────┐
│ • Coletar mudanças no sistema               │
│ • Detectar efeitos colaterais               │
│ • Fornecer feedback ao usuário              │
└────────────────┬────────────────────────────┘
                 ↓
┌─ RECUPERAR ────────────────────────────────┐
│ • Analisar falhas com fallback map          │
│ • Decidir: retry, alternativa ou notificar  │
│ • Manter transparência de erros             │
└────────────────┴────────────────────────────┘
```

## Arquitetura

### Core (`core/`)

**`orchestrator.py`** — Orquestrador principal
- `Orchestrator`: Coordena o pipeline completo
- `ExecutionResult`: Encapsula resultado com metadados

```python
from os_agent.core.orchestrator import Orchestrator

orch = Orchestrator(permission_manager=pm, planner=planner)
orch.register_executors({"files": file_exec, "apps": app_exec})
result = orch.execute("abrir o Chrome e listar a pasta Downloads")
print(result.summary_text(verbose=True))
```

**`planner.py`** — Planejador de ações
- `ActionPlan`: Contém todos os passos com dependências
- `ActionStep`: Representa uma ação atômica
- `Planner`: Reconhece padrões naturais → ações estruturadas

```python
from os_agent.core.planner import Planner

planner = Planner()
plan = planner.plan("criar pasta testes e copiar arquivo.txt para lá")
for step in plan.steps:
    print(f"  {step.action}: {step.description}")
```

**`permissions.py`** — Sistema de permissões
- 4 níveis: `SAFE` (automático) → `NOTIFY` → `CONFIRM` → `BLOCKED`
- 45 ações classificadas por risco
- Cache de aprovações (sessão e permanente)

```python
from os_agent.core.permissions import PermissionManager, PermissionLevel

pm = PermissionManager()
perm = pm.request("delete_file", "Remover arquivo.txt")
if not perm.approved:
    print(f"Ação bloqueada: {perm.level.value}")
```

### Executors (`executors/`)

Cada executor implementa um domínio com ações específicas:

| Executor | Ações | Descrição |
|----------|-------|-----------|
| **files** | 12 | Criar, ler, copiar, mover, renomear, deletar, organizar arquivos |
| **apps** | 4 | Abrir, fechar, listar, alternar aplicativos |
| **processes** | 4 | Listar processos, encerrar, monitorar CPU/memória/disco |
| **windows** | 4 | Listar janelas, focar, minimizar, maximizar, screenshot |
| **scripts** | 4 | Executar comandos shell, Python, PowerShell, scripts |
| **browser** | 5 | Navegar, gerenciar abas, executar JS, pesquisar web |
| **network** | 3 | Download, upload, verificar conectividade |

Todos herdam de `Executor` base que fornece:
- Validação de parâmetros
- Dispatch automático de ações
- Temporização e logging
- Recuperação de erros

```python
from os_agent.executors.files import FileExecutor

files = FileExecutor()
result = files.execute("list_directory", {"path": "C:\\Users"})
for entry in result:
    print(f"  {entry['name']} ({entry['type']})")
```

### Observer (`observer/`)

**`monitor.py`** — Monitora estado do sistema

```python
from os_agent.observer.monitor import SystemMonitor

monitor = SystemMonitor()
snapshot = monitor.snapshot()
print(f"CPU: {snapshot.cpu_percent}%")
print(f"Memória: {snapshot.memory_percent}%")

# Detectar mudanças significativas
if monitor.detect_significant_change():
    print("Sistema sofreu mudança significativa!")
```

### Recovery (`recovery/`)

**`error_handler.py`** — Estratégias de recuperação

5 estratégias aplicadas adaptivamente:
- **RETRY**: Tentar novamente (com backoff exponencial)
- **FALLBACK**: Usar ação alternativa mapeada
- **ALTERNATIVE**: Simplificar e retentar
- **NOTIFY**: Informar usuário e continuar
- **ABORT**: Parar execução

```python
from os_agent.recovery.error_handler import ErrorHandler

eh = ErrorHandler(max_retries=3)
plan = eh.handle("read_file", {"path": "/nonexistent"}, FileNotFoundError(...))
if plan.should_retry:
    print(f"Tentando novamente em {plan.delay_seconds}s...")
elif plan.fallback_action:
    print(f"Usando fallback: {plan.fallback_action}")
else:
    print(plan.message)
```

### Config (`config/`)

**`defaults.py`** — Configuração tipada

```python
from os_agent.config.defaults import OSAgentConfig

config = OSAgentConfig(
    permissions=PermissionConfig(allow_once=True, allow_always=False),
    executor=ExecutorConfig(timeout_seconds=30, max_retries=2),
    planner=PlannerConfig(max_plan_steps=20),
)

# Merge com overrides
custom = config.merge({
    "permissions": {"timeout_seconds": 120},
    "os": {"safe_mode": True}
})
```

## Uso Básico

### 1. Setup mínimo

```python
from os_agent import Orchestrator
from os_agent.core.permissions import PermissionManager
from os_agent.core.planner import Planner
from os_agent.executors import (
    FileExecutor, AppExecutor, ProcessExecutor,
    WindowExecutor, ScriptExecutor, BrowserExecutor, NetworkExecutor
)

# Criar gerenciador de permissões
pm = PermissionManager(allow_permanent=False)

# Criar planejador
planner = Planner(permission_manager=pm)

# Criar orquestrador
orch = Orchestrator(permission_manager=pm, planner=planner)

# Registrar executors
orch.register_executors({
    "files": FileExecutor(),
    "apps": AppExecutor(),
    "processes": ProcessExecutor(),
    "windows": WindowExecutor(),
    "scripts": ScriptExecutor(),
    "browser": BrowserExecutor(),
    "network": NetworkExecutor(),
})
```

### 2. Executar comando

```python
# Execução com confirmação
result = orch.execute("abrir Chrome e baixar arquivo")
print(result.summary_text(verbose=True))

# Dry-run (planejar sem executar)
result = orch.execute("criar pasta", dry_run=True)
print(result.summary_text())

# Explicar plano sem executar
explanation = orch.explain_plan("mover arquivo.txt para pasta")
print(explanation)
```

### 3. Callbacks (opcional)

```python
def on_step_start(step):
    print(f"Iniciando: {step.description}")

def on_step_complete(step, success, message):
    print(f"Concluído: {success}")

def on_error(plan, error):
    print(f"Erro no plano: {error}")

orch = Orchestrator(
    on_step_start=on_step_start,
    on_step_complete=on_step_complete,
    on_error=on_error
)
```

## Níveis de Permissão

### SAFE (automático)
Operações apenas-leitura sem risco:
- `read_file`, `list_directory`, `search_files`
- `list_processes`, `get_system_info`, `screenshot`

### NOTIFY (notificar)
Operações que modificam mas com baixo risco:
- `open_app`, `close_app`, `create_folder`
- `move_file`, `copy_file`, `run_script`
- `browser_navigate`, `download_file`

### CONFIRM (confirmar)
Operações sensíveis que requerem confirmação:
- `delete_file`, `delete_folder`, `write_file`
- `execute_command`, `install_app`, `kill_process`
- `shutdown`, `restart`

### BLOCKED (bloqueado)
Operações perigosas ou desabilitadas:
- `modify_system_files`, `disable_security`

Customize via:

```python
pm = PermissionManager()
pm.register_action("custom_action", PermissionLevel.CONFIRM)
```

## Extensibilidade

### Adicionar novo executor

```python
from os_agent.executors.base import Executor
from typing import Dict, Any

class MyExecutor(Executor):
    def __init__(self):
        super().__init__(name="myservice")
        self._actions = {
            "do_something": "Fazer algo especial",
            "query_info": "Consultar informações",
        }
    
    def action_do_something(self, params: Dict[str, Any], context: Dict) -> Any:
        result = "Executado!"
        return {"success": True, "message": result}
    
    def action_query_info(self, params: Dict[str, Any], context: Dict) -> Any:
        return {"info": "dados"}

# Registrar
executor = MyExecutor()
orch.register_executor("myservice", executor)
```

### Adicionar novo padrão de ação

```python
planner.register_action_pattern(
    action="my_action",
    tokens=["meu comando", "execute my thing"],
    executor="myservice"
)
```

### Adicionar estratégia de fallback

```python
eh.register_fallback(
    action="risky_operation",
    fallback_actions=["safe_alternative", "manual_intervention"]
)
```

## Exemplos de Uso Avançado

### Executar com contexto

```python
context = {
    "current_project": "my-project",
    "output_format": "json",
    "dry_run": False
}

result = orch.execute(
    "listar arquivos do projeto",
    context=context
)
```

### Monitorar recursos antes e depois

```python
from os_agent.observer.monitor import SystemMonitor

monitor = SystemMonitor()
before = monitor.snapshot()

result = orch.execute("executar compilação")

after = monitor.snapshot()
changes = monitor.diff(before, after)
print(f"Mudanças: {changes}")
```

### Histórico de erros e recuperação

```python
from os_agent.recovery.error_handler import ErrorHandler

eh = ErrorHandler()
# ... operações ...
history = eh.get_history(limit=10)
for error_record in history:
    print(f"{error_record.action}: {error_record.error}")
```

## Testando a Arquitetura

```bash
cd ~/.yami
python -m runtime.os_agent.__main__
```

Saída esperada:
```
============================================================
  YAMI - OS Agent Architecture Verification
============================================================

[1/7] PermissionManager...
  [OK] PermissionManager

[2/7] Planner...
  [OK] Planner

[3/7] Executors...
  [OK] All executors loaded

...

============================================================
  [OK] YAMI OS Agent architecture verified successfully!
============================================================
```

## Integração com YAMI Existente

O módulo é registrado em `runtime/yami-manifest.json` como **Controle Yami** com:
- ID: `os-agent`
- Status: `active`
- 33 capacidades diferentes
- 7 executors mapeados

Para integrar com a lógica do agente YAMI:

```python
# Em um handler YAMI existente
from runtime.os_agent import Orchestrator
from runtime.os_agent.core.permissions import PermissionManager

pm = PermissionManager(
    approval_callback=yami_approval_handler,  # Aproveita sistema YAMI
    session_id=session_id
)

orch = Orchestrator(permission_manager=pm)
# ... rest of setup
```

## Princípios de Design

### 1. Separação de Responsabilidades
- **Planner**: apenas análise e decomposição
- **PermissionManager**: apenas verificação de acesso
- **Executors**: apenas execução de ações
- **ErrorHandler**: apenas estratégias de recuperação
- **Orchestrator**: apenas orquestração do pipeline

### 2. Fail-Safe
- Erros em um step não interrompem o plano se `required=False`
- Fallbacks automáticos para operações com alternativas
- Notificação sempre ao usuário

### 3. Transparência Operacional
- Cada passo é descrito em linguagem natural
- Tempos de execução registrados
- Erros incluem contexto completo
- Histórico disponível para auditoria

### 4. Extensibilidade sem Modificação do Core
- Novos executors registrados dinamicamente
- Novos padrões adicionados ao planner
- Novas estratégias de recuperação sem alterar orchestrator
- Configuração via merge, não codificada

## Performance

Simulação de plano com 10 passos:
- Planning: ~5ms
- Authorization: ~10ms
- Execution: ~50-500ms (depende das ações)
- Total: <1s para operações simples

Com observação:
- System monitor snapshot: ~50ms
- Diff entre snapshots: <1ms

## Segurança

- ✅ Permissões granulares (4 níveis)
- ✅ Aprovações por sessão/permanente
- ✅ Caminhos restritos para file operations
- ✅ Timeout para todas as operações
- ✅ Isolamento de contexto entre execuções
- ✅ Logging completo de ações sensíveis

## Limitações Conhecidas

1. **Planner**: Padrão matching é heurístico, não IA
   - Melhoria: Integrar com LLM para resolução de ambiguidade
2. **Observer**: Monitora apenas sistema local
   - Melhoria: Integrar com APIs de monitoramento remoto
3. **Network**: Sem autenticação em downloads
   - Melhoria: Suportar auth headers, cookies, certificates
4. **Windows**: CDP debugging requer Chrome com --remote-debugging-port

## Roadmap

- [ ] Integrar com LLM para padrão matching em linguagem natural
- [ ] Suporte a automações agendadas (cron integration)
- [ ] Observação remota via SSH/WinRM
- [ ] Integração com Google Photos, Drive, Gmail
- [ ] Histórico persistente com busca
- [ ] UI dashboard para visualizar execuções
- [ ] Modo replay para reruns
- [ ] Profiling detalhado e otimizações

## Contribuindo

Para adicionar um novo executor:

1. Crie `executors/myfeature.py`
2. Herde de `Executor`
3. Implemente `action_*` methods
4. Registre no orchestrator
5. Adicione testes

```python
class MyFeatureExecutor(Executor):
    def __init__(self):
        super().__init__(name="myfeature")
        self._actions = {...}
    
    def action_operation(self, params, context):
        return result
```

---

**YAMI OS Agent** © 2026. MIT License.
