"""
Sartor API Cost Tracker

Tracks Claude API usage and estimated costs with a configurable daily
spending limit. Stores data in a simple JSON file with automatic pruning
of entries older than 30 days.
"""

import argparse
import fcntl
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

# Per-million-token pricing
MODEL_PRICING = {
    "haiku":  {"input": 0.25, "output": 1.25},
    "sonnet": {"input": 3.00, "output": 15.00},
    "opus":   {"input": 15.00, "output": 75.00},
}

DEFAULT_DAILY_LIMIT = 5.00
PRUNE_DAYS = 30


def _calculate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    """Calculate the dollar cost for a single API call."""
    pricing = MODEL_PRICING[model]
    cost = (input_tokens * pricing["input"] + output_tokens * pricing["output"]) / 1_000_000
    return round(cost, 6)


class CostTracker:
    """Thread-safe API cost tracker backed by a JSON file."""

    def __init__(self, path: str = "sartor/costs.json"):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def _read(self) -> dict:
        if not self.path.exists():
            return {"daily_limit": DEFAULT_DAILY_LIMIT, "calls": []}
        with open(self.path, "r") as f:
            fcntl.flock(f, fcntl.LOCK_SH)
            try:
                data = json.load(f)
            finally:
                fcntl.flock(f, fcntl.LOCK_UN)
        return data

    def _write(self, data: dict) -> None:
        cutoff = (datetime.now() - timedelta(days=PRUNE_DAYS)).isoformat()
        data["calls"] = [c for c in data["calls"] if c["timestamp"] >= cutoff]
        with open(self.path, "w") as f:
            fcntl.flock(f, fcntl.LOCK_EX)
            try:
                json.dump(data, f, indent=2)
                f.write("\n")
            finally:
                fcntl.flock(f, fcntl.LOCK_UN)

    def log_call(
        self,
        model: str,
        input_tokens: int,
        output_tokens: int,
        timestamp: Optional[str] = None,
    ) -> float:
        """Log an API call and return its cost."""
        model = model.lower()
        if model not in MODEL_PRICING:
            raise ValueError(f"Unknown model: {model}. Use: {list(MODEL_PRICING)}")
        cost = _calculate_cost(model, input_tokens, output_tokens)
        entry = {
            "timestamp": timestamp or datetime.now().isoformat(timespec="seconds"),
            "model": model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost": cost,
        }
        data = self._read()
        data["calls"].append(entry)
        self._write(data)
        return cost

    def _sum_since(self, since: datetime) -> float:
        cutoff = since.isoformat()
        data = self._read()
        return round(sum(c["cost"] for c in data["calls"] if c["timestamp"] >= cutoff), 6)

    def get_today_total(self) -> float:
        """Total cost for today (since midnight)."""
        return self._sum_since(datetime.now().replace(hour=0, minute=0, second=0, microsecond=0))

    def get_week_total(self) -> float:
        """Total cost for the last 7 days."""
        return self._sum_since(datetime.now() - timedelta(days=7))

    def get_month_total(self) -> float:
        """Total cost for the last 30 days."""
        return self._sum_since(datetime.now() - timedelta(days=30))

    def can_spend(self, amount: float = 0.0) -> bool:
        """Check if spending `amount` would stay within the daily limit."""
        data = self._read()
        limit = data.get("daily_limit", DEFAULT_DAILY_LIMIT)
        return (self.get_today_total() + amount) <= limit

    def set_daily_limit(self, limit: float) -> None:
        """Update the daily spending limit."""
        data = self._read()
        data["daily_limit"] = round(limit, 2)
        self._write(data)

    def get_summary(self) -> dict:
        """Return a summary dict with today, this_week, this_month, and limit."""
        data = self._read()
        return {
            "today": self.get_today_total(),
            "this_week": self.get_week_total(),
            "this_month": self.get_month_total(),
            "limit": data.get("daily_limit", DEFAULT_DAILY_LIMIT),
        }


def _format_summary(tracker: CostTracker, period: str = "today") -> str:
    summary = tracker.get_summary()
    remaining = summary["limit"] - summary["today"]
    lines = []
    if period == "today":
        lines.append(f"  Today:      ${summary['today']:.4f}")
    elif period == "week":
        lines.append(f"  This week:  ${summary['this_week']:.4f}")
        lines.append(f"  Today:      ${summary['today']:.4f}")
    lines.append(f"  Daily limit: ${summary['limit']:.2f}")
    lines.append(f"  Remaining:   ${remaining:.4f}")
    return "Sartor Cost Tracker\n" + "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Sartor API Cost Tracker")
    parser.add_argument("--file", default="sartor/costs.json", help="Path to costs.json")
    parser.add_argument("--week", action="store_true", help="Show this week's costs")
    parser.add_argument("--limit", type=float, help="Set daily spending limit")
    parser.add_argument("--log", nargs=3, metavar=("MODEL", "INPUT_TOK", "OUTPUT_TOK"),
                        help="Log a call: model input_tokens output_tokens")
    args = parser.parse_args()

    tracker = CostTracker(args.file)

    if args.limit is not None:
        tracker.set_daily_limit(args.limit)
        print(f"Daily limit set to ${args.limit:.2f}")
        return

    if args.log:
        model, inp, out = args.log[0], int(args.log[1]), int(args.log[2])
        cost = tracker.log_call(model=model, input_tokens=inp, output_tokens=out)
        print(f"Logged {model} call: {inp} in / {out} out = ${cost:.6f}")
        return

    period = "week" if args.week else "today"
    print(_format_summary(tracker, period))


if __name__ == "__main__":
    main()
