# Safety Research Wiki — Deployable Bundle

A self-contained, portable LLM wiki system for pharmacovigilance and drug safety research. Drop this folder into any environment (work laptop, VDI, locked-down enterprise workspace, offline machine) and you have a compiled knowledge base that compounds every paper you read.

Based on Andrej Karpathy's LLM-Wiki pattern (gist `442a6bf555914893e9891c11519de94f`) applied to pharmacovigilance. No external dependencies for the core. No enterprise APIs required. No data leaves the machine.

## What you get

- **`wiki.py`** — 1300+ lines, zero dependencies, single-file Python query and index layer. Handles backlinks, tag index, orphan detection, broken link audit, article view with provenance, optional semantic similarity, bounded health file, and a full CLI.
- **`skills/safety-research-wiki/SKILL.md`** — domain-specific playbook with page type definitions (mechanism, drug, adverse event, signal, study), ingest workflow, lint workflow, tag vocabulary, and done criteria.
- **`skills/build-llm-wiki/SKILL.md`** — generic playbook for building any LLM wiki from scratch, if you want to adapt this pattern to a non-safety domain.
- **`agents/wiki-reader.md`** — specialized query subagent that keeps parent context bounded.
- **`scheduled-tasks/wiki-reindex/SKILL.md`** — nightly Hermes-pattern reindex task with bounded memory contract.
- **`templates/`** — 5 starting templates for the core page types plus a `README` explaining when to use each.
- **`conventions/CONVENTIONS.md`** — the frontmatter, wikilink, callout, and tag hierarchy spec. This is the schema the wiki enforces.
- **`docs/ARCHITECTURE.md`** — how everything fits together.
- **`docs/INGEST.md`** — the ingest workflow, including how to bring content in from Gmail, Google Drive, PDFs, and arbitrary text sources.
- **`examples/`** — one or two example pages to show what the final output looks like.
- **`scripts/install.ps1`** and **`scripts/install.sh`** — setup scripts for Windows and Linux/Mac.

## Quick start (3 steps, ~10 minutes)

1. **Copy the bundle somewhere writable:** `C:\wiki\` or `~/wiki/` or wherever your personal working directory lives.
2. **Run the install script:**
   - Windows PowerShell: `.\scripts\install.ps1`
   - Linux/Mac bash: `bash scripts/install.sh`
3. **Run the selftest:** `python wiki.py --selftest`

If selftest passes, you're ready to start authoring pages. See `skills/safety-research-wiki/SKILL.md` for the page templates and workflow.

## Philosophy in one paragraph

Traditional research tooling is retrieve-per-query: you search, get chunks, synthesize in your head, close the tab, lose the synthesis. A compiled wiki inverts this. Every paper you read becomes a durable page with structured frontmatter, wikilinks to related concepts, and a log entry. The next time you need to answer a question about that mechanism or drug, the work is already done — you just read the page. Synthesis happens once at ingest, not per query. The wiki is the artifact; the LLM's job is bookkeeping.

## What's new compared to the original Anthropic LLM-Wiki

The Karpathy/Anthropic original is a gist of prompts and conventions. This bundle adds:

- **`wiki.py`** — a real query layer with backlinks, tag search, lint, and log tail operations. You don't have to re-derive the indexes on every query.
- **Domain-specific templates** — pharmacovigilance page types (mechanism/drug/AE/signal/study) with the right frontmatter fields for each.
- **Ingest workflows for Gmail and Google Drive** — documented patterns for pulling regulatory correspondence, collaborator emails, and shared documents into the wiki as source material.
- **Obsidian-first compatibility** — everything is YAML frontmatter + wikilinks + callouts, so the same folder opens in Obsidian for visual navigation.
- **Bounded health file** — `state/wiki-state.md` is capped at 1500 chars so agents can read it on context injection without blowing up their token budget.
- **Hermes-pattern nightly reindex** — `wiki-reindex` scheduled task runs evaluate/implement/validate cycles.

## Hard requirements

- Python 3.10+ (uses `|` type syntax)
- A folder of markdown files (or start from scratch)
- (Optional) `git` for provenance tracking
- (Optional) Obsidian for visual navigation

**Zero other dependencies for the core.** Similarity computation requires an embeddings module (see `docs/ARCHITECTURE.md` § Semantic similarity) but is optional.

## What this bundle is NOT

- It's not a web UI. Everything is CLI + markdown files.
- It's not a database replacement for your enterprise PV systems. It's a synthesis layer ON TOP of your authoritative sources.
- It's not multi-user concurrent editing. Single-author or small-team only. For multi-user, use Confluence.
- It's not a real-time signal detection system. It's a navigation and synthesis layer for signal investigation.

## Licensing and attribution

Pattern source: Andrej Karpathy LLM-Wiki gist (`442a6bf555914893e9891c11519de94f`) and Nous Research Hermes Agent v2026.4.8.

Conventions source: kepano/obsidian-skills.

This bundle is unencumbered. Use, modify, share freely within your organization.

## Next steps

1. Read `skills/safety-research-wiki/SKILL.md` end to end (~10 min)
2. Run `python wiki.py --selftest` to verify the core works
3. Copy `templates/mechanism.md.tmpl` to `hepatotoxicity-DILI.md` (or some topic you know cold) and fill it in
4. Copy `templates/drug.md.tmpl` to one drug you reference often
5. Run `python wiki.py --reindex` and verify backlinks resolve
6. Start ingesting real sources. Compound kicks in within 2-4 weeks of daily habit.

See `INSTALL.md` for the longer setup walkthrough with troubleshooting.
