"""Orquestrador principal — coordena o ciclo planejar → executar → observar.

Gerencia o pipeline completo de transformação de comandos do usuário
em ações no sistema operacional com transparência e recuperação de erros.
"""

from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Tuple

from .planner import ActionPlan, ActionStep, Planner, StepStatus
from .permissions import PermissionManager

logger = logging.getLogger(__name__)


class ExecutionResult:
    """Resultado da execução de um plano de ação."""

    def __init__(
        self,
        plan: ActionPlan,
        success: bool = False,
        summary: str = "",
        step_results: Optional[List[Tuple[ActionStep, bool, str]]] = None,
        duration_ms: float = 0.0,
        error: Optional[str] = None,
    ):
        self.plan = plan
        self.success = success
        self.summary = summary
        self.step_results = step_results or []
        self.duration_ms = duration_ms
        self.error = error

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "summary": self.summary,
            "duration_ms": self.duration_ms,
            "error": self.error,
            "steps": [
                {
                    "id": s.id,
                    "action": s.action,
                    "description": s.description,
                    "status": s.status.value,
                    "error": s.error,
                    "duration_ms": s.duration_ms,
                }
                for s, _, _ in self.step_results
            ],
            "plan_id": self.plan.id,
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=2)

    def summary_text(self, verbose: bool = False) -> str:
        if not verbose:
            return self.summary or ("✅ Comando executado com sucesso." if self.success else f"❌ Falha na execução: {self.error}")
        lines = [f"Plano: {self.plan.intent}", f"Status: {'Sucesso' if self.success else 'Falha'}", ""]
        for step, ok, msg in self.step_results:
            icon = "✅" if ok else "❌"
            dur = f" ({step.duration_ms:.0f}ms)" if step.duration_ms else ""
            lines.append(f"  {icon} {step.description}{dur}")
            if not ok and step.error:
                lines.append(f"     ⚠ {step.error}")
        if self.error:
            lines.append(f"\nErro: {self.error}")
        lines.append(f"\nDuração total: {self.duration_ms:.0f}ms")
        return "\n".join(lines)


class Orchestrator:
    """Coordena o ciclo completo: planejar → autorizar → executar → observar → reportar.

    Uso:
        orch = Orchestrator(permission_manager=pm, config=cfg)
        orch.register_executor("files", file_exec)
        result = orch.execute("abrir o Chrome e baixar um arquivo")
        print(result.summary_text())
    """

    def __init__(
        self,
        permission_manager: Optional[PermissionManager] = None,
        planner: Optional[Planner] = None,
        config: Optional[Any] = None,
        on_step_start: Optional[Callable] = None,
        on_step_complete: Optional[Callable] = None,
        on_plan_start: Optional[Callable] = None,
        on_error: Optional[Callable] = None,
    ):
        self._pm = permission_manager or PermissionManager()
        self._planner = planner or Planner(
            permission_manager=self._pm,
            config=config,
        )
        self._config = config
        self._executors: Dict[str, Any] = {}
        self._on_step_start = on_step_start
        self._on_step_complete = on_step_complete
        self._on_plan_start = on_plan_start
        self._on_error = on_error

    def register_executor(self, name: str, executor: Any):
        self._executors[name] = executor
        if hasattr(self._planner, "register_executor"):
            self._planner.register_executor(name, executor)

    def register_executors(self, executors: Dict[str, Any]):
        for name, executor in executors.items():
            self.register_executor(name, executor)

    def execute(
        self,
        intent: str,
        context: Optional[Dict[str, Any]] = None,
        dry_run: bool = False,
    ) -> ExecutionResult:
        """Pipeline principal: planejar → autorizar → executar → reportar."""
        start_time = time.time()

        plan = self._planner.plan(intent, context)

        if self._on_plan_start:
            self._on_plan_start(plan)

        if dry_run:
            return ExecutionResult(
                plan=plan,
                success=True,
                summary=f"[DRY RUN] Plano gerado com {len(plan.steps)} passo(s). Nenhuma ação executada.",
                duration_ms=(time.time() - start_time) * 1000,
            )

        step_results: List[Tuple[ActionStep, bool, str]] = []
        overall_success = True
        errors: List[str] = []

        for step in plan.steps:
            step.status = StepStatus.IN_PROGRESS
            step_start = time.time()

            if self._on_step_start:
                self._on_step_start(step)

            success, message = self._execute_step(step, plan)
            step.duration_ms = (time.time() - step_start) * 1000
            step.status = StepStatus.COMPLETED if success else StepStatus.FAILED

            if self._on_step_complete:
                self._on_step_complete(step, success, message)

            step_results.append((step, success, message))
            if not success:
                overall_success = False
                errors.append(f"[{step.action}] {message}")
                step.error = message
                if step.required:
                    break

        duration = (time.time() - start_time) * 1000
        summary = self._build_summary(overall_success, step_results, errors)
        error_text = "; ".join(errors) if errors else None

        if error_text and self._on_error:
            self._on_error(plan, error_text)

        return ExecutionResult(
            plan=plan,
            success=overall_success,
            summary=summary,
            step_results=step_results,
            duration_ms=duration,
            error=error_text,
        )

    def _execute_step(self, step: ActionStep, plan: ActionPlan) -> Tuple[bool, str]:
        """Executa um único passo com verificação de permissão."""
        perm = self._pm.request(step.action, step.description)
        if not perm.approved:
            msg = f"Ação '{step.action}' bloqueada por permissão (nível: {perm.level.value})."
            logger.warning(msg)
            return False, msg

        executor = self._executors.get(step.executor)
        if not executor:
            msg = f"Nenhum executor registrado para '{step.executor}'."
            logger.error(msg)
            return False, msg

        try:
            logger.info(
                "Executando: %s (%s) — params: %s",
                step.action, step.executor, step.params,
            )
            result = executor.execute(step.action, step.params, plan.context)
            return True, str(result) if result is not None else "Executado sem retorno."
        except Exception as e:
            logger.exception("Falha no passo %s: %s", step.id, e)
            return False, f"Erro na execução: {e}"

    def _build_summary(
        self,
        success: bool,
        step_results: List[Tuple[ActionStep, bool, str]],
        errors: List[str],
    ) -> str:
        total = len(step_results)
        ok = sum(1 for _, s, _ in step_results if s)
        if success:
            return f"✅ Comando executado com sucesso ({ok}/{total} passos concluídos)."
        return f"❌ Comando parcialmente executado ({ok}/{total} passos). Erros: {'; '.join(errors)}"

    def explain_plan(self, intent: str) -> str:
        """Gera explicação textual do plano sem executar."""
        plan = self._planner.plan(intent)
        lines = [
            f"📋 **Plano de Ação**",
            f"Comando: {intent}",
            f"Passos: {len(plan.steps)}",
        ]
        for i, step in enumerate(plan.steps, 1):
            lines.append(f"  {i}. {step.description} ({step.action})")
        if plan.requires_confirmation:
            lines.append("\n⚠ Este plano requer sua confirmação.")
        return "\n".join(lines)
