#!/usr/bin/env python3
"""Render Sartor SKILL.md files from .tmpl sources.

Walks `.claude/skills/` for any `SKILL.md.tmpl`. Substitutes `{{PREAMBLE}}`
with the contents of `.claude/skills/_preamble/PREAMBLE.tmpl`. Writes the
result to `SKILL.md` next to the template.

Python stdlib only. Intended to be run from repo root:

    python scripts/render_skills.py

Or with a custom root:

    python scripts/render_skills.py /path/to/repo

The script is idempotent: running it twice produces the same files.

Exit codes:
  0 on success
  1 if the preamble is missing
  2 if any template has an unresolved placeholder after substitution
"""

from __future__ import annotations

import sys
from pathlib import Path

PLACEHOLDER = "{{PREAMBLE}}"
TEMPLATE_SUFFIX = ".tmpl"
PREAMBLE_REL = ".claude/skills/_preamble/PREAMBLE.tmpl"
SKILLS_REL = ".claude/skills"


def find_repo_root(argv: list[str]) -> Path:
    if len(argv) > 1:
        return Path(argv[1]).resolve()
    # Default: assume script lives at <repo>/scripts/render_skills.py
    return Path(__file__).resolve().parent.parent


def load_preamble(root: Path) -> str:
    preamble_path = root / PREAMBLE_REL
    if not preamble_path.is_file():
        print(f"ERROR: preamble not found at {preamble_path}", file=sys.stderr)
        sys.exit(1)
    return preamble_path.read_text(encoding="utf-8").rstrip() + "\n"


def iter_templates(root: Path):
    skills_dir = root / SKILLS_REL
    if not skills_dir.is_dir():
        return
    # Only SKILL.md.tmpl files. Skip the _preamble dir itself.
    for path in skills_dir.rglob("SKILL.md" + TEMPLATE_SUFFIX):
        if "_preamble" in path.parts:
            continue
        yield path


def render_one(template_path: Path, preamble: str) -> tuple[Path, bool]:
    """Render template_path -> SKILL.md next to it. Return (output_path, had_placeholder)."""
    src = template_path.read_text(encoding="utf-8")
    had = PLACEHOLDER in src
    rendered = src.replace(PLACEHOLDER, preamble)
    if PLACEHOLDER in rendered:
        # Should not happen after a single replace, but guard anyway.
        print(
            f"ERROR: unresolved {PLACEHOLDER} in {template_path}", file=sys.stderr
        )
        sys.exit(2)
    out_path = template_path.with_suffix("")  # strips .tmpl -> SKILL.md
    out_path.write_text(rendered, encoding="utf-8")
    return out_path, had


def main(argv: list[str]) -> int:
    root = find_repo_root(argv)
    preamble = load_preamble(root)
    rendered_count = 0
    no_placeholder = []
    for template in iter_templates(root):
        out_path, had = render_one(template, preamble)
        rendered_count += 1
        rel = out_path.relative_to(root)
        marker = "" if had else " (NOTE: template contained no placeholder)"
        print(f"rendered: {rel}{marker}")
        if not had:
            no_placeholder.append(template)
    if rendered_count == 0:
        print("no SKILL.md.tmpl files found; nothing to render")
    if no_placeholder:
        # Non-fatal. A template without {{PREAMBLE}} is legal but worth flagging,
        # since the usual reason to have a .tmpl is to inject the preamble.
        print(
            f"warning: {len(no_placeholder)} template(s) had no {PLACEHOLDER} marker",
            file=sys.stderr,
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
