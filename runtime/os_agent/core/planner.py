"""Planejador de ações — transforma intenção do usuário em plano executável.

Analisa o comando recebido, decompõe em etapas ordenadas,
valida pré-condições e identifica dependências entre passos.
"""

from __future__ import annotations

import logging
import re
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set

logger = logging.getLogger(__name__)


class StepStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"
    BLOCKED = "blocked"


@dataclass
class ActionStep:
    id: str = field(default_factory=lambda: f"step-{uuid.uuid4().hex[:6]}")
    action: str = ""
    params: Dict[str, Any] = field(default_factory=dict)
    description: str = ""
    status: StepStatus = StepStatus.PENDING
    depends_on: List[str] = field(default_factory=list)
    executor: str = ""
    result: Any = None
    error: Optional[str] = None
    duration_ms: float = 0.0
    can_parallel: bool = False
    is_observation: bool = False
    required: bool = True


@dataclass
class ActionPlan:
    id: str = field(default_factory=lambda: f"plan-{uuid.uuid4().hex[:8]}")
    intent: str = ""
    steps: List[ActionStep] = field(default_factory=list)
    context: Dict[str, Any] = field(default_factory=dict)
    created_at: float = field(default_factory=time.time)
    executed_at: Optional[float] = None
    parallel_groups: List[List[str]] = field(default_factory=list)
    requires_confirmation: bool = False
    status: str = "created"


