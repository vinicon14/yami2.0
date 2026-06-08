Set shell = CreateObject("WScript.Shell")
fso = CreateObject("Scripting.FileSystemObject")
drive = Left(WScript.ScriptFullName, 2)
panel = drive & "\.yami\auto-panel\YamiPanelPendriveHidden.vbs"
shell.Run """" & panel & """", 0, False
WScript.Sleep 1200
chrome = shell.ExpandEnvironmentStrings("%ProgramFiles%") & "\Google\Chrome\Application\chrome.exe"
profile = drive & "\.yami\auto-panel\chrome-user-data"
url = "http://127.0.0.1:18808/?voice=1&v=" & Replace(CStr(Timer), ",", ".")
If fso.FileExists(chrome) Then
  shell.Run """" & chrome & """ --user-data-dir=""" & profile & """ --use-fake-ui-for-media-stream --autoplay-policy=no-user-gesture-required --app=" & url, 1, False
Else
  shell.Run url, 1, False
End If
