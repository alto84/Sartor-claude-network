#!/usr/bin/env python3
"""
sartor-power: lightweight power/energy logger for gpuserver1.

Polls Intel RAPL (CPU package energy counter) and nvidia-smi (GPU instantaneous
power) and writes one TSV row per invocation to /home/alton/sartor-power/data/YYYY-MM-DD.tsv.

Designed for repeated invocation every ~10s via systemd timer or always-running
daemon loop. Stdlib only. Handles counter rollover, first-run, concurrent
invocation (flock), and missing sensors gracefully.
"""
import datetime as dt
import errno
import fcntl
import json
import os
import subprocess
import sys
import time
from pathlib import Path

BASE = Path("/home/alton/sartor-power")
DATA = BASE / "data"
LOGS = BASE / "logs"
STATE_FILE = BASE / "state.json"
LOCK_FILE = BASE / "power_logger.lock"

RAPL_PACKAGE = Path("/sys/class/powercap/intel-rapl:0")

COLS = [
    "timestamp_iso",
    "cpu_package_joules_cumulative",
    "cpu_package_watts_interval",
    "dram_joules_cumulative",
    "dram_watts_interval",
    "gpu_joules_cumulative",
    "gpu_watts_instantaneous",
    "gpu_watts_interval",
    "estimated_total_watts",
]


def read_rapl(domain_dir: Path):
    """Return (energy_uj_int, max_range_uj_int) or (None, None) if unavailable."""
    try:
        energy = int((domain_dir / "energy_uj").read_text().strip())
        maxr = int((domain_dir / "max_energy_range_uj").read_text().strip())
        return energy, maxr
    except (OSError, ValueError):
        return None, None


def read_gpu_power():
    """Return (power_draw_avg_w, power_draw_instant_w) or (None, None)."""
    try:
        out = subprocess.check_output(
            [
                "nvidia-smi",
                "--query-gpu=power.draw,power.draw.instant",
                "--format=csv,noheader,nounits",
            ],
            stderr=subprocess.DEVNULL,
            timeout=5,
        ).decode()
        # Handles 1 or more GPUs; sum across them.
        total_avg = 0.0
        total_inst = 0.0
        any_row = False
        for line in out.strip().splitlines():
            parts = [p.strip() for p in line.split(",")]
            if len(parts) >= 2:
                try:
                    total_avg += float(parts[0])
                    total_inst += float(parts[1])
                    any_row = True
                except ValueError:
                    pass
        if any_row:
            return total_avg, total_inst
    except (OSError, subprocess.SubprocessError):
        pass
    return None, None


def load_state():
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except (OSError, json.JSONDecodeError):
            pass
    return {}


def save_state(state):
    tmp = STATE_FILE.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(state))
    tmp.replace(STATE_FILE)


def diff_counter(cur, prev, maxr):
    """Return energy delta in joules, handling rollover. cur, prev, maxr in uJ."""
    if prev is None or cur is None:
        return None
    delta_uj = cur - prev
    if delta_uj < 0 and maxr:
        delta_uj += maxr
    return delta_uj / 1_000_000.0  # joules


def fmt(v, prec=3):
    if v is None:
        return ""
    if isinstance(v, float):
        return f"{v:.{prec}f}"
    return str(v)


