"""Configurações padrão do OS Agent."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class PermissionConfig:
    allow_once: bool = True
    allow_session: bool = True
    allow_always: bool = False
    timeout_seconds: float = 60.0
    require_confirmation_for: tuple = (
        "delete",
        "format",
        "shutdown",
        "install",
        "uninstall",
        "network_write",
    )


@dataclass
class ExecutorConfig:
    enabled: bool = True
    timeout_seconds: float = 30.0
    max_retries: int = 2
    max_concurrent: int = 4


@dataclass
class PlannerConfig:
    max_plan_steps: int = 20
    validate_before_execute: bool = True
    allow_parallel_steps: bool = True


@dataclass
class ObserverConfig:
    poll_interval_seconds: float = 2.0
    track_resource_usage: bool = True
    track_processes: bool = True
    track_window_state: bool = True


@dataclass
class RecoveryConfig:
    max_retries: int = 3
    retry_delay_seconds: float = 1.0
    fallback_on_failure: bool = True
    notify_user_on_recovery: bool = True


@dataclass
class OSConfig:
    supported_platforms: tuple = ("win32", "linux", "darwin")
    safe_mode: bool = True
    dry_run: bool = False


@dataclass
class AppConfig:
    allowed_apps: List[str] = field(default_factory=list)
    blocked_apps: List[str] = field(default_factory=list)
    app_paths: Dict[str, str] = field(default_factory=dict)
    terminal: str = ""


@dataclass
class BrowserConfig:
    default_browser: str = "chrome"
    debug_port: int = 9222
    headless: bool = False


@dataclass
class OSAgentConfig:
    permissions: PermissionConfig = field(default_factory=PermissionConfig)
    executor: ExecutorConfig = field(default_factory=ExecutorConfig)
    planner: PlannerConfig = field(default_factory=PlannerConfig)
    observer: ObserverConfig = field(default_factory=ObserverConfig)
    recovery: RecoveryConfig = field(default_factory=RecoveryConfig)
    os: OSConfig = field(default_factory=OSConfig)
    app: AppConfig = field(default_factory=AppConfig)
    browser: BrowserConfig = field(default_factory=BrowserConfig)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "OSAgentConfig":
        return cls(
            permissions=PermissionConfig(**(data.get("permissions") or {})),
            executor=ExecutorConfig(**(data.get("executor") or {})),
            planner=PlannerConfig(**(data.get("planner") or {})),
            observer=ObserverConfig(**(data.get("observer") or {})),
            recovery=RecoveryConfig(**(data.get("recovery") or {})),
            os=OSConfig(**(data.get("os") or {})),
            app=AppConfig(**(data.get("app") or {})),
            browser=BrowserConfig(**(data.get("browser") or {})),
        )

    def merge(self, overrides: Dict[str, Any]) -> "OSAgentConfig":
        base = {
            "permissions": self.permissions.__dict__.copy(),
            "executor": self.executor.__dict__.copy(),
            "planner": self.planner.__dict__.copy(),
            "observer": self.observer.__dict__.copy(),
            "recovery": self.recovery.__dict__.copy(),
            "os": self.os.__dict__.copy(),
            "app": self.app.__dict__.copy(),
            "browser": self.browser.__dict__.copy(),
        }
        for section, values in overrides.items():
            if section in base and isinstance(values, dict):
                base[section].update(values)
        return self.from_dict(base)
