---
name: SOURCE-DOC-AUDIT
description: Discovery + indexing audit of scattered source documents (PDFs, statements, contracts, tax / medical / legal / shares paperwork) across Rocinante. Companion to the canonical Layer-4 source-document index built into sartor/memory/source-documents/INDEX.md.
type: audit
status: complete
date: 2026-05-06
inspector: inspector-source-docs (Opus 4.7, 1M context)
project: memory-system-uplift-2026-05-06
deliverable: sartor/memory/source-documents/INDEX.md
related: [[memory-system-uplift-2026-05-06-PLAN]], [[reference_anthropic_shares]], [[TAXES]], [[BUSINESS]]
---

# Source-Documents — Discovery & Indexing Audit

## Mission

Two-phase: (1) walk likely source-document locations on Rocinante and discover scattered PDFs/statements/contracts/etc.; (2) build the canonical Layer-4 source-document index per the memory-system-uplift plan. Alton's explicit greenlight: "I'd love it if you index everything, including my old stuff in downloads."

## Headline numbers

- **Locations searched:** 8 root directories (read-only).
- **Raw candidate files (16 doc extensions):** 6,642.
- **After exclusion of repo / game-data / system / browser-cache / OneNote / Obsidian-config:** 3,459.
- **After dropping junk (license.txt clones, language packs, mod data):** **3,211 indexed documents** across 21 categories.
- **Index file size:** 615 KB / 10,189 lines at `sartor/memory/source-documents/INDEX.md` — large but each entry is one structured record per the plan's schema.
- **Date span:** 2017 – 2026; modal year is 2025 (786 docs), then 2023 (674), then 2021 (489).
- **Largest single artifact:** `OneDrive_1_2-10-2026.zip` (932 MB, "other", almost certainly an OneDrive bulk export).
- **Single biggest category:** Professional-AZ (747 docs, 23% of indexed). Tax (186), Family-misc (152), Banking (120), Property (93), Professional-early (93), Personal-career (78), Professional-Biogen (73), Medical-family (70). Other/uncategorized (1,367) is the long tail.

## Methodology

### Locations searched (read-only)

