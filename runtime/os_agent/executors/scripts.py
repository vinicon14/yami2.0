"""Executor de scripts e automações.

Executa scripts autorizados (PowerShell, Python, shell, etc.),
gerencia tarefas agendadas e processos em background.
"""

from __future__ import annotations

import logging
import os
import subprocess
import sys
import tempfile
from typing import Any, Dict, List, Optional, Tuple

from .base import Executor

logger = logging.getLogger(__name__)


class ScriptExecutor(Executor):
    """Executa scripts e comandos shell no sistema operacional."""

    def __init__(self, allowed_paths: Optional[List[str]] = None):
        super().__init__(name="scripts")
        self._allowed_paths = allowed_paths or []
        self._session_vars: Dict[str, Any] = {}
        self._actions = {
            "execute_command": "Executar um comando no terminal",
            "run_script": "Executar um script (ps1, py, sh, bat, etc.)",
            "run_python": "Executar código Python",
            "run_powershell": "Executar comando PowerShell",
        }

    def validate(self, action: str, params: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        valid, error = super().validate(action, params)
        if not valid:
            return valid, error

        script_path = params.get("path", "")
        if script_path and self._allowed_paths:
            resolved = os.path.abspath(os.path.expanduser(script_path))
            allowed = False
            for ap in self._allowed_paths:
                if resolved.startswith(os.path.abspath(os.path.expanduser(ap))):
                    allowed = True
                    break
            if not allowed:
                return False, f"Script '{resolved}' não está em caminho permitido."
        return True, None

    def action_execute_command(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        command = params.get("command", "")
        workdir = params.get("workdir") or os.getcwd()
        timeout = params.get("timeout", 30)
        env = {**os.environ, **(params.get("env", {}))}

        if not command:
            raise ValueError("Parâmetro 'command' é obrigatório.")

        try:
            result = subprocess.run(
                command,
                shell=True,
                cwd=workdir,
                env=env,
                capture_output=True,
                text=True,
                timeout=timeout,
            )
            return {
                "success": result.returncode == 0,
                "exit_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "command": command,
                "workdir": workdir,
            }
        except subprocess.TimeoutExpired:
            raise TimeoutError(f"Comando excedeu {timeout}s: {command[:100]}")
        except Exception as e:
            raise RuntimeError(f"Falha ao executar comando: {e}")

    def action_run_script(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        path = params.get("path", "")
        args = params.get("args", "")
        timeout = params.get("timeout", 60)
        workdir = params.get("workdir") or os.path.dirname(path) or os.getcwd()

        if not path:
            raise ValueError("Parâmetro 'path' é obrigatório.")

        resolved = os.path.abspath(os.path.expanduser(path))
        if not os.path.exists(resolved):
            raise FileNotFoundError(f"Script não encontrado: {resolved}")

        ext = os.path.splitext(resolved)[1].lower()
        try:
            if ext in (".ps1",):
                cmd = ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", resolved]
                if args:
                    cmd.extend(args.split() if isinstance(args, str) else args)
            elif ext in (".py",):
                cmd = [sys.executable, resolved]
                if args:
                    cmd.extend(args.split() if isinstance(args, str) else args)
            elif ext in (".bat", ".cmd"):
                cmd = [resolved]
                if args:
                    cmd.extend(args.split() if isinstance(args, str) else args)
            else:
                cmd = [resolved]
                if args:
                    cmd.extend(args.split() if isinstance(args, str) else args)

            result = subprocess.run(cmd, cwd=workdir, capture_output=True, text=True, timeout=timeout)
            return {
                "success": result.returncode == 0,
                "exit_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "path": resolved,
            }
        except subprocess.TimeoutExpired:
            raise TimeoutError(f"Script excedeu {timeout}s: {resolved}")
        except Exception as e:
            raise RuntimeError(f"Falha ao executar script: {e}")

    def action_run_python(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        code = params.get("code", "")
        timeout = params.get("timeout", 30)

        if not code:
            raise ValueError("Parâmetro 'code' é obrigatório.")

        temp = tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8")
        try:
            temp.write(code)
            temp.close()
            result = subprocess.run(
                [sys.executable, temp.name],
                capture_output=True, text=True, timeout=timeout,
            )
            return {
                "success": result.returncode == 0,
                "exit_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
            }
        except subprocess.TimeoutExpired:
            raise TimeoutError(f"Código Python excedeu {timeout}s.")
        except Exception as e:
            raise RuntimeError(f"Falha ao executar Python: {e}")
        finally:
            try:
                os.unlink(temp.name)
            except OSError:
                pass

    def action_run_powershell(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        command = params.get("command", "")
        timeout = params.get("timeout", 30)

        if not command:
            raise ValueError("Parâmetro 'command' é obrigatório.")

        try:
            result = subprocess.run(
                ["powershell", "-NoProfile", "-Command", command],
                capture_output=True, text=True, timeout=timeout,
            )
            return {
                "success": result.returncode == 0,
                "exit_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
            }
        except subprocess.TimeoutExpired:
            raise TimeoutError(f"PowerShell excedeu {timeout}s.")
        except Exception as e:
            raise RuntimeError(f"Falha ao executar PowerShell: {e}")
