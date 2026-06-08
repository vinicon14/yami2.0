"""Sistema de permissões para operações sensíveis no sistema operacional.

Gerencia aprovação do usuário antes de executar ações com potencial impacto.
Integra-se com o sistema de aprovação existente do YAMI.
"""

from __future__ import annotations

import enum
import json
import logging
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Set

logger = logging.getLogger(__name__)


class PermissionLevel(enum.Enum):
    SAFE = "safe"
    NOTIFY = "notify"
    CONFIRM = "confirm"
    BLOCKED = "blocked"


ACTION_CLASSIFICATIONS: Dict[str, PermissionLevel] = {
    # Leitura / consulta — seguros
    "read_file": PermissionLevel.SAFE,
    "list_directory": PermissionLevel.SAFE,
    "get_file_info": PermissionLevel.SAFE,
    "search_files": PermissionLevel.SAFE,
    "list_processes": PermissionLevel.SAFE,
    "get_system_info": PermissionLevel.SAFE,
    "monitor_resources": PermissionLevel.SAFE,
    "screenshot": PermissionLevel.SAFE,
    "list_apps": PermissionLevel.SAFE,
    "list_windows": PermissionLevel.SAFE,
    "get_clipboard": PermissionLevel.SAFE,
    "check_network": PermissionLevel.SAFE,
    "list_devices": PermissionLevel.SAFE,
    "get_disk_usage": PermissionLevel.SAFE,
    # Ações moderadas — notificar
    "open_app": PermissionLevel.NOTIFY,
    "switch_window": PermissionLevel.NOTIFY,
    "navigate_folder": PermissionLevel.NOTIFY,
    "download_file": PermissionLevel.NOTIFY,
    "rename_file": PermissionLevel.NOTIFY,
    "move_file": PermissionLevel.NOTIFY,
    "copy_file": PermissionLevel.NOTIFY,
    "create_folder": PermissionLevel.NOTIFY,
    "run_script": PermissionLevel.NOTIFY,
    "fill_form": PermissionLevel.NOTIFY,
    "browser_navigate": PermissionLevel.NOTIFY,
    "close_app": PermissionLevel.NOTIFY,
    # Ações sensíveis — confirmar
    # Regra 2: Compartilhamento de arquivos exige confirmacao explicita
    "upload_file": PermissionLevel.CONFIRM,
    "share_file": PermissionLevel.CONFIRM,
    "delete_file": PermissionLevel.CONFIRM,
    "delete_folder": PermissionLevel.CONFIRM,
    "write_file": PermissionLevel.CONFIRM,
    "patch_file": PermissionLevel.CONFIRM,
    "execute_command": PermissionLevel.CONFIRM,
    "install_app": PermissionLevel.CONFIRM,
    "uninstall_app": PermissionLevel.CONFIRM,
    "kill_process": PermissionLevel.CONFIRM,
    "modify_registry": PermissionLevel.CONFIRM,
    "format_device": PermissionLevel.CONFIRM,
    "shutdown": PermissionLevel.CONFIRM,
    "restart": PermissionLevel.CONFIRM,
    "sleep": PermissionLevel.CONFIRM,
    "network_modify": PermissionLevel.CONFIRM,
    "manage_service": PermissionLevel.CONFIRM,
    "manage_startup": PermissionLevel.CONFIRM,
    # Bloqueado por padrão
    "modify_system_files": PermissionLevel.BLOCKED,
    "disable_security": PermissionLevel.BLOCKED,
}


@dataclass
class PermissionRequest:
    id: str = field(default_factory=lambda: f"perm-{uuid.uuid4().hex[:8]}")
    action: str = ""
    details: str = ""
    level: PermissionLevel = PermissionLevel.SAFE
    timestamp: float = field(default_factory=time.time)
    resolved: bool = False
    approved: bool = False
    session_approved: bool = False
    always_approved: bool = False


class PermissionManager:
    """Gerencia permissões para operações do sistema.

    Mantém cache de aprovações por sessão e permanentes,
    e integra com o sistema de aprovação existente do YAMI.
    """

    def __init__(
        self,
        approval_callback: Optional[Callable] = None,
        session_id: str = "",
        allow_permanent: bool = True,
    ):
        self._approval_callback = approval_callback
        self._session_id = session_id
        self._allow_permanent = allow_permanent
        self._session_approvals: Set[str] = set()
        self._always_approvals: Set[str] = set()
        self._history: List[PermissionRequest] = []
        self._auto_approve_safe: bool = True
        self._auto_notify: bool = True
        self._classifications: Dict[str, PermissionLevel] = dict(ACTION_CLASSIFICATIONS)

    def classify(self, action: str) -> PermissionLevel:
        return self._classifications.get(action, PermissionLevel.CONFIRM)

    def register_action(self, action: str, level: PermissionLevel):
        self._classifications[action] = level

    def request(
        self,
        action: str,
        details: str = "",
        session_key: str = "",
    ) -> PermissionRequest:
        level = self.classify(action)
        req = PermissionRequest(action=action, details=details, level=level)

        if level == PermissionLevel.SAFE and self._auto_approve_safe:
            req.resolved = True
            req.approved = True
            self._history.append(req)
            return req

        if level == PermissionLevel.NOTIFY and self._auto_notify:
            req.resolved = True
            req.approved = True
            self._history.append(req)
            return req

        if session_key:
            if session_key in self._always_approvals:
                req.resolved = True
                req.approved = True
                req.always_approved = True
                self._history.append(req)
                return req
            if session_key in self._session_approvals:
                req.resolved = True
                req.approved = True
                req.session_approved = True
                self._history.append(req)
                return req

        if level == PermissionLevel.BLOCKED:
            req.resolved = True
            req.approved = False
            self._history.append(req)
            return req

        if self._approval_callback:
            result = self._approval_callback(action, details)
            self._resolve_from_callback(req, result)
        else:
            req.resolved = True
            req.approved = True
            self._history.append(req)

        return req

    def _resolve_from_callback(self, req: PermissionRequest, result: Any):
        if isinstance(result, str):
            result = result.lower()
            if result in ("once", "allow_once"):
                req.resolved = True
                req.approved = True
            elif result in ("session", "allow_session"):
                req.resolved = True
                req.approved = True
                req.session_approved = True
            elif result in ("always", "allow_always"):
                req.resolved = True
                req.approved = True
                req.always_approved = True
            else:
                req.resolved = True
                req.approved = False
        elif isinstance(result, bool):
            req.resolved = True
            req.approved = result
        else:
            req.resolved = True
            req.approved = False

        if req.always_approved:
            self._always_approvals.add(req.action)
        if req.session_approved:
            self._session_approvals.add(req.action)

        self._history.append(req)

    def set_approval_callback(self, callback: Optional[Callable]):
        self._approval_callback = callback

    def clear_session_approvals(self):
        self._session_approvals.clear()

    def clear_always_approvals(self):
        self._always_approvals.clear()
