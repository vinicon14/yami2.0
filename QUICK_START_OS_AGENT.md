# Quick Start — OS Agent YAMI

Comece a usar o Controle YAMI em 5 minutos.

## 1. Verificar a Instalação

```bash
cd ~/.yami
python -m runtime.os_agent.__main__
```

Você deve ver:
```
[OK] PermissionManager
[OK] Planner
[OK] All executors loaded
... 
[OK] YAMI OS Agent architecture verified successfully!
```

## 2. Modo Interativo (Mais Fácil)

```bash
python -m runtime.os_agent.cli interactive
```

Exemplo de sessão:
```
os-agent> execute abrir o Chrome
Executando: abrir o Chrome

[DRY RUN] Plano gerado com 1 passo(s). Nenhuma acao executada.

os-agent> plan listar arquivos
{
  "command": "listar arquivos",
  "plan_id": "plan-abc123",
  "steps": [
    {
      "id": "step-xyz",
      "action": "list_directory",
      "executor": "files",
      ...
    }
  ]
}

os-agent> status
Status do Sistema:
  Platform: win32
  Working Dir: C:\Users\vinim\.yami
  CPU: 45.2%
  Memory: 82.1%
  Disk: 77.3%
  ...

os-agent> exit
```

## 3. Uso Programático

```python
from runtime.os_agent import Orchestrator
from runtime.os_agent.core.permissions import PermissionManager
from runtime.os_agent.core.planner import Planner
from runtime.os_agent.executors import *

# Setup (5 linhas)
pm = PermissionManager()
planner = Planner(permission_manager=pm)
orch = Orchestrator(permission_manager=pm, planner=planner)

orch.register_executors({
    "files": FileExecutor(),
    "apps": AppExecutor(),
    "processes": ProcessExecutor(),
    "windows": WindowExecutor(),
    "scripts": ScriptExecutor(),
    "browser": BrowserExecutor(),
    "network": NetworkExecutor(),
})

# Execute (1 linha)
result = orch.execute("abrir o Chrome")

# Ver resultado (1 linha)
print(result.summary_text())
```

## 4. Comandos Comuns

### Arquivos
```
"listar arquivos da pasta Downloads"
"criar pasta Projetos"
"copiar arquivo.txt para backup"
"deletar arquivo temporario.tmp"
"mover arquivo para pasta"
"procurar arquivo.pdf"
```

### Aplicativos
```
"abrir chrome"
"fechar bloco de notas"
"listar programas abertos"
"alternar para firefox"
```

### Sistema
```
"obter informacoes do sistema"
"monitorar recursos"
"listar processos"
"obter uso de disco"
```

### Navegador
```
"navegar para google.com"
"pesquisar python documentation"
"executar javascript"
```

### Downloads
```
"baixar arquivo do url"
"verificar conectividade internet"
```

### Scripts
```
"executar script.py"
"executar comando powershell"
"executar python inline code"
```

## 5. Modo Planejamento (Dry-Run)

Ver o plano sem executar:

```python
result = orch.execute("abrir chrome e baixar arquivo", dry_run=True)
print(result.summary_text())

# Output:
# [DRY RUN] Plano gerado com 2 passo(s). Nenhuma acao executada.
```

## 6. Entender o Plano

```python
plan = planner.plan("criar pasta e listar conteudo")

for step in plan.steps:
    print(f"{step.action} via {step.executor}")
    print(f"  Descricao: {step.description}")
    print(f"  Parametros: {step.params}")
    print(f"  Pode executar em paralelo: {step.can_parallel}")
    print()
```

## 7. Monitorar Sistema

```python
from runtime.os_agent.observer.monitor import SystemMonitor

monitor = SystemMonitor()

# Antes
before = monitor.snapshot()
print(f"CPU antes: {before.cpu_percent}%")

# Executar algo
result = orch.execute("compilar projeto")

# Depois
after = monitor.snapshot()
print(f"CPU depois: {after.cpu_percent}%")

# Ver mudancas
changes = monitor.diff(before, after)
print(f"Mudancas: {changes}")
```

