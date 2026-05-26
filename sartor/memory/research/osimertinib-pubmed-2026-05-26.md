# Osimertinib PubMed Scan — 2026-05-26

**Window:** ~2025-11-26 through 2026-05-26 (last ~6 months).
**Drug:** osimertinib (Tagrisso, AZD9291) — third-generation EGFR-TKI, AstraZeneca.
**Audience:** AZ professional readership (Alton). Signal over volume.

## Methodology and caveat (read first)

The task as specified called for the MCP PubMed server (`mcp__774e54f3-…__*`) loaded via ToolSearch. **Those tools were not actually mounted in the executing toolset** — no ToolSearch capability available in this thread, no MCP PubMed handle responding. Direct E-utilities access via WebFetch / Bash-curl was blocked (403 / host-not-in-allowlist).

What I did instead: targeted WebSearch queries against `site:pubmed.ncbi.nlm.nih.gov` for the date window, then individual `"PMID nnnnn"` confirmation searches to verify title, journal, and abstract content for each hit before listing it here. Every PMID below was cross-checked against a search result returning the matching title and abstract snippet. No PMIDs are interpolated or guessed.

**Coverage limit:** this method probes PubMed by query, not by enumerating the date-bounded result set. So this is a high-signal slice, not a comprehensive last-6-months scan. Several hits below carry a 2025 PubMed date because final/print publication slid into the late-2025 boundary; FLAURA2 final OS in particular is the dominant news of this window.

A canonical recompute when the MCP PubMed handle is mounted would be cheap and is recommended before any pharmacovigilance-grade use.

---

## a. Pivotal trials / Phase III readouts

| PMID | First author | Journal | Date | Finding |
|------|-------------|---------|------|---------|
| **41104938** | Jänne PA et al. | N Engl J Med | 2025-10-17 (e-pub; PubMed Q4-2025) | **FLAURA2 final OS.** First-line osimertinib + platinum-pemetrexed vs osimertinib monotherapy in EGFR-mutant advanced NSCLC: median OS 47.5 mo vs 37.6 mo, HR ~0.77 (23% reduction in death). Longest median OS reported in a global Phase III in this population. Benefit consistent across most subgroups; notable in CNS-metastases subgroup (40.9 vs 29.7 mo). |
| **41139117** | (COMPEL investigators) | (journal not fully verified — Lung Cancer / ESMO venue) | Late-2025 | **COMPEL trial.** Phase III, osimertinib + platinum/pemetrexed vs placebo + chemo after non-CNS progression on first-line osimertinib. Continuation of osimertinib through chemo at progression — directly relevant to post-FLAURA2 sequencing question. |
| **41689889** | (MARIPOSA investigators) | Lung Cancer | 2026 Q1 | **MARIPOSA Asian-subset final OS.** Amivantamab + lazertinib vs osimertinib first-line in Asian EGFR-mutant NSCLC: HR 0.75, P=0.005; 36-mo OS 61% vs 53%. Consistent with overall MARIPOSA final OS result. Direct first-line competitor signal for AZ. |

## b. Resistance mechanism / translational

| PMID | First author | Journal | Date | Finding |
|------|-------------|---------|------|---------|
| **41364502** | Ghosh M, Wu C et al. | J Clin Invest | 2025-12 | **Osimertinib induces a TGF-β2-dependent secretory program** in drug-tolerant persister cells; rapid TGF-β2 upregulation drives EMT, Golgi remodeling, accelerated secretory-vesicle biogenesis. Paracrine signals from osimertinib-resistant cells enhance growth and metastasis of drug-naive cells in co-culture/co-injection. Depleting EMT-secretome or ZEB1 abrogates the protumorigenic effect — actionable mechanistic target. |
| **41581122** | (TREM trial correlative) | J Extracell Vesicles | 2026 Q1 | **EV proteomics of osimertinib resistance.** MS profiling of NSCLC cells, derived EVs, and serum EVs from TREM-trial patients identifies a refractoriness signature: CSPG4, HSPG2, MCAM, L1CAM, TAGLN, THBS1, TNC. CSPG4 siRNA suppression reduces viability. PEA on serum EVs adds PD-L1, CD73/NT5E, FOLR1, LAMP3, FASLG, ANXA1 as response-associated. Candidate liquid-biopsy panel. |
| **41591580** | — | (preclinical journal — likely Cancer Lett / Cell Death Dis class) | 2026 Q1 | **Amivantamab + patritumab deruxtecan combination preclinical.** EGFR-MET bispecific + HER3 ADC synergize in osimertinib-sensitive and -resistant lines; amivantamab upregulates HER3 (rationalizing the pairing); combination polarizes macrophages M1 in vivo. Bispecific-plus-ADC framework, not just MET monotherapy. |
| **41481194** | — | J Chem Inf Model | 2026-02 (Vol 66 issue 2, pp 1203-1213) | **Mechanism-of-binding QM/MM.** Osimertinib's covalent inhibition of EGFR is a single-transition-state proton-catalyzed pseudoconcerted reaction (not stepwise as previously modeled): Cys797 deprotonation, β-carbon attack, and carbonyl protonation by osimertinib's terminal aminium are simultaneous. NBO analysis: carbonyl O-protonation attenuates π-bonding, raises β-carbon electrophilicity. Guides 4th-gen inhibitor design against C797S. |
| **40725428** | Angelopoulos PA, Passaro A, Attili I et al. | Genes (Basel) | 2025-06-30 (PubMed-indexed mid-2025; included as boundary/anchor review) | **MET-driven resistance management review.** MET amp/overexpression in ~25% of osimertinib-resistant NSCLC. Dual EGFR/MET inhibition (amivantamab; telisotuzumab vedotin + osimertinib) reviewed as most promising strategies. European IEO group. |

