Set shell = CreateObject("WScript.Shell")
panel = shell.ExpandEnvironmentStrings("%USERPROFILE%") & "\.yami\auto-panel\YamiPanelHidden.vbs"
shell.Run """" & panel & """", 0, False
WScript.Sleep 1200
chrome = shell.ExpandEnvironmentStrings("%ProgramFiles%") & "\Google\Chrome\Application\chrome.exe"
profile = shell.ExpandEnvironmentStrings("%USERPROFILE%") & "\.yami\auto-panel\chrome-user-data"
url = "http://127.0.0.1:18808/?voice=1&v=" & Replace(CStr(Timer), ",", ".")
If CreateObject("Scripting.FileSystemObject").FileExists(chrome) Then
  shell.Run """" & chrome & """ --user-data-dir=""" & profile & """ --use-fake-ui-for-media-stream --autoplay-policy=no-user-gesture-required --app=" & url, 1, False
Else
  shell.Run url, 1, False
End If