| Path | Files found (post-exclusion) | Notes |
|---|---:|---|
| `C:\Users\alto8\Downloads\` | 2,839 | Catch-all. Includes years of browser downloads, drive exports, tax packets. |
| `C:\Users\alto8\Desktop\` | 255 | A genuine "desktop" — `185 Davis/`, `2020 Sartor - Saxena Tax Folder/`, `2023 Tax/`, `Biogen Folder/`, `CV and Cover letters/`, `Spore grant/`, plus loose root-level PDFs. |
| `C:\Users\alto8\Documents\` | 111 | Local Documents (NOT redirected to OneDrive). Contains old work product (Biogen, BMC, NEO), `Obsidian Vault/`, the `Sartor-claude-network/` repo (excluded), game-data dirs (excluded). |
| `C:\Users\alto8\OneDrive\Documents\` | ~5 | `Sartor-network/2026-05-01-network-takeover-report.{md,txt}` plus a few stray docs (Neuro-Onc division chief, Personal Statement, Section meeting, Tumor Board). The OneDrive Documents tree is mostly empty — Alton clearly does not actively put things here. |
| `C:\Users\alto8\OneDrive\backups\` | 1 | `anthropic-shares-2026-05/Anthropic-shares-2025-2026.zip` (already curated by [[reference_anthropic_shares]]). |
| `C:\Users\alto8\OneDrive\Desktop\` | 0 | Empty (only shortcuts). |
| `C:\Users\alto8\OneDrive\Scans\` | 0 | Empty. |
| `C:\Users\alto8\OneDrive\Email attachments\` | 0 | Empty. |

### Extensions captured

`.pdf .docx .doc .xlsx .xls .csv .zip .eml .msg .txt .pptx .ppt .one .pst .rtf`

Initial pass also gathered `.json .html .xml` (3,166 hits); these were dropped from the index because they are overwhelmingly browser cruft, MCP debug artifacts, web exports, or small config files. If Alton wants any indexed (e.g., specific `.json` financial exports), point at them and I will fold them in.

### Exclusion subtrees

- `Sartor-claude-network/` — the repo itself (its contents are versioned and tracked).
- Game-data dirs: `Battlefield 2042/`, `Call of Duty/`, `CD Projekt Red/`, `Diablo II/`, `Diablo III/`, `Diablo IV/`, `Egosoft/`, `Larian Studios/`, `My Games/`, `Paradox Interactive/`, `STAR WARS Battlefront II/`, `STAR WARS Squadrons Steam/`, `StarCraft II/`, `steamvr/`, `Saved Games/`, `Tutorial.rivet-project`.
- System/cache: `OneNote Notebooks/`, `SlicerDICOMDatabase/`, `cache/`, `Custom Office Templates/`, `FeedbackHub/`, `Zoom/`, `Apps/`, `Microsoft Copilot Chat Files/`, `Public/`, `WindowsPowerShell/`, `node_modules/`, `__pycache__/`, `.git/`, `Obsidian Vault/.obsidian`.

### Junk filter (248 files dropped)

- `license.txt` clones (38)
- Language-pack readmes (`eng.txt`, `fra.txt`, `deu.txt`, `ger.txt`, `por.txt`, `rom.txt`, `slv.txt`, `spa.txt`, `cht.txt`, etc.) — game / mod localization files (107)
- Mod data (`EnabledMods.txt`, `BodyParts.txt`, `Phase_I_Clone_Helmet*.zip`, `Brick-like Clone Armor*.zip`, `American soldier ww2 Stand A1.zip`, `space-exploration_*.zip` Factorio mod, `Warhammer_Fortress_of_Sacrifice_Dice_Tower*.zip`)
- `[TGx]Downloaded from torrentgalaxy.to.txt`
- `~$*` Office lock files
- `ErP_Lot4VA_*.rtf` (appliance regulatory boilerplate)
- `SDCardFormatterv5_WinEN.zip` (software installer)
- `Wed-SS-1-6-*` series (conference-proceedings PDFs of unclear value)

### Categorization rules

165 regex rules organized into 21 categories, applied in priority order with first-match-wins. Source: `audits/_raw/categorize.py`. The CSV at `audits/_raw/categorized.csv` is the machine-readable output and the source of truth for the index. Regenerating the index is `python build_index.py` (in same `_raw/` dir).

For high-value categories (tax / brokerage / medical / legal) I peeked at one or two filenames per cluster but did NOT extract content into the index — the file-naming convention is informative enough on its own. Rule: characterize, never quote sensitive content.

### What I did NOT do (per plan constraints)

- **No file moves.** Every doc indexed in place at its discovered path.
- **No PDF text extraction beyond first page.** And in practice, no extraction was needed because filenames are remarkably descriptive (Alton clearly uses descriptive filenames).
- **No new directory structure proposed for the docs themselves** — that's a Phase-2 reorg call.
- **No Gmail / Drive integration audit.** That is `inspector-gmail-drive`'s deliverable.
- **No git push.** Wave-1 deliverable lands in tree, commits later.

## Surprises and observations

### 1. Alton already has two excellent organizational patterns

`Downloads/2025-Tax-Documents/` is **24 hand-numbered files** (`01-W2-Alton-AstraZeneca-TY2025.pdf` through `24-...`) — a one-folder, one-tax-year canonical bundle. This is exactly the layout Layer-4 should propagate.

`Downloads/2025-Solar-Inference-LLC-Tax-Package/` is **8 numbered subfolders** (`01-Entity-Formation/`, `02-Equipment-Receipts/`, `03-Solar-Roof/`, ..., `08-Expense-Summary/`). Inside `01-Entity-Formation/`: BusinessRegistrationCertificate.pdf, EIN Confirmation Letter.pdf, LLC Articles, Operating Agreement, dept-of-Treasury appointment as registered agent — the canonical SI-LLC corpus.

**Recommendation:** Phase-2 source-doc reorg should propagate this `01-NN-Description.ext` pattern to other entity-bundles (185 Davis condo, 85 Stonebridge mortgage, Anthropic shares, MKA tuition, etc.). Don't reinvent — promote what works.

### 2. The "Sartor - Saxena" tax folders pre-2025 are scattered

Tax docs for 2018-2024 are sprinkled across `~/Downloads`, `~/Desktop/2020 Sartor - Saxena Tax Folder/`, `~/Desktop/2023 Tax/`, and a couple of zip files (`2021 taxes-20220315T153005Z-001.zip`, `2022 taxes-20230324T020751Z-001.zip`). There's no per-tax-year canonical folder for years before 2025. Anyone trying to retrieve "show me Aneeta's 2021 W2" today walks Downloads alphabetically.

**Recommendation:** Reorg pass should mirror the `2025-Tax-Documents/` pattern back to TY2018-TY2024.

### 3. Multiple file duplicates

Common pattern: the same file shows up as `foo.pdf` and `foo (1).pdf` (and sometimes `(2)`, `(3)`). Examples: `2024 Aneeta Saxena W2 2024.pdf`, `2024 Aneeta Saxena W2 2024 (1).pdf`, `2024 Aneeta Saxena W2 2024 (2).pdf`. Probably re-downloads of the same browser asset. The index records all copies — useful for verifying nothing is missing, but a deduplication pass (by SHA-256 of file content, not filename) would shrink the index by an estimated 10-20%.

**Recommendation:** Phase-2 has a low-effort opportunity to dedupe by content hash and keep the canonical (oldest, longest-named, or in the most-organized folder) copy.

### 4. The 932 MB OneDrive zip and the 270 MB pptx

Two outliers: `Downloads\OneDrive_1_2-10-2026.zip` (932 MB) and `Downloads\OneDrive_1_11-3-2021.zip` (65 MB) appear to be Microsoft-OneDrive "Download all" exports. Likely massive bundles of duplicates of files already individually present elsewhere. The 270 MB `Project PATH Overview June 23.pptx` is real AZ work product (not opened — too large to peek).

**Recommendation:** Investigate the OneDrive zips. If they are full-history backups they should be moved to `~/backups/` and indexed once at the bundle level rather than expanded.

### 5. The Anthropic-shares zip is the model entry

`OneDrive\backups\anthropic-shares-2026-05\Anthropic-shares-2025-2026.zip` is the only doc here that already has a deep `[[reference_anthropic_shares]]` companion. That reference doc is the gold standard for Layer-4 entries: per-doc table of contents, cross-references to the entity that owns the asset, decision considerations, action items. The new INDEX.md is the lightweight one-line-per-doc index; the `reference_anthropic_shares` pattern is the heavyweight per-bundle deep-doc that lives alongside.

**Recommendation:** As bundles get reorganized in Phase-2, write a per-bundle `reference_*.md` whenever the bundle has decision-relevant content (e.g., mortgage statements aren't decision-relevant, but the 185-Davis purchase doc cluster probably is).

### 6. AZ work product is 23% of the indexed corpus

747 documents tagged `professional-az` (and another ~200 in `other` that are also probably AZ). This is years of pharmacovigilance / risk-management / clinical-trial / AI-strategy work — Cell Therapy predictive safety, Project PATH, Locus LTFU, MS PATHS, ALXN1720, AZD6414, MGFA-I, Project PATH ad boards, EvoPAR, BARB, hazard analyses, FMEAs, MEDWATCH submissions, GVP guidelines, CIOMS reports. Two implications:

- **AZ Compliance scope:** these are AZ work product. They live on a personal machine (and OneDrive). Worth confirming with AZ Compliance that this is per policy, especially for anything containing patient-level safety data (MEDWATCH PDFs, CASE_*_case_report.docx batches).
- **The professional bucket is the natural source for the `safety-research-wiki` skill** if Alton wants to cross-link safety knowledge into the Layer-3 deep memory. Not in scope for this audit.

### 7. Zero PSE&G / Verizon utility bills indexed

The `utilities` category has only 2 hits, neither a real bill. Either Alton receives utilities as Gmail attachments only (likely — paperless billing), or they live in a location not searched (less likely). This is a real gap for any "where did the electricity bills go" question and reinforces the inspector-gmail-drive Wave-1 inspection of email-resident statements.

### 8. Solar Inference LLC source corpus is small (22 docs) and clean

`02-Equipment-Receipts/`, `03-Solar-Roof/` (Lucent invoices), `04-LegalZoom-Receipts/`, `05-Google-Workspace/`, `06-Chase-Statements/`, `07-Tax-Filing/`, `08-Expense-Summary/` plus root receipts. 22 indexed docs total. This entire corpus could comfortably move under `sartor/memory/source-documents/business-solar-inference/` if Alton wants Layer-4 to be the canonical store rather than `~/Downloads/`.

### 9. The 1,367 "other" pile is mostly AZ + research papers

Of the 1,367 uncategorized docs, sampled inspection shows the dominant categories are:
- More AZ work product (CASE_*, CTCAE, Risk Management Plans, R&D Tx AI Sprint decks, MS PATHS data-request forms) that didn't match my regexes precisely
- Research papers (`1-s2.0-S*-main.pdf`, `*-2021.pdf`, `*-mmc*.pdf` supplementary materials)
- Some genuinely personal items (transactions.csv, account 4246 500k transfer.pdf, Marie Thelus wire 4-29-22.pdf, Climate First refund) that I missed
- Browser-installer / random `.txt` README snippets

**Recommendation:** Tighter regexes can drive this down further but with diminishing returns; the index categorization is "good enough" at ~58% specifically categorized. Anyone needing a doc can `Ctrl-F` filename across the index regardless of category.

## Recommendations for Phase 2 reorg

In rough priority order:

1. **Adopt the `2025-Tax-Documents/` pattern as the Layer-4 standard.** Numbered files within a one-bundle-per-topic folder, each filename self-describing. Repropagate to TY2018-TY2024. Rough effort: 4-6 hours.
2. **Build per-bundle `reference_*.md` companions** following the `reference_anthropic_shares` pattern for each high-value bundle: `reference_185_davis_condo`, `reference_85_stonebridge_mortgage`, `reference_solar_inference_llc`, `reference_sante_total`, `reference_2025_tax_year`. Rough effort: 1 hour per bundle.
3. **Dedupe by content hash.** Estimated 10-20% shrink. Trivial Python pass. Keep the canonical copy under the most-organized parent folder.
4. **Investigate the 932 MB OneDrive zip.** Either it's a full backup that should move to `~/backups/` and be expanded once, or it's already-stale and should be deleted. Either way, don't leave it in Downloads.
5. **AZ Compliance check on personal-machine storage of AZ work product.** Probably already approved (he's been doing this for years), but worth a paper trail given the volume.
6. **Defer:** moving anything physically. The `inspector-source-docs` deliverable is the index. Reorg is a Phase-2 explicit-greenlight gate.

## Files produced

- `sartor/memory/source-documents/INDEX.md` — the deliverable Alton asked for. Canonical Layer-4 source-document index. ~615 KB / 10,189 lines / 3,211 entries grouped by 21 categories.
- `audits/_raw/enumeration.csv` — raw enumeration (6,642 candidates with full metadata).
- `audits/_raw/enumeration-filtered.csv` — post-exclusion enumeration (3,459 candidates).
- `audits/_raw/categorized.csv` — categorized + junk-flagged. The source of truth; the index can be regenerated from this.
- `audits/_raw/categorize.py` — categorization rules (165 regexes + junk patterns).
- `audits/_raw/build_index.py` — markdown-index generator.

## Phone-home

None filed. No encrypted PDFs encountered (no peek attempts that failed). No suspicious files. No scope ambiguity that required Alton intervention. The "professional-az" volume raises an AZ-Compliance question (item 5 above) but that is a recommendation, not a blocker.

## Status

Complete. INDEX.md ready for use. Ready to update DISPATCH-LOG.md.