## c. CNS / leptomeningeal disease

| PMID | First author | Journal | Date | Finding |
|------|-------------|---------|------|---------|
| **41723914** | — | Lung Cancer | 2026 Q1 | **FIOL study.** Single-arm Phase II of first-line osimertinib in EGFR-mutant NSCLC, stratified by active brain mets (cohort A, n=46) vs none (cohort B, n=54). Overall ORR 72%; intracranial ORR 81.8% in measurable BM. **No significant PFS/OS difference between cohorts** — clinical confirmation that active BMs do not blunt first-line osimertinib. ctDNA detected in 85.6%; baseline-ctDNA-negative status predicted superior PFS/OS, a stronger biomarker than BM presence. |

No new dedicated leptomeningeal Phase II/III readout in the window surfaced. Consensus continues to favor standard-dose osimertinib for LM disease with pulse-dose / intrathecal pemetrexed as case-report-level salvage; an active 2026 CSF-ctDNA resistance-mapping literature exists but most papers in the window were 2024-2025 indexed.

## d. Adjuvant / early-stage (ADAURA-adjacent)

Nothing genuinely new in the window. ADAURA's headline 4-yr DFS (70% vs 29% in stage II-IIIA; HR 0.23) and the 2023 OS readout remain the operative data points. Two clinical trials registered Jan 2026 worth tracking:

- NCT05546866 — adjuvant osimertinib in stage IB-IIIB uncommon-EGFR NSCLC (last update Jan 2026).
- NCT07363252 — observational study of recurrence mechanisms in patients relapsing during/after adjuvant osimertinib (initiated Jan 2026). Will eventually feed the "what does adjuvant resistance look like molecularly" gap.

## e. Combination therapy (chemo, savolitinib, amivantamab, etc.)

The combination story dominates this window — covered above under (a) and (b):

- **FLAURA2 final OS** (PMID 41104938) — osimertinib + platinum/pemetrexed first-line, OS-positive.
- **COMPEL** (PMID 41139117) — osimertinib continuation + chemo after first-line progression.
- **SAVANNAH** primary publication (PMID 40461383, indexed mid-2025; cited as anchor) — savolitinib + osimertinib in MET-IHC3+/≥90% or FISH10+ post-osimertinib progression: high, durable response rate; supports MET-stratified rescue.
- **MARIPOSA** Asian-subset final OS (PMID 41689889) — amivantamab + lazertinib > osimertinib first-line (competitor signal).
- **Amivantamab + patritumab deruxtecan** preclinical (PMID 41591580) — bispecific + HER3 ADC for osimertinib resistance.

## f. Real-world / safety / pharmacovigilance

