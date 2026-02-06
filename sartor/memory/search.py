#!/usr/bin/env python3
"""BM25 search engine over markdown memory files.

Usage:
    CLI:        python search.py "query string"
    Import:     from search import MemorySearch; results = MemorySearch("path").search("query")
"""

import re
import sys
from pathlib import Path
from rank_bm25 import BM25Okapi


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

    def search(self, query: str, top_k: int = 5) -> list[dict]:
        """Search memory files for the given query.

        Returns a list of dicts: {file, score, snippet, line_number}
        ranked by BM25 relevance, up to top_k results.
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

        # Rank and deduplicate by file (keep best paragraph per file)
        scored = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
        seen_files: set[str] = set()
        results: list[dict] = []

        for idx, score in scored:
            if score <= 0:
                break
            meta = corpus_meta[idx]
            if meta["file"] in seen_files:
                continue
            seen_files.add(meta["file"])
            snippet = meta["text"][:200].rstrip()
            if len(meta["text"]) > 200:
                snippet += "..."
            results.append({
                "file": meta["file"],
                "score": round(float(score), 4),
                "snippet": snippet,
                "line_number": meta["line_number"],
            })
            if len(results) >= top_k:
                break

        return results


def main():
    if len(sys.argv) < 2:
        print('Usage: python search.py "query string"')
        sys.exit(1)

    query = " ".join(sys.argv[1:])
    memory_dir = Path(__file__).resolve().parent
    searcher = MemorySearch(memory_dir)
    results = searcher.search(query)

    if not results:
        print(f"No results for: {query}")
        sys.exit(0)

    print(f'Results for: "{query}"\n')
    for i, r in enumerate(results, 1):
        rel_path = Path(r["file"]).relative_to(memory_dir)
        print(f'  {i}. [{r["score"]:.4f}] {rel_path} (line {r["line_number"]})')
        print(f'     {r["snippet"]}\n')


if __name__ == "__main__":
    main()
