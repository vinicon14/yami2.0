Option Explicit
On Error Resume Next

Dim objShell, objFSO, strScriptDir, strSetupScript
Dim WshShell

Set objShell = CreateObject("Shell.Application")
Set objFSO = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")

' Obter diretório do script
strScriptDir = objFSO.GetParentFolderName(WScript.ScriptFullName)

' Definir caminho do script de instalação
strSetupScript = strScriptDir & "\setup.bat"

' Verificar se o script existe
If Not objFSO.FileExists(strSetupScript) Then
    MsgBox "✗ Arquivo de instalação não encontrado: " & strSetupScript, vbCritical, "YAMI Setup - Erro"
    WScript.Quit 1
End If

' Executar o instalador com privilégios elevados
WshShell.Run "cmd /c cd /d """ & strScriptDir & """ && """ & strSetupScript & """", 1, False

WScript.Quit 0