class Planner:
    """Decompõe comandos do usuário em planos de ação executáveis.

    Usa heurísticas para identificar ações, parâmetros e dependências.
    Integra-se com o PermissionManager para classificar sensibilidade.
    """

    def __init__(
        self,
        executor_registry: Optional[Dict[str, Any]] = None,
        permission_manager: Optional[Any] = None,
        config: Optional[Any] = None,
    ):
        self._executor_registry = executor_registry or {}
        self._permission_manager = permission_manager
        self._config = config
        self._action_patterns = self._build_action_patterns()

    def _build_action_patterns(self) -> Dict[str, Dict]:
        return {
            "open_app": {"tokens": ["abrir", "iniciar", "executar", "rodar", "open", "launch", "start"], "executor": "apps"},
            "close_app": {"tokens": ["fechar", "encerrar", "matar", "close", "kill", "stop"], "executor": "apps"},
            "switch_app": {"tokens": ["alternar", "trocar", "mudar", "switch", "swap"], "executor": "apps"},
            "create_folder": {"tokens": ["criar pasta", "criar um pasta", "criar uma pasta", "criar diretório", "nova pasta", "mkdir", "create folder", "create directory"], "executor": "files"},
            "delete_file": {"tokens": ["deletar", "apagar", "remover", "excluir", "delete", "remove"], "executor": "files"},
            "move_file": {"tokens": ["mover", "recortar", "move", "cut"], "executor": "files"},
            "copy_file": {"tokens": ["copiar", "duplicar", "copy", "duplicate"], "executor": "files"},
            "rename_file": {"tokens": ["renomear", "rename"], "executor": "files"},
            "list_directory": {"tokens": ["listar", "mostrar pasta", "conteúdo", "list", "ls", "dir", "folder"], "executor": "files"},
            "run_script": {"tokens": ["executar script", "rodar script", "run script", "execute script"], "executor": "scripts"},
            "execute_command": {"tokens": ["comando", "terminal", "cmd", "command", "shell"], "executor": "scripts"},
            "list_processes": {"tokens": ["processos", "programas abertos", "processes", "running"], "executor": "processes"},
            "kill_process": {"tokens": ["matar processo", "kill process"], "executor": "processes"},
            "monitor_resources": {"tokens": ["cpu", "memória", "disco", "recurso", "resource", "memory", "disk"], "executor": "processes"},
            "list_windows": {"tokens": ["janelas", "área de trabalho", "windows", "desktop"], "executor": "windows"},
            "switch_window": {"tokens": ["minimizar", "maximizar", "minimize", "maximize"], "executor": "windows"},
            "screenshot": {"tokens": ["capturar tela", "print", "screenshot"], "executor": "windows"},
            "browser_navigate": {"tokens": ["navegar", "abrir site", "ir para", "browser", "navigate", "go to", "open url"], "executor": "browser"},
            "download_file": {"tokens": ["baixar", "download", "downloading"], "executor": "network"},
            "upload_file": {"tokens": ["enviar", "upload", "subir"], "executor": "network"},
            "get_system_info": {"tokens": ["informações do sistema", "info", "system", "sysinfo"], "executor": "processes"},
        }

    def plan(self, intent: str, context: Optional[Dict[str, Any]] = None) -> ActionPlan:
        """Recebe uma intenção em linguagem natural e retorna um plano de ação."""
        plan = ActionPlan(intent=intent, context=context or {})
        steps = self._decompose(intent, context or {})

        if not steps:
            steps.append(
                ActionStep(
                    action="get_system_info",
                    params={"question": intent},
                    description="Coletar informações do sistema para responder ao comando",
                    executor="processes",
                    is_observation=True,
                )
            )

        plan.steps = steps
        plan.parallel_groups = self._build_parallel_groups(steps)
        plan.requires_confirmation = any(
            self._is_sensitive(step.action) for step in steps
        )
        return plan

    def _decompose(self, intent: str, context: Dict[str, Any]) -> List[ActionStep]:
        """Decompõe intenção em passos usando reconhecimento de padrões."""
        steps: List[ActionStep] = []
        intent_lower = intent.lower().strip()

        patterns = self._action_patterns
        matched = set()

        has_file_path = bool(re.search(r'["\']?([A-Za-z]:\\[^\s"\']+|~\/[^\s]*|\/[^\s]+)', intent))
        has_url = bool(re.search(r'https?://[^\s]+', intent_lower))
        has_app_name = bool(re.search(r'(abrir|open|start|launch|executar)\s+["\']?([a-zA-Z0-9_\-\s]+)["\']?', intent_lower))

        # Observation step — always prepend if needed
        if context.get("observe_first"):
            steps.append(
                ActionStep(
                    action="get_system_info",
                    params={"focus": intent},
                    description="Observar estado atual do sistema",
                    executor="processes",
                    is_observation=True,
                    can_parallel=False,
                )
            )

        for action, info in patterns.items():
            for token in info["tokens"]:
                if token in intent_lower:
                    if action not in matched:
                        step = ActionStep(
                            action=action,
                            executor=info["executor"],
                            description=self._build_description(action, intent, context),
                            params=self._extract_params(action, intent, context),
                        )
                        steps.append(step)
                        matched.add(action)
                    break

        if has_url and "browser_navigate" not in matched:
            urls = re.findall(r'https?://[^\s"\']+', intent)
            if urls:
                steps.append(
                    ActionStep(
                        action="browser_navigate",
                        executor="browser",
                        description=f"Navegar para {urls[0]}",
                        params={"url": urls[0]},
                    )
                )
                matched.add("browser_navigate")

        return steps

    def _build_description(self, action: str, intent: str, context: Dict) -> str:
        descriptions = {
            "open_app": "Abrir aplicativo",
            "close_app": "Fechar aplicativo",
            "switch_app": "Alternar para aplicativo",
            "create_folder": "Criar pasta",
            "delete_file": "Remover arquivo",
            "move_file": "Mover arquivo",
            "copy_file": "Copiar arquivo",
            "rename_file": "Renomear arquivo",
            "list_directory": "Listar conteúdo da pasta",
            "run_script": "Executar script",
            "execute_command": "Executar comando",
            "list_processes": "Listar processos em execução",
            "kill_process": "Encerrar processo",
            "monitor_resources": "Monitorar recursos do sistema",
            "list_windows": "Listar janelas abertas",
            "switch_window": "Gerenciar janela",
            "screenshot": "Capturar tela",
            "browser_navigate": "Navegar no navegador",
            "download_file": "Baixar arquivo",
            "upload_file": "Enviar arquivo",
            "get_system_info": "Obter informações do sistema",
        }
        base = descriptions.get(action, f"Executar {action}")
        extra = self._extract_name(intent)
        return f"{base}: {extra}" if extra else base

    def _extract_params(self, action: str, intent: str, context: Dict) -> Dict[str, Any]:
        params: Dict[str, Any] = {}
        intent_lower = intent.lower()

        path_match = re.search(r'["\']?([A-Za-z]:\\[^\s"\']+)["\']?', intent)
        if path_match:
            params["path"] = path_match.group(1)

        url_match = re.search(r'(https?://[^\s"\']+)', intent)
        if url_match:
            params["url"] = url_match.group(1)

        name = self._extract_name(intent)
        if name:
            params["name"] = name

        if action in ("move_file", "copy_file"):
            dest_match = re.search(r'(?:para|to|em|in)\s+["\']?([A-Za-z]:\\[^\s"\']+)["\']?', intent)
            if dest_match:
                params["destination"] = dest_match.group(1)

        return params

    def _extract_name(self, intent: str) -> str:
        patterns = [
            r'(?:abrir|open|start|launch|executar)\s+["\']?([a-zA-Z0-9_\-\s\.]+?)["\']?(?:\s|$|,)',
            r'(?:fechar|close|kill|stop)\s+["\']?([a-zA-Z0-9_\-\s\.]+?)["\']?(?:\s|$|,)',
            r'(?:criar|create|nova|new)\s+(?:a\s+|o\s+)?(?:pasta|folder|diretorio|directory)\s+["\']?([a-zA-Z0-9_\-\s]+?)["\']?(?:\s|$|,)',
            r'(?:deletar|apagar|remover|delete|remove)\s+["\']?([a-zA-Z0-9_\-\s\.]+?)["\']?(?:\s|$|,)',
            r'(?:renomear|rename)\s+["\']?([a-zA-Z0-9_\-\s\.]+?)["\']?(?:\s|$|,)',
        ]
        for p in patterns:
            m = re.search(p, intent, re.IGNORECASE)
            if m:
                return m.group(1).strip()
        return ""

    def _build_parallel_groups(self, steps: List[ActionStep]) -> List[List[str]]:
        parallel: List[List[str]] = []
        current: List[str] = []
        for step in steps:
            if step.can_parallel and not step.depends_on:
                current.append(step.id)
            else:
                if current:
                    parallel.append(current)
                    current = []
        if current:
            parallel.append(current)
        return parallel

    def _is_sensitive(self, action: str) -> bool:
        if self._permission_manager:
            level = self._permission_manager.classify(action)
            return level.value in ("confirm", "blocked")
        return False

    def register_action_pattern(self, action: str, tokens: List[str], executor: str):
        self._action_patterns[action] = {"tokens": tokens, "executor": executor}
