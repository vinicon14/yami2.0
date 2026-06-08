"""Observador do ambiente — monitora estado do sistema e coleta contexto.

Fornece ao orquestrador uma visão atualizada do ambiente antes,
durante e depois da execução de ações. Essencial para planejamento
contextual e recuperação de erros.
"""

from __future__ import annotations

import logging
import os
import platform
import sys
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class SystemSnapshot:
    timestamp: float = field(default_factory=time.time)
    platform: str = ""
    cwd: str = ""
    cpu_percent: float = 0.0
    memory_percent: float = 0.0
    disk_percent: float = 0.0
    process_count: int = 0
    active_window: str = ""
    uptime: float = 0.0
    extra: Dict[str, Any] = field(default_factory=dict)


class SystemMonitor:
    """Observa e registra o estado do ambiente computacional.

    Coleta métricas periódicas, detecta mudanças significativas
    e fornece contexto para o planejador.
    """

    def __init__(self, poll_interval: float = 2.0):
        self._poll_interval = poll_interval
        self._last_snapshot: Optional[SystemSnapshot] = None
        self._history: List[SystemSnapshot] = []
        self._max_history = 100
        self._running = False
        self._listeners: List[Any] = []

    def snapshot(self) -> SystemSnapshot:
        """Coleta um snapshot completo do estado atual do sistema."""
        s = SystemSnapshot(
            platform=sys.platform,
            cwd=os.getcwd(),
        )

        try:
            s.uptime = time.time() - self._get_boot_time()
        except Exception:
            pass

        try:
            import psutil
            s.cpu_percent = psutil.cpu_percent(interval=0.3)
            s.memory_percent = psutil.virtual_memory().percent
            s.disk_percent = psutil.disk_usage("/").percent
            s.process_count = len(psutil.pids())
        except ImportError:
            pass

        try:
            s.active_window = self._get_active_window()
        except Exception:
            pass

        self._last_snapshot = s
        self._history.append(s)
        if len(self._history) > self._max_history:
            self._history = self._history[-self._max_history:]

        return s

    def _get_boot_time(self) -> float:
        try:
            import psutil
            return psutil.boot_time()
        except ImportError:
            return 0.0

    def _get_active_window(self) -> str:
        try:
            if sys.platform == "win32":
                import ctypes
                user32 = ctypes.windll.user32
                hwnd = user32.GetForegroundWindow()
                length = user32.GetWindowTextLengthW(hwnd)
                buf = ctypes.create_unicode_buffer(length + 1)
                user32.GetWindowTextW(hwnd, buf, length + 1)
                return buf.value or ""
        except Exception:
            pass
        return ""

    def diff(self, before: SystemSnapshot, after: SystemSnapshot) -> Dict[str, Any]:
        """Compara dois snapshots e retorna as diferenças."""
        changes: Dict[str, Any] = {}
        for attr in ("cpu_percent", "memory_percent", "disk_percent", "process_count", "active_window", "cwd"):
            b = getattr(before, attr, None)
            a = getattr(after, attr, None)
            if b != a:
                changes[attr] = {"before": b, "after": a}
        return changes

    def detect_significant_change(self) -> Optional[Dict[str, Any]]:
        """Detecta se houve mudança significativa desde o último snapshot."""
        if not self._last_snapshot:
            return None

        current = self.snapshot()
        if len(self._history) < 2:
            return None

        previous = self._history[-2]
        changes = self.diff(previous, current)

        significant = {}
        cpu_delta = abs(changes.get("cpu_percent", {}).get("before", 0) - changes.get("cpu_percent", {}).get("after", 0))
        if cpu_delta > 30:
            significant["cpu_spike"] = cpu_delta

        mem_delta = abs(changes.get("memory_percent", {}).get("before", 0) - changes.get("memory_percent", {}).get("after", 0))
        if mem_delta > 20:
            significant["memory_spike"] = mem_delta

        if changes.get("cwd"):
            significant["cwd_changed"] = changes["cwd"]

        return significant if significant else None

    def get_context(self) -> Dict[str, Any]:
        """Retorna contexto resumido para o planejador."""
        s = self.snapshot()
        return {
            "platform": s.platform,
            "cwd": s.cwd,
            "cpu": s.cpu_percent,
            "memory": s.memory_percent,
            "disk": s.disk_percent,
            "processes": s.process_count,
            "active_window": s.active_window,
        }

    def on_change(self, callback: Any):
        """Registra callback para notificações de mudança."""
        self._listeners.append(callback)

    def get_history(self, limit: int = 10) -> List[SystemSnapshot]:
        return self._history[-limit:]

    def clear_history(self):
        self._history.clear()
