"""Demonstracao e validacao da arquitetura do OS Agent YAMI.

Executa um ciclo completo de planejamento e execucao simulada
para verificar a integridade de todos os modulos.

Uso:
    python -m runtime.os_agent
"""

from __future__ import annotations

import json
import sys
import time

from .core.orchestrator import Orchestrator
from .core.permissions import PermissionManager, ACTION_CLASSIFICATIONS
from .core.planner import Planner
from .executors.files import FileExecutor
from .executors.apps import AppExecutor
from .executors.processes import ProcessExecutor
from .executors.windows import WindowExecutor
from .executors.scripts import ScriptExecutor
from .executors.browser import BrowserExecutor
from .executors.network import NetworkExecutor
from .observer.monitor import SystemMonitor
from .recovery.error_handler import ErrorHandler


def main():
    print("=" * 60)
    print("  YAMI - OS Agent Architecture Verification")
    print("=" * 60)

    # 1. Permission Manager
    print("\n[1/7] PermissionManager...")
    pm = PermissionManager(allow_permanent=False)
    for action in ("read_file", "delete_file", "disable_security"):
        perm = pm.request(action, "Test: %s" % action)
        print("  %-25s -> level=%-10s approved=%s" % (perm.action, perm.level.value, perm.approved))
    assert pm.request("list_directory").approved
    assert not pm.request("disable_security").approved
    print("  [OK] PermissionManager")

    # 2. Planner
    print("\n[2/7] Planner...")
    planner = Planner(permission_manager=pm)
    tests = [
        "abrir o Chrome",
        "listar arquivos da pasta C:\\Users",
        "fechar o bloco de notas",
        "criar pasta chamada teste",
        "baixar https://example.com/file.zip",
    ]
    for cmd in tests:
        plan = planner.plan(cmd)
        actions = [s.action + "(" + s.executor + ")" for s in plan.steps]
        print("  '%-40s' -> %s" % (cmd[:40], actions))
    print("  [OK] Planner")

    # 3. Executors
    print("\n[3/7] Executors...")
    executors = {
        "files": FileExecutor(),
        "apps": AppExecutor(),
        "processes": ProcessExecutor(),
        "windows": WindowExecutor(),
        "scripts": ScriptExecutor(),
        "browser": BrowserExecutor(),
        "network": NetworkExecutor(),
    }
    for name, ex in executors.items():
        actions = ex.list_actions()
        preview = ", ".join(actions[:4])
        if len(actions) > 4:
            preview += "..."
        print("  %-12s -> %d actions: %s" % (name, len(actions), preview))
    print("  [OK] All executors loaded")

    # 4. System Monitor
    print("\n[4/7] SystemMonitor...")
    monitor = SystemMonitor()
    snapshot = monitor.snapshot()
    print("  platform=%s  cwd=%s" % (snapshot.platform, snapshot.cwd))
    context = monitor.get_context()
    print("  cpu=%s%%  mem=%s%%  disk=%s%%" % (context.get("cpu"), context.get("memory"), context.get("disk")))
    print("  [OK] SystemMonitor")

    # 5. Error Handler
    print("\n[5/7] ErrorHandler...")
    eh = ErrorHandler()
    test_errors = [
        ("read_file", {"path": "/nonexistent"}, FileNotFoundError("Arquivo nao encontrado")),
        ("execute_command", {"command": "slow-task"}, TimeoutError("Timeout de 30s")),
    ]
    for action, params, err in test_errors:
        plan = eh.handle(action, params, err)
        print("  %-20s attempt=1 -> strategy=%-12s retry=%s" % (action, plan.strategy.value, plan.should_retry))
        if plan.should_retry:
            plan2 = eh.handle(action, params, err, attempt=2)
            print("  %-20s attempt=2 -> strategy=%-12s retry=%s" % (action, plan2.strategy.value, plan2.should_retry))
    print("  [OK] ErrorHandler")

    # 6. Orchestrator (dry-run)
    print("\n[6/7] Orchestrator (dry-run)...")
    orch = Orchestrator(permission_manager=pm, planner=planner)
    orch.register_executors(executors)
    result = orch.execute("abrir o Chrome e listar o diretorio atual", dry_run=True)
    print("  plan_id=%s  steps=%d" % (result.plan.id, len(result.plan.steps)))
    for i, step in enumerate(result.plan.steps, 1):
        print("    %d. %s [%s @ %s]" % (i, step.description, step.action, step.executor))
    print("  summary=%s" % result.summary)
    print("  [OK] Orchestrator (dry-run)")

    # 7. Full architecture summary
    print("\n[7/7] Architecture Summary")
    print("  Modules: core, executors (7), observer, recovery, config")
    print("  Registered actions: %d" % len(ACTION_CLASSIFICATIONS))
    print("  Permission levels: safe, notify, confirm, blocked")
    print("  Recovery strategies: retry, fallback, simplify, notify, abort")
    print("  Executors: files, apps, processes, windows, scripts, browser, network")

    print("\n" + "=" * 60)
    print("  [OK] YAMI OS Agent architecture verified successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()
