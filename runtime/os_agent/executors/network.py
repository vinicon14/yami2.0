"""Executor de operações de rede — downloads, uploads e conectividade.

Gerencia transferências de arquivos, verifica conectividade,
e integra-se com serviços externos (Google Photos, etc.).
"""

from __future__ import annotations

import logging
import os
import urllib.request
import urllib.parse
from pathlib import Path
from typing import Any, Dict, List, Optional

from .base import Executor

logger = logging.getLogger(__name__)


class NetworkExecutor(Executor):
    """Gerencia operações de download, upload e conectividade de rede."""

    def __init__(self, download_dir: Optional[str] = None):
        super().__init__(name="network")
        self._download_dir = download_dir or os.path.join(os.path.expanduser("~"), "Downloads")
        self._actions = {
            "download_file": "Baixar arquivo da internet",
            "check_connectivity": "Verificar conectividade com a internet",
            "resolve_url": "Resolver e validar uma URL",
        }

    def action_download_file(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        url = params.get("url", "")
        output = params.get("output", "")
        timeout = params.get("timeout", 60)

        if not url:
            raise ValueError("Parâmetro 'url' é obrigatório.")

        if not output:
            filename = url.split("/")[-1].split("?")[0] or "download"
            output = os.path.join(self._download_dir, filename)

        output_path = Path(output)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            logger.info("Baixando: %s → %s", url, output)
            urllib.request.urlretrieve(url, output)
            size = output_path.stat().st_size
            return {
                "success": True,
                "url": url,
                "file": str(output_path.absolute()),
                "size": size,
                "size_str": self._format_size(size),
            }
        except Exception as e:
            raise RuntimeError(f"Falha ao baixar '{url}': {e}")

    def action_check_connectivity(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        import socket
        hosts = params.get("hosts", ["google.com", "cloudflare.com", "github.com"])
        results = []
        for host in hosts:
            try:
                socket.setdefaulttimeout(5)
                socket.gethostbyname(host)
                results.append({"host": host, "reachable": True})
            except Exception:
                results.append({"host": host, "reachable": False})

        online = any(r["reachable"] for r in results)
        return {
            "online": online,
            "checks": results,
        }

    def action_resolve_url(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        url = params.get("url", "")
        if not url:
            raise ValueError("Parâmetro 'url' é obrigatório.")

        parsed = urllib.parse.urlparse(url)
        if not parsed.scheme:
            url = "https://" + url
            parsed = urllib.parse.urlparse(url)

        try:
            req = urllib.request.Request(url, method="HEAD")
            with urllib.request.urlopen(req, timeout=10) as resp:
                return {
                    "url": url,
                    "status": resp.status,
                    "headers": dict(resp.headers),
                    "resolved": resp.url,
                }
        except Exception as e:
            return {"url": url, "error": str(e), "resolved": url}

    def _format_size(self, bytes_val: int) -> str:
        for unit in ("B", "KB", "MB", "GB"):
            if bytes_val < 1024:
                return f"{bytes_val:.1f} {unit}"
            bytes_val /= 1024
        return f"{bytes_val:.1f} TB"
