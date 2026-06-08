#!/usr/bin/env python3
"""
YAMI Runtime Launcher - Windows EXE Wrapper
Launches the Node.js-based YAMI runtime
"""

import os
import subprocess
import sys
import shutil
from pathlib import Path

def get_yami_home():
    """Get YAMI home directory (where the EXE is located)"""
    if getattr(sys, 'frozen', False):
        # Running as compiled EXE
        return os.path.dirname(sys.executable)
    else:
        # Running as script
        return os.path.dirname(os.path.abspath(__file__))

def check_node_installed():
    """Check if Node.js is installed"""
    if shutil.which('node') is None:
        return False
    return True

def show_error_with_pause(message):
    """Show error message and wait for user to press Enter"""
    print("\n" + "="*60)
    print("ERROR")
    print("="*60)
    print(message)
    print("="*60 + "\n")
    try:
        input("Press Enter to close...")
    except:
        pass

def main():
    yami_home = get_yami_home()
    launcher_cmd = os.path.join(yami_home, 'bin', 'yami.cmd')
    
    # Set environment variable
    os.environ['YAMI_HOME'] = yami_home
    
    # Check if Node.js is installed
    if not check_node_installed():
        show_error_with_pause(
            "Node.js is not installed or not in PATH.\n\n"
            "Please install Node.js from:\n"
            "https://nodejs.org/\n\n"
            "Version required: v22.19 or higher"
        )
        sys.exit(1)
    
    # Ensure launcher exists
    if not os.path.exists(launcher_cmd):
        show_error_with_pause(
            f"YAMI launcher not found at:\n{launcher_cmd}\n\n"
            f"YAMI_HOME: {yami_home}\n\n"
            "Make sure all YAMI files are intact."
        )
        sys.exit(1)
    
    # Execute launcher
    try:
        result = subprocess.run(launcher_cmd, shell=True)
        sys.exit(result.returncode)
    except Exception as e:
        show_error_with_pause(f"Error executing YAMI launcher:\n{e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
