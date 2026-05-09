' run-hidden.vbs - Run a command line with no visible window.
' Used by Sartor scheduled tasks to suppress the powershell.exe / cmd.exe console flash.
' Usage from Task Scheduler:
'   Program: wscript.exe
'   Arguments: "C:\Users\alto8\scripts\run-hidden.vbs" "<full command line>"
' WScript.Shell.Run with intWindowStyle=0 hides the window AND with bWaitOnReturn=True
' propagates the child exit code so Task Scheduler's LastResult is meaningful.
Option Explicit
Dim shell, ec
Set shell = CreateObject("WScript.Shell")
If WScript.Arguments.Count = 0 Then WScript.Quit 1
ec = shell.Run(WScript.Arguments(0), 0, True)
WScript.Quit ec
