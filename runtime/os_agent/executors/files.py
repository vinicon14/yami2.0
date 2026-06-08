"""Executor de operações com arquivos e pastas.

Criar, mover, copiar, renomear, organizar arquivos e navegar pelo sistema.
Usa operações nativas do sistema e wrappers seguros.
"""

from __future__ import annotations

import logging
import os
import shutil
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from .base import Executor

logger = logging.getLogger(__name__)


class FileExecutor(Executor):
    """Gerencia arquivos e pastas no sistema de arquivos local."""

    def __init__(self, safe_mode: bool = True, restricted_paths: Optional[List[str]] = None):
        super().__init__(name="files")
        self._safe_mode = safe_mode
        self._restricted_paths = restricted_paths or []
        self._actions = {
            "list_directory": "Listar conteúdo de uma pasta",
            "read_file": "Ler conteúdo de um arquivo",
            "write_file": "Escrever/escrever conteúdo em um arquivo",
            "create_folder": "Criar uma nova pasta",
            "delete_file": "Remover um arquivo",
            "delete_folder": "Remover uma pasta e seu conteúdo",
            "copy_file": "Copiar arquivo ou pasta",
            "move_file": "Mover arquivo ou pasta",
            "rename_file": "Renomear arquivo ou pasta",
            "get_file_info": "Obter informações detalhadas do arquivo",
            "search_files": "Buscar arquivos por padrão",
            "get_disk_usage": "Obter uso de disco",
        }

    def validate(self, action: str, params: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        valid, error = super().validate(action, params)
        if not valid:
            return valid, error

        path = params.get("path") or params.get("source") or ""
        if path and self._safe_mode:
            resolved = os.path.abspath(os.path.expanduser(path))
            for restricted in self._restricted_paths:
                if resolved.startswith(os.path.abspath(restricted)):
                    return False, f"Caminho '{resolved}' está na lista de restrição."
            return True, None
        return True, None

    def action_list_directory(self, params: Dict[str, Any], context: Dict) -> List[Dict[str, Any]]:
        path = os.path.expanduser(params.get("path", "."))
        p = Path(path)
        if not p.exists():
            raise FileNotFoundError(f"Pasta não encontrada: {path}")
        if not p.is_dir():
            raise NotADirectoryError(f"Não é uma pasta: {path}")

        entries = []
        for entry in sorted(p.iterdir()):
            try:
                stat = entry.stat()
                entries.append({
                    "name": entry.name,
                    "path": str(entry.absolute()),
                    "type": "folder" if entry.is_dir() else "file",
                    "size": stat.st_size,
                    "modified": stat.st_mtime,
                })
            except PermissionError:
                entries.append({"name": entry.name, "path": str(entry.absolute()), "error": "sem permissão"})
        return entries

    def action_read_file(self, params: Dict[str, Any], context: Dict) -> str:
        path = os.path.expanduser(params.get("path", ""))
        if not path:
            raise ValueError("Parâmetro 'path' é obrigatório.")
        p = Path(path)
        if not p.exists():
            raise FileNotFoundError(f"Arquivo não encontrado: {path}")
        if not p.is_file():
            raise IsADirectoryError(f"É uma pasta, não um arquivo: {path}")

        limit = params.get("limit", 0)
        offset = params.get("offset", 0)
        encoding = params.get("encoding", "utf-8")

        with open(p, encoding=encoding, errors="replace") as f:
            if offset > 0:
                for _ in range(offset):
                    next(f, None)
            if limit > 0:
                lines = [next(f, None) for _ in range(limit)]
                return "".join(l for l in lines if l is not None)
            return f.read()

    def action_write_file(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        path = os.path.expanduser(params.get("path", ""))
        content = params.get("content", "")
        if not path:
            raise ValueError("Parâmetro 'path' é obrigatório.")
        mode = params.get("mode", "write")
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)

        if mode == "append":
            with open(p, "a", encoding="utf-8") as f:
                f.write(content)
        else:
            p.write_text(content, encoding="utf-8")

        return {"success": True, "path": str(p.absolute()), "size": len(content)}

    def action_create_folder(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        path = os.path.expanduser(params.get("path", ""))
        if not path:
            raise ValueError("Parâmetro 'path' é obrigatório.")
        p = Path(path)
        p.mkdir(parents=True, exist_ok=True)
        return {"success": True, "path": str(p.absolute())}

    def action_delete_file(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        path = os.path.expanduser(params.get("path", ""))
        if not path:
            raise ValueError("Parâmetro 'path' é obrigatório.")
        p = Path(path)
        if not p.exists():
            raise FileNotFoundError(f"Arquivo não encontrado: {path}")
        if p.is_dir():
            raise IsADirectoryError(f"É uma pasta. Use delete_folder para remover pastas: {path}")
        os.remove(p)
        return {"success": True, "path": str(p.absolute())}

    def action_delete_folder(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        path = os.path.expanduser(params.get("path", ""))
        if not path:
            raise ValueError("Parâmetro 'path' é obrigatório.")
        p = Path(path)
        if not p.exists():
            raise FileNotFoundError(f"Pasta não encontrada: {path}")
        shutil.rmtree(p)
        return {"success": True, "path": str(p.absolute())}

    def action_copy_file(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        source = os.path.expanduser(params.get("source") or params.get("path", ""))
        dest = os.path.expanduser(params.get("destination", ""))
        if not source or not dest:
            raise ValueError("Parâmetros 'source' e 'destination' são obrigatórios.")
        src = Path(source)
        dst = Path(dest)
        if src.is_dir():
            shutil.copytree(src, dst, dirs_exist_ok=True)
        else:
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
        return {"success": True, "source": str(src.absolute()), "destination": str(dst.absolute())}

    def action_move_file(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        source = os.path.expanduser(params.get("source") or params.get("path", ""))
        dest = os.path.expanduser(params.get("destination", ""))
        if not source or not dest:
            raise ValueError("Parâmetros 'source' e 'destination' são obrigatórios.")
        src = Path(source)
        dst = Path(dest)
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(src), str(dst))
        return {"success": True, "source": str(src.absolute()), "destination": str(dst.absolute())}

    def action_rename_file(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        path = os.path.expanduser(params.get("path", ""))
        new_name = params.get("new_name", "")
        if not path or not new_name:
            raise ValueError("Parâmetros 'path' e 'new_name' são obrigatórios.")
        p = Path(path)
        new_path = p.parent / new_name
        p.rename(new_path)
        return {"success": True, "old": str(p.absolute()), "new": str(new_path.absolute())}

    def action_get_file_info(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        path = os.path.expanduser(params.get("path", ""))
        if not path:
            raise ValueError("Parâmetro 'path' é obrigatório.")
        p = Path(path)
        if not p.exists():
            raise FileNotFoundError(f"Arquivo não encontrado: {path}")
        stat = p.stat()
        return {
            "path": str(p.absolute()),
            "name": p.name,
            "type": "folder" if p.is_dir() else "file",
            "size": stat.st_size,
            "created": stat.st_ctime,
            "modified": stat.st_mtime,
            "parent": str(p.parent),
            "extension": p.suffix,
        }

    def action_search_files(self, params: Dict[str, Any], context: Dict) -> List[Dict[str, Any]]:
        pattern = params.get("pattern", "*")
        path = os.path.expanduser(params.get("path", "."))
        p = Path(path)
        if not p.exists():
            raise FileNotFoundError(f"Pasta não encontrada: {path}")
        results = []
        for f in p.rglob(pattern):
            if f.is_file():
                results.append({
                    "name": f.name,
                    "path": str(f.absolute()),
                    "size": f.stat().st_size,
                })
        return results

    def action_get_disk_usage(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        path = os.path.expanduser(params.get("path", "/"))
        usage = shutil.disk_usage(path)
        return {
            "total": usage.total,
            "used": usage.used,
            "free": usage.free,
            "percent_used": round((usage.used / usage.total) * 100, 1) if usage.total else 0,
        }

    def observe(self) -> Dict[str, Any]:
        cwd = os.getcwd()
        entries = []
        try:
            for e in os.scandir(cwd):
                entries.append({"name": e.name, "type": "folder" if e.is_dir() else "file"})
        except PermissionError:
            pass
        return {"cwd": cwd, "entries_count": len(entries), "entries": entries[:20]}
