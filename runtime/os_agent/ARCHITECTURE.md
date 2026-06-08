# Arquitetura do OS Agent YAMI

Documento técnico detalhado da arquitetura, design patterns e fluxos de dados.

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                  ENTRADA DO USUÁRIO                         │
│         Voz / Texto / Aplicação / API Externa               │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────▼──────────────────┐
         │    CAMADA DE ORQUESTRAÇÃO       │
         │   (Orchestrator Principal)       │
         └───┬──────────┬─────────┬─────────┘
             │          │         │
         ┌───▼──┐   ┌───▼──┐  ┌──▼────┐
         │      │   │      │  │       │
    PLANE │AUTORIZE│EXECUTE │OBSERVE │
         │      │   │      │  │       │
         └───┬──┘   └───┬──┘  └──┬────┘
             │          │        │
      ┌──────▼──────────▼──┐    │
      │   CAMADA DE        │    │
      │   EXECUÇÃO         │    │
      │ 7 Executors        │    │
      └────────────────────┘    │
                                 │
                        ┌────────▼─────────┐
                        │  SystemMonitor   │
                        └──────────────────┘
```

## 2. Componentes Principais

### 2.1 Orchestrator (Orquestrador)

**Responsabilidade**: Coordenar o pipeline completo de execução.

**Interface**:
```python
class Orchestrator:
    def execute(self, intent: str, context: Dict = None, dry_run: bool = False) -> ExecutionResult
    def explain_plan(self, intent: str) -> str
    def register_executor(self, name: str, executor: Executor)
```

**Fluxo interno**:
1. Recebe intenção do usuário
2. Delega ao `Planner` → obtém `ActionPlan`
3. Para cada `ActionStep`:
   - Verifica permissão com `PermissionManager`
   - Se aprovado → dispatch para executor apropriado
   - Capture resultado e erro
4. Constrói `ExecutionResult` com metadados
5. Retorna ao chamador

**Timings**:
- Planning: ~5ms
- Authorization: ~10ms
- Execution: 50-500ms (depende da ação)
- Total: <1s para operações simples

### 2.2 Planner (Planejador)

**Responsabilidade**: Converter linguagem natural em plano estruturado.

**Implementação**: Padrão matching com heurísticas (não IA).

```python
class Planner:
    def plan(self, intent: str, context: Dict = None) -> ActionPlan
```

**Padrões reconhecidos**: 29 ações diferentes
- Apps: open, close, list, switch
- Files: read, write, create, delete, move, copy, rename, search, info, disk_usage
- Processes: list, kill, sysinfo, monitor
- Windows: list, switch, screenshot, clipboard
- Scripts: execute, run, python, powershell
- Browser: navigate, tabs, js, info, search
- Network: download, connectivity, resolve

**Exemplo de decomposição**:
```
Input: "abrir chrome e baixar arquivo"
↓
[
  ActionStep(action="open_app", executor="apps", params={"name": "chrome"}),
  ActionStep(action="download_file", executor="network", params={"url": "..."})
]
```

**Estrutura do ActionPlan**:
```python
@dataclass
class ActionPlan:
    id: str              # Identificador único
    intent: str          # Comando original
    steps: List[ActionStep]  # Passos decompostos
    context: Dict        # Contexto (projeto, usuário, etc.)
    parallel_groups: List[List[str]]  # Grupos que podem executar em paralelo
    requires_confirmation: bool  # Requer aprovação?
```

### 2.3 PermissionManager (Gerenciador de Permissões)

**Responsabilidade**: Verificar e aplicar permissões antes de executar.

**4 Níveis de Permissão**:
1. **SAFE**: Automático (operações apenas-leitura)
   - read_file, list_directory, get_system_info, screenshot
2. **NOTIFY**: Notificar usuário (modificações baixo-risco)
   - open_app, create_folder, move_file, download_file
3. **CONFIRM**: Requer confirmação (operações sensíveis)
   - delete_file, write_file, execute_command, kill_process, shutdown
4. **BLOCKED**: Sempre bloqueado (perigoso/desabilitado)
   - modify_system_files, disable_security

**Classificação de 45 ações**:
```python
ACTION_CLASSIFICATIONS: Dict[str, PermissionLevel] = {
    "read_file": SAFE,
    "delete_file": CONFIRM,
    "disable_security": BLOCKED,
    ...
}
```

**Cache de aprovações**:
- `_session_approvals`: Aprovações válidas pela sessão
- `_always_approvals`: Aprovações permanentes
- Histórico de requisições

```python
perm = permission_manager.request("delete_file", "Remove file.txt")
if perm.approved:
    # Executar ação
    pass
else:
    # Informar usuário
    print(f"Bloqueado por segurança: {perm.level}")
