"""Shared Windows wake-lock helper.

Every long-running mini-lab script MUST call `acquire()` at startup and
`release()` on clean exit (or rely on the context manager). The overnight
Qwen experiment previously died because Windows put the box to sleep
mid-training; this prevents that class of failure.

Usage:
    from wake_lock import keep_awake
    with keep_awake("sft-v1 training"):
        train(...)

Or raw:
    import wake_lock
    wake_lock.acquire()
    try:
        ...
    finally:
        wake_lock.release()
"""
from __future__ import annotations

import atexit
import contextlib
import ctypes
import logging
import platform
import sys

log = logging.getLogger("wake_lock")

ES_CONTINUOUS = 0x80000000
ES_SYSTEM_REQUIRED = 0x00000001
ES_AWAYMODE_REQUIRED = 0x00000040
ES_DISPLAY_REQUIRED = 0x00000002

_STATE_ACTIVE = (
    ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_AWAYMODE_REQUIRED
)
_STATE_CLEAR = ES_CONTINUOUS

_held = False


def acquire(tag: str = "") -> bool:
    """Request that Windows stay awake. Returns True if the request was honored."""
    global _held
    if platform.system() != "Windows":
        log.info("wake_lock.acquire: non-Windows platform, no-op")
        return False
    result = ctypes.windll.kernel32.SetThreadExecutionState(_STATE_ACTIVE)
    if result == 0:
        log.error("SetThreadExecutionState returned 0 for tag=%r", tag)
        return False
    _held = True
    atexit.register(release)
    log.info("wake lock acquired (tag=%r)", tag)
    print(f"[wake_lock] acquired (tag={tag!r})", file=sys.stderr)
    return True


def release() -> None:
    global _held
    if not _held:
        return
    if platform.system() != "Windows":
        _held = False
        return
    ctypes.windll.kernel32.SetThreadExecutionState(_STATE_CLEAR)
    _held = False
    log.info("wake lock released")
    print("[wake_lock] released", file=sys.stderr)


@contextlib.contextmanager
def keep_awake(tag: str = ""):
    acquire(tag)
    try:
        yield
    finally:
        release()


if __name__ == "__main__":
    with keep_awake("self-test"):
        print("wake lock self-test: acquired, sleeping 1s, releasing")
        import time
        time.sleep(1)
