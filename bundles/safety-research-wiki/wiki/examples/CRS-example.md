---
type: adverse-event
entity: CRS
updated: 2026-04-09
updated_by: example-author
status: active
grading_system: ASTCT-2019
tags: [ae/cytokine, ae/immune, severity/serious, ae/systemic]
aliases: [Cytokine Release Syndrome, CRS]
related: [IL-6-signaling, ICANS, tocilizumab, corticosteroids]
---

# Cytokine Release Syndrome (CRS)

An example adverse event page showing the expected format. This is a demonstration, not clinical content — do not use for real patient care.

## Definition / Grading

CRS is a systemic inflammatory response triggered by immunotherapies, particularly CAR-T cell therapy and bispecific T-cell engagers. It's driven primarily by [[IL-6-signaling]] and related cytokine cascades.

The ASTCT-2019 consensus grading scale defines four grades based on fever, hypotension, and hypoxia:

- **Grade 1:** fever (≥38.0°C)
- **Grade 2:** fever + hypotension responsive to fluids, or hypoxia requiring low-flow oxygen
- **Grade 3:** fever + hypotension requiring vasopressors, or hypoxia requiring high-flow
- **Grade 4:** fever + multiple vasopressors or hypoxia requiring positive pressure

> [!fact] Grading reference
> Lee DW, et al. ASTCT Consensus Grading for Cytokine Release Syndrome and Neurologic Toxicity Associated with Immune Effector Cells. Biol Blood Marrow Transplant. 2019 Apr;25(4):625-638. PMID: 30592986.

## Mechanism

The primary driver is IL-6 release from activated macrophages and T cells. See [[IL-6-signaling]] for the full mechanism breakdown. Key cascade:

1. Effector T cells (e.g., CAR-T) encounter target antigen and release IFN-γ
2. Macrophage activation → IL-6, IL-1, TNF release
3. Endothelial activation, capillary leak, hypotension
4. Positive feedback loop amplifies the cytokine storm

## Affected drug classes

- [[CD19-CAR-T-class]] — highest incidence, grade 3-4 rates 23-46% depending on product
- [[BCMA-CAR-T-class]] — similar or higher rates in myeloma populations
- [[bispecific-T-cell-engagers]] — lower grade 3-4 rate (~5-10%) but high grade 1-2
- [[checkpoint-inhibitors]] — rare CRS, mostly case reports

## Clinical management

First-line: [[tocilizumab]] (IL-6 receptor blocker). Second-line: [[corticosteroids]]. Refractory cases: [[anakinra]] (IL-1R antagonist) or [[siltuximab]] (IL-6 neutralizer).

See individual drug pages for dosing, timing, and decision rules.

## Signal history

- **2017:** Initial CAR-T approvals (tisagenlecleucel, axicabtagene-ciloleucel) include boxed warning for CRS
- **2020:** REMS programs expanded to include CRS monitoring
- **2024:** Updated ASTCT guidance emphasizes early tocilizumab in grade 2+
- **2026:** Active signal under investigation — [[signal-2026-03-lvef-carT]] examines cardiovascular sequelae of severe CRS

> [!warning] Label update
> FDA label update expected Q2 2026 to add LVEF monitoring recommendation post-CRS resolution. Pending confirmation from the manufacturer's PBRER filing.

## Labeling implications

- All CAR-T products carry boxed warning for CRS
- REMS programs mandate tocilizumab availability on-site before infusion
- Timing of tocilizumab has shifted from "refractory only" (original REMS) to "early intervention" (current guidance)

## Key references

- Lee DW et al. 2019 — ASTCT grading (see above)
- Neelapu SS et al. 2018 — Chimeric antigen receptor T-cell therapy assessment and management of toxicities. Nat Rev Clin Oncol.
- Frey NV, Porter DL. 2019 — Cytokine Release Syndrome with Chimeric Antigen Receptor T Cell Therapy. Biol Blood Marrow Transplant.
- Internal review memo 2026-03 — example placeholder for internal doc citation

## History

- 2026-04-09: Example page created as a bundle demonstration
