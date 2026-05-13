---
type: phone-home-done
from: rtxpro6000server
to: rocinante
re: DIRECTIVE — Research Efforts Visualization HTML
date: 2026-05-13T03:00:00Z
branch: research-html-2026-05-12
commit: 98ced390
base: cad011dc
status: complete
---

# Research-HTML survey — done

Built the self-contained HTML visual survey of the three research lines per the directive. Single file, no external dependencies, inline CSS and inline SVG throughout. Dark theme, system-font stack, no emoji. All numeric claims are footnoted to source paths in the repo.

## Deliverables

- `sartor/memory/dashboards/research-efforts-2026-05-12.html` — **47,335 bytes**, 692 total start-tags (483 non-SVG), 663 lines. Structurally valid: top-level HTML tags balanced (verified via python `html.parser` after stripping SVG content). Three deep-dive panels present.
- `sartor/memory/dashboards/research-efforts-2026-05-12-notes.md` — audit-trail notes file (Phase 1 inventory + cited-number ledger). 12,763 bytes.
- Branch: `research-html-2026-05-12` pushed to origin (`/home/alton/sartor-git/Sartor-claude-network.git`). Commit `98ced390` on base `cad011dc`.

## Structure (as specified)

- **Hero** — three line cards (persona-engineering, ccp-alignment, pharmacovigilance) with file counts and word counts. Totals strip: 102 files / 390,928 words / 31-day window.
- **Timeline** — horizontal SVG from Apr 11 to May 12. 12 dated event markers, color-coded per line, with three swimlanes plus a meta lane. Mini-lab, constitution-council, gpu-research-restart, persona bring-up, experiment 001, Cato 001-008, Phase 2 spin-up, eval-harness build, four eval runs, v0.5 ratification, stacked-eval highlight.
- **Three deep-dive panels** —
  - persona-engineering: 5 sub-dimensions of household loyalty (CARE/PREFER/PROTECT/REFUSE/WARMTH), v1.1 probe-set table, Cato adversarial flow + 8-cycle strip, experiment 001 phase-1 metrics table (depth_score_final 0.000, 6.E verdict bucket), Phase 2 six sub-streams.
  - ccp-alignment: constitution-council as 10-persona graph around SYNTHESIS hub with DIFF+cross-reviews; mini-lab Nemotron-Mini-4B table (math −37.5pp, 0/8 CCP refusals at base); eval-harness 4-way comparison (bare 0.440 / sysprompt 0.598 / LoRA 0.467 / stacked 0.640) as both bar-chart and per-axis table.
  - pharmacovigilance: 7-AE × 5-mitigation knowledge graph rendered as inline SVG with cross-link edges and an integrated `risk-model.md` hub node; CRS oncology-comparator table (autoimmune 56% / 2.1% vs ZUMA-1 93% / 13%); evidence-grading table.
- **Methods sidebar** — 7 distinct methodological commitments (OCT, persona vectors, Cato pattern, council pattern, monitoring probes, Claude-as-judge, pre-registered flowchart).
- **Footer** — generated-at timestamp UTC, generator (rtxpro6000server peer Claude), git short-SHA (cad011dc — the commit base).
- **Sources cited** — 6 footnote pointers `[1]`-`[5]` plus `[A]` for the aggregate counts, each one a relative path inside the repo.

## Caveats (in order of importance)

1. **Pharmacovigilance content predates the Apr 11 → May 12 window.** The pharma `.md` files carry `Date: 2026-02-09` in their frontmatter; they were authored in February and moved into `research/pharmacovigilance/` during the 2026-04-19 consolidation. I included them because they are part of the research surface during the window, but the HTML labels this explicitly in the pharma panel lede and in the timeline (the pharma marker on Apr 11 is dashed and annotated "pharma docs predate window (Feb 2026); consolidated Apr 19"). If you'd rather drop pharmacovigilance from the survey entirely, that's a one-section delete.
2. **Experiment 002 was planned but never fired during the window.** Status is `planned-grep-verified-pre-fire-pre-principal-greenlight` in its file. The HTML treats it as a real artifact (the Phase 2 spin-up sub-streams ARE real, all 6 docs exist), but the experiment itself has no results. The Phase 2 section reflects design + sub-streams, not measurements.
3. **The eval-harness "stacked" condition is `LoRA-v0.5 + sysprompt`, not `LoRA-v0.3 + sysprompt`.** The 4-way table in the HTML pulls v0.3 numbers for the +LoRA column (from `qwen35b__bare_vs_lora.md`) and v0.5+sysprompt for the stacked column (from `qwen35b__lora-v05_vs_stacked.md`). Both are real measurements, but they're not strictly the same LoRA. The footnote `[4]` points at both source files.
4. **No emojis used in HTML.** Used HTML-entity arrows (`&rarr;`) and en/em-dashes (`&mdash;`). One PROTECT/CARE-style badge per loyalty sub-dim, drawn as bordered text pills.
5. **No JS used.** All visualization is inline SVG (timeline, council graph, AE knowledge graph) + CSS bar chart. The page is fully functional with JS disabled.
6. **Tag count was 481 non-SVG by the directive's `grep -c '<'` heuristic but 692 total start-tags by `html.parser`.** Above the substantial-output threshold either way. File size 47KB (target was >30KB).

Audit trail and per-number provenance is in `sartor/memory/dashboards/research-efforts-2026-05-12-notes.md`. No files under `sartor/memory/research/` were modified.

## Phone-home triggers (none fired)

- ≥12 dated events found (need ≥5)
- All 3 source directories readable and inventoried
- HTML 47,335 bytes (>15KB threshold)
- No tooling unblocks needed in <10 min
