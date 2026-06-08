<#
killswitch-watcher.ps1 — the OS-level kill switch, independent of the agent.

Runs in its OWN process with a message loop and a GLOBAL hotkey (Ctrl+Alt+Pause).
When Alton presses it, it writes the runtime STOP flag that gate.ps1 checks before EVERY
primitive — so an agent that is wedged, looping, or prompt-injected cannot suppress the
abort (it does not run in the agent's process and the agent has no handle to it).

Launch once per session (the SKILL preflight starts it):
  Start-Process powershell -ArgumentList '-NoProfile','-WindowStyle','Minimized','-File','killswitch-watcher.ps1'

Press Ctrl+Alt+Pause to ARM the STOP flag. Delete the flag (or close this watcher) to resume.
#>
[CmdletBinding()]
param([string]$Hotkey = 'Ctrl+Alt+Pause')

$RuntimeDir = 'C:\Users\alto8\computer-control-runtime'
if (-not (Test-Path $RuntimeDir)) { New-Item -ItemType Directory -Path $RuntimeDir -Force | Out-Null }
$StopFlag = Join-Path $RuntimeDir 'STOP'

Add-Type -AssemblyName System.Windows.Forms
Add-Type -ReferencedAssemblies System.Windows.Forms -TypeDefinition @"
using System;
using System.IO;
using System.Windows.Forms;
using System.Runtime.InteropServices;

public class SartorKillWatcher : Form {
  [DllImport("user32.dll")] static extern bool RegisterHotKey(IntPtr hWnd, int id, uint fsModifiers, uint vk);
  [DllImport("user32.dll")] static extern bool UnregisterHotKey(IntPtr hWnd, int id);
  const int WM_HOTKEY = 0x0312;
  const uint MOD_ALT = 0x1, MOD_CONTROL = 0x2;
  const uint VK_PAUSE = 0x13;
  const int HK_ID = 0xB0B;
  string _flag;
  public SartorKillWatcher(string flag) {
    _flag = flag;
    this.WindowState = FormWindowState.Minimized;
    this.ShowInTaskbar = false;
    this.FormBorderStyle = FormBorderStyle.FixedToolWindow;
    this.Text = "Sartor KillSwitch (Ctrl+Alt+Pause)";
  }
  protected override void OnHandleCreated(EventArgs e) {
    base.OnHandleCreated(e);
    RegisterHotKey(this.Handle, HK_ID, MOD_CONTROL | MOD_ALT, VK_PAUSE);
  }
  protected override void WndProc(ref Message m) {
    if (m.Msg == WM_HOTKEY && (int)m.WParam == HK_ID) {
      try { File.WriteAllText(_flag, "STOP " + DateTime.Now.ToString("o")); } catch {}
      try { Console.Beep(1200, 250); Console.Beep(900, 250); } catch {}
    }
    base.WndProc(ref m);
  }
  protected override void OnFormClosing(FormClosingEventArgs e) {
    try { UnregisterHotKey(this.Handle, HK_ID); } catch {}
    base.OnFormClosing(e);
  }
}
"@

Write-Host "Sartor kill switch armed. Press Ctrl+Alt+Pause to STOP the agent's OS control."
Write-Host "STOP flag path: $StopFlag"
[System.Windows.Forms.Application]::Run([SartorKillWatcher]::new($StopFlag))