def main():
    BASE.mkdir(parents=True, exist_ok=True)
    DATA.mkdir(parents=True, exist_ok=True)
    LOGS.mkdir(parents=True, exist_ok=True)

    # Advisory lock: prevents concurrent TSV writes corrupting rows.
    lock_fd = os.open(str(LOCK_FILE), os.O_CREAT | os.O_RDWR, 0o644)
    try:
        fcntl.flock(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError as e:
        if e.errno in (errno.EAGAIN, errno.EACCES):
            # Another invocation is running; bail out cleanly.
            return 0
        raise

    try:
        now = dt.datetime.now(dt.timezone.utc).astimezone()
        now_iso = now.isoformat(timespec="seconds")
        now_unix = now.timestamp()

        # Read RAPL package-0 (CPU package)
        cpu_uj, cpu_max = read_rapl(RAPL_PACKAGE)
        # DRAM domain: check for intel-rapl:0:1 or a 'dram' subdomain. On 14900K
        # consumer Z790 this is typically absent.
        dram_uj, dram_max = None, None
        for sub in sorted(RAPL_PACKAGE.glob("intel-rapl:*")):
            try:
                name = (sub / "name").read_text().strip()
            except OSError:
                continue
            if name == "dram":
                dram_uj, dram_max = read_rapl(sub)
                break

        gpu_avg_w, gpu_inst_w = read_gpu_power()

        state = load_state()
        prev_cpu_uj = state.get("cpu_uj")
        prev_dram_uj = state.get("dram_uj")
        prev_gpu_joules = state.get("gpu_joules")
        prev_ts = state.get("ts")

        interval_s = None
        if prev_ts is not None:
            interval_s = max(0.001, now_unix - prev_ts)

        # CPU package interval watts
        cpu_watts_interval = None
        if interval_s and cpu_uj is not None and prev_cpu_uj is not None:
            dj = diff_counter(cpu_uj, prev_cpu_uj, cpu_max)
            if dj is not None:
                cpu_watts_interval = dj / interval_s

        # DRAM interval watts
        dram_watts_interval = None
        if interval_s and dram_uj is not None and prev_dram_uj is not None:
            dj = diff_counter(dram_uj, prev_dram_uj, dram_max)
            if dj is not None:
                dram_watts_interval = dj / interval_s

        # GPU cumulative joules: driver 570 on 5090 does not expose
        # total_energy_consumption, so we integrate power.draw (average over ~1s)
        # across poll intervals. First row has no prior sample -> start at 0.
        if prev_gpu_joules is None:
            gpu_joules_cum = 0.0
        else:
            gpu_joules_cum = float(prev_gpu_joules)
        gpu_watts_interval = None
        if interval_s and gpu_avg_w is not None:
            # Trapezoidal integration using current average power draw over
            # the interval since the last poll.
            gpu_joules_cum += gpu_avg_w * interval_s
            gpu_watts_interval = gpu_avg_w  # power.draw is already time-averaged

        # Estimated total watts using the 1.15x + 25W formula. We need a
        # current-watts estimate; use the interval watts when we have them,
        # otherwise fall back to instantaneous.
        est_total = None
        cpu_w_for_total = cpu_watts_interval
        gpu_w_for_total = gpu_watts_interval if gpu_watts_interval is not None else gpu_inst_w
        dram_w_for_total = dram_watts_interval if dram_watts_interval is not None else 0.0
        if cpu_w_for_total is not None and gpu_w_for_total is not None:
            est_total = (cpu_w_for_total + gpu_w_for_total + dram_w_for_total) * 1.15 + 25.0

        row = {
            "timestamp_iso": now_iso,
            "cpu_package_joules_cumulative": fmt((cpu_uj or 0) / 1_000_000.0, 3) if cpu_uj is not None else "",
            "cpu_package_watts_interval": fmt(cpu_watts_interval, 3),
            "dram_joules_cumulative": fmt((dram_uj or 0) / 1_000_000.0, 3) if dram_uj is not None else "",
            "dram_watts_interval": fmt(dram_watts_interval, 3),
            "gpu_joules_cumulative": fmt(gpu_joules_cum, 3) if gpu_avg_w is not None else "",
            "gpu_watts_instantaneous": fmt(gpu_inst_w, 3),
            "gpu_watts_interval": fmt(gpu_watts_interval, 3),
            "estimated_total_watts": fmt(est_total, 3),
        }

        tsv_path = DATA / f"{now.strftime('%Y-%m-%d')}.tsv"
        need_header = not tsv_path.exists() or tsv_path.stat().st_size == 0
        with open(tsv_path, "a", encoding="utf-8") as f:
            if need_header:
                f.write("\t".join(COLS) + "\n")
            f.write("\t".join(row[c] for c in COLS) + "\n")

        save_state(
            {
                "ts": now_unix,
                "cpu_uj": cpu_uj,
                "dram_uj": dram_uj,
                "gpu_joules": gpu_joules_cum if gpu_avg_w is not None else prev_gpu_joules,
            }
        )
        return 0
    finally:
        try:
            fcntl.flock(lock_fd, fcntl.LOCK_UN)
        except OSError:
            pass
        os.close(lock_fd)


def daemon():
    """Run main() in a loop every POLL_INTERVAL seconds."""
    interval = int(os.environ.get("POLL_INTERVAL", "10"))
    while True:
        start = time.time()
        try:
            main()
        except Exception as e:  # noqa: BLE001
            # Log to LOGS/error.log but never crash the daemon.
            try:
                LOGS.mkdir(parents=True, exist_ok=True)
                with open(LOGS / "error.log", "a", encoding="utf-8") as f:
                    f.write(f"{dt.datetime.now().isoformat()} {type(e).__name__}: {e}\n")
            except OSError:
                pass
        elapsed = time.time() - start
        time.sleep(max(0.0, interval - elapsed))


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--daemon":
        daemon()
    else:
        sys.exit(main())
