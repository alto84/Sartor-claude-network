#!/usr/bin/env python3
"""peer-send — Rocinante → Sartor peer Claude (rtxserver / gpuserver1) one-call send.

Design: sartor/memory/projects/peer-comms-streamlining-2026-05-22.md

Usage:
    python peer-send.py <peer> <prompt>
    python peer-send.py <peer> --from-file <path>
    echo "prompt text" | python peer-send.py <peer> --stdin

Behavior:
    1. Preflight: SSH reach + tmux liveness (parallel where possible).
    2. OAuth refresh if peer credential <4h to expiry.
    3. Tmux session recovery if dead.
    4. Light path (default, <500 char single-line): direct tmux send-keys + C-m + ack-capture.
    5. Heavy path (>=500 char OR multi-line OR --force-heavy):
       inbox file + git commit + push + tmux "git pull && cat <file>".
    6. Ack verification: capture-pane tail for processing indicator (~4s window).
    7. JSONL audit log per send: sartor/memory/peer-sends/{YYYY-MM}.jsonl.
    8. §7 content judgment: warn (don't block) on pricing/money/medical/kids patterns.

Exits 0 on visible-processing ack. Non-zero with stderr on failure.

Cross-platform: Python 3.8+, stdlib only. Tested Windows (Rocinante) + Ubuntu (peers).
"""
from __future__ import annotations

import argparse
import datetime
import hashlib
import json
import os
import re
import shlex
import subprocess
import sys
import tempfile
import time
from pathlib import Path

# ---------------------------------------------------------------- constants

REPO_ROOT = Path(__file__).resolve().parent.parent
PEER_SENDS_DIR = REPO_ROOT / "sartor" / "memory" / "peer-sends"
INBOX_DIR_FMT = REPO_ROOT / "sartor" / "memory" / "inbox" / "{peer}"

PEERS = {
    "rtxserver": {
        "ssh_host": "192.168.1.157",
        "ssh_user": "alton",
        "tmux_session": "claude-team-1",
        "user_systemd_unit": "sartor-claude-peer.service",
        "remote_repo_dir": "/home/alton/Sartor-claude-network",
    },
    "rtxpro6000server": "rtxserver",  # alias
    "gpuserver1": {
        "ssh_host": "192.168.1.100",
        "ssh_user": "alton",
        "tmux_session": "claude-team-1",
        "user_systemd_unit": None,  # gpuserver1 spawns tmux via cron, not systemd
        "remote_repo_dir": "/home/alton/Sartor-claude-network",
    },
}

# Heavy-path triggers
HEAVY_CHAR_THRESHOLD = 500
HEAVY_LINES_THRESHOLD = 5

# §7 judgment patterns — loose, per Alton: warn but don't block
SENSITIVE_PATTERNS = [
    (re.compile(r"\bvastai\s+(list|set\s+min-bid|delete|cleanup)\s+machine\b", re.I), "vast.ai pricing/listing change"),
    (re.compile(r"\bsend\b.{0,40}\b(email|to:|gmail)\b", re.I), "sending under principal's name"),
    (re.compile(r"\b(diagnos|patient|prescri|medicat|treatment\s+plan|MRI|EHR|EMR)\w*\b", re.I), "possible medical/PHI"),
    (re.compile(r"\b(vayu|vishala|vasu)\b.{0,80}\b(birthday|school|illness|behavior|medical|grade)\b", re.I), "child-specific detail"),
    (re.compile(r"\b(transfer|wire|venmo|zelle)\s+\$?\d", re.I), "money movement"),
]

ACK_PROCESSING_RE = re.compile(
    r"(Cogitating|Forming|Thinking|Schlepping|Pondering|Reasoning|Building|Constructing|Searching|"
    r"Running…|Bash\(|Read\(|Edit\(|Write\(|Grep\(|Glob\(|Task|tokens|↑\s*\d+|↓\s*\d+|· thought for)",
    re.I,
)

# ---------------------------------------------------------------- utilities

def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")


def resolve_peer(name: str) -> tuple[str, dict]:
    """Returns (canonical-peer-name, peer-config-dict)."""
    if name not in PEERS:
        die(f"unknown peer: {name!r}. Known: {[k for k,v in PEERS.items() if isinstance(v, dict)]}")
    val = PEERS[name]
    if isinstance(val, str):
        return val, PEERS[val]
    return name, val


