"""Classe base para todos os executores do OS Agent.

Cada executor implementa um domínio de capacidades (arquivos, apps, etc.)
e segue o contrato: validar → executar → observar → reportar.
"""

from __future__ import annotations

import logging
import time
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


class Executor(ABC):
    """Classe base abstrata para executores de domínio.

    Fornece estrutura comum de logging, temporização e validação.
    Subclasses implementam `execute()` com dispatch interno para ações.
    """

    def __init__(self, name: str = ""):
        self._name = name or self.__class__.__name__
        self._actions: Dict[str, str] = {}  # action -> description

    @abstractmethod
    def execute(self, action: str, params: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> Any:
        """Executa uma ação específica com os parâmetros fornecidos."""
        ...

    def validate(self, action: str, params: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """Valida se a ação e parâmetros são aceitáveis. Subclasses podem sobrescrever."""
        if action not in self._actions:
            return False, f"Ação '{action}' não suportada por {self._name}."
        return True, None

    def observe(self) -> Dict[str, Any]:
        """Retorna observações sobre o estado atual do domínio. Opcional."""
        return {}

    def recover(self, action: str, params: Dict[str, Any], error: Exception) -> Tuple[bool, Any]:
        """Tenta recuperar de uma falha. Opcional."""
        return False, None

    def list_actions(self) -> List[str]:
        return list(self._actions.keys())

    def _timed(self, fn, *args, **kwargs) -> Tuple[Any, float]:
        start = time.perf_counter()
        result = fn(*args, **kwargs)
        return result, (time.perf_counter() - start) * 1000

    def _dispatch(self, action: str, params: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> Any:
        handler_name = f"action_{action}"
        handler = getattr(self, handler_name, None)
        if handler is None:
            raise NotImplementedError(f"Handler '{handler_name}' não implementado em {self._name}.")
        logger.debug("%s → %s(%s)", self._name, handler_name, params)
        return handler(params, context or {})

    def execute(self, action: str, params: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> Any:
        valid, error = self.validate(action, params)
        if not valid:
            raise ValueError(error)
        return self._dispatch(action, params, context)
