#!/usr/bin/env python3
"""Semantic search engine over markdown memory files using embeddings.

Runs PARALLEL to the existing BM25 search (search.py), not replacing it.
Embeddings come from ollama (nomic-embed-text, 768-dim) on gpuserver1.
Index is a SQLite DB at .index/memory.db -- a derived artifact, .gitignored.

Usage:
    CLI:
        python embeddings.py --build              # full rebuild
        python embeddings.py --update             # incremental (changed files only)
        python embeddings.py --search "query"     # semantic search
        python embeddings.py --hybrid "query"     # blended BM25 + semantic + decay
        python embeddings.py --status             # index stats

    Import:
        from embeddings import SemanticSearch
        ss = SemanticSearch("path/to/memory")
        results = ss.search_semantic("query")
        results = ss.search_hybrid("query")
"""

import json
import math
import os
import re
import sqlite3
import struct
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

OLLAMA_URL = "http://192.168.1.100:11434/api/embed"
OLLAMA_MODEL = "nomic-embed-text"
EMBEDDING_DIM = 768
INDEX_DIR = Path(__file__).resolve().parent / ".index"
DB_PATH = INDEX_DIR / "memory.db"
SKIP_DIRS = {".obsidian", ".git", "__pycache__", "node_modules", ".meta", ".index"}

# Chunking limits
MAX_CHUNK_CHARS = 2000  # Soft cap per chunk
MIN_CHUNK_CHARS = 50    # Skip tiny chunks

# Hybrid search defaults
DEFAULT_BM25_WEIGHT = 0.4
DEFAULT_SEMANTIC_WEIGHT = 0.6

# ---------------------------------------------------------------------------
# Embedding helpers
# ---------------------------------------------------------------------------

def _pack_embedding(vec: list[float]) -> bytes:
    """Pack a float list into a compact binary blob (little-endian float32)."""
    return struct.pack(f"<{len(vec)}f", *vec)


def _unpack_embedding(blob: bytes) -> list[float]:
    """Unpack a binary blob back to a float list."""
    n = len(blob) // 4
    return list(struct.unpack(f"<{n}f", blob))


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def _get_embeddings(texts: list[str], timeout: float = 60.0) -> list[list[float]] | None:
    """Get embeddings from ollama API. Returns None if unreachable.

    Uses the /api/embed endpoint (ollama 0.20+) with batch input.
    """
    if not texts:
        return []
    try:
        payload = json.dumps({"model": OLLAMA_MODEL, "input": texts}).encode()
        req = urllib.request.Request(
            OLLAMA_URL,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read())
            embeddings = data.get("embeddings", [])
            if len(embeddings) == len(texts):
                return embeddings
            # Fallback: single embedding returned for single input
            if len(texts) == 1 and "embedding" in data:
                return [data["embedding"]]
            return embeddings if embeddings else None
    except (urllib.error.URLError, urllib.error.HTTPError, OSError, json.JSONDecodeError) as e:
        return None


def _get_single_embedding(text: str, timeout: float = 30.0) -> list[float] | None:
    """Get embedding for a single text. Returns None if unreachable."""
    result = _get_embeddings([text], timeout=timeout)
    if result and len(result) > 0:
        return result[0]
    return None


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------

def _chunk_markdown(text: str, file_path: str) -> list[dict]:
    """Split markdown into chunks by section headers (## headings).

    Returns list of dicts: {file_path, section_heading, chunk_text, line_number}
    Chunks on ## (h2) boundaries. Content before the first heading is its own chunk.
    If a section exceeds MAX_CHUNK_CHARS, it is split on paragraph boundaries.
    """
    lines = text.splitlines()
    chunks = []
    current_heading = "(preamble)"
    current_lines = []
    current_start = 1

    def _flush(heading, chunk_lines, start_line):
        """Flush accumulated lines into one or more chunks."""
        raw = "\n".join(chunk_lines).strip()
        if len(raw) < MIN_CHUNK_CHARS:
            return
        if len(raw) <= MAX_CHUNK_CHARS:
            chunks.append({
                "file_path": file_path,
                "section_heading": heading,
                "chunk_text": raw,
                "line_number": start_line,
            })
        else:
            # Split on double-newlines (paragraph boundaries)
            _split_large_chunk(raw, heading, file_path, start_line, chunks)

    def _split_large_chunk(raw, heading, fpath, start_line, out):
        """Split a large chunk on paragraph boundaries."""
        paragraphs = re.split(r"\n\s*\n", raw)
        buf = []
        buf_len = 0
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            if buf_len + len(para) > MAX_CHUNK_CHARS and buf:
                out.append({
                    "file_path": fpath,
                    "section_heading": heading,
                    "chunk_text": "\n\n".join(buf),
                    "line_number": start_line,
                })
                buf = []
                buf_len = 0
            buf.append(para)
            buf_len += len(para) + 2
        if buf:
            out.append({
                "file_path": fpath,
                "section_heading": heading,
                "chunk_text": "\n\n".join(buf),
                "line_number": start_line,
            })

    for i, line in enumerate(lines, start=1):
        # Match ## headings (h2 and below) as chunk boundaries
        m = re.match(r"^(#{1,3})\s+(.+)$", line)
        if m:
            _flush(current_heading, current_lines, current_start)
            current_heading = m.group(2).strip()
            current_lines = [line]
            current_start = i
        else:
            if not current_lines:
                current_start = i
            current_lines.append(line)

    _flush(current_heading, current_lines, current_start)
    return chunks


# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------

def _init_db(db_path: Path) -> sqlite3.Connection:
    """Create or open the SQLite database with the required schema."""
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")

    conn.executescript("""
        CREATE TABLE IF NOT EXISTS chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_path TEXT NOT NULL,
            section_heading TEXT NOT NULL,
            chunk_text TEXT NOT NULL,
            line_number INTEGER NOT NULL,
            embedding BLOB,
            has_embedding INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS file_meta (
            file_path TEXT PRIMARY KEY,
            mtime_ns INTEGER NOT NULL,
            chunk_count INTEGER NOT NULL,
            indexed_at REAL NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_chunks_file ON chunks(file_path);
    """)

    # Create FTS5 virtual table if it doesn't exist
    try:
        conn.execute(
            "CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts "
            "USING fts5(chunk_text, content=chunks, content_rowid=id)"
        )
    except sqlite3.OperationalError:
        # FTS5 not available -- degrade gracefully
        pass

    conn.commit()
    return conn


def _rebuild_fts(conn: sqlite3.Connection):
    """Rebuild the FTS5 index from the chunks table."""
    try:
        conn.execute("INSERT INTO chunks_fts(chunks_fts) VALUES('rebuild')")
        conn.commit()
    except sqlite3.OperationalError:
        pass


# ---------------------------------------------------------------------------
# SemanticSearch class
# ---------------------------------------------------------------------------