```

### 2.4 Executors (Executadores)

**Responsabilidade**: Executar ações atômicas no sistema.

**Padrão de Executor**:
```python
class Executor(ABC):
    def execute(self, action: str, params: Dict, context: Dict) -> Any
    def validate(self, action: str, params: Dict) -> Tuple[bool, Optional[str]]
    def observe(self) -> Dict[str, Any]
    def _dispatch(self, action: str, params: Dict, context: Dict) -> Any
```

**7 Executors implementados**:

| Executor | Ações | Descrição |
|----------|-------|-----------|
| FileExecutor | 12 | Sistema de arquivos |
| AppExecutor | 4 | Ciclo de vida de apps |
| ProcessExecutor | 4 | Processos e recursos |
| WindowExecutor | 4 | Janelas e desktop |
| ScriptExecutor | 4 | Execução de scripts |
| BrowserExecutor | 5 | Interação com navegador |
| NetworkExecutor | 3 | Download, upload, conectividade |

**Dispatch automático**:
```python
# Ao chamar executor.execute("read_file", {"path": "/etc/hosts"})
# Internamente chama: self.action_read_file({"path": "..."}, context)
```

**Exemplo: FileExecutor.action_read_file**:
```python
def action_read_file(self, params, context):
    path = os.path.expanduser(params.get("path", ""))
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Arquivo nao encontrado: {path}")
    return p.read_text(encoding="utf-8")
```

### 2.5 ErrorHandler (Gerenciador de Erros)

**Responsabilidade**: Implementar estratégias de recuperação de falhas.

**5 Estratégias de Recuperação**:

1. **RETRY**: Retenta com backoff exponencial
   - Aplicado para: TimeoutError, ConnectionError
   - Delay = base_delay × attempt

2. **FALLBACK**: Executa ação alternativa
   - Exemplo: read_file falha → list_directory (ao menos listar conteúdo)
   - Mapa configurável: `_fallback_map`

3. **ALTERNATIVE**: Simplifica operação
   - Exemplo: comando complexo → versão simples

4. **NOTIFY**: Notifica usuário e continua
   - Aplicado para: PermissionError, não-encontrado

5. **ABORT**: Para execução
   - Aplicado quando: máximo de tentativas atingido

**Exemplo de decisão**:
```python
try:
    result = executor.execute(action, params)
except FileNotFoundError as e:
    plan = error_handler.handle(action, params, e, attempt=1)
    if plan.should_retry:
        time.sleep(plan.delay_seconds)
        # retentar
    elif plan.fallback_action:
        result = executor.execute(plan.fallback_action, plan.fallback_params)
    else:
        raise
```

### 2.6 SystemMonitor (Monitor do Sistema)

**Responsabilidade**: Observar estado do sistema e detectar mudanças.

**Dados coletados**:
```python
@dataclass
class SystemSnapshot:
    timestamp: float
    platform: str          # "win32", "linux", "darwin"
    cwd: str               # Diretório atual
    cpu_percent: float     # % de CPU
    memory_percent: float  # % de memória
    disk_percent: float    # % de disco
    process_count: int
    active_window: str     # Janela ativa (Windows)
    uptime: float          # Tempo de ligado
```

**Métodos**:
```python
monitor.snapshot()                    # Coleta snapshot atual
monitor.diff(before, after)           # Detecta mudanças
monitor.detect_significant_change()   # Mudanças > threshold
monitor.get_context()                 # Contexto para planejador
monitor.get_history(limit=10)         # Histórico de snapshots
```

**Uso**:
```python
before = monitor.snapshot()
result = orch.execute("compilar projeto")
after = monitor.snapshot()

changes = monitor.diff(before, after)
print(f"CPU antes: {before.cpu_percent}% -> depois: {after.cpu_percent}%")
```

## 3. Fluxos de Dados

### 3.1 Execução Completa

```
User Input: "abrir chrome e baixar arquivo"
│
├─ PLANNER.plan()
│  ├─ Tokenize: ["abrir", "chrome", "e", "baixar", "arquivo"]
│  ├─ Match patterns: open_app, download_file
│  └─ Return: ActionPlan(
│     steps=[
│       ActionStep(action="open_app", executor="apps"),
│       ActionStep(action="download_file", executor="network")
│     ]
│  )
│
├─ Para cada ActionStep:
│  │
│  ├─ PERMISSION_MANAGER.request("open_app")
│  │  ├─ Classificar: NOTIFY
│  │  ├─ Cache miss → callback
│  │  └─ Return: PermissionRequest(approved=True)
│  │
│  ├─ Executor["apps"].execute("open_app", {name: "chrome"})
│  │  ├─ Validar parâmetros
│  │  ├─ Dispatch: action_open_app(...)
│  │  ├─ Executar: subprocess.Popen(["chrome"])
│  │  └─ Return: {success: True}
│  │
│  └─ Record: ExecutionResult(success=True, duration_ms=150)
│
└─ Return: ExecutionResult(
   success=True,
   summary="2 passos executados com sucesso",
   duration_ms=250
)
```

### 3.2 Tratamento de Erro

```
Executor falha: FileNotFoundError("/nonexistent")
│
├─ ERROR_HANDLER.handle(action, params, error, attempt=1)
│  │
│  ├─ Classificar erro: FileNotFoundError → FALLBACK
│  ├─ Consultar fallback_map["read_file"] → ["list_directory", "search_files"]
│  │
│  └─ Return: RecoveryPlan(
│     strategy=FALLBACK,
│     fallback_action="list_directory",
│     fallback_params={...}
│  )
│
├─ Se strategy == RETRY:
│  └─ Aguardar delay_seconds, retentar
│
├─ Se strategy == FALLBACK:
│  └─ Executar fallback_action
│
└─ Se strategy == ABORT:
   └─ Parar, informar usuário
