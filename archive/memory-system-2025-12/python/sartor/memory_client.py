"""
Memory client for the Sartor multi-tier memory system.
Provides Python access to Hot (Firebase), Warm (Firestore/Vector), and Cold (GitHub) tiers.
"""

import json
import os
import hashlib
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any, Union
from enum import Enum
import requests


class MemoryType(Enum):
    EPISODIC = "episodic"      # Events with timestamps
    SEMANTIC = "semantic"       # Facts and knowledge
    PROCEDURAL = "procedural"  # Workflows and methods
    WORKING = "working"        # Current session context


class MemoryTier(Enum):
    HOT = "hot"      # <100ms - Firebase RTDB
    WARM = "warm"    # <500ms - Firestore + Vector
    COLD = "cold"    # <2s - GitHub


@dataclass
class Memory:
    """A memory entry in the system."""
    id: str
    content: str
    type: MemoryType
    importance: float  # 0.0 to 1.0
    tags: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: str = ""
    source: str = ""
    embedding: Optional[List[float]] = None

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.utcnow().isoformat()
        if not self.id:
            self.id = self._generate_id()

    def _generate_id(self) -> str:
        """Generate a unique ID based on content hash."""
        content_hash = hashlib.sha256(self.content.encode()).hexdigest()[:12]
        return f"mem_{content_hash}"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "content": self.content,
            "type": self.type.value,
            "importance": self.importance,
            "tags": self.tags,
            "metadata": self.metadata,
            "timestamp": self.timestamp,
            "source": self.source,
            "embedding": self.embedding
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Memory":
        return cls(
            id=data.get("id", ""),
            content=data["content"],
            type=MemoryType(data.get("type", "semantic")),
            importance=data.get("importance", 0.5),
            tags=data.get("tags", []),
            metadata=data.get("metadata", {}),
            timestamp=data.get("timestamp", ""),
            source=data.get("source", ""),
            embedding=data.get("embedding")
        )