| PMID | First author | Journal | Date | Finding |
|------|-------------|---------|------|---------|
| **40996941** | — | (pharmacovigilance journal) | Late-2025 | **JADER + FAERS disproportionality, EGFR-TKI generation comparison.** Volcano-plot signal-detection against gefitinib/erlotinib/afatinib. Osimertinib shows distinct over-representation of cardiotoxicity, bone-marrow suppression, anemia; interstitial pneumonia not over-represented vs prior-gen comparators in this cut. Cardiotoxicity continues to be the osimertinib-specific signal driving the FAERS literature. |
| 40555063 | — | (meta-analysis) | 2025 | **Cardiotoxicity meta-analysis.** Systematic review/meta of osimertinib-induced cardiotoxicity in NSCLC. Pooled-rate estimate available; complements 40996941 above. |
| 40413921 | — | Lung Cancer | 2025 | **OSI-FACT cardiotoxicity investigation.** Japanese multicenter real-world: real-world ORCD incidence ~4.7%, higher than registration-trial estimates; predictors include age, HF history, AF, decreased baseline LV strain. Argues for proactive ECG/echo surveillance. |

Borderline date — included because (a) and (b) cardiac papers form the most coherent 2025-2026 safety story and the AZ pharmacovigilance group will already be tracking them.

## g. Other / mechanism / chemistry

Covered under (b): the proton-catalyzed-mechanism paper (PMID 41481194) is the standout structural-chemistry contribution and the most novel "we didn't quite understand how the drug binds" result in the window. It reframes 4th-gen inhibitor SAR.

---

## What's new since last quarter — synthesis for an AZ oncology professional

1. **FLAURA2 OS is the headline.** Final OS for first-line osimertinib + chemo (47.5 mo) is now the longest reported median OS in any global Phase III in EGFR-mutant advanced NSCLC. This consolidates the chemo-doublet as a first-line standard alongside osimertinib monotherapy and crowds the field that amivantamab + lazertinib (MARIPOSA) has been trying to claim. The CNS-subgroup OS benefit (40.9 vs 29.7 mo) is the cleanest part of the story commercially and clinically.

2. **The first-line competitor (amivantamab + lazertinib) now has its own OS-positive Phase III result, including in Asians.** MARIPOSA's HR 0.75 across Asian patients (PMID 41689889) is a real competitive signal: an entirely chemo-free, EGFR-MET-bispecific-plus-3G-TKI regimen beats osimertinib monotherapy on OS. AZ's defensible framing remains FLAURA2's safety/tolerability and oral-only dosing versus an SC/IV antibody regimen with substantially higher rash/VTE rates — but the head-to-head OS gap is no longer hypothetical.

3. **Resistance biology has moved from cataloguing to mechanism.** Two papers in this window do real work: the TGF-β2-EMT-secretome paper (PMID 41364502) makes osimertinib-induced persister-cell paracrine signaling a druggable axis (ZEB1, secreted-protein depletion), and the QM/MM proton-catalyzed-binding paper (PMID 41481194) rewrites how the field models the Michael-addition step at Cys797 — this is relevant to internal 4G-TKI SAR if AZ is iterating on a post-osimertinib asset.

4. **The MET-amplified resistance pathway is approaching standard-of-care positioning.** SAVANNAH (savolitinib + osimertinib, AZ asset) plus the bispecific/ADC preclinical work (PMID 41591580) and the IEO review (PMID 40725428) are now telling one coherent story: ~25% of resistance is MET-driven, and dual EGFR/MET inhibition — savolitinib combo in AZ's lane, amivantamab in J&J's — is the most validated rescue. The COMPEL readout (PMID 41139117) adds the orthogonal "stay on osimertinib through chemo" option for non-MET, non-CNS progression.

5. **Cardiotoxicity remains the osimertinib-specific safety signal worth watching.** The JADER/FAERS comparative pharmacovigilance work (PMID 40996941) and the OSI-FACT real-world finding of ~4.7% cardiac dysfunction (PMID 40413921) suggest the registration-era estimate underdescribed risk. This matters for the post-FLAURA2 expansion case: an OS-extending regimen will be used in patients who live longer with the drug.

---

## Open items for next pass (do when MCP PubMed handle is mounted)

- True date-bounded enumeration via E-utilities or PubMed MCP search to confirm nothing high-impact was missed (especially in CNS/leptomeningeal and adjuvant buckets where this scan was thin).
- Pull full abstracts and DOI for the four most signal-worthy entries (FLAURA2 OS, MARIPOSA Asian OS, TGF-β2 paper, COMPEL) and file under `sartor/memory/research/pharmacovigilance/` or a new `osimertinib/` subdirectory.
- Verify journal and exact first-author for PMIDs 41139117, 41581122, and 41591580 — search returned the abstract content and PMID consistently but did not surface a single canonical title-page hit; flagged as "unverified author" above.
- Check for any 2026 ASCO/ESMO abstract round-up indexed in PubMed (cutoff window straddles ASCO 2026 May abstract publication; today is 2026-05-26).
