# Guia de Integração — OS Agent YAMI

Como integrar o OS Agent com sistemas existentes, APIs e serviços.

## 1. Integração com YAMI Existente

### 1.1 Habilitar o módulo

O módulo `os-agent` já está registrado em `runtime/yami-manifest.json` como **Controle Yami**. Para habilitá-lo:

```json
{
  "skills": {
    "entries": {
      "os-agent": {
        "enabled": true
      }
    }
  }
}
```

### 1.2 Usando na lógica de agente YAMI

```python
# Em um handler YAMI existente
from runtime.os_agent import Orchestrator
from runtime.os_agent.core.permissions import PermissionManager
from runtime.os_agent.core.planner import Planner
from runtime.os_agent.executors import (
    FileExecutor, AppExecutor, ProcessExecutor,
    WindowExecutor, ScriptExecutor, BrowserExecutor, NetworkExecutor
)

class YAMIAgentHandler:
    def __init__(self, yami_config):
        # Usar sistema de aprovação YAMI existente
        self.pm = PermissionManager(
            approval_callback=self._yami_approval_handler,
            session_id=yami_config.get("session_id")
        )
        
        self.planner = Planner(permission_manager=self.pm)
        self.orch = Orchestrator(
            permission_manager=self.pm,
            planner=self.planner
        )
        
        # Registrar executors
        self.orch.register_executors({
            "files": FileExecutor(),
            "apps": AppExecutor(),
            # ... rest of executors
        })
    
    def _yami_approval_handler(self, action, details):
        """Integra com o sistema de aprovação YAMI existente."""
        # Chamar API de aprovação YAMI
        approval = yami_request_approval(action, details)
        return approval.decision  # "once", "session", "always", "deny"
    
    def handle_voice_command(self, transcript):
        """Processa comando recebido via voz."""
        result = self.orch.execute(transcript)
        return result.summary_text()
```

### 1.3 Conectar com WhatsApp de YAMI

```python
# Em um handler WhatsApp YAMI
from runtime.os_agent import Orchestrator

class WhatsAppOSAgentBridge:
    def __init__(self):
        self.orch = Orchestrator(...)
    
    def on_whatsapp_message(self, msg):
        """Processar comando via WhatsApp."""
        # Verificar se é comando de SO
        if msg.text.startswith("/os "):
            command = msg.text[4:]
            result = self.orch.execute(command, dry_run=True)
            
            # Enviar resultado via WhatsApp
            response = result.summary_text(verbose=False)
            send_whatsapp_reply(msg.chat_id, response)
```

## 2. Integração com Sistemas Externos

### 2.1 Google Drive / Google Photos (já integrado em YAMI)

```python
# Executor customizado para fotos Google
from runtime.os_agent.executors.base import Executor

class GooglePhotosExecutor(Executor):
    def __init__(self, auth_token):
        super().__init__(name="google-photos")
        self.auth_token = auth_token
        self._actions = {
            "search_photos": "Buscar fotos no Google Photos",
            "create_album": "Criar álbum",
            "upload_photo": "Fazer upload de foto",
        }
    
    def action_search_photos(self, params, context):
        query = params.get("query", "")
        # Chamar API Google Photos
        results = google_photos_api.search(query, auth=self.auth_token)
        return results

# Registrar no orchestrator
orch.register_executor("google-photos", GooglePhotosExecutor(token))
```

### 2.2 Calendário (Google Calendar / Outlook)

```python
from runtime.os_agent.executors.base import Executor

class CalendarExecutor(Executor):
    def __init__(self):
        super().__init__(name="calendar")
        self._actions = {
            "create_event": "Criar evento no calendario",
            "list_events": "Listar eventos proximos",
            "delete_event": "Remover evento",
        }
    
    def action_create_event(self, params, context):
        title = params.get("title")
        start = params.get("start_time")
        end = params.get("end_time")
        # Chamar API de calendario (Google/Outlook)
        event = calendar_api.create(title, start, end)
        return {"success": True, "event_id": event.id}

orch.register_executor("calendar", CalendarExecutor())
```

### 2.3 Email (Gmail / Outlook)

```python
class EmailExecutor(Executor):
    def __init__(self):
        super().__init__(name="email")
        self._actions = {
            "send_email": "Enviar email",
            "list_emails": "Listar emails",
            "search_email": "Buscar email",
        }
    
    def action_send_email(self, params, context):
        to = params.get("to")
        subject = params.get("subject")
        body = params.get("body")
        email_api.send(to, subject, body)
        return {"success": True, "sent_to": to}

orch.register_executor("email", EmailExecutor())
```

### 2.4 Gerenciador de tarefas (Todoist / Things / Trello)

```python
class TaskExecutor(Executor):
    def __init__(self, api_key):
        super().__init__(name="tasks")
        self.api_key = api_key
        self._actions = {
            "create_task": "Criar nova tarefa",
            "list_tasks": "Listar minhas tarefas",
            "complete_task": "Marcar tarefa como concluida",
        }
    
    def action_create_task(self, params, context):
        title = params.get("title")
        project = context.get("project")
        task = todoist_api.create_task(title, project=project, auth=self.api_key)
        return {"success": True, "task_id": task.id}

orch.register_executor("tasks", TaskExecutor(api_key))
```

## 3. Hooks de Personalização

### 3.1 On-Step Callbacks

