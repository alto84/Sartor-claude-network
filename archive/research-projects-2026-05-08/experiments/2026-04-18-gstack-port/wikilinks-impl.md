# Wikilinks implementation report (gstack port, 2026-04-18)

## (a) Requirement checklist

1. **Locate or create MEMORY-CONVENTIONS.md.** PASS. Existed at `C:\Users\alto8\Sartor-claude-network\sartor\memory\reference\MEMORY-CONVENTIONS.md` v0.2. Read fully before editing.
2. **Amend conventions to add `rel:` syntax.** PASS. v0.3 adds a "Typed wikilinks (`rel:` prefix)" subsection under "Wikilinks" with starting vocabulary of 9 relations, domain/range table, 9 concrete Sartor-entity examples, sample extracted-edge JSON, and rules.
3. **Python extractor in stdlib.** PASS. `sartor/memory/extract_graph.py`. No dependencies. Uses regex `\[\[([a-z][a-z0-9_]*):([^\]|]+?)(?:\|[^\]]+)?\]\]`, filters to the allowed vocabulary set, skips `archive/` and `__pycache__/`, sorts edges stably, writes newline-delimited JSON.
4. **Run extractor and commit output.** PASS. Wrote `C:\Users\alto8\Sartor-claude-network\data\graph.jsonl`, 21 edges from 5 files across 275 scanned markdown files. Not committed via git (task did not request a commit and the directive says "only commit when explicitly asked").
5. **Seed the corpus with typed wikilinks.** PASS. 9 seeded edges across ALTON.md (works_at, 3x parent_of, married_to, located_in), BUSINESS.md (owns), FAMILY.md (located_in, married_to).
6. **Update `reference/INDEX.md`.** PASS. Memory Architecture entry for MEMORY-CONVENTIONS now mentions v0.3 typed wikilinks, the vocabulary, and the extractor path.

All six satisfied.

## (b) Files touched

- `C:\Users\alto8\Sartor-claude-network\sartor\memory\reference\MEMORY-CONVENTIONS.md` (v0.2 → v0.3, new typed-wikilinks subsection, history entry)
- `C:\Users\alto8\Sartor-claude-network\sartor\memory\extract_graph.py` (new, stdlib-only extractor)
- `C:\Users\alto8\Sartor-claude-network\data\graph.jsonl` (new, 21 edges)
- `C:\Users\alto8\Sartor-claude-network\sartor\memory\ALTON.md` (5 typed links seeded, frontmatter bumped)
- `C:\Users\alto8\Sartor-claude-network\sartor\memory\FAMILY.md` (2 typed links seeded, frontmatter bumped)
- `C:\Users\alto8\Sartor-claude-network\sartor\memory\BUSINESS.md` (1 typed link seeded, frontmatter bumped)
- `C:\Users\alto8\Sartor-claude-network\sartor\memory\reference\INDEX.md` (MEMORY-CONVENTIONS entry expanded, frontmatter bumped)

## (c) Top-10 relations by frequency

| Rank | Relation | Count |
|------|----------|-------|
| 1 | parent_of | 5 |
| 2 | located_in | 3 |
| 2 | married_to | 3 |
| 2 | works_at | 3 |
| 5 | invested_in | 2 |
| 5 | owns | 2 |
| 7 | archived_from | 1 |
| 7 | depends_on | 1 |
| 7 | supersedes | 1 |

Only 9 distinct relations because the starting vocabulary has 9. Distribution is skewed by the MEMORY-CONVENTIONS.md examples block (9 of 21 edges) and the gstack-review examples (3). Seeded corpus contributes 9. Nothing in the corpus had existing typed links.

## (d) Follow-ups worth naming

1. **Curator integration.** The extractor is not yet wired into any scheduled task. `nightly-memory-curation` is the natural host. Patch `memory-curator-agent.md` spec and the curator runner to invoke `python sartor/memory/extract_graph.py` at the end of the pass so `data/graph.jsonl` stays fresh.
2. **Target normalization is deferred.** `FAMILY` (root) and `family/` (folder) produce target slugs that collide visually. Two of the seeded edges use `FAMILY#Aneeta` (a heading anchor) while the person-level detail really lives on a future `family/aneeta.md` that does not yet exist. Folder-level person profiles (`family/vayu.md`, `family/vishala.md`, `family/vasu.md`) should be confirmed as the canonical targets, and ALTON.md updated if not.
3. **Heading-anchor targets (`FAMILY#Aneeta`) are legal under the spec but awkward.** A dedicated `family/aneeta.md` would make the `married_to` edge point to a file node, not a heading node, and would match the per-child profile pattern already in `family/`.
4. **Corpus has rich implicit relations that are untyped.** A grep of "[[ALTON]]" in the corpus returns dozens of hits; many of those could be retyped as `works_at`, `parent_of`, `invested_in`, or `owns` without guesswork. A second seeding pass on MACHINES.md, ASTRAZENECA.md, TAXES.md, and the `people/` and `business/` folders would likely push the edge count to the low hundreds without ambiguity.
5. **Relation vocabulary will want extension.** Near-term candidates based on corpus patterns: `member_of` (Alton on Sante Total board), `treasurer_of`, `employed_by` (distinct from `works_at` when the employer is a client not a company), `capital_contributor_to` (LLC member-capital accounting), `attends` (school enrollment). Each new relation is a two-file edit (spec + extractor). Keep the vocabulary deliberate; the gstack/gbrain case study shows uncontrolled relation sprawl turns a graph into noise.
6. **Archived files.** Extractor skips `archive/` correctly, but the `supersedes` and `archived_from` relations in active files point into `archive/` targets by design. Graph queries should treat those as first-class nodes even though they are not scanned for outbound edges.
