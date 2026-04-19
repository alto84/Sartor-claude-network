"""
Local-First Memory System
Inspired by OpenClaw's markdown-based memory with hybrid search.

Design principles:
- Markdown files are the source of truth (human-readable, editable, portable)
- Append-only daily logs for audit trail
- Hybrid BM25 + semantic search for retrieval
- Auto-compaction before context overflow
- Session memory flush to persist important facts

Usage:
    memory = LocalFirstMemory("/path/to/memory/")
    memory.store("user_preferences", "User prefers dark mode and vim keybindings", tags=["preferences"])
    results = memory.search("dark mode")
    memory.flush_session(session_facts=["Discovered user uses RTX 5090"])
"""

import os
import json
import re
import time
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field


@dataclass
class MemoryEntry:
    key: str
    content: str
    tags: List[str] = field(default_factory=list)
    timestamp: float = 0.0
    source: str = ""
    confidence: float = 1.0

    def to_markdown(self) -> str:
        """Convert to markdown section."""
        lines = [f"## {self.key}"]
        if self.tags:
            lines.append(f"**Tags:** {', '.join(self.tags)}")
        if self.source:
            lines.append(f"**Source:** {self.source}")
        lines.append(f"**Updated:** {datetime.fromtimestamp(self.timestamp).isoformat()}")
        lines.append("")
        lines.append(self.content)
        lines.append("")
        return "\n".join(lines)


