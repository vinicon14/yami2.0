Set shell = CreateObject("WScript.Shell")
cmd = """" & shell.ExpandEnvironmentStrings("%USERPROFILE%") & "\.yami\auto-panel\YamiPanel.cmd" & """"
shell.Run cmd, 0, False