class SemanticSearch:
    """Semantic and hybrid search over markdown memory files."""

    def __init__(self, memory_dir: str | Path):
        self.memory_dir = Path(memory_dir).resolve()
        self.db_path = self.memory_dir / ".index" / "memory.db"
        self._conn = None

    @property
    def conn(self) -> sqlite3.Connection:
        if self._conn is None:
            self._conn = _init_db(self.db_path)
        return self._conn

    def close(self):
        if self._conn:
            self._conn.close()
            self._conn = None

    # ---- File collection ----

    def _collect_files(self) -> list[Path]:
        """Recursively collect .md files, skipping excluded directories."""
        files = []
        for path in sorted(self.memory_dir.rglob("*.md")):
            if any(part in SKIP_DIRS for part in path.parts):
                continue
            files.append(path)
        return files

    def _read_safe(self, path: Path) -> str | None:
        try:
            return path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, PermissionError, OSError):
            return None

    # ---- Index building ----

    def build_index(self, incremental: bool = False) -> dict:
        """Build or update the index.

        Args:
            incremental: If True, only reindex files whose mtime has changed.

        Returns:
            Stats dict with counts of files processed, chunks created, embeddings computed.
        """
        stats = {
            "files_scanned": 0,
            "files_indexed": 0,
            "files_skipped": 0,
            "chunks_created": 0,
            "embeddings_computed": 0,
            "embeddings_failed": 0,
            "ollama_available": False,
        }

        # Test ollama connectivity
        test_emb = _get_single_embedding("test", timeout=10)
        stats["ollama_available"] = test_emb is not None

        files = self._collect_files()
        stats["files_scanned"] = len(files)

        # Load existing file metadata for incremental mode
        existing_meta = {}
        if incremental:
            for row in self.conn.execute("SELECT file_path, mtime_ns FROM file_meta"):
                existing_meta[row[0]] = row[1]

        for path in files:
            rel_path = str(path.relative_to(self.memory_dir))
            try:
                mtime_ns = path.stat().st_mtime_ns
            except OSError:
                continue

            # Skip unchanged files in incremental mode
            if incremental and rel_path in existing_meta:
                if existing_meta[rel_path] == mtime_ns:
                    stats["files_skipped"] += 1
                    continue

            text = self._read_safe(path)
            if text is None:
                continue

            # Remove old chunks for this file
            self.conn.execute("DELETE FROM chunks WHERE file_path = ?", (rel_path,))
            self.conn.execute("DELETE FROM file_meta WHERE file_path = ?", (rel_path,))

            # Chunk the file
            chunks = _chunk_markdown(text, rel_path)
            if not chunks:
                continue

            # Get embeddings in batch (up to 32 at a time)
            chunk_embeddings = [None] * len(chunks)
            if stats["ollama_available"]:
                batch_size = 32
                for batch_start in range(0, len(chunks), batch_size):
                    batch_end = min(batch_start + batch_size, len(chunks))
                    batch_texts = [c["chunk_text"] for c in chunks[batch_start:batch_end]]
                    embeddings = _get_embeddings(batch_texts, timeout=120)
                    if embeddings and len(embeddings) == len(batch_texts):
                        for j, emb in enumerate(embeddings):
                            chunk_embeddings[batch_start + j] = emb
                            stats["embeddings_computed"] += 1
                    else:
                        stats["embeddings_failed"] += len(batch_texts)

            # Insert chunks
            for i, chunk in enumerate(chunks):
                emb = chunk_embeddings[i]
                emb_blob = _pack_embedding(emb) if emb else None
                has_emb = 1 if emb else 0
                self.conn.execute(
                    "INSERT INTO chunks (file_path, section_heading, chunk_text, line_number, embedding, has_embedding) "
                    "VALUES (?, ?, ?, ?, ?, ?)",
                    (chunk["file_path"], chunk["section_heading"], chunk["chunk_text"],
                     chunk["line_number"], emb_blob, has_emb),
                )
                stats["chunks_created"] += 1

            # Record file metadata
            self.conn.execute(
                "INSERT OR REPLACE INTO file_meta (file_path, mtime_ns, chunk_count, indexed_at) "
                "VALUES (?, ?, ?, ?)",
                (rel_path, mtime_ns, len(chunks), time.time()),
            )
            stats["files_indexed"] += 1

        self.conn.commit()
        _rebuild_fts(self.conn)
        return stats

    # ---- Search methods ----

    def search_semantic(self, query: str, top_k: int = 10) -> list[dict]:
        """Pure semantic search using embedding cosine similarity.

        Returns list of dicts: {file, section, score, snippet, line_number}
        """
        query_emb = _get_single_embedding(query)
        if query_emb is None:
            return []

        # Load all chunks with embeddings
        rows = self.conn.execute(
            "SELECT id, file_path, section_heading, chunk_text, line_number, embedding "
            "FROM chunks WHERE has_embedding = 1"
        ).fetchall()

        if not rows:
            return []

        scored = []
        for row in rows:
            chunk_emb = _unpack_embedding(row[5])
            sim = _cosine_similarity(query_emb, chunk_emb)
            scored.append((sim, row))

        scored.sort(key=lambda x: x[0], reverse=True)

        # Deduplicate by file, keep best chunk per file
        results = []
        seen_files = set()
        for sim, row in scored:
            file_path = row[1]
            if file_path in seen_files:
                continue
            seen_files.add(file_path)
            snippet = row[3][:200].rstrip()
            if len(row[3]) > 200:
                snippet += "..."
            results.append({
                "file": str(self.memory_dir / file_path),
                "section": row[2],
                "score": round(sim, 4),
                "snippet": snippet,
                "line_number": row[4],
            })
            if len(results) >= top_k:
                break

        return results

    def search_fts(self, query: str, top_k: int = 20) -> list[dict]:
        """FTS5 full-text search. Returns scored results for hybrid blending."""
        # Tokenize query for FTS5
        tokens = re.split(r"[^a-zA-Z0-9]+", query.lower())
        tokens = [t for t in tokens if t and len(t) > 1]
        if not tokens:
            return []

        fts_query = " OR ".join(tokens)

        try:
            rows = self.conn.execute(
                "SELECT c.id, c.file_path, c.section_heading, c.chunk_text, c.line_number, "
                "chunks_fts.rank "
                "FROM chunks_fts "
                "JOIN chunks c ON c.id = chunks_fts.rowid "
                "WHERE chunks_fts MATCH ? "
                "ORDER BY chunks_fts.rank "
                "LIMIT ?",
                (fts_query, top_k * 3),
            ).fetchall()
        except sqlite3.OperationalError:
            # FTS5 not available
            return []

        if not rows:
            return []

        # FTS5 rank is negative (more negative = more relevant), normalize
        raw_scores = [-r[5] for r in rows]
        max_score = max(raw_scores) if raw_scores else 1.0
        if max_score == 0:
            max_score = 1.0

        results = []
        seen_files = set()
        for i, row in enumerate(rows):
            file_path = row[1]
            if file_path in seen_files:
                continue
            seen_files.add(file_path)
            norm_score = raw_scores[i] / max_score
            snippet = row[3][:200].rstrip()
            if len(row[3]) > 200:
                snippet += "..."
            results.append({
                "file": str(self.memory_dir / file_path),
                "section": row[2],
                "score": round(norm_score, 4),
                "snippet": snippet,
                "line_number": row[4],
            })
            if len(results) >= top_k:
                break

        return results

    def search_hybrid(
        self,
        query: str,
        top_k: int = 10,
        bm25_weight: float = DEFAULT_BM25_WEIGHT,
        semantic_weight: float = DEFAULT_SEMANTIC_WEIGHT,
        apply_decay: bool = True,
    ) -> list[dict]:
        """Blended search: BM25 (FTS5) + semantic + optional decay scoring.

        Scores are normalized to [0,1] before weighting and combination.
        """
        # Get FTS5 results
        fts_results = self.search_fts(query, top_k=top_k * 2)

        # Get semantic results
        sem_results = self.search_semantic(query, top_k=top_k * 2)

        # Build score maps keyed by file path
        fts_map = {r["file"]: r for r in fts_results}
        sem_map = {r["file"]: r for r in sem_results}

        # Normalize semantic scores to [0,1]
        if sem_results:
            max_sem = max(r["score"] for r in sem_results)
            if max_sem > 0:
                for r in sem_results:
                    sem_map[r["file"]]["norm_score"] = r["score"] / max_sem
            else:
                for r in sem_results:
                    sem_map[r["file"]]["norm_score"] = 0.0
        # FTS scores are already normalized in search_fts

        # Union of all files
        all_files = set(fts_map.keys()) | set(sem_map.keys())

        # Load decay scores
        decay_scores = {}
        if apply_decay:
            try:
                from decay import load_scores, compute_all_scores
                decay_scores = load_scores()
                if not decay_scores:
                    decay_scores = compute_all_scores()
            except ImportError:
                pass

        # Compute combined scores
        combined = []
        for f in all_files:
            fts_score = fts_map[f]["score"] if f in fts_map else 0.0
            sem_score = sem_map[f].get("norm_score", sem_map[f]["score"]) if f in sem_map else 0.0

            blended = bm25_weight * fts_score + semantic_weight * sem_score

            # Apply decay multiplier
            if decay_scores:
                basename = Path(f).name
                entry = decay_scores.get(basename) or decay_scores.get(f)
                if entry:
                    decay_mult = entry.get("score", 1.0)
                    blended *= decay_mult

            # Get best metadata from whichever result set has it
            meta = sem_map.get(f) or fts_map.get(f)
            combined.append({
                "file": f,
                "section": meta.get("section", ""),
                "score": round(blended, 4),
                "bm25_score": round(fts_score, 4),
                "semantic_score": round(sem_score, 4),
                "snippet": meta.get("snippet", ""),
                "line_number": meta.get("line_number", 0),
            })

        combined.sort(key=lambda x: x["score"], reverse=True)
        return combined[:top_k]

    # ---- Status ----

    def get_status(self) -> dict:
        """Return index status and statistics."""
        if not self.db_path.exists():
            return {"indexed": False, "message": "No index found. Run --build first."}

        total_chunks = self.conn.execute("SELECT COUNT(*) FROM chunks").fetchone()[0]
        with_embeddings = self.conn.execute(
            "SELECT COUNT(*) FROM chunks WHERE has_embedding = 1"
        ).fetchone()[0]
        total_files = self.conn.execute("SELECT COUNT(*) FROM file_meta").fetchone()[0]
        db_size = self.db_path.stat().st_size

        # Per-file breakdown
        file_stats = self.conn.execute(
            "SELECT file_path, chunk_count FROM file_meta ORDER BY file_path"
        ).fetchall()

        # Check ollama
        test_emb = _get_single_embedding("test", timeout=5)
        ollama_ok = test_emb is not None

        return {
            "indexed": True,
            "db_path": str(self.db_path),
            "db_size_kb": round(db_size / 1024, 1),
            "total_files": total_files,
            "total_chunks": total_chunks,
            "chunks_with_embeddings": with_embeddings,
            "chunks_without_embeddings": total_chunks - with_embeddings,
            "embedding_coverage": f"{with_embeddings}/{total_chunks} ({100*with_embeddings//max(total_chunks,1)}%)",
            "ollama_reachable": ollama_ok,
            "file_stats": file_stats,
        }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    args = sys.argv[1:]

    if not args:
        print(__doc__)
        sys.exit(0)

    memory_dir = Path(__file__).resolve().parent
    ss = SemanticSearch(memory_dir)

    try:
        if "--build" in args:
            print("Building full index...")
            t0 = time.time()
            stats = ss.build_index(incremental=False)
            elapsed = time.time() - t0
            print(f"\nIndex built in {elapsed:.1f}s:")
            print(f"  Files scanned:        {stats['files_scanned']}")
            print(f"  Files indexed:        {stats['files_indexed']}")
            print(f"  Chunks created:       {stats['chunks_created']}")
            print(f"  Embeddings computed:  {stats['embeddings_computed']}")
            if stats['embeddings_failed']:
                print(f"  Embeddings failed:    {stats['embeddings_failed']}")
            print(f"  Ollama available:     {stats['ollama_available']}")
            if not stats['ollama_available']:
                print("  (FTS5 index built without embeddings -- semantic search unavailable)")

        elif "--update" in args:
            print("Incremental index update...")
            t0 = time.time()
            stats = ss.build_index(incremental=True)
            elapsed = time.time() - t0
            print(f"\nUpdate completed in {elapsed:.1f}s:")
            print(f"  Files scanned:        {stats['files_scanned']}")
            print(f"  Files indexed:        {stats['files_indexed']}")
            print(f"  Files skipped (unchanged): {stats['files_skipped']}")
            print(f"  Chunks created:       {stats['chunks_created']}")
            print(f"  Embeddings computed:  {stats['embeddings_computed']}")

        elif "--search" in args:
            idx = args.index("--search")
            query_parts = [a for a in args[idx+1:] if not a.startswith("--")]
            if not query_parts:
                print("Usage: python embeddings.py --search \"query\"")
                sys.exit(1)
            query = " ".join(query_parts)
            results = ss.search_semantic(query)
            if not results:
                print(f"No semantic results for: {query}")
                print("(Is the index built? Is ollama reachable?)")
                sys.exit(0)
            print(f'Semantic results for: "{query}"\n')
            for i, r in enumerate(results, 1):
                rel_path = Path(r["file"]).relative_to(memory_dir)
                print(f'  {i}. [{r["score"]:.4f}] {rel_path} :: {r["section"]}')
                print(f'     (line {r["line_number"]}) {r["snippet"]}\n')

        elif "--hybrid" in args:
            idx = args.index("--hybrid")
            query_parts = [a for a in args[idx+1:] if not a.startswith("--")]
            if not query_parts:
                print("Usage: python embeddings.py --hybrid \"query\"")
                sys.exit(1)
            query = " ".join(query_parts)
            results = ss.search_hybrid(query)
            if not results:
                print(f"No hybrid results for: {query}")
                sys.exit(0)
            print(f'Hybrid results for: "{query}" (BM25={DEFAULT_BM25_WEIGHT}, semantic={DEFAULT_SEMANTIC_WEIGHT}, +decay)\n')
            for i, r in enumerate(results, 1):
                rel_path = Path(r["file"]).relative_to(memory_dir)
                print(f'  {i}. [{r["score"]:.4f}] {rel_path} :: {r.get("section", "")}')
                print(f'     BM25={r.get("bm25_score", 0):.4f}  semantic={r.get("semantic_score", 0):.4f}')
                print(f'     (line {r["line_number"]}) {r["snippet"]}\n')

        elif "--status" in args:
            status = ss.get_status()
            if not status.get("indexed"):
                print(status.get("message", "No index found."))
                sys.exit(0)
            print("Semantic Index Status")
            print("=" * 50)
            print(f"  DB path:              {status['db_path']}")
            print(f"  DB size:              {status['db_size_kb']} KB")
            print(f"  Total files:          {status['total_files']}")
            print(f"  Total chunks:         {status['total_chunks']}")
            print(f"  Embedding coverage:   {status['embedding_coverage']}")
            print(f"  Ollama reachable:     {status['ollama_reachable']}")
            print()
            print("  Per-file chunk counts:")
            for fpath, count in status["file_stats"]:
                print(f"    {fpath:<55} {count:>3} chunks")

        else:
            print(__doc__)
    finally:
        ss.close()


if __name__ == "__main__":
    main()