class MemoryClient:
    """
    Client for accessing the Sartor memory system.

    Supports multiple backends:
    - Local file (development/testing)
    - MCP HTTP server (production)
    - Direct Firebase (if credentials available)
    """

    def __init__(
        self,
        local_path: Optional[str] = None,
        mcp_url: Optional[str] = None,
        firebase_url: Optional[str] = None
    ):
        self.local_path = Path(local_path) if local_path else None
        self.mcp_url = mcp_url
        self.firebase_url = firebase_url

        # Initialize local storage if specified
        if self.local_path:
            self.local_path.mkdir(parents=True, exist_ok=True)
            for tier in MemoryTier:
                (self.local_path / tier.value).mkdir(exist_ok=True)

    def store(
        self,
        content: str,
        memory_type: MemoryType = MemoryType.SEMANTIC,
        importance: float = 0.5,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        source: str = "python-sdk"
    ) -> Memory:
        """Store a new memory."""
        memory = Memory(
            id="",
            content=content,
            type=memory_type,
            importance=importance,
            tags=tags or [],
            metadata=metadata or {},
            source=source
        )

        # Determine tier based on importance
        if importance >= 0.8:
            tier = MemoryTier.HOT
        elif importance >= 0.5:
            tier = MemoryTier.WARM
        else:
            tier = MemoryTier.COLD

        # Store based on available backends
        if self.mcp_url:
            self._store_mcp(memory, tier)
        elif self.local_path:
            self._store_local(memory, tier)

        return memory

    def search(
        self,
        query: str,
        memory_type: Optional[MemoryType] = None,
        min_importance: float = 0.0,
        tags: Optional[List[str]] = None,
        limit: int = 10
    ) -> List[Memory]:
        """Search memories by query string."""
        if self.mcp_url:
            return self._search_mcp(query, memory_type, min_importance, tags, limit)
        elif self.local_path:
            return self._search_local(query, memory_type, min_importance, tags, limit)
        return []

    def get(self, memory_id: str) -> Optional[Memory]:
        """Get a specific memory by ID."""
        if self.local_path:
            for tier in MemoryTier:
                file_path = self.local_path / tier.value / f"{memory_id}.json"
                if file_path.exists():
                    with open(file_path) as f:
                        return Memory.from_dict(json.load(f))
        return None

    def delete(self, memory_id: str) -> bool:
        """Delete a memory by ID."""
        if self.local_path:
            for tier in MemoryTier:
                file_path = self.local_path / tier.value / f"{memory_id}.json"
                if file_path.exists():
                    file_path.unlink()
                    return True
        return False

    def list_by_type(
        self,
        memory_type: MemoryType,
        limit: int = 100
    ) -> List[Memory]:
        """List memories by type."""
        return self.search("", memory_type=memory_type, limit=limit)

    def list_by_tags(self, tags: List[str], limit: int = 100) -> List[Memory]:
        """List memories by tags."""
        return self.search("", tags=tags, limit=limit)

    # --- Local Storage Implementation ---

    def _store_local(self, memory: Memory, tier: MemoryTier):
        """Store memory in local filesystem."""
        file_path = self.local_path / tier.value / f"{memory.id}.json"
        with open(file_path, "w") as f:
            json.dump(memory.to_dict(), f, indent=2)

    def _search_local(
        self,
        query: str,
        memory_type: Optional[MemoryType],
        min_importance: float,
        tags: Optional[List[str]],
        limit: int
    ) -> List[Memory]:
        """Search memories in local filesystem."""
        results = []
        query_lower = query.lower()

        for tier in MemoryTier:
            tier_path = self.local_path / tier.value
            if not tier_path.exists():
                continue

            for file_path in tier_path.glob("*.json"):
                try:
                    with open(file_path) as f:
                        data = json.load(f)
                    memory = Memory.from_dict(data)

                    # Apply filters
                    if memory.importance < min_importance:
                        continue
                    if memory_type and memory.type != memory_type:
                        continue
                    if tags and not any(t in memory.tags for t in tags):
                        continue
                    if query and query_lower not in memory.content.lower():
                        continue

                    results.append(memory)
                except Exception:
                    continue

        # Sort by importance descending
        results.sort(key=lambda m: -m.importance)
        return results[:limit]

    # --- MCP HTTP Implementation ---

    def _store_mcp(self, memory: Memory, tier: MemoryTier):
        """Store memory via MCP HTTP server."""
        try:
            response = requests.post(
                f"{self.mcp_url}/memory/create",
                json={
                    "content": memory.content,
                    "type": memory.type.value,
                    "importance": memory.importance,
                    "tags": memory.tags,
                    "metadata": memory.metadata,
                    "source": memory.source
                },
                timeout=10
            )
            response.raise_for_status()
        except requests.RequestException as e:
            print(f"MCP store failed: {e}, falling back to local")
            if self.local_path:
                self._store_local(memory, tier)

    def _search_mcp(
        self,
        query: str,
        memory_type: Optional[MemoryType],
        min_importance: float,
        tags: Optional[List[str]],
        limit: int
    ) -> List[Memory]:
        """Search memories via MCP HTTP server."""
        try:
            params = {
                "query": query,
                "limit": limit,
                "minImportance": min_importance
            }
            if memory_type:
                params["type"] = memory_type.value
            if tags:
                params["tags"] = ",".join(tags)

            response = requests.get(
                f"{self.mcp_url}/memory/search",
                params=params,
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            return [Memory.from_dict(m) for m in data.get("memories", [])]
        except requests.RequestException as e:
            print(f"MCP search failed: {e}, falling back to local")
            if self.local_path:
                return self._search_local(query, memory_type, min_importance, tags, limit)
            return []


# Convenience functions for quick access
_default_client: Optional[MemoryClient] = None


def init_memory(
    local_path: Optional[str] = None,
    mcp_url: Optional[str] = None
) -> MemoryClient:
    """Initialize the default memory client."""
    global _default_client
    _default_client = MemoryClient(local_path=local_path, mcp_url=mcp_url)
    return _default_client


def remember(
    content: str,
    importance: float = 0.5,
    tags: Optional[List[str]] = None,
    memory_type: MemoryType = MemoryType.SEMANTIC
) -> Memory:
    """Store a memory using the default client."""
    if not _default_client:
        raise RuntimeError("Memory client not initialized. Call init_memory() first.")
    return _default_client.store(content, memory_type, importance, tags)


def recall(query: str, limit: int = 5) -> List[Memory]:
    """Search memories using the default client."""
    if not _default_client:
        raise RuntimeError("Memory client not initialized. Call init_memory() first.")
    return _default_client.search(query, limit=limit)


# Example usage
if __name__ == "__main__":
    # Initialize with local storage
    client = init_memory(local_path="/tmp/sartor/memory")

    # Store some memories
    remember(
        "The RTX 5090 is priced at $0.25/hr on Vast.ai for competitive first rental",
        importance=0.8,
        tags=["pricing", "vast.ai", "rtx5090"]
    )

    remember(
        "Agent harnesses are the 2026 capability unlock - Layer 2 extracts more from Layer 1",
        importance=0.9,
        tags=["architecture", "insight", "deepfates"]
    )

    # Recall memories
    results = recall("pricing")
    for mem in results:
        print(f"[{mem.importance}] {mem.content[:60]}...")
