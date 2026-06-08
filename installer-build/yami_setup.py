#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
YAMI Installer - Personal AI Assistant Runtime
Versão 0.1.0
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path
from datetime import datetime

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def log(message, color=Colors.GREEN):
    timestamp = datetime.now().strftime('%H:%M:%S')
    print(f"{color}[{timestamp}] {message}{Colors.RESET}")

def log_header():
    print(f"{Colors.CYAN}{'='*70}{Colors.RESET}")
    print(f"{Colors.CYAN}{Colors.BOLD}YAMI Installation - Personal AI Assistant{Colors.RESET}")
    print(f"{Colors.CYAN}{'='*70}{Colors.RESET}\n")

def log_separator():
    print(f"{Colors.CYAN}{'='*70}{Colors.RESET}")

def install_yami():
    log_header()

    # Caminhos
    source_path = Path(r"C:\Users\vinim\Downloads\yami2.0-master (3)\yami2.0-master\dist-releases")
    install_path = Path(os.getenv('ProgramFiles')) / "YAMI"
    desktop_path = Path.home() / "Desktop"
    startmenu_path = Path.home() / "AppData" / "Roaming" / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "YAMI"

    # Verificar caminho de origem
    log(f"Verificando arquivos de origem...", Colors.YELLOW)
    if not source_path.exists():
        log(f"✗ Caminho não encontrado: {source_path}", Colors.RED)
        input("\nPressione Enter para sair...")
        return False

    log(f"✓ Arquivos de origem encontrados", Colors.GREEN)

    # Criar diretório de instalação
    log(f"Criando diretório: {install_path}", Colors.YELLOW)
    try:
        install_path.mkdir(parents=True, exist_ok=True)
        log(f"✓ Diretório criado/verificado", Colors.GREEN)
    except Exception as e:
        log(f"✗ Erro ao criar diretório: {e}", Colors.RED)
        return False

    # Copiar arquivos
    log(f"Copiando arquivos...", Colors.YELLOW)
    files_to_copy = [
        "yami.exe",
        "yami.apk",
        "run.bat",
        "yami.json",
        "requirements.txt",
        "README.md",
        "INSTALL.txt",
        "README.txt",
        "CHECKSUM.txt"
    ]

    for file in files_to_copy:
        source_file = source_path / file
        if source_file.exists():
            try:
                shutil.copy2(source_file, install_path / file)
                log(f"  ✓ {file}", Colors.GREEN)
            except Exception as e:
                log(f"  ⚠ {file}: {e}", Colors.YELLOW)
        else:
            log(f"  ⚠ {file} (não encontrado)", Colors.YELLOW)

    # Copiar pasta bin
    bin_source = source_path / "bin"
    if bin_source.exists():
        log(f"Copiando pasta bin...", Colors.YELLOW)
        bin_dest = install_path / "bin"
        try:
            if bin_dest.exists():
                shutil.rmtree(bin_dest)
            shutil.copytree(bin_source, bin_dest)
            log(f"  ✓ Pasta bin copiada", Colors.GREEN)
        except Exception as e:
            log(f"  ✗ Erro ao copiar bin: {e}", Colors.RED)

    # Criar atalhos
    log(f"Criando atalhos...", Colors.YELLOW)

    try:
        # Atalho na Área de Trabalho
        shortcut_path = desktop_path / "YAMI.lnk"
        create_shortcut(str(install_path / "yami.exe"), str(shortcut_path), str(install_path))
        log(f"  ✓ Atalho criado na Área de Trabalho", Colors.GREEN)
    except Exception as e:
        log(f"  ⚠ Erro ao criar atalho: {e}", Colors.YELLOW)

    try:
        # Atalho no Menu Iniciar
        startmenu_path.mkdir(parents=True, exist_ok=True)
        shortcut_path = startmenu_path / "YAMI.lnk"
        create_shortcut(str(install_path / "yami.exe"), str(shortcut_path), str(install_path))
        log(f"  ✓ Atalho criado no Menu Iniciar", Colors.GREEN)
    except Exception as e:
        log(f"  ⚠ Erro ao criar atalho: {e}", Colors.YELLOW)

    # Testar executável
    log(f"Testando executável...", Colors.YELLOW)
    try:
        exe_path = install_path / "yami.exe"
        if exe_path.exists():
            process = subprocess.Popen(
                [str(exe_path)],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )

            import time
            time.sleep(2)

            if process.poll() is None:
                process.terminate()
                log(f"✓ Executável funcionando", Colors.GREEN)
            else:
                code = process.returncode
                if code == 0:
                    log(f"✓ Executável retornou: {code}", Colors.GREEN)
                else:
                    log(f"⚠ Executável retornou: {code}", Colors.YELLOW)
    except Exception as e:
        log(f"⚠ Erro ao testar: {e}", Colors.YELLOW)

    # Resumo final
    log_separator()
    print(f"\n{Colors.BOLD}{Colors.GREEN}✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!{Colors.RESET}\n")

    print(f"{Colors.CYAN}📁 Localização de Instalação:{Colors.RESET}")
    print(f"   {install_path}\n")

    print(f"{Colors.CYAN}🔗 Atalhos Criados:{Colors.RESET}")
    print(f"   • Área de Trabalho: YAMI.lnk")
    print(f"   • Menu Iniciar: YAMI.lnk\n")

    print(f"{Colors.CYAN}🚀 Como Usar:{Colors.RESET}")
    print(f"   1. Clique em YAMI.lnk na Área de Trabalho")
    print(f"   2. Ou procure 'YAMI' no Menu Iniciar")
    print(f"   3. Ou execute: {install_path}\\yami.exe\n")

    log(f"Instalação concluída em: {install_path}", Colors.GREEN)

    # Perguntar se deseja executar
    print(f"{Colors.YELLOW}Deseja executar YAMI agora? (S/N): {Colors.RESET}", end="")
    response = input().strip().upper()

    if response == "S":
        try:
            subprocess.Popen([str(install_path / "yami.exe")])
            log("YAMI iniciado!", Colors.GREEN)
        except Exception as e:
            log(f"Erro ao iniciar: {e}", Colors.RED)

    input(f"\n{Colors.CYAN}Pressione Enter para fechar...{Colors.RESET}")
    return True

def create_shortcut(target, link_path, working_dir):
    """Criar atalho Windows usando COM"""
    try:
        import win32com.client
        shell = win32com.client.Dispatch("WScript.Shell")
        shortcut = shell.CreateShortCut(link_path)
        shortcut.TargetPath = target
        shortcut.WorkingDirectory = working_dir
        shortcut.Description = "YAMI - Personal AI Assistant"
        shortcut.IconLocation = target + ",0"
        shortcut.Save()
    except:
        # Fallback se win32com não estiver disponível
        import subprocess
        vbs_script = f'''
        Set objShell = CreateObject("WScript.Shell")
        Set objLink = objShell.CreateShortCut("{link_path}")
        objLink.TargetPath = "{target}"
        objLink.WorkingDirectory = "{working_dir}"
        objLink.Description = "YAMI - Personal AI Assistant"
        objLink.IconLocation = "{target},0"
        objLink.Save
        '''

        vbs_file = Path(working_dir) / "create_shortcut.vbs"
        with open(vbs_file, 'w') as f:
            f.write(vbs_script)

        subprocess.run(['cscript.exe', str(vbs_file)], capture_output=True)
        vbs_file.unlink()

if __name__ == "__main__":
    try:
        success = install_yami()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Instalação cancelada pelo usuário.{Colors.RESET}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}Erro inesperado: {e}{Colors.RESET}")
        input("Pressione Enter para sair...")
        sys.exit(1)