```python
def on_step_start(step):
    # Log para auditoria
    audit_log.write(f"Starting: {step.action}")

def on_step_complete(step, success, message):
    # Enviar métrica
    metrics.increment(f"step.{step.action}.{'success' if success else 'failure'}")

def on_plan_start(plan):
    # Notificar usuário
    notify_user(f"Planejando: {plan.intent}")

def on_error(plan, error):
    # Alertar administrador
    admin_alert(f"Erro no plano: {error}")

orch = Orchestrator(
    on_step_start=on_step_start,
    on_step_complete=on_step_complete,
    on_plan_start=on_plan_start,
    on_error=on_error,
)
```

### 3.2 Personalizar Permissões

```python
from runtime.os_agent.core.permissions import PermissionManager, PermissionLevel

pm = PermissionManager()

# Registrar ações customizadas
pm.register_action("send_email", PermissionLevel.CONFIRM)
pm.register_action("company_policy_check", PermissionLevel.SAFE)

# Callback customizado
def company_approval_handler(action, details):
    # Verificar política da empresa
    if "financial" in details:
        return "deny"  # Ações financeiras bloqueadas
    if "production" in details:
        return "confirm"  # Requer confirmação
    return "once"

pm.set_approval_callback(company_approval_handler)
```

## 4. Monitoramento e Observação

### 4.1 Integrar com sistemas de monitoramento

```python
from runtime.os_agent.observer.monitor import SystemMonitor
import prometheus_client

monitor = SystemMonitor()

def send_metrics():
    snapshot = monitor.snapshot()
    
    # Enviar para Prometheus
    gauge_cpu.set(snapshot.cpu_percent)
    gauge_memory.set(snapshot.memory_percent)
    gauge_disk.set(snapshot.disk_percent)
    gauge_processes.set(snapshot.process_count)

# Enviar métricas periodicamente
schedule.every(30).seconds.do(send_metrics)
```

### 4.2 Alertas baseados em mudanças

```python
monitor = SystemMonitor()

def check_for_anomalies():
    changes = monitor.detect_significant_change()
    if changes:
        if "cpu_spike" in changes:
            alert_admin("Pico de CPU detectado")
        if "memory_spike" in changes:
            alert_admin("Pico de memória detectado")

schedule.every(10).seconds.do(check_for_anomalies)
```

## 5. Histórico e Auditoria

### 5.1 Persistir execuções

```python
from runtime.os_agent import Orchestrator
import json
from datetime import datetime

class AuditedOrchestrator(Orchestrator):
    def __init__(self, *args, audit_db=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.audit_db = audit_db
    
    def execute(self, intent, context=None, dry_run=False):
        result = super().execute(intent, context, dry_run)
        
        # Persistir no banco de dados
        if self.audit_db:
            record = {
                "timestamp": datetime.now().isoformat(),
                "intent": intent,
                "plan_id": result.plan.id,
                "success": result.success,
                "duration_ms": result.duration_ms,
                "steps_count": len(result.plan.steps),
            }
            self.audit_db.insert(record)
        
        return result
```

### 5.2 Replay de planos

```python
# Reexecutar um plano anterior
def replay_plan(plan_id):
    # Recuperar plano do histórico
    historical_plan = audit_db.find_plan(plan_id)
    
    # Reexecutar
    orch = Orchestrator(...)
    for step in historical_plan.steps:
        result = orch._execute_step(step, historical_plan)
        print(f"{step.action}: {result}")
```

## 6. Integração com Orquestrador de Workflows

### 6.1 Apache Airflow

```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from runtime.os_agent import Orchestrator

dag = DAG("os_agent_tasks")

def execute_command(command):
    orch = Orchestrator(...)
    result = orch.execute(command)
    return result.success

for cmd in ["backup_files", "cleanup_temp", "generate_report"]:
    task = PythonOperator(
        task_id=cmd,
        python_callable=execute_command,
        op_args=[cmd],
        dag=dag,
    )
```

### 6.2 Jenkins / GitHub Actions

```yaml
# .github/workflows/automated-ops.yml
name: Automated System Operations

on:
  schedule:
    - cron: '0 2 * * *'  # 2am every day

jobs:
  os-operations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run OS Agent
        run: |
          python -m runtime.os_agent.cli execute "backup database"
          python -m runtime.os_agent.cli execute "cleanup logs"
```

## 7. Testes e Validação

### 7.1 Unit tests para executors customizados

```python
import unittest
from runtime.os_agent.executors.base import Executor

class TestMyExecutor(unittest.TestCase):
    def setUp(self):
        self.executor = MyExecutor()
    
    def test_action_creates_resource(self):
        result = self.executor.execute("create_resource", {"name": "test"})
        self.assertTrue(result["success"])
        self.assertEqual(result["name"], "test")
    
    def test_action_requires_param(self):
        with self.assertRaises(ValueError):
            self.executor.execute("create_resource", {})
```

### 7.2 Testes de integração

```python
def test_end_to_end_workflow():
    orch = Orchestrator(...)
    
    # Simular workflow completo
    result = orch.execute("criar pasta /tmp/test && listar conteudo")
    
    # Validar resultado
    assert result.success
    assert len(result.plan.steps) == 2
    assert result.duration_ms < 5000
```

## 8. Performance e Otimizações

### 8.1 Caching de permissões

```python
from functools import lru_cache

class CachedPermissionManager(PermissionManager):
    @lru_cache(maxsize=128)
    def classify(self, action: str):
        return super().classify(action)
```

### 8.2 Execução paralela

```python
# Planos com passos parallelizáveis
plan = planner.plan("baixar 3 arquivos")
# plan.parallel_groups = [["download_1", "download_2", "download_3"]]

# Executar em paralelo
import concurrent.futures
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
    futures = [executor.submit(orch._execute_step, step, plan) for step in plan.steps]
    results = [f.result() for f in futures]
```

---

**Para questões de integração, consulte o README.md principal.**
