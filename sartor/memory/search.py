#!/usr/bin/env python3
"""BM25 search engine over markdown memory files.

Usage:
    CLI:        python search.py "query string"              # BM25
                python search.py --with-decay "query string"  # BM25 + decay
                python search.py --semantic "query string"    # semantic only
                python search.py --hybrid "query string"      # blended BM25 + semantic + decay
    Import:     from search import MemorySearch; results = MemorySearch("path").search("query")
"""

import io
import re
import sys
from pathlib import Path
from rank_bm25 import BM25Okapi

# Fix UnicodeEncodeError on Windows consoles that can't handle Unicode
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ('utf-8', 'utf8'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding=sys.stdout.encoding, errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding=sys.stderr.encoding, errors='replace')

try:
    from decay import decay_score, load_scores, record_access, compute_all_scores
    _DECAY_AVAILABLE = True
except ImportError:
    _DECAY_AVAILABLE = False


def tokenize(text: str) -> list[str]:
    """Split on whitespace and punctuation, lowercase."""
    return [t for t in re.split(r"[^a-zA-Z0-9]+", text.lower()) if t]


def extract_paragraphs(text: str) -> list[tuple[int, str]]:
    """Split text into paragraphs, returning (line_number, paragraph) pairs."""
    paragraphs = []
    current_lines: list[str] = []
    start_line = 1
    for i, line in enumerate(text.splitlines(), start=1):
        if line.strip() == "":
            if current_lines:
                paragraphs.append((start_line, "\n".join(current_lines)))
                current_lines = []
        else:
            if not current_lines:
                start_line = i
            current_lines.append(line)
    if current_lines:
        paragraphs.append((start_line, "\n".join(current_lines)))
    return paragraphs


class MemorySearch:
    """BM25-based search over a directory of markdown files."""

    SKIP_DIRS = {".obsidian", ".git", "__pycache__", "node_modules"}

    def __init__(self, memory_dir: str | Path):
        self.memory_dir = Path(memory_dir)

    def _collect_files(self) -> list[Path]:
        """Recursively collect .md files, skipping excluded directories."""
        files = []
        for path in sorted(self.memory_dir.rglob("*.md")):
            if any(part in self.SKIP_DIRS for part in path.parts):
                continue
            files.append(path)
        return files

    def _read_safe(self, path: Path) -> str | None:
        """Read a file, returning None if binary or unreadable."""
        try:
            return path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, PermissionError, OSError):
            return None

    def search(self, query: str, top_k: int = 5, with_decay: bool = False) -> list[dict]:
        """Search memory files for the given query.

        Returns a list of dicts: {file, score, snippet, line_number}
        ranked by BM25 relevance (optionally multiplied by decay score), up to top_k results.

        Args:
            query: Search query string.
            top_k: Maximum number of results to return.
            with_decay: If True, multiply BM25 scores by temporal decay scores.
        """
        # Build corpus: one document per paragraph, track provenance
        corpus_tokens: list[list[str]] = []
        corpus_meta: list[dict] = []  # {file, line_number, text}

        for path in self._collect_files():
            text = self._read_safe(path)
            if text is None:
                continue
            for line_number, paragraph in extract_paragraphs(text):
                tokens = tokenize(paragraph)
                if not tokens:
                    continue
                corpus_tokens.append(tokens)
                corpus_meta.append({
                    "file": str(path),
                    "line_number": line_number,
                    "text": paragraph,
                })

        if not corpus_tokens:
            return []

        # Build BM25 index and query
        bm25 = BM25Okapi(corpus_tokens)
        query_tokens = tokenize(query)
        if not query_tokens:
            return []

        scores = bm25.get_scores(query_tokens)

        # Load decay scores once if needed
        decay_scores_map: dict = {}
        if with_decay and _DECAY_AVAILABLE:
            decay_scores_map = load_scores()
            if not decay_scores_map:
                decay_scores_map = compute_all_scores()

        # Rank and deduplicate by file (keep best paragraph per file)
        scored = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
        seen_files: set[str] = set()
        results: list[dict] = []
        files_accessed: list[str] = []

        for idx, bm25_score in scored:
            if bm25_score <= 0:
                break
            meta = corpus_meta[idx]
            if meta["file"] in seen_files:
                continue
            seen_files.add(meta["file"])

            final_score = float(bm25_score)
            if with_decay and _DECAY_AVAILABLE:
                basename = Path(meta["file"]).name
                entry = decay_scores_map.get(basename) or decay_scores_map.get(meta["file"])
                if entry:
                    final_score *= entry.get("score", 1.0)

            snippet = meta["text"][:200].rstrip()
            if len(meta["text"]) > 200:
                snippet += "..."
            results.append({
                "file": meta["file"],
                "score": round(final_score, 4),
                "snippet": snippet,
                "line_number": meta["line_number"],
            })
            files_accessed.append(meta["file"])
            if len(results) >= top_k:
                break

        # Record access for returned results
        if with_decay and _DECAY_AVAILABLE and files_accessed:
            for f in files_accessed:
                record_access(f)

        return results


