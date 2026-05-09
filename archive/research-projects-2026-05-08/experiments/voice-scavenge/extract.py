"""Extract text from .docx files in a list of paths, skip lock/temp files, emit JSONL."""
from __future__ import annotations
import json, os, sys
from pathlib import Path
from docx import Document

def read_docx(p: Path) -> str:
    try:
        d = Document(str(p))
        return "\n".join(para.text for para in d.paragraphs if para.text.strip())
    except Exception as e:
        return f"[ERROR {type(e).__name__}: {e}]"

def main():
    out_path = Path(sys.argv[1])
    paths: list[Path] = []
    for arg in sys.argv[2:]:
        p = Path(arg)
        if p.is_dir():
            paths.extend(sorted(p.glob("*.docx")))
        elif p.is_file():
            paths.append(p)

    with out_path.open("w", encoding="utf-8") as fh:
        for p in paths:
            if p.name.startswith("~$"):  # lock files
                continue
            text = read_docx(p)
            rec = {
                "path": str(p),
                "name": p.name,
                "size": p.stat().st_size,
                "mtime": p.stat().st_mtime,
                "chars": len(text),
                "text": text,
            }
            fh.write(json.dumps(rec, ensure_ascii=False) + "\n")
            try:
                print(f"{p.name}  {len(text)} chars")
            except UnicodeEncodeError:
                print(f"[unicode-safe] {p.name.encode('ascii','replace').decode()}  {len(text)} chars")

if __name__ == "__main__":
    main()
