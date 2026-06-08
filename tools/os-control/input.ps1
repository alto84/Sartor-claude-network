<#
input.ps1 — synthetic-input ENGINE (dot-source library; not called directly).
All synthetic mouse/keyboard goes through gate.ps1, which dot-sources this file.
Pins PER_MONITOR_AWARE_V2 and normalizes physical coords to the SendInput
ABSOLUTE|VIRTUALDESK 0..65535 space across the whole virtual desktop (handles the
negative-X left monitor correctly). NO SetCursorPos / mouse_event (legacy, DPI-broken).

Dot-source:  . .\input.ps1   then call Invoke-CCClick / Invoke-CCType / etc.
#>

if (-not ('SartorCC.Input' -as [type])) {
Add-Type -Namespace SartorCC -Name Input -MemberDefinition @'
[StructLayout(LayoutKind.Sequential)]
public struct MOUSEINPUT { public int dx; public int dy; public uint mouseData; public uint dwFlags; public uint time; public IntPtr dwExtraInfo; }
[StructLayout(LayoutKind.Sequential)]
public struct KEYBDINPUT { public ushort wVk; public ushort wScan; public uint dwFlags; public uint time; public IntPtr dwExtraInfo; }
[StructLayout(LayoutKind.Explicit)]
public struct INPUTUNION { [FieldOffset(0)] public MOUSEINPUT mi; [FieldOffset(0)] public KEYBDINPUT ki; }
[StructLayout(LayoutKind.Sequential)]
public struct INPUT { public uint type; public INPUTUNION u; }

[DllImport("user32.dll", SetLastError=true)] public static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);
[DllImport("user32.dll")] public static extern int GetSystemMetrics(int nIndex);
[DllImport("user32.dll")] public static extern bool SetProcessDpiAwarenessContext(IntPtr value);

const uint INPUT_MOUSE = 0, INPUT_KEYBOARD = 1;
const uint MOVE=0x0001, LDOWN=0x0002, LUP=0x0004, RDOWN=0x0008, RUP=0x0010, MDOWN=0x0020, MUP=0x0040, WHEELF=0x0800, ABS=0x8000, VDESK=0x4000;
const uint KEYUP=0x0002, UNICODE=0x0004;

public static void Init() { try { SetProcessDpiAwarenessContext((IntPtr)(-4)); } catch {} }

static int VL(){ return GetSystemMetrics(76); }
static int VT(){ return GetSystemMetrics(77); }
static int VW(){ return GetSystemMetrics(78); }
static int VH(){ return GetSystemMetrics(79); }

static int NX(int x){ return (int)System.Math.Round((double)(x - VL()) * 65535.0 / (VW() - 1)); }
static int NY(int y){ return (int)System.Math.Round((double)(y - VT()) * 65535.0 / (VH() - 1)); }

static void Send(INPUT[] a){ SendInput((uint)a.Length, a, Marshal.SizeOf(typeof(INPUT))); }
static INPUT M(uint flags, int nx, int ny, uint data){ INPUT i=new INPUT(); i.type=INPUT_MOUSE; i.u.mi.dx=nx; i.u.mi.dy=ny; i.u.mi.mouseData=data; i.u.mi.dwFlags=flags; return i; }

public static void MoveTo(int x,int y){ Send(new INPUT[]{ M(MOVE|ABS|VDESK, NX(x), NY(y), 0) }); }

public static void Click(int x,int y,string button,bool dbl){
  uint dn=LDOWN, up=LUP;
  if(button=="right"){ dn=RDOWN; up=RUP; } else if(button=="middle"){ dn=MDOWN; up=MUP; }
  int nx=NX(x), ny=NY(y);
  System.Collections.Generic.List<INPUT> l = new System.Collections.Generic.List<INPUT>();
  l.Add(M(MOVE|ABS|VDESK,nx,ny,0));
  l.Add(M(dn|ABS|VDESK,nx,ny,0)); l.Add(M(up|ABS|VDESK,nx,ny,0));
  if(dbl){ l.Add(M(dn|ABS|VDESK,nx,ny,0)); l.Add(M(up|ABS|VDESK,nx,ny,0)); }
  Send(l.ToArray());
}

