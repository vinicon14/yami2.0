"""Executor de interação com navegadores.

Navega, preenche formulários, extrai conteúdo e gerencia abas.
Integra-se com o sistema de navegador existente do YAMI.
"""

from __future__ import annotations

import json
import logging
import subprocess
import sys
import time
import urllib.parse
from typing import Any, Dict, List, Optional

from .base import Executor

logger = logging.getLogger(__name__)


class BrowserExecutor(Executor):
    """Interage com navegadores web (Chrome, Firefox, Edge)."""

    def __init__(self, default_browser: str = "chrome", debug_port: int = 9222):
        super().__init__(name="browser")
        self._default_browser = default_browser
        self._debug_port = debug_port
        self._actions = {
            "navigate": "Navegar para uma URL",
            "get_tabs": "Listar abas abertas",
            "execute_js": "Executar JavaScript na página",
            "get_page_info": "Obter título e URL da página atual",
            "search_web": "Pesquisar na web",
        }

    def action_navigate(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        url = params.get("url", "")
        browser = params.get("browser", self._default_browser)

        if not url:
            raise ValueError("Parâmetro 'url' é obrigatório.")

        parsed = urllib.parse.urlparse(url)
        if not parsed.scheme:
            url = "https://" + url

        try:
            if sys.platform == "win32":
                if browser == "chrome":
                    chrome_paths = [
                        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
                        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
                        os.path.join(os.environ.get("LOCALAPPDATA", ""), "Google\\Chrome\\Application\\chrome.exe"),
                    ]
                    for cp in chrome_paths:
                        if os.path.exists(cp):
                            subprocess.Popen([cp, f"--new-window={url}"], start_new_session=True)
                            return {"success": True, "url": url, "browser": browser}
                elif browser == "edge":
                    edge_paths = [
                        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
                        os.path.join(os.environ.get("LOCALAPPDATA", ""), "Microsoft\\Edge\\Application\\msedge.exe"),
                    ]
                    for ep in edge_paths:
                        if os.path.exists(ep):
                            subprocess.Popen([ep, url], start_new_session=True)
                            return {"success": True, "url": url, "browser": browser}
                os.startfile(url)
            elif sys.platform == "darwin":
                subprocess.Popen(["open", url], start_new_session=True)
            else:
                subprocess.Popen(["xdg-open", url], start_new_session=True)
            return {"success": True, "url": url, "browser": browser}
        except Exception as e:
            raise RuntimeError(f"Falha ao navegar para {url}: {e}")

    def action_get_tabs(self, params: Dict[str, Any], context: Dict) -> List[Dict[str, Any]]:
        try:
            import requests
            resp = requests.get(f"http://127.0.0.1:{self._debug_port}/json", timeout=5)
            tabs = resp.json()
            return [
                {"id": t.get("id"), "title": t.get("title"), "url": t.get("url"), "active": t.get("type") == "page"}
                for t in tabs
                if t.get("type") == "page"
            ]
        except ImportError:
            return [{"error": "requests não instalado. Use: pip install requests"}]
        except Exception as e:
            logger.warning("Falha ao listar abas via CDP: %s", e)
            return [{"error": str(e)}]

    def action_execute_js(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        code = params.get("code", "")
        tab_id = params.get("tab_id", "")

        if not code:
            raise ValueError("Parâmetro 'code' é obrigatório.")

        try:
            import requests
            tabs = requests.get(f"http://127.0.0.1:{self._debug_port}/json", timeout=5).json()
            target = None

            if tab_id:
                for t in tabs:
                    if t.get("id") == tab_id:
                        target = t
                        break
            if not target:
                for t in tabs:
                    if t.get("type") == "page":
                        target = t
                        break
            if not target:
                raise RuntimeError("Nenhuma aba de navegador encontrada via CDP.")

            ws_url = target.get("webSocketDebuggerUrl")
            if not ws_url:
                raise RuntimeError("Navegador não está com depuração remota habilitada.")

            from websocket import create_connection
            ws = create_connection(ws_url, timeout=10)
            cmd_id = 1
            ws.send(json.dumps({"id": cmd_id, "method": "Runtime.evaluate", "params": {"expression": code}}))
            resp = ws.recv()
            ws.close()
            result = json.loads(resp)
            return {"success": True, "result": result.get("result", {})}
        except ImportError as e:
            return {"error": f"Biblioteca necessária: {e}"}
        except Exception as e:
            return {"error": str(e)}

    def action_get_page_info(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        try:
            import requests
            tabs = requests.get(f"http://127.0.0.1:{self._debug_port}/json", timeout=5).json()
            for t in tabs:
                if t.get("type") == "page":
                    return {"title": t.get("title", ""), "url": t.get("url", ""), "id": t.get("id", "")}
            return {"error": "Nenhuma aba de página encontrada."}
        except Exception as e:
            return {"error": str(e)}

    def action_search_web(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        query = params.get("query", "")
        if not query:
            raise ValueError("Parâmetro 'query' é obrigatório.")

        encoded = urllib.parse.quote(query)
        search_url = f"https://www.google.com/search?q={encoded}"
        return self.action_navigate({"url": search_url, "browser": params.get("browser", self._default_browser)}, context)