```

## 4. Configuração e Extensibilidade

### 4.1 Configuração padrão

```python
from runtime.os_agent.config.defaults import OSAgentConfig

config = OSAgentConfig(
    permissions=PermissionConfig(
        allow_once=True,
        allow_session=True,
        allow_always=False,
        timeout_seconds=60,
    ),
    executor=ExecutorConfig(
        enabled=True,
        timeout_seconds=30,
        max_retries=2,
        max_concurrent=4,
    ),
    planner=PlannerConfig(
        max_plan_steps=20,
        validate_before_execute=True,
        allow_parallel_steps=True,
    ),
    observer=ObserverConfig(
        poll_interval_seconds=2.0,
        track_resource_usage=True,
    ),
    recovery=RecoveryConfig(
        max_retries=3,
        retry_delay_seconds=1.0,
        fallback_on_failure=True,
    ),
)
```

### 4.2 Adicionar novo executor

```python
from runtime.os_agent.executors.base import Executor

class CustomExecutor(Executor):
    def __init__(self):
        super().__init__(name="custom")
        self._actions = {
            "action1": "Desc 1",
            "action2": "Desc 2",
        }
    
    def action_action1(self, params, context):
        # Implementação
        return result

# Registrar
orch.register_executor("custom", CustomExecutor())
```

### 4.3 Adicionar novo padrão de ação

```python
planner.register_action_pattern(
    action="custom_action",
    tokens=["fazer coisa", "execute thing"],
    executor="custom"
)
```

## 5. Design Patterns Utilizados

### 5.1 Strategy Pattern
- `ErrorHandler` implementa várias estratégias de recuperação
- Seleção dinâmica baseada no tipo de erro

### 5.2 Command Pattern
- Cada `ActionStep` encapsula uma comando com parâmetros
- Pode ser serializado, persistido, reexecutado

### 5.3 Factory Pattern
- `Executor` base fornece interface comum
- Subclasses implementam domínios específicos

### 5.4 Observer Pattern
- `SystemMonitor` notifica mudanças significativas
- Callbacks registráveis para cada fase

### 5.5 Decorator Pattern
- Callbacks envolvem o pipeline de execução
- `on_step_start`, `on_step_complete`, `on_error`

## 6. Garantias e Propriedades

### 6.1 Atomicidade
- Cada `ActionStep` é atômico
- Não há rollback automático (requer executor customizado)

### 6.2 Segurança
- Permissões verificadas antes de execução
- Timeouts em todas as operações
- Isolamento de contexto entre execuções
- Caminhos restritos para operações de arquivo

### 6.3 Rastreabilidade
- Cada execução tem `execution_id`
- Cada passo tem `step_id`
- Histórico de erros disponível
- Logs com timestamps

### 6.4 Extensibilidade
- Novos executors sem modificar core
- Novos padrões sem modificar planner
- Novos callbacks sem modificar orchestrator

## 7. Performance

### 7.1 Timings

```
Operação simples (abrir app):
- Planning: 3ms
- Authorization: 2ms
- Execution: 100ms
- Total: 105ms

Operação complex (12 passos):
- Planning: 8ms
- Authorization: 15ms
- Execution (paralelo): 200ms
- Total: 223ms
```

### 7.2 Otimizações

- Cache de classificação de permissões
- Execução paralela de ActionSteps independentes
- Lazy loading de executors
- Connection pooling para network requests

## 8. Testes

### 8.1 Unidade
- Cada executor testado isoladamente
- Mocking de dependências externas
- Validação de parâmetros

### 8.2 Integração
- Planner → Executor pipeline
- Permission Manager feedback
- Error handling paths

### 8.3 End-to-End
- Comando natural → Resultado esperado
- Verificação de efeitos colaterais no sistema
- Performance benchmarks

---

**Para mais detalhes, veja o README.md e INTEGRATION.md.**
