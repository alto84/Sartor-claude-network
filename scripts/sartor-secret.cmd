@echo off
rem Windows shim for sartor-secret. Forwards to the Python script.
rem Requires `python` in PATH.
python "%~dp0sartor-secret" %*
