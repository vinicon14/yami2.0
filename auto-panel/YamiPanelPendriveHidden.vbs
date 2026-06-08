Set shell = CreateObject("WScript.Shell")
drive = Left(WScript.ScriptFullName, 2)
cmd = """" & drive & "\.yami\auto-panel\YamiPanelPendrive.cmd" & """"
shell.Run cmd, 0, False