def die(msg: str, code: int = 2) -> None:
    print(f"peer-send: ERROR: {msg}", file=sys.stderr)
    sys.exit(code)


def warn(msg: str) -> None:
    print(f"peer-send: WARN: {msg}", file=sys.stderr)


def info(msg: str) -> None:
    print(f"peer-send: {msg}", file=sys.stderr)


def ssh_args(peer: dict, *extra: str) -> list[str]:
    """ssh argv prefix, no command yet."""
    return [
        "ssh",
        "-o", "ConnectTimeout=10",
        "-o", "StrictHostKeyChecking=accept-new",
        "-o", "BatchMode=yes",
        f"{peer['ssh_user']}@{peer['ssh_host']}",
        *extra,
    ]


def run(cmd: list[str], timeout: int = 30, check: bool = False, stdin_data: str | None = None) -> subprocess.CompletedProcess:
    # encoding=utf-8 + errors=replace so Windows cp1252 default doesn't choke on
    # peer Claude's TUI unicode (✻ ⏵⏵ etc.) in capture-pane output.
    return subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout,
        check=check,
        input=stdin_data,
    )


def slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower())
    s = s.strip("-")
    return s[:60] or "msg"


def content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:12]


# ---------------------------------------------------------------- preflight

def preflight(peer_name: str, peer: dict) -> None:
    """Quick reachability + tmux liveness. Raise on hard failure."""
    info(f"preflight: ssh {peer['ssh_host']} + tmux ls")
    r = run(ssh_args(peer, "tmux", "ls"), timeout=15)
    if r.returncode != 0:
        # tmux ls fails if no sessions OR ssh fails — distinguish
        if "Connection" in r.stderr or "ssh:" in r.stderr:
            die(f"ssh to {peer['ssh_host']} failed: {r.stderr.strip()}", code=10)
        # tmux not running — try recovery
        warn(f"tmux session check failed, attempting recovery")
        tmux_recover(peer_name, peer)
        return
    if peer["tmux_session"] not in r.stdout:
        warn(f"session {peer['tmux_session']!r} not in tmux ls; attempting recovery")
        tmux_recover(peer_name, peer)


def tmux_recover(peer_name: str, peer: dict) -> None:
    if peer.get("user_systemd_unit"):
        info(f"restarting {peer['user_systemd_unit']} on {peer_name}")
        r = run(ssh_args(peer, "systemctl", "--user", "restart", peer["user_systemd_unit"]), timeout=30)
        if r.returncode != 0:
            die(f"systemd recovery failed: {r.stderr.strip()}", code=11)
        time.sleep(5)
        return
    # gpuserver1: scripted tmux recreate
    info(f"creating new tmux session on {peer_name}")
    cmd = (
        f"tmux new-session -d -s {shlex.quote(peer['tmux_session'])} -x 200 -y 50 "
        f"'cd {shlex.quote(peer['remote_repo_dir'])} && claude --dangerously-skip-permissions'"
    )
    r = run(ssh_args(peer, cmd), timeout=20)
    if r.returncode != 0:
        die(f"tmux recreate failed: {r.stderr.strip()}", code=11)
    time.sleep(5)


def oauth_check(peer_name: str, peer: dict) -> None:
    """Check ~/.claude/.credentials.json expiry on peer; trigger refresh if <4h."""
    cmd = "python3 -c 'import json,time,os; p=os.path.expanduser(\"~/.claude/.credentials.json\"); d=json.load(open(p)); exp=d.get(\"claudeAiOauth\",{}).get(\"expiresAt\",0)/1000; print(int(exp-time.time()))'"
    r = run(ssh_args(peer, cmd), timeout=15)
    if r.returncode != 0:
        warn(f"oauth check failed (non-fatal): {r.stderr.strip()[:80]}")
        return
    try:
        secs_left = int(r.stdout.strip())
    except ValueError:
        warn(f"oauth expiry parse failed: {r.stdout.strip()[:80]}")
        return
    if secs_left < 4 * 3600:
        info(f"oauth expires in {secs_left}s on {peer_name}; refreshing via sartor-creds-sync.ps1")
        cred_sync = REPO_ROOT / "scripts" / "win-tasks" / "sartor-creds-sync.ps1"
        if cred_sync.exists():
            run(["powershell.exe", "-NoProfile", "-File", str(cred_sync)], timeout=60)
        else:
            warn("sartor-creds-sync.ps1 not found; oauth may fail mid-session")


# ---------------------------------------------------------------- send paths