class LocalFirstMemory:
    """Markdown-first memory system with search capabilities."""

    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

        # Core files
        self.memory_file = self.base_dir / "MEMORY.md"
        self.daily_dir = self.base_dir / "daily"
        self.index_file = self.base_dir / ".index.json"

        self.daily_dir.mkdir(exist_ok=True)

        # Load or create index
        self._index = self._load_index()

    def _load_index(self) -> Dict:
        """Load the search index."""
        if self.index_file.exists():
            try:
                return json.loads(self.index_file.read_text())
            except json.JSONDecodeError:
                pass
        return {"entries": {}, "tags": {}, "last_updated": 0}

    def _save_index(self):
        """Save the search index."""
        self._index["last_updated"] = time.time()
        self.index_file.write_text(json.dumps(self._index, indent=2))

    def store(self, key: str, content: str, tags: List[str] = None,
              source: str = "", confidence: float = 1.0):
        """Store a memory entry."""
        entry = MemoryEntry(
            key=key,
            content=content,
            tags=tags or [],
            timestamp=time.time(),
            source=source,
            confidence=confidence,
        )

        # Update MEMORY.md
        self._update_memory_file(entry)

        # Update index
        self._index["entries"][key] = {
            "content": content,
            "tags": entry.tags,
            "timestamp": entry.timestamp,
            "source": source,
            "confidence": confidence,
        }
        for tag in entry.tags:
            if tag not in self._index["tags"]:
                self._index["tags"][tag] = []
            if key not in self._index["tags"][tag]:
                self._index["tags"][tag].append(key)
        self._save_index()

        # Append to daily log
        self._append_daily_log(entry)

    def _update_memory_file(self, entry: MemoryEntry):
        """Update or append to MEMORY.md."""
        if self.memory_file.exists():
            content = self.memory_file.read_text()
        else:
            content = "# Memory\n\nCurated facts and knowledge.\n\n"

        # Check if key already exists (replace section)
        pattern = rf"## {re.escape(entry.key)}\n.*?(?=\n## |\Z)"
        if re.search(pattern, content, re.DOTALL):
            content = re.sub(pattern, entry.to_markdown().rstrip(), content, flags=re.DOTALL)
        else:
            content += entry.to_markdown()

        self.memory_file.write_text(content)

    def _append_daily_log(self, entry: MemoryEntry):
        """Append to today's daily log (append-only)."""
        today = datetime.now().strftime("%Y-%m-%d")
        log_file = self.daily_dir / f"{today}.md"

        timestamp = datetime.fromtimestamp(entry.timestamp).strftime("%H:%M:%S")
        line = f"- **{timestamp}** [{entry.key}] {entry.content[:200]}\n"

        with open(log_file, "a") as f:
            if not log_file.exists() or log_file.stat().st_size == 0:
                f.write(f"# Daily Log: {today}\n\n")
            f.write(line)

    def get(self, key: str) -> Optional[MemoryEntry]:
        """Retrieve a specific memory by key."""
        if key in self._index["entries"]:
            data = self._index["entries"][key]
            return MemoryEntry(
                key=key,
                content=data["content"],
                tags=data.get("tags", []),
                timestamp=data.get("timestamp", 0),
                source=data.get("source", ""),
                confidence=data.get("confidence", 1.0),
            )
        return None

    def search(self, query: str, limit: int = 10) -> List[Tuple[str, float]]:
        """Search memories using BM25-style text matching.

        Returns list of (key, score) tuples sorted by relevance.
        """
        query_terms = query.lower().split()
        scores = {}

        for key, data in self._index["entries"].items():
            content = f"{key} {data['content']} {' '.join(data.get('tags', []))}".lower()
            score = 0.0
            for term in query_terms:
                # Term frequency
                tf = content.count(term)
                if tf > 0:
                    # Simple BM25-like scoring
                    score += (tf * 2.0) / (tf + 1.0)
                    # Boost for key/title match
                    if term in key.lower():
                        score += 2.0
                    # Boost for tag match
                    for tag in data.get("tags", []):
                        if term in tag.lower():
                            score += 1.5
            if score > 0:
                scores[key] = score * data.get("confidence", 1.0)

        sorted_results = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_results[:limit]

    def search_by_tag(self, tag: str) -> List[str]:
        """Find all memories with a specific tag."""
        return self._index["tags"].get(tag, [])

    def flush_session(self, session_facts: List[str], session_id: str = None):
        """Flush important session facts to persistent memory.

        Called before context overflow to preserve continuity.
        Inspired by OpenClaw's session compaction pattern.
        """
        if not session_facts:
            return

        session_id = session_id or datetime.now().strftime("%Y%m%d_%H%M%S")
        key = f"session_flush_{session_id}"
        content = "\n".join(f"- {fact}" for fact in session_facts)

        self.store(
            key=key,
            content=content,
            tags=["session_flush", "auto_generated"],
            source=f"session_{session_id}",
        )

    def get_recent(self, n: int = 10) -> List[MemoryEntry]:
        """Get the N most recently updated memories."""
        entries = []
        for key, data in self._index["entries"].items():
            entries.append((key, data.get("timestamp", 0)))
        entries.sort(key=lambda x: x[1], reverse=True)
        return [self.get(key) for key, _ in entries[:n]]

    def stats(self) -> Dict:
        """Get memory system statistics."""
        return {
            "total_entries": len(self._index["entries"]),
            "total_tags": len(self._index["tags"]),
            "daily_logs": len(list(self.daily_dir.glob("*.md"))),
            "memory_file_size": self.memory_file.stat().st_size if self.memory_file.exists() else 0,
        }


class HeartbeatScheduler:
    """Periodic self-wakeup for proactive agent behavior.

    Inspired by OpenClaw's heartbeat pattern - agents check a lightweight
    checklist file periodically to determine if action is needed.
    """

    def __init__(self, checklist_path: str, interval: int = 300):
        self.checklist_path = Path(checklist_path)
        self.interval = interval  # seconds
        self._handlers: Dict[str, callable] = {}

    def register_check(self, name: str, handler: callable):
        """Register a periodic check."""
        self._handlers[name] = handler

    def run_checks(self) -> List[Dict]:
        """Run all registered checks and return results."""
        results = []
        for name, handler in self._handlers.items():
            try:
                result = handler()
                results.append({"check": name, "result": result, "status": "ok"})
            except Exception as e:
                results.append({"check": name, "error": str(e), "status": "error"})
        return results

    def update_checklist(self, items: List[str]):
        """Update the checklist file."""
        content = f"# Heartbeat Checklist\n**Updated:** {datetime.now().isoformat()}\n\n"
        for item in items:
            content += f"- [ ] {item}\n"
        self.checklist_path.write_text(content)
