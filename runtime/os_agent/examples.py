"""Exemplos de uso do OS Agent YAMI.

Demonstra padrões comuns de integração e uso da arquitetura.
Execute com: python -m runtime.os_agent.examples
"""

from __future__ import annotations

import sys
from typing import Dict, Any, Optional

from .core.orchestrator import Orchestrator
from .core.permissions import PermissionManager, PermissionLevel
from .core.planner import Planner
from .executors import (
    FileExecutor, AppExecutor, ProcessExecutor,
    WindowExecutor, ScriptExecutor, BrowserExecutor, NetworkExecutor
)
from .observer.monitor import SystemMonitor
from .recovery.error_handler import ErrorHandler


class YAMIOSAgentExample:
    """Exemplo completo de integração do OS Agent."""

    def __init__(self):
        self.pm = PermissionManager(allow_permanent=False)
        self.planner = Planner(permission_manager=self.pm)
        self.orch = Orchestrator(permission_manager=self.pm, planner=self.planner)
        self.monitor = SystemMonitor()
        self.error_handler = ErrorHandler()

        # Registrar executors
        self.orch.register_executors({
            "files": FileExecutor(),
            "apps": AppExecutor(),
            "processes": ProcessExecutor(),
            "windows": WindowExecutor(),
            "scripts": ScriptExecutor(),
            "browser": BrowserExecutor(),
            "network": NetworkExecutor(),
        })

    def example_1_basic_execution(self):
        """Exemplo 1: Execucao basica de comando."""
        print("\n" + "=" * 60)
        print("EXEMPLO 1: Execucao Basica")
        print("=" * 60)

        commands = [
            "abrir o Chrome",
            "listar arquivos da pasta Downloads",
            "obter informacoes do sistema",
        ]

        for cmd in commands:
            print(f"\nComando: {cmd}")
            result = self.orch.execute(cmd, dry_run=True)
            print(result.summary_text(verbose=False))

    def example_2_permissions(self):
        """Exemplo 2: Verificacao de permissoes."""
        print("\n" + "=" * 60)
        print("EXEMPLO 2: Permissoes")
        print("=" * 60)

        actions = [
            ("read_file", "Ler arquivo"),
            ("delete_file", "Deletar arquivo"),
            ("disable_security", "Desabilitar seguranca"),
            ("open_app", "Abrir aplicativo"),
        ]

        print("\nClassificacao de acoes:")
        for action, desc in actions:
            perm = self.pm.request(action, desc)
            print(f"  {action:20s} -> {perm.level.value:10s} (aprovado={perm.approved})")

    def example_3_planning(self):
        """Exemplo 3: Planejamento de acoes."""
        print("\n" + "=" * 60)
        print("EXEMPLO 3: Planejamento")
        print("=" * 60)

        complex_commands = [
            "criar uma pasta chamada projeto e depois abrir o editor de texto",
            "baixar arquivo e extrair conteudo",
            "executar script e listar resultados",
        ]

        for cmd in complex_commands:
            print(f"\nComando: {cmd}")
            plan = self.planner.plan(cmd)
            print(f"Passos gerados: {len(plan.steps)}")
            for i, step in enumerate(plan.steps, 1):
                deps = f" (depende de: {', '.join(step.depends_on)})" if step.depends_on else ""
                print(f"  {i}. {step.action}: {step.description}{deps}")

    def example_4_monitoring(self):
        """Exemplo 4: Observacao do sistema."""
        print("\n" + "=" * 60)
        print("EXEMPLO 4: Monitoracao")
        print("=" * 60)

        print("\nSnapshot do sistema:")
        snapshot = self.monitor.snapshot()
        print(f"  Platform: {snapshot.platform}")
        print(f"  Working dir: {snapshot.cwd}")
        print(f"  CPU: {snapshot.cpu_percent}%")
        print(f"  Memory: {snapshot.memory_percent}%")
        print(f"  Disk: {snapshot.disk_percent}%")
        print(f"  Active window: {snapshot.active_window or '(none)'}")

        print("\nContexto para planejador:")
        context = self.monitor.get_context()
        for key, value in context.items():
            if not isinstance(value, list):
                print(f"  {key}: {value}")

    def example_5_error_recovery(self):
        """Exemplo 5: Recuperacao de erros."""
        print("\n" + "=" * 60)
        print("EXEMPLO 5: Recuperacao de Erros")
        print("=" * 60)

        test_cases = [
            ("read_file", {"path": "/nonexistent"}, FileNotFoundError("Nao encontrado")),
            ("execute_command", {"command": "sleep 100"}, TimeoutError("Timeout")),
            ("delete_file", {"path": "/protected"}, PermissionError("Acesso negado")),
        ]

        print("\nEstrategias de recuperacao:")
        for action, params, error in test_cases:
            print(f"\n  Acao: {action}")
            print(f"  Erro: {error}")

            plan = self.error_handler.handle(action, params, error, attempt=1)
            print(f"  Estrategia: {plan.strategy.value}")
            if plan.should_retry:
                print(f"    -> Retentando em {plan.delay_seconds}s")
            elif plan.fallback_action:
                print(f"    -> Fallback: {plan.fallback_action}")
            print(f"    Mensagem: {plan.message}")

    def example_6_context_aware_execution(self):
        """Exemplo 6: Execucao contextual."""
        print("\n" + "=" * 60)
        print("EXEMPLO 6: Execucao Contextual")
        print("=" * 60)

        context = {
            "project_path": "C:\\Projects\\my-app",
            "output_format": "json",
            "user_preference": "verbose",
        }

        print("\nContexto fornecido:")
        for key, value in context.items():
            print(f"  {key}: {value}")

        print("\nExecutando com contexto...")
        result = self.orch.execute(
            "listar arquivos do projeto",
            context=context,
            dry_run=True
        )
        print(result.summary_text(verbose=False))

    def example_7_dry_run(self):
        """Exemplo 7: Modo dry-run (planejamento sem execucao)."""
        print("\n" + "=" * 60)
        print("EXEMPLO 7: Dry-Run (Planejamento sem Execucao)")
        print("=" * 60)

        commands = [
            "executar compilacao completa",
            "fazer backup e fazer deploy",
            "processar imagens e enviar para nuvem",
        ]

        for cmd in commands:
            print(f"\nComando: {cmd}")
            result = self.orch.execute(cmd, dry_run=True)
            print(f"  Passos: {len(result.plan.steps)}")
            print(f"  Resultado: {result.summary}")

    def example_8_explain_plan(self):
        """Exemplo 8: Explicar plano sem executar."""
        print("\n" + "=" * 60)
        print("EXEMPLO 8: Explicar Plano")
        print("=" * 60)

        commands = [
            "baixar e descompactar arquivo.zip",
            "criar backup e fazer limpeza",
        ]

        for cmd in commands:
            print(f"\nComando: {cmd}")
            explanation = self.orch.explain_plan(cmd)
            print(explanation)

    def example_9_custom_approval(self):
        """Exemplo 9: Sistema customizado de aprovacao."""
        print("\n" + "=" * 60)
        print("EXEMPLO 9: Aprovacao Customizada")
        print("=" * 60)

        def custom_approval_callback(action: str, details: str) -> str:
            print(f"\n[APROVACAO REQUERIDA]")
            print(f"  Acao: {action}")
            print(f"  Detalhes: {details}")
            print(f"  (Em sistema real, isto iria para interface de usuario)")
            return "once"  # Simular aprovacao por uma vez

        pm_custom = PermissionManager(
            approval_callback=custom_approval_callback,
            allow_permanent=False
        )

        planner_custom = Planner(permission_manager=pm_custom)
        orch_custom = Orchestrator(permission_manager=pm_custom, planner=planner_custom)
        orch_custom.register_executors({
            "files": FileExecutor(),
        })

        print("\nExecutando comando com aprovacao customizada...")
        result = orch_custom.execute("deletar arquivo teste.txt", dry_run=True)
        print(f"\nResultado: {result.summary}")

    def example_10_executor_actions(self):
        """Exemplo 10: Listar acoes disponiveis por executor."""
        print("\n" + "=" * 60)
        print("EXEMPLO 10: Acoes Disponiveis")
        print("=" * 60)

        print("\nAcoes por executor:")
        for executor_name in ("files", "apps", "processes", "windows", "scripts", "browser", "network"):
            executor = self.orch._executors.get(executor_name)
            if executor:
                actions = executor.list_actions()
                print(f"\n  {executor_name.upper()} ({len(actions)} acoes)")
                for i, action in enumerate(actions[:3], 1):
                    print(f"    {i}. {action}")
                if len(actions) > 3:
                    print(f"    ... e mais {len(actions) - 3}")

    def run_all_examples(self):
        """Executar todos os exemplos."""
        self.example_1_basic_execution()
        self.example_2_permissions()
        self.example_3_planning()
        self.example_4_monitoring()
        self.example_5_error_recovery()
        self.example_6_context_aware_execution()
        self.example_7_dry_run()
        self.example_8_explain_plan()
        self.example_9_custom_approval()
        self.example_10_executor_actions()

        print("\n" + "=" * 60)
        print("Todos os exemplos executados com sucesso!")
        print("=" * 60)


def main():
    """Executar exemplos."""
    example = YAMIOSAgentExample()

    if len(sys.argv) > 1:
        example_num = sys.argv[1]
        method_name = f"example_{example_num}"
        if hasattr(example, method_name):
            getattr(example, method_name)()
        else:
            print(f"Exemplo {example_num} nao encontrado.")
            print("Use: python -m runtime.os_agent.examples [1-10]")
    else:
        example.run_all_examples()


if __name__ == "__main__":
    main()
