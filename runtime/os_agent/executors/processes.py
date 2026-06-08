"""Executor de monitoramento e gerenciamento de processos e recursos do sistema.

Lista processos, monitora CPU/memória/disco, obtém informações do sistema.
"""

from __future__ import annotations

import logging
import os
import platform
import subprocess
import sys
import time
from typing import Any, Dict, List, Optional

from .base import Executor

logger = logging.getLogger(__name__)


class ProcessExecutor(Executor):
    """Monitora e gerencia processos e recursos do sistema."""

    def __init__(self):
        super().__init__(name="processes")
        self._actions = {
            "list_processes": "Listar processos em execução",
            "kill_process": "Encerrar um processo",
            "get_system_info": "Obter informações detalhadas do sistema",
            "monitor_resources": "Monitorar uso de CPU, memória e disco",
        }

    def action_list_processes(self, params: Dict[str, Any], context: Dict) -> List[Dict[str, Any]]:
        sort_by = params.get("sort", "cpu")
        limit = params.get("limit", 20)
        filter_str = params.get("filter", "")

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
                    if len(parts) >= 5:
                        proc = {
                            "name": parts[0],
                            "pid": parts[1],
                            "session": parts[2],
                            "session_num": parts[3],
                            "mem_usage": parts[4],
                        }
                        if not filter_str or filter_str.lower() in proc["name"].lower():
                            processes.append(proc)
            else:
                result = subprocess.run(
                    ["ps", "aux", "--no-headers"],
                    capture_output=True, text=True, timeout=15,
                )
                for line in result.stdout.strip().splitlines():
                    parts = line.split(None, 10)
                    if len(parts) >= 11:
                        proc = {
                            "user": parts[0],
                            "pid": parts[1],
                            "cpu": float(parts[2]),
                            "mem": float(parts[3]),
                            "vsz": parts[4],
                            "rss": parts[5],
                            "tty": parts[6],
                            "stat": parts[7],
                            "start": parts[8],
                            "time": parts[9],
                            "name": parts[10],
                        }
                        if not filter_str or filter_str.lower() in proc["name"].lower():
                            processes.append(proc)
        except Exception as e:
            logger.error("Erro ao listar processos: %s", e)
            return [{"error": str(e)}]

        if sort_by == "cpu" and processes and "cpu" in processes[0]:
            processes.sort(key=lambda p: p.get("cpu", 0), reverse=True)
        elif sort_by == "mem" and processes and "mem" in processes[0]:
            processes.sort(key=lambda p: p.get("mem", 0), reverse=True)
        elif sort_by == "name":
            processes.sort(key=lambda p: p.get("name", ""))

        return processes[:limit]

    def action_kill_process(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        pid = params.get("pid")
        name = params.get("name", "")

        if not pid and not name:
            raise ValueError("Parâmetro 'pid' ou 'name' é obrigatório.")

        try:
            if pid:
                os.kill(int(pid), 9)
                return {"success": True, "pid": pid, "action": "killed"}
            else:
                if sys.platform == "win32":
                    subprocess.run(["taskkill", "/F", "/IM", name], capture_output=True, text=True, timeout=10, check=True)
                elif sys.platform == "darwin":
                    subprocess.run(["pkill", "-9", "-x", name], capture_output=True, text=True, timeout=10, check=True)
                else:
                    subprocess.run(["pkill", "-9", "-f", name], capture_output=True, text=True, timeout=10, check=True)
                return {"success": True, "name": name, "action": "killed"}
        except subprocess.TimeoutExpired:
            raise TimeoutError(f"Timeout ao encerrar processo '{name or pid}'.")
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Falha ao encerrar processo: {e}")

    def action_get_system_info(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        uname = platform.uname()
        info = {
            "system": uname.system,
            "node": uname.node,
            "release": uname.release,
            "version": uname.version,
            "machine": uname.machine,
            "processor": uname.processor,
            "platform": sys.platform,
            "python_version": sys.version,
            "cpu_count": os.cpu_count(),
            "pid": os.getpid(),
        }

        try:
            import psutil
            info["cpu_percent"] = psutil.cpu_percent(interval=0.5)
            info["cpu_freq"] = psutil.cpu_freq()._asdict() if psutil.cpu_freq() else None
            mem = psutil.virtual_memory()
            info["memory"] = {"total": mem.total, "available": mem.available, "percent": mem.percent, "used": mem.used}
            disk = psutil.disk_usage("/")
            info["disk"] = {"total": disk.total, "used": disk.used, "free": disk.free, "percent": disk.percent}
            info["boot_time"] = psutil.boot_time()
        except ImportError:
            logger.info("psutil não disponível — informações parciais do sistema.")

        return info

    def action_monitor_resources(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        duration = params.get("duration", 3)
        interval = params.get("interval", 1)

        try:
            import psutil
        except ImportError:
            return {"error": "psutil não instalado. Use: pip install psutil", "cpu_count": os.cpu_count()}

        samples = []
        for _ in range(max(1, int(duration / interval))):
            samples.append({
                "cpu_percent": psutil.cpu_percent(interval=interval),
                "memory": psutil.virtual_memory()._asdict(),
                "disk_io": psutil.disk_io_counters()._asdict() if psutil.disk_io_counters() else None,
                "net_io": psutil.net_io_counters()._asdict() if psutil.net_io_counters() else None,
            })

        if samples:
            avg_cpu = sum(s["cpu_percent"] for s in samples) / len(samples)
            avg_mem = sum(s["memory"]["percent"] for s in samples) / len(samples)
        else:
            avg_cpu = 0
            avg_mem = 0

        return {
            "samples": len(samples),
            "avg_cpu_percent": round(avg_cpu, 1),
            "avg_memory_percent": round(avg_mem, 1),
            "last_sample": samples[-1] if samples else {},
        }
