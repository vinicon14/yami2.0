"""Interface de linha de comando para o OS Agent.

Uso:
    python -m runtime.os_agent.cli execute "abrir chrome"
    python -m runtime.os_agent.cli explain "criar pasta"
    python -m runtime.os_agent.cli plan "listar arquivos"
    python -m runtime.os_agent.cli interactive
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import Optional

from .core.orchestrator import Orchestrator
from .core.permissions import PermissionManager
from .core.planner import Planner
from .executors import (
    FileExecutor, AppExecutor, ProcessExecutor,
    WindowExecutor, ScriptExecutor, BrowserExecutor, NetworkExecutor
)
from .observer.monitor import SystemMonitor


class OSAgentCLI:
    """Interface CLI para o OS Agent."""

    def __init__(self, verbose: bool = False, dry_run: bool = False):
        self.verbose = verbose
        self.dry_run = dry_run

        self.pm = PermissionManager(allow_permanent=not dry_run)
        self.planner = Planner(permission_manager=self.pm)
        self.orch = Orchestrator(
            permission_manager=self.pm,
            planner=self.planner,
            on_step_start=self._on_step_start,
            on_step_complete=self._on_step_complete,
            on_error=self._on_error,
        )

        self.orch.register_executors({
            "files": FileExecutor(),
            "apps": AppExecutor(),
            "processes": ProcessExecutor(),
            "windows": WindowExecutor(),
            "scripts": ScriptExecutor(),
            "browser": BrowserExecutor(),
            "network": NetworkExecutor(),
        })

        self.monitor = SystemMonitor()

    def _on_step_start(self, step):
        if self.verbose:
            print(f"[INICIANDO] {step.description}")

    def _on_step_complete(self, step, success, message):
        status = "OK" if success else "FALHA"
        if self.verbose:
            print(f"[{status}] {step.description}")
            if not success and message:
                print(f"        {message}")

    def _on_error(self, plan, error):
        print(f"[ERRO] {error}")

    def execute(self, command: str) -> int:
        """Executar comando."""
        print(f"Executando: {command}")

        before = self.monitor.snapshot()
        result = self.orch.execute(command, dry_run=self.dry_run)
        after = self.monitor.snapshot()

        print(f"\n{result.summary_text(verbose=self.verbose)}")

        if result.plan.steps:
            print("\nDetalhes dos passos:")
            for i, (step, success, msg) in enumerate(result.step_results, 1):
                icon = "[OK]" if success else "[FAIL]"
                print(f"  {i}. {icon} {step.action} - {step.duration_ms:.0f}ms")
                if msg and (not success or self.verbose):
                    print(f"     {msg[:100]}")

        changes = self.monitor.diff(before, after)
        if changes and self.verbose:
            print("\nMudancas no sistema:")
            for key, delta in changes.items():
                print(f"  {key}: {delta['before']} -> {delta['after']}")

        return 0 if result.success else 1

    def explain(self, command: str) -> int:
        """Explicar plano sem executar."""
        print(f"Explicacao do plano: {command}\n")
        explanation = self.orch.explain_plan(command)
        print(explanation)
        return 0

    def plan(self, command: str) -> int:
        """Mostrar plano em JSON."""
        plan = self.planner.plan(command)
        data = {
            "command": command,
            "plan_id": plan.id,
            "steps": [
                {
                    "id": s.id,
                    "action": s.action,
                    "executor": s.executor,
                    "description": s.description,
                    "params": s.params,
                    "depends_on": s.depends_on,
                    "can_parallel": s.can_parallel,
                }
                for s in plan.steps
            ],
            "parallel_groups": plan.parallel_groups,
            "requires_confirmation": plan.requires_confirmation,
        }
        print(json.dumps(data, indent=2, ensure_ascii=False))
        return 0

    def interactive(self) -> int:
        """Modo interativo."""
        print("=" * 60)
        print("YAMI - OS Agent CLI (Modo Interativo)")
        print("=" * 60)
        print("\nComandos disponiveis:")
        print("  execute <comando>  - Executar comando")
        print("  explain <comando>  - Explicar plano")
        print("  plan <comando>     - Mostrar plano em JSON")
        print("  status             - Status do sistema")
        print("  actions            - Listar acoes disponiveis")
        print("  permissions        - Listar permissoes")
        print("  help               - Mostrar ajuda")
        print("  exit               - Sair")
        print("\nExemplos:")
        print("  execute abrir o Chrome")
        print("  explain listar arquivos")
        print("  plan criar pasta")

        try:
            while True:
                try:
                    user_input = input("\nos-agent> ").strip()
                except EOFError:
                    break

                if not user_input:
                    continue

                if user_input.lower() == "exit":
                    break

                parts = user_input.split(maxsplit=1)
                command = parts[0].lower()
                arg = parts[1] if len(parts) > 1 else ""

                if command == "execute":
                    if arg:
                        self.execute(arg)
                    else:
                        print("Uso: execute <comando>")

                elif command == "explain":
                    if arg:
                        self.explain(arg)
                    else:
                        print("Uso: explain <comando>")

                elif command == "plan":
                    if arg:
                        self.plan(arg)
                    else:
                        print("Uso: plan <comando>")

                elif command == "status":
                    self._show_status()

                elif command == "actions":
                    self._show_actions()

                elif command == "permissions":
                    self._show_permissions()

                elif command == "help":
                    self._show_help()

                else:
                    print(f"Comando desconhecido: {command}")
                    print("Use 'help' para listar comandos disponiveis.")

        except KeyboardInterrupt:
            print("\n\nAte logo!")
            return 0

        return 0

    def _show_status(self):
        """Mostrar status do sistema."""
        snapshot = self.monitor.snapshot()
        print("\nStatus do Sistema:")
        print(f"  Platform: {snapshot.platform}")
        print(f"  Working Dir: {snapshot.cwd}")
        print(f"  CPU: {snapshot.cpu_percent:.1f}%")
        print(f"  Memory: {snapshot.memory_percent:.1f}%")
        print(f"  Disk: {snapshot.disk_percent:.1f}%")
        print(f"  Processes: {snapshot.process_count}")
        if snapshot.active_window:
            print(f"  Active Window: {snapshot.active_window}")

    def _show_actions(self):
        """Mostrar acoes disponiveis."""
        print("\nAcoes Disponiveis:")
        for executor_name in ("files", "apps", "processes", "windows", "scripts", "browser", "network"):
            executor = self.orch._executors.get(executor_name)
            if executor:
                actions = executor.list_actions()
                print(f"\n  {executor_name.upper()} ({len(actions)} acoes)")
                for action in actions:
                    print(f"    - {action}")

    def _show_permissions(self):
        """Mostrar nivel de permissoes."""
        from .core.permissions import ACTION_CLASSIFICATIONS

        print("\nNiveis de Permissoes:")
        levels = {}
        for action, level in ACTION_CLASSIFICATIONS.items():
            levels.setdefault(level.value, []).append(action)

        for level in ("safe", "notify", "confirm", "blocked"):
            actions = levels.get(level, [])
            print(f"\n  {level.upper()} ({len(actions)} acoes)")
            for action in actions[:5]:
                print(f"    - {action}")
            if len(actions) > 5:
                print(f"    ... e mais {len(actions) - 5}")

    def _show_help(self):
        """Mostrar ajuda."""
        print("""
