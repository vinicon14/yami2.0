"""Sistema de recuperação de erros — estratégias para retomada após falhas.

Gerencia retentativas, fallbacks e notificação ao usuário quando
uma ação do OS Agent encontra problemas.
"""

from __future__ import annotations

import logging
import time
import traceback
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


class RecoveryStrategy(Enum):
    RETRY = "retry"
    FALLBACK = "fallback"
    ALTERNATIVE = "alternative"
    SIMPLIFY = "simplify"
    NOTIFY = "notify"
    ABORT = "abort"


@dataclass
class ErrorRecord:
    action: str = ""
    params: Dict[str, Any] = field(default_factory=dict)
    error: str = ""
    traceback: str = ""
    timestamp: float = field(default_factory=time.time)
    attempt: int = 1
    strategy: RecoveryStrategy = RecoveryStrategy.RETRY


@dataclass
class RecoveryPlan:
    should_retry: bool = False
    strategy: RecoveryStrategy = RecoveryStrategy.ABORT
    fallback_action: str = ""
    fallback_params: Dict[str, Any] = field(default_factory=dict)
    message: str = ""
    delay_seconds: float = 0.0


class ErrorHandler:
    """Gerencia recuperação de erros com estratégias configuráveis.

    Tenta retomar a execução com abordagens alternativas quando
    uma ação falha, mantendo transparência com o usuário.
    """

    def __init__(
        self,
        max_retries: int = 3,
        retry_delay: float = 1.0,
        fallback_enabled: bool = True,
        notify_user: bool = True,
    ):
        self._max_retries = max_retries
        self._retry_delay = retry_delay
        self._fallback_enabled = fallback_enabled
        self._notify_user = notify_user
        self._history: List[ErrorRecord] = []
        self._fallback_map: Dict[str, List[str]] = {
            "read_file": ["list_directory", "search_files"],
            "write_file": ["execute_command"],
            "open_app": ["execute_command"],
            "browser_navigate": ["execute_command"],
            "download_file": ["execute_command"],
            "list_processes": ["get_system_info"],
            "execute_command": ["run_powershell", "run_script"],
        }
        self._on_notify: Optional[Callable] = None

    def handle(
        self,
        action: str,
        params: Dict[str, Any],
        error: Exception,
        attempt: int = 1,
        executor: Optional[Any] = None,
    ) -> RecoveryPlan:
        """Analisa o erro e retorna um plano de recuperação."""
        error_str = f"{type(error).__name__}: {error}"
        tb = traceback.format_exc()

        record = ErrorRecord(
            action=action,
            params=params,
            error=error_str,
            traceback=tb,
            attempt=attempt,
        )
        self._history.append(record)

        if attempt > self._max_retries:
            return RecoveryPlan(strategy=RecoveryStrategy.ABORT, message=f"Falha após {attempt} tentativa(s): {error_str}")

        strategy = self._decide_strategy(action, error, attempt)
        plan = RecoveryPlan(strategy=strategy, message=self._build_message(strategy, action, error, attempt))

        if strategy in (RecoveryStrategy.RETRY,):
            plan.should_retry = True
            plan.delay_seconds = self._retry_delay * attempt

        elif strategy == RecoveryStrategy.FALLBACK and self._fallback_enabled:
            fallbacks = self._fallback_map.get(action, [])
            if fallbacks:
                plan.fallback_action = fallbacks[0]
                plan.fallback_params = {k: v for k, v in params.items() if k in ("path", "name", "url")}

        elif strategy == RecoveryStrategy.NOTIFY and self._notify_user and self._on_notify:
            try:
                self._on_notify(f"⚠ {plan.message}")
            except Exception:
                pass

        return plan

    def _decide_strategy(self, action: str, error: Exception, attempt: int) -> RecoveryStrategy:
        error_str = str(error).lower()

        if isinstance(error, (FileNotFoundError, NotADirectoryError)):
            if attempt < self._max_retries:
                return RecoveryStrategy.FALLBACK
            return RecoveryStrategy.NOTIFY

        if isinstance(error, (TimeoutError, TimeoutError)):
            if attempt < self._max_retries:
                return RecoveryStrategy.RETRY
            return RecoveryStrategy.SIMPLIFY

        if isinstance(error, PermissionError):
            return RecoveryStrategy.NOTIFY

        if "not found" in error_str or "não encontrado" in error_str:
            if attempt < self._max_retries:
                return RecoveryStrategy.FALLBACK
            return RecoveryStrategy.ABORT

        if "timeout" in error_str or "time out" in error_str:
            return RecoveryStrategy.RETRY

        if "connection" in error_str or "connect" in error_str:
            return RecoveryStrategy.RETRY

        if attempt < self._max_retries:
            return RecoveryStrategy.RETRY

        return RecoveryStrategy.FALLBACK if self._fallback_enabled else RecoveryStrategy.ABORT

    def _build_message(self, strategy: RecoveryStrategy, action: str, error: Exception, attempt: int) -> str:
        msgs = {
            RecoveryStrategy.RETRY: f"Tentando novamente ({attempt}/{self._max_retries}): {action}",
            RecoveryStrategy.FALLBACK: f"Usando abordagem alternativa para: {action}",
            RecoveryStrategy.SIMPLIFY: f"Simplificando operação: {action}",
            RecoveryStrategy.ALTERNATIVE: f"Tentando método alternativo para: {action}",
            RecoveryStrategy.NOTIFY: f"Não foi possível executar {action}: {error}",
            RecoveryStrategy.ABORT: f"Operação abortada após {attempt} tentativa(s): {error}",
        }
        return msgs.get(strategy, f"Erro em {action}: {error}")

    def register_fallback(self, action: str, fallback_actions: List[str]):
        """Registra ações de fallback para uma determinada ação."""
        existing = self._fallback_map.setdefault(action, [])
        for fa in fallback_actions:
            if fa not in existing:
                existing.append(fa)

    def set_notify_callback(self, callback: Optional[Callable]):
        self._on_notify = callback

    def get_history(self, limit: int = 10) -> List[ErrorRecord]:
        return self._history[-limit:]

    def clear_history(self):
        self._history.clear()