public static void Drag(int x1,int y1,int x2,int y2,string button){
  uint dn=LDOWN, up=LUP; if(button=="right"){ dn=RDOWN; up=RUP; }
  MoveTo(x1,y1); Send(new INPUT[]{ M(dn|ABS|VDESK,NX(x1),NY(y1),0) });
  int steps=20;
  for(int s=1;s<=steps;s++){ int xi=x1+(x2-x1)*s/steps; int yi=y1+(y2-y1)*s/steps; Send(new INPUT[]{ M(MOVE|ABS|VDESK,NX(xi),NY(yi),0) }); }
  Send(new INPUT[]{ M(up|ABS|VDESK,NX(x2),NY(y2),0) });
}

public static void Wheel(int notches){ Send(new INPUT[]{ M(WHEELF,0,0,(uint)(notches*120)) }); }

static INPUT K(ushort vk, ushort scan, uint flags){ INPUT i=new INPUT(); i.type=INPUT_KEYBOARD; i.u.ki.wVk=vk; i.u.ki.wScan=scan; i.u.ki.dwFlags=flags; return i; }

public static void TypeChar(char c){
  ushort s=(ushort)c;
  Send(new INPUT[]{ K(0,s,UNICODE), K(0,s,UNICODE|KEYUP) });
}
public static void TypeText(string t){ foreach(char c in t){ TypeChar(c); } }

public static void KeyTap(ushort vk){ Send(new INPUT[]{ K(vk,0,0), K(vk,0,KEYUP) }); }
public static void Chord(ushort[] mods, ushort vk){
  System.Collections.Generic.List<INPUT> l=new System.Collections.Generic.List<INPUT>();
  foreach(ushort m in mods) l.Add(K(m,0,0));
  l.Add(K(vk,0,0)); l.Add(K(vk,0,KEYUP));
  for(int i=mods.Length-1;i>=0;i--) l.Add(K(mods[i],0,KEYUP));
  Send(l.ToArray());
}
'@
}

[void][SartorCC.Input]::Init()

# ---- PowerShell wrappers (the surface gate.ps1 calls) -------------------------
function Invoke-CCMove   { param([int]$X,[int]$Y) [SartorCC.Input]::MoveTo($X,$Y) }
function Invoke-CCClick  { param([int]$X,[int]$Y,[ValidateSet('left','right','middle')][string]$Button='left',[switch]$Double) [SartorCC.Input]::Click($X,$Y,$Button,[bool]$Double) }
function Invoke-CCDrag   { param([int]$X1,[int]$Y1,[int]$X2,[int]$Y2,[ValidateSet('left','right')][string]$Button='left') [SartorCC.Input]::Drag($X1,$Y1,$X2,$Y2,$Button) }
function Invoke-CCWheel  { param([int]$Notches) [SartorCC.Input]::Wheel($Notches) }
function Invoke-CCType   { param([Parameter(Mandatory)][string]$Text) [SartorCC.Input]::TypeText($Text) }
function Invoke-CCKey    { param([Parameter(Mandatory)][int]$Vk) [SartorCC.Input]::KeyTap([uint16]$Vk) }
function Invoke-CCChord  { param([int[]]$Mods,[Parameter(Mandatory)][int]$Vk) [SartorCC.Input]::Chord([uint16[]]$Mods,[uint16]$Vk) }

# Secret entry: types a SecureString per-char, never materializing it in a logged
# variable, never as a tool-call argument. Plaintext lives only inside this scope
# for the minimum time, then is zeroed. This is the Bitwarden-fallback typing path.
function Invoke-CCTypeSecure {
  param([Parameter(Mandatory)][System.Security.SecureString]$Secure)
  $bstr = [System.IntPtr]::Zero
  try {
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
    $plain = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    [SartorCC.Input]::TypeText($plain)
  } finally {
    if ($bstr -ne [System.IntPtr]::Zero) { [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
    if ($plain) { $plain = $null }
    [System.GC]::Collect()
  }
}