## 8. Listar Acoes Disponiveis

```python
# Ver todas as acoes
for executor_name in ("files", "apps", "processes", "windows", "scripts", "browser", "network"):
    executor = orch._executors.get(executor_name)
    print(f"\n{executor_name.upper()}:")
    for action in executor.list_actions():
        print(f"  - {action}")

# Output:
# FILES:
#   - list_directory
#   - read_file
#   - write_file
#   ...
```

## 9. Permissoes

```python
from runtime.os_agent.core.permissions import PermissionLevel

# Verificar nivel de uma acao
perm = pm.request("delete_file", "Deletar arquivo.txt")
print(f"Nivel: {perm.level.value}")  # confirm
print(f"Aprovado: {perm.approved}")

# Registrar acao customizada
pm.register_action("my_action", PermissionLevel.SAFE)
```

## 10. Recuperacao de Erros

```python
from runtime.os_agent.recovery.error_handler import ErrorHandler

eh = ErrorHandler(max_retries=3)

try:
    result = executor.execute("read_file", {"path": "/nonexistent"})
except FileNotFoundError as e:
    plan = eh.handle("read_file", {"path": "/nonexistent"}, e, attempt=1)
    
    if plan.should_retry:
        print(f"Tentando novamente em {plan.delay_seconds}s...")
    elif plan.fallback_action:
        print(f"Usando alternativa: {plan.fallback_action}")
    else:
        print(f"Falha: {plan.message}")
```

## 11. Exemplos Completos

```python
# Exemplo 1: Executar com contexto
result = orch.execute(
    "listar arquivos",
    context={"path": "C:\\Projects\\my-app"}
)

# Exemplo 2: Com callbacks
def on_start(step):
    print(f"Iniciando: {step.description}")

def on_complete(step, success, msg):
    print(f"Concluído: {success}")

orch2 = Orchestrator(
    permission_manager=pm,
    planner=planner,
    on_step_start=on_start,
    on_step_complete=on_complete,
)

result = orch2.execute("criar pasta teste")

# Exemplo 3: Explicar plano
explanation = orch.explain_plan("mover arquivo")
print(explanation)
```

## 12. Troubleshooting

### "ImportError: cannot import..."
```python
# Verificar instalacao
python -m runtime.os_agent.__main__
```

### "PermissionError"
O comando pode estar bloqueado por questoes de seguranca. Verifique o nivel de permissao:
```python
perm = pm.classify("delete_file")
print(perm)  # PermissionLevel.CONFIRM
```

### Comando nao reconhecido
O planner usa pattern matching. Se seu comando nao foi reconhecido, tente reformular:
```python
# Ao inves de:
plan = planner.plan("ver pasta")

# Tente:
plan = planner.plan("listar arquivos pasta")
```

## 13. Proximos Passos

1. Ler `runtime/os_agent/README.md` para documentacao completa
2. Explorar `runtime/os_agent/examples.py` para mais exemplos
3. Consultar `ARCHITECTURE.md` para entender o design
4. Ver `INTEGRATION.md` para integrar com sistemas externos

## 14. Recursos

| Recurso | Localizacao |
|---------|------------|
| Codigo principal | `runtime/os_agent/` |
| Documentacao | `runtime/os_agent/README.md` |
| Arquitetura | `runtime/os_agent/ARCHITECTURE.md` |
| Integracao | `runtime/os_agent/INTEGRATION.md` |
| CLI | `python -m runtime.os_agent.cli` |
| Teste | `python -m runtime.os_agent.__main__` |
| Exemplos | `runtime/os_agent/examples.py` |
| Sumario | `OS_AGENT_SUMMARY.md` (este diretorio) |

---

**Dica**: Comece com o modo interativo (`cli interactive`) para explorar as capacidades sem se preocupar com codigo!

**Status**: ✅ Pronto para usar
