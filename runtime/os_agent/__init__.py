"""OS Agent — Módulo de controle do sistema operacional para YAMI.

Arquitetura modular que transforma comandos do usuário em ações executáveis
sobre o sistema operacional e serviços conectados.

Princípios:
  - Execução real (não apenas instruções)
  - Planejamento antes da ação
  - Modularidade para novas integrações
  - Observação do ambiente
  - Recuperação de erros
  - Transparência operacional
  - Expansão futura simplificada
"""

from __future__ import annotations

from .core.orchestrator import Orchestrator
from .executors.base import Executor
from .executors.files import FileExecutor
from .executors.apps import AppExecutor
from .executors.processes import ProcessExecutor
from .executors.windows import WindowExecutor
from .executors.scripts import ScriptExecutor
from .executors.browser import BrowserExecutor
from .executors.network import NetworkExecutor

__all__ = [
    "Orchestrator",
    "Executor",
    "FileExecutor",
    "AppExecutor",
    "ProcessExecutor",
    "WindowExecutor",
    "ScriptExecutor",
    "BrowserExecutor",
    "NetworkExecutor",
]

VERSION = "0.1.0"
