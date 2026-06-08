Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get the directory where this script is located
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
yamiHome = scriptDir

' Set environment variable
Set env = shell.Environment("USER")
env("YAMI_HOME") = yamiHome

' Path to the launcher
launcherCmd = scriptDir & "\bin\yami.cmd"

' Execute the launcher
result = shell.Run(launcherCmd, 1, True)

' Exit with the same code
WScript.Quit(result)