def is_heavy(text: str) -> bool:
    if len(text) >= HEAVY_CHAR_THRESHOLD:
        return True
    if text.count("\n") >= HEAVY_LINES_THRESHOLD:
        return True
    return False


def judge_content(text: str) -> list[str]:
    """Loose §7 scan. Returns list of warning labels. Never blocks."""
    hits = []
    for pat, label in SENSITIVE_PATTERNS:
        if pat.search(text):
            hits.append(label)
    return hits


def send_light(peer_name: str, peer: dict, text: str) -> None:
    """Direct tmux send-keys for short message.

    SSH concats argv through `sh -c`, so the text must be shell-quoted on
    the local side OR delivered via a remote temp file. We use the temp-file
    path: it handles parens, dollar signs, backticks, apostrophes, newlines
    without any local escaping (the "file-not-heredoc" rule from peer-comms
    SKILL, applied to short sends too).
    """
    info(f"light send → {peer_name} ({len(text)} chars)")
    # Write text to local temp file, scp to peer, then tmux send-keys "$(cat tempfile)"
    ts = int(time.time())
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as tf:
        tf.write(text)
        local_tmp = tf.name
    remote_tmp = f"/tmp/peer-send-{ts}.txt"
    try:
        r = run(["scp", "-o", "ConnectTimeout=10", "-o", "BatchMode=yes",
                 local_tmp, f"{peer['ssh_user']}@{peer['ssh_host']}:{remote_tmp}"], timeout=20)
        if r.returncode != 0:
            die(f"scp of text failed: {r.stderr.strip()}", code=20)
        # Step 1: read remote file into tmux pane — single arg, no shell-quoting issue
        cmd = f'tmux send-keys -t {shlex.quote(peer["tmux_session"] + ":0")} "$(cat {shlex.quote(remote_tmp)})"'
        r = run(ssh_args(peer, cmd), timeout=15)
        if r.returncode != 0:
            die(f"tmux send-keys (text) failed: {r.stderr.strip()}", code=20)
        # Step 2: C-m to submit (critical — peer-comms SKILL line 57; Enter as literal won't submit)
        time.sleep(0.5)
        r = run(ssh_args(peer, "tmux", "send-keys", "-t", f"{peer['tmux_session']}:0", "C-m"), timeout=15)
        if r.returncode != 0:
            die(f"tmux send-keys (C-m) failed: {r.stderr.strip()}", code=20)
        # Step 3: clean up remote temp (best effort)
        run(ssh_args(peer, "rm", "-f", remote_tmp), timeout=10)
    finally:
        try:
            os.unlink(local_tmp)
        except OSError:
            pass


def send_heavy(peer_name: str, peer: dict, text: str, slug: str) -> str:
    """Inbox file + commit + push + tmux pull-and-read. Returns commit SHA."""
    ts = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H%MZ")
    inbox_dir = REPO_ROOT / "sartor" / "memory" / "inbox" / peer_name
    inbox_dir.mkdir(parents=True, exist_ok=True)
    file_name = f"{ts}-{slug}.md"
    inbox_path = inbox_dir / file_name
    rel_path = inbox_path.relative_to(REPO_ROOT).as_posix()

    info(f"heavy send → {peer_name}: writing {rel_path}")
    inbox_path.write_text(
        f"---\ntype: peer-send\nfrom: rocinante\nto: {peer_name}\nsent_at: {now_iso()}\n---\n\n{text}\n",
        encoding="utf-8",
    )

    # git add + commit
    r = run(["git", "-C", str(REPO_ROOT), "add", rel_path], timeout=10)
    if r.returncode != 0:
        die(f"git add failed: {r.stderr.strip()}", code=30)
    commit_msg = f"peer-send: {peer_name} {slug}"
    r = run(["git", "-C", str(REPO_ROOT), "commit", "-m", commit_msg], timeout=15)
    if r.returncode != 0:
        die(f"git commit failed: {r.stderr.strip()}", code=30)
    # push to canonical bare (rtxserver:/home/alton/sartor-git)
    r = run(["git", "-C", str(REPO_ROOT), "push", "origin", "main"], timeout=30)
    if r.returncode != 0:
        die(f"git push origin failed: {r.stderr.strip()}", code=30)

    sha = run(["git", "-C", str(REPO_ROOT), "rev-parse", "HEAD"], timeout=10).stdout.strip()

    # Tell peer to pull and read
    pull_msg = (
        f"git pull --rebase origin main && cat {rel_path} "
        f"# peer-send {sha[:8]}: act on directive"
    )
    send_light(peer_name, peer, pull_msg)
    return sha


