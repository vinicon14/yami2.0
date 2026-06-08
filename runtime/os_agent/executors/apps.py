"""Executor de gerenciamento de aplicativos.

Abrir, fechar e alternar entre aplicativos instalados no sistema.
Usa comandos nativos de cada plataforma.
"""

from __future__ import annotations

import logging
import os
import shutil
import subprocess
import sys
from typing import Any, Dict, List, Optional, Tuple

from .base import Executor

logger = logging.getLogger(__name__)


class AppExecutor(Executor):
    """Gerencia o ciclo de vida de aplicativos no sistema."""

    def __init__(self, app_paths: Optional[Dict[str, str]] = None):
        super().__init__(name="apps")
        self._app_paths = app_paths or {}
        self._actions = {
            "open_app": "Abrir um aplicativo",
            "close_app": "Fechar um aplicativo",
            "list_apps": "Listar aplicativos em execução",
            "switch_app": "Alternar para um aplicativo",
        }

    def action_open_app(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        name = params.get("name", "")
        path = params.get("path", "")

        if not name and not path:
            raise ValueError("Parâmetro 'name' ou 'path' é obrigatório.")

        if not path:
            path = self._resolve_app_path(name)

        if not path:
            raise FileNotFoundError(f"Aplicativo '{name}' não encontrado. Forneça o caminho ou registre em app_paths.")

        try:
            if sys.platform == "win32":
                os.startfile(path)
            elif sys.platform == "darwin":
                subprocess.Popen(["open", path], start_new_session=True)
            else:
                subprocess.Popen([path], start_new_session=True)
            return {"success": True, "app": name or path}
        except Exception as e:
            raise RuntimeError(f"Falha ao abrir '{name}': {e}")

    def action_close_app(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        name = params.get("name", "")
        if not name:
            raise ValueError("Parâmetro 'name' é obrigatório.")

        try:
            if sys.platform == "win32":
                subprocess.run(["taskkill", "/IM", name, "/F"], capture_output=True, text=True, timeout=10)
            elif sys.platform == "darwin":
                subprocess.run(["pkill", "-x", name], capture_output=True, text=True, timeout=10)
            else:
                subprocess.run(["pkill", "-f", name], capture_output=True, text=True, timeout=10)
            return {"success": True, "app": name}
        except subprocess.TimeoutExpired:
            raise TimeoutError(f"Timeout ao fechar '{name}'.")
        except Exception as e:
            raise RuntimeError(f"Falha ao fechar '{name}': {e}")

    def action_list_apps(self, params: Dict[str, Any], context: Dict) -> List[Dict[str, Any]]:
        processes = []
        try:
            if sys.platform == "win32":
                result = subprocess.run(
                    ["tasklist", "/FO", "CSV", "/NH"],
                    capture_output=True, text=True, timeout=15,
                )
                for line in result.stdout.strip().splitlines():
                    if not line:
                        continue
                    parts = line.strip('"').split('","')
                    if len(parts) >= 2:
                        processes.append({"name": parts[0], "pid": parts[1]})
            else:
                result = subprocess.run(
                    ["ps", "aux", "--no-headers"],
                    capture_output=True, text=True, timeout=15,
                )
                for line in result.stdout.strip().splitlines():
                    parts = line.split(None, 10)
                    if len(parts) >= 11:
                        processes.append({"name": parts[10], "pid": parts[1], "cpu": parts[2], "mem": parts[3]})
        except Exception as e:
            logger.warning("Erro ao listar processos: %s", e)
        return processes

    def action_switch_app(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        name = params.get("name", "")
        if not name:
            raise ValueError("Parâmetro 'name' é obrigatório.")
        try:
            if sys.platform == "win32":
                subprocess.run(["powershell", "-Command", f"(New-Object -ComObject Shell.Application).Windows() | Where-Object {{ $_.LocationName -like '*{name}*' }} | ForEach-Object {{ $_.Visible = $true; $_.Focus() }}"], capture_output=True, timeout=10)
            return {"success": True, "app": name, "action": "switch"}
        except Exception as e:
            logger.warning("Falha ao alternar para '%s': %s", name, e)
            return {"success": False, "app": name, "error": str(e)}

    def _resolve_app_path(self, name: str) -> str:
        if name in self._app_paths:
            return self._app_paths[name]
        which = shutil.which(name)
        if which:
            return which
        if sys.platform == "win32":
            extensions = [".exe", ".com", ".bat", ".cmd"]
            for ext in extensions:
                path = shutil.which(name + ext)
                if path:
                    return path
            program_files = [
                os.environ.get("ProgramFiles", "C:\\Program Files"),
                os.environ.get("ProgramFiles(x86)", "C:\\Program Files (x86)"),
                os.environ.get("LocalAppData", ""),
            ]
            for pf in program_files:
                for root, dirs, files in os.walk(pf):
                    for f in files:
                        if f.lower().startswith(name.lower()) and any(f.lower().endswith(ext) for ext in extensions):
                            return os.path.join(root, f)
                    if len(list(os.walk(pf))) > 100:
                        break
        return ""