YAMI - OS Agent CLI

Comandos:
  execute <cmd>     Executar um comando do SO
  explain <cmd>     Explicar o plano de um comando
  plan <cmd>        Mostrar plano em formato JSON
  status            Mostrar status do sistema
  actions           Listar todas as acoes disponiveis
  permissions       Mostrar niveis de permissao
  help              Mostrar esta ajuda
  exit              Sair

Exemplos:
  execute abrir o Chrome e listar Downloads
  explain criar pasta Projetos
  plan deletar arquivo.txt

Opcoes (via CLI):
  -v, --verbose     Modo verbose
  -d, --dry-run     Planejar sem executar
""")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="YAMI - OS Agent CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  %(prog)s execute "abrir chrome"
  %(prog)s explain "criar pasta testes"
  %(prog)s plan "listar arquivos"
  %(prog)s interactive
        """
    )

    parser.add_argument(
        "action",
        nargs="?",
        default="interactive",
        choices=["execute", "explain", "plan", "interactive"],
        help="Acao a executar"
    )

    parser.add_argument(
        "command",
        nargs="?",
        default="",
        help="Comando para executor/explicar/planejar"
    )

    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Modo verbose"
    )

    parser.add_argument(
        "-d", "--dry-run",
        action="store_true",
        help="Planejar sem executar (nao requer confirmacao)"
    )

    args = parser.parse_args()

    cli = OSAgentCLI(verbose=args.verbose, dry_run=args.dry_run)

    if args.action == "execute":
        if not args.command:
            parser.error("'execute' requer um comando")
        return cli.execute(args.command)

    elif args.action == "explain":
        if not args.command:
            parser.error("'explain' requer um comando")
        return cli.explain(args.command)

    elif args.action == "plan":
        if not args.command:
            parser.error("'plan' requer um comando")
        return cli.plan(args.command)

    else:  # interactive
        return cli.interactive()


if __name__ == "__main__":
    sys.exit(main())