# ---------------------------------------------------------------- ack + log

def capture_ack(peer: dict, window_s: int = 4) -> tuple[bool, str]:
    """Sleep window_s then capture-pane tail. Return (ack_seen, snapshot)."""
    time.sleep(window_s)
    r = run(ssh_args(peer, "tmux", "capture-pane", "-t", f"{peer['tmux_session']}:0", "-p", "-S", "-30"), timeout=15)
    snap = r.stdout if r.returncode == 0 else r.stderr
    ack = bool(ACK_PROCESSING_RE.search(snap))
    return ack, snap[-1500:]


def audit_log(record: dict) -> None:
    PEER_SENDS_DIR.mkdir(parents=True, exist_ok=True)
    month = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m")
    path = PEER_SENDS_DIR / f"{month}.jsonl"
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


# ---------------------------------------------------------------- main

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Rocinante → Sartor peer Claude one-call send")
    p.add_argument("peer", help=f"one of: {[k for k,v in PEERS.items() if isinstance(v, dict)]}")
    p.add_argument("prompt", nargs="?", default=None, help="prompt text (or use --from-file / --stdin)")
    p.add_argument("--from-file", help="read prompt from file")
    p.add_argument("--stdin", action="store_true", help="read prompt from stdin")
    p.add_argument("--force-heavy", action="store_true", help="force inbox-file path regardless of length")
    p.add_argument("--ack-window", type=int, default=4, help="seconds to wait before capturing ack (default 4)")
    p.add_argument("--no-oauth-check", action="store_true", help="skip OAuth freshness check")
    p.add_argument("--dry-run", action="store_true", help="preflight + content-judge only; no send")
    return p.parse_args()


def main() -> int:
    args = parse_args()

    # Resolve prompt
    if args.stdin:
        text = sys.stdin.read()
    elif args.from_file:
        text = Path(args.from_file).read_text(encoding="utf-8")
    elif args.prompt is not None:
        text = args.prompt
    else:
        die("no prompt provided (positional, --from-file, or --stdin)")
    text = text.rstrip("\n")
    if not text:
        die("empty prompt")

    peer_name, peer = resolve_peer(args.peer)

    # Judgment scan — warn, don't block
    hits = judge_content(text)
    if hits:
        warn(f"content judgment flags: {', '.join(hits)}")
        warn("proceeding anyway (loose-mode per Alton 2026-05-22); peer can decline")

    # Preflight
    preflight(peer_name, peer)
    if not args.no_oauth_check:
        oauth_check(peer_name, peer)

    if args.dry_run:
        info("dry-run: preflight OK, would send")
        return 0

    # Choose path
    slug = slugify(text.splitlines()[0] if text else "msg")
    heavy = args.force_heavy or is_heavy(text)
    commit_sha = None
    try:
        if heavy:
            commit_sha = send_heavy(peer_name, peer, text, slug)
        else:
            send_light(peer_name, peer, text)
    except Exception as e:
        # Log the failed send too
        audit_log({
            "ts": now_iso(),
            "peer": peer_name,
            "path": "heavy" if heavy else "light",
            "slug": slug,
            "content_hash": content_hash(text),
            "content_preview": text[:200],
            "char_count": len(text),
            "commit_sha": commit_sha,
            "ack_seen": False,
            "ack_snapshot": "",
            "judgment_flags": hits,
            "status": "send-failed",
            "error": str(e),
        })
        raise

    # Ack capture
    ack_seen, ack_snap = capture_ack(peer, args.ack_window)
    info(f"ack {'OK' if ack_seen else 'NOT-SEEN-YET'} ({len(ack_snap)} chars captured)")

    audit_log({
        "ts": now_iso(),
        "peer": peer_name,
        "path": "heavy" if heavy else "light",
        "slug": slug,
        "content_hash": content_hash(text),
        "content_preview": text[:200],
        "char_count": len(text),
        "commit_sha": commit_sha,
        "ack_seen": ack_seen,
        "ack_snapshot": ack_snap,
        "judgment_flags": hits,
        "status": "sent",
    })

    if not ack_seen:
        warn("no processing indicator visible in capture-pane tail; peer may still be working")
        # exit non-zero so callers know to investigate, but the send itself succeeded
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