def main():
    args = sys.argv[1:]
    with_decay = False
    use_semantic = False
    use_hybrid = False

    if "--with-decay" in args:
        with_decay = True
        args = [a for a in args if a != "--with-decay"]
    if "--semantic" in args:
        use_semantic = True
        args = [a for a in args if a != "--semantic"]
    if "--hybrid" in args:
        use_hybrid = True
        args = [a for a in args if a != "--hybrid"]

    if not args:
        print('Usage: python search.py [--with-decay] [--semantic] [--hybrid] "query string"')
        sys.exit(1)

    query = " ".join(args)
    memory_dir = Path(__file__).resolve().parent

    # Semantic-only mode: delegate to embeddings.py
    if use_semantic:
        try:
            from embeddings import SemanticSearch
            ss = SemanticSearch(memory_dir)
            results = ss.search_semantic(query)
            ss.close()
        except ImportError:
            print("Error: embeddings.py not found. Semantic search unavailable.")
            sys.exit(1)

        if not results:
            print(f"No semantic results for: {query}")
            sys.exit(0)

        print(f'Semantic results for: "{query}"\n')
        for i, r in enumerate(results, 1):
            rel_path = Path(r["file"]).relative_to(memory_dir)
            section = r.get("section", "")
            print(f'  {i}. [{r["score"]:.4f}] {rel_path} :: {section}')
            print(f'     {r["snippet"]}\n')
        return

    # Hybrid mode: blended BM25 + semantic + decay
    if use_hybrid:
        try:
            from embeddings import SemanticSearch
            ss = SemanticSearch(memory_dir)
            results = ss.search_hybrid(query, apply_decay=True)
            ss.close()
        except ImportError:
            print("Error: embeddings.py not found. Hybrid search unavailable.")
            sys.exit(1)

        if not results:
            print(f"No hybrid results for: {query}")
            sys.exit(0)

        print(f'Hybrid results for: "{query}" (BM25=0.4, semantic=0.6, +decay)\n')
        for i, r in enumerate(results, 1):
            rel_path = Path(r["file"]).relative_to(memory_dir)
            section = r.get("section", "")
            print(f'  {i}. [{r["score"]:.4f}] {rel_path} :: {section}')
            print(f'     BM25={r.get("bm25_score", 0):.4f}  semantic={r.get("semantic_score", 0):.4f}')
            print(f'     {r["snippet"]}\n')
        return

    # Default: BM25 search
    searcher = MemorySearch(memory_dir)
    results = searcher.search(query, with_decay=with_decay)

    if not results:
        print(f"No results for: {query}")
        sys.exit(0)

    decay_label = " (decay-weighted)" if with_decay else ""
    print(f'Results for: "{query}"{decay_label}\n')
    for i, r in enumerate(results, 1):
        rel_path = Path(r["file"]).relative_to(memory_dir)
        print(f'  {i}. [{r["score"]:.4f}] {rel_path} (line {r["line_number"]})')
        print(f'     {r["snippet"]}\n')


if __name__ == "__main__":
    main()
