"""Executor de gerenciamento de janelas e áreas de trabalho.

Controla posição, estado (minimizar/maximizar), alterna entre janelas,
e gerencia áreas de trabalho virtuais. Suporte principal no Windows.
"""

from __future__ import annotations

import logging
import subprocess
import sys
from typing import Any, Dict, List, Optional

from .base import Executor

logger = logging.getLogger(__name__)


class WindowExecutor(Executor):
    """Gerencia janelas, áreas de trabalho e capturas de tela."""

    def __init__(self):
        super().__init__(name="windows")
        self._actions = {
            "list_windows": "Listar janelas abertas",
            "switch_window": "Alternar/minimizar/maximizar janela",
            "screenshot": "Capturar tela",
            "get_clipboard": "Obter conteúdo da área de transferência",
        }

    def action_list_windows(self, params: Dict[str, Any], context: Dict) -> List[Dict[str, Any]]:
        windows = []
        try:
            if sys.platform == "win32":
                result = subprocess.run(
                    ["powershell", "-Command", """
                        Add-Type @"
                        using System;
                        using System.Runtime.InteropServices;
                        using System.Text;
                        using System.Diagnostics;
                        public class WinAPI {
                            [DllImport("user32.dll")] public static extern IntPtr GetDesktopWindow();
                            [DllImport("user32.dll")] public static extern IntPtr GetWindow(IntPtr hWnd, int uCmd);
                            [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
                            [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
                            const int GW_CHILD = 5; const int GW_HWNDNEXT = 2;
                            public static string[] GetWindows() {
                                var list = new System.Collections.Generic.List<string>();
                                IntPtr hWnd = GetWindow(GetDesktopWindow(), GW_CHILD);
                                while (hWnd != IntPtr.Zero) {
                                    if (IsWindowVisible(hWnd)) {
                                        StringBuilder sb = new StringBuilder(256);
                                        GetWindowText(hWnd, sb, 256);
                                        if (sb.Length > 0) list.Add(sb.ToString());
                                    }
                                    hWnd = GetWindow(hWnd, GW_HWNDNEXT);
                                }
                                return list.ToArray();
                            }
                        }
"@
                        [WinAPI]::GetWindows()
                    """],
                    capture_output=True, text=True, timeout=15,
                )
                for line in result.stdout.strip().splitlines():
                    line = line.strip()
                    if line and not line.startswith("PS") and not line.startswith("Add-Type"):
                        windows.append({"title": line})
        except Exception as e:
            logger.warning("Erro ao listar janelas: %s", e)
        return windows

    def action_switch_window(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        title = params.get("title", "")
        action = params.get("window_action", "focus")

        if not title:
            raise ValueError("Parâmetro 'title' é obrigatório.")

        try:
            if sys.platform == "win32":
                encoded_title = title.replace("'", "''")
                if action == "minimize":
                    ps_cmd = f"""
                        $wshell = New-Object -ComObject WScript.Shell
                        $wshell.SendKeys('%{{n}}')
                        Add-Type @"
                        using System; using System.Runtime.InteropServices;
                        public class Win {{ [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
                            [DllImport("user32.dll")] public static extern IntPtr FindWindow(string c, string w);
                            public static void Minimize(string t) {{ IntPtr h = FindWindow(null, t); if(h != IntPtr.Zero) ShowWindowAsync(h, 6); }} }}
"@
                        [Win]::Minimize('{encoded_title}')
                    """
                elif action == "maximize":
                    ps_cmd = f"""
                        Add-Type @"
                        using System; using System.Runtime.InteropServices;
                        public class Win {{ [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
                            [DllImport("user32.dll")] public static extern IntPtr FindWindow(string c, string w);
                            public static void Maximize(string t) {{ IntPtr h = FindWindow(null, t); if(h != IntPtr.Zero) ShowWindowAsync(h, 3); }} }}
"@
                        [Win]::Maximize('{encoded_title}')
                    """
                else:
                    ps_cmd = f"""
                        Add-Type @"
                        using System; using System.Runtime.InteropServices;
                        public class Win {{ [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
                            [DllImport("user32.dll")] public static extern IntPtr FindWindow(string c, string w);
                            public static void Focus(string t) {{ IntPtr h = FindWindow(null, t); if(h != IntPtr.Zero) SetForegroundWindow(h); }} }}
"@
                        [Win]::Focus('{encoded_title}')
                    """
                subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], capture_output=True, timeout=10)
            return {"success": True, "window": title, "action": action}
        except Exception as e:
            return {"success": False, "window": title, "action": action, "error": str(e)}

    def action_screenshot(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        output = params.get("output", "")
        try:
            if sys.platform == "win32":
                if not output:
                    output = f"screenshot_{int(__import__('time').time())}.png"
                ps_cmd = f"""
                    Add-Type -AssemblyName System.Windows.Forms
                    Add-Type -AssemblyName System.Drawing
                    $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
                    $img = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
                    $g = [System.Drawing.Graphics]::FromImage($img)
                    $g.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
                    $img.Save('{output}')
                    $g.Dispose()
                    $img.Dispose()
                """
                subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], capture_output=True, timeout=30)
                return {"success": True, "file": output}
            return {"success": False, "error": "Screenshot não suportado nesta plataforma."}
        except Exception as e:
            raise RuntimeError(f"Falha ao capturar tela: {e}")

    def action_get_clipboard(self, params: Dict[str, Any], context: Dict) -> Dict[str, Any]:
        try:
            if sys.platform == "win32":
                result = subprocess.run(
                    ["powershell", "-NoProfile", "-Command", "Get-Clipboard"],
                    capture_output=True, text=True, timeout=10,
                )
                return {"content": result.stdout.strip()}
            return {"content": ""}
        except Exception as e:
            return {"error": str(e), "content": ""}
