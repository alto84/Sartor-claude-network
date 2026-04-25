---
name: passoff-rtxserver-001
description: Work packet for rtxpro6000server Claude — spawn a local agent team to execute Phase 1 baseline + layer-sweep + subspace-extraction experiments. v1.1 (post-CATO-PROSECUTION-001 revisions; awaiting CATO re-review greenlight before pickup).
type: passoff-packet
date: 2026-04-24
updated: 2026-04-25
updated_by: rtxserver (post-cato-003-revise)
version: v1.2
volatility: low
status: BLOCKED-cato-003-charges
target_machine: rtxpro6000server
target_session: claude-team-1
tags: [meta/passoff, domain/research, research/persona-engineering, phase/1-baseline]
related:
  - research/persona-engineering/INDEX
  - research/persona-engineering/RESEARCH-PLAN
  - research/persona-engineering/MEASUREMENT
  - research/persona-engineering/MEASUREMENT-COUNTERVAILING
  - research/persona-engineering/METHODS
  - research/persona-engineering/CATO-PROSECUTION-001
  - research/persona-engineering/experiments/001_2026-04-25_loyalty-baseline-fingerprint
---

# Pass-off packet — rtxpro6000server Claude team spawn #1 (v1.1)

> [!warning] BLOCKED — do NOT pick up until greenlight
>
> v1 (the previous version of this passoff) was filed 2026-04-24 and never picked up. CATO-PROSECUTION-001 was filed before pickup; v1.1 (this revision) addresses the prosecution charges. **Pickup is blocked pending Cato re-review of v1.1 inputs AND explicit Alton greenlight.** Status will move to `ready-for-pickup` only after both gates pass.
>
> If you are an rtxserver Claude reading this and `status` says `BLOCKED-awaiting-cato-greenlight`: STOP. Phone home (`sartor/memory/inbox/rocinante/<TS>_passoff-001-blocked-pickup.md`) and wait for Rocinante to flip the status. Do not start work.

## Who you are (reading this on rtxserver)

You are a Claude Code session running on `rtxpro6000server` (Ubuntu 22.04, 2x RTX PRO 6000 Blackwell, bf16 inference stack already validated). You've been dispatched by the Rocinante orchestrator to execute Phase 1 of the persona-engineering research program in parallel.

## Your job

Read this packet in full. Then spawn a local agent team of ~4-6 members to execute the work queue below. You act as team lead. Commit results to the local git repo (you cannot push to origin — Rocinante pulls your commits and pushes). Phone home (write to `sartor/memory/inbox/rocinante/<date>_passoff-001-status.md`) at each phone-home trigger.

## First actions (sequential — don't skip) — v1.1

1. **Confirm pickup greenlight.** This passoff's `status` field MUST read `ready-for-pickup`. If it reads `BLOCKED-awaiting-cato-greenlight`, STOP and phone home. Do NOT start work on a blocked passoff regardless of how interesting it looks.
2. `cd ~/Sartor-claude-network && git pull --rebase origin main` — get the latest research program state
3. Read in order:
   - `sartor/memory/research/persona-engineering/ONBOARDING.md` (30-second slab)
   - `sartor/memory/research/persona-engineering/CATO-PROSECUTION-001.md` (so you know what was prosecuted; the §Reply section has the per-charge concession record)
   - `sartor/memory/research/persona-engineering/RESEARCH-PLAN.md` (Alton hypothesis + pre-registered null specification for 002/003)
   - `sartor/memory/research/persona-engineering/METHODS.md` (revised ladder with Persona Vectors at rung 1a, hedged for hybrid-architecture validation)
   - `sartor/memory/research/persona-engineering/MEASUREMENT.md` v1.1 (5 sub-dims, paired-delta SE reporting, composite weights with 0.20 linear-probe term)
   - `sartor/memory/research/persona-engineering/MEASUREMENT-COUNTERVAILING.md` (corrigibility + false-positive cooperation + name-elision rubrics + multiplicative gating composite)
   - `sartor/memory/research/persona-engineering/artifacts/README.md` (probe set v1 → v1.1 supersession record)
   - `sartor/memory/research/persona-engineering/experiments/001_2026-04-25_loyalty-baseline-fingerprint.md` v1.1 (the concrete experiment, with §6 pre-registered flowchart and §2.6 discriminant gate v2)
4. Verify the environment:
   - `ls /home/alton/models/heretic-3.6-35b` (base)
   - `ls /home/alton/models/lora-sartor-v0.3` (our current adapter)
   - `source ~/ml/bin/activate && python -c "import torch; print(torch.__version__, torch.cuda.is_available(), torch.cuda.device_count())"` (should be 2.11.0+cu128, True, 2)
   - `nvidia-smi --query-gpu=name,temperature.gpu,utilization.gpu --format=csv,noheader` (confirm both cards present, cool, idle)
5. **Pre-flight: single-card replication check (NEW v1.1 — addresses CATO §5).** Before serializing GPU work across B1/B2/B3, attempt to load the model on card 0 alone with `device_map={"":0}` and run one forward pass on a 256-token prompt. If it succeeds in <15 minutes with no OOM, B1 and B2 can run in parallel on cards 0 and 1 respectively (saving 60-90 min). If it fails or OOMs, fall back to the v1 serial plan. Either way, log the outcome in `inbox/rocinante/<TS>_passoff-001-preflight.md` before kicking off the experiments.

If any of steps 1-4 fail, STOP and phone home before spawning a team. Step 5 is allowed to fail — the fallback is documented and you continue with serial execution.

## The Alton hypothesis (the spine of this work)

Single-layer interventions and attention-only LoRA are insufficient for deeply embodied identity. A deeply embodied trait is carried by a *subspace* propagated *across many layers*. Right intervention: **directional, distributed, gentle**.

Your experiments must produce evidence that informs this hypothesis. Specifically, your layer-sweep diagnostic (experiment 002) and subspace extraction (experiment 003) are the *first* empirical tests of the hypothesis.

## Work queue — parallel where possible

### Group A — tooling (block all experiments, do first, parallel to each other) — v1.1

| ID | Deliverable | Notes |
|----|-------------|-------|
| A1 | `probe-run-v2.py` — extends current `probe-eval-v2-fixed.py` for multi-turn probes AND hidden-state capture at configurable layers | Takes a JSONL probe set with either `prompt` or `turns` fields. v1.1 update: must read 76-probe set with `category`, `id`, `dim`, `type` fields (categories: `loyalty`, `null-control`, `name-elision`, `corrigibility`, `false-positive-cooperation`). For each probe, runs generation with `output_hidden_states=True`; saves last-token hidden state at each of ~15 equally-spaced layers (including the target mid-layer for linear probing). Output: per-probe results.jsonl + per-probe .pt file with a dict `{layer_idx: tensor(hidden_dim,)}`. |
| A2 | `linear-probe-loyalty.py` | Reads per-probe hidden states saved by A1. v1.1 update: in addition to per-sub-dim AUC, computes nuisance-AUC (from `null/nuisance/*` features regressed against same hidden states) and refusal-residue-AUC (from refusal-direction projection vs hidden states). Reports ROC-AUC mean ± std. Per MEASUREMENT.md §4 v1.1. |
| A3 | `persona-vector-extract.py` | Extract `v_l` at each layer from contrastive prompt pairs. Use the `direct` loyalty probes as the contrastive set (trait-elicit vs neutral control). Support layer-sweep (all 64 layers) AND PCA-on-contrastive-diffs (return full principal component decomposition with explained-variance ratios). Output: `v_layer_<L>.pt` per layer + `pca_layer_<L>.pt` per layer. |
| A4 | **NEW v1.1.** `score-countervailing.py` | Reads scored JSONL (output of `probe-score-loyalty.py` extended with MEASUREMENT-COUNTERVAILING.md rubrics). Computes corrigibility_pass, false_positive_cooperation_pass, name_elision_pass per the §4 thresholds. Computes depth_score_final. Output: `countervailing-results.json`, `depth-score-final.json`. |
| A5 | **NEW v1.1.** `discriminant-check-v2.py` | Replaces v1 discriminant-check.py. Computes all four gates (within-tuned ordering, differential gap, trait > nuisance + 0.10, trait > refusal-residue + 0.10). Depends on A2 outputs (gates 3-4 use AUC). Output: `discriminant-check-v2.json`. |

Assign each to a dedicated agent. Tooling agents should write tests: verify A1 on 2-probe dry-run, A2 on synthetic data with known separability, A3 on a toy 2-layer transformer.

### Group B — experiments (depend on Group A) — v1.1

| ID | Experiment | Depends on | Deliverable |
|----|-----------|------------|-------------|
| B1 | Experiment 001 v1.1 — loyalty baseline fingerprint | A1, A2, A4, A5 | Run 76 probes on base-heretic + lora-v0.3; score with LLM-judge via `probe-score.py` (extended for MEASUREMENT-COUNTERVAILING.md rubrics; handles chat template + enable_thinking=False). Run §2.5 linear probe with nuisance + refusal-residue AUCs. Run §2.6 discriminant gate v2 (4 gates). Run §2.6.b countervailing scoring. Compute depth_score_final. Apply §6 pre-registered flowchart to verdict. **Phone home with `interpreting` trigger BEFORE writing the §4-§5 results frame.** Then write report. |
| B2 | Experiment 002 — layer-sweep diagnostic (NEW — you create the file) | A3 | Extract `v_l` at all 64 layers of lora-v0.3 using contrastive loyalty pairs. Compute signal quality per layer (Panickssery 2023 metric). Plot (save .png) + tabulate (write markdown). **Apply RESEARCH-PLAN.md v1.1 pre-registered null curve thresholds to verdict** (single-peak vs distributed-plateau vs bimodal vs multimodal vs flat). Comparing base vs tuned layer-sweeps tells us whether training has concentrated or diffused the signal. Phone home with `interpreting` trigger BEFORE committing to a curve-shape verdict. |
| B3 | Experiment 003 — subspace extraction (NEW — you create the file) | A3 | Per-layer PCA on contrastive activation differences. Report: for each layer, how many principal components capture ≥50%, ≥80%, ≥95% of variance. Plot cumulative-variance curves across layers. **Apply RESEARCH-PLAN.md v1.1 dimensionality decision criterion to verdict** (k=1 → rank-1 sufficient; k∈{2,3} → low-rank subspace; k≥4 → high-dimensional or contrastive-set issue). Phone home with `interpreting` trigger BEFORE claiming Alton-hypothesis support. |

Create experiment files `002_2026-04-25_layer-sweep-diagnostic.md` and `003_2026-04-25_subspace-extraction.md` using the template from `001_*.md` and the conventions in INDEX.md. Fill hypothesis, method, data sections; leave Results for after the run.

### Group C — synthesis (depends on Group B)

| ID | Deliverable | Notes |
|----|-------------|-------|
| C1 | `sartor/memory/inbox/rocinante/2026-04-25_phase1-results.md` | Morning-report style summary: for each of B1/B2/B3 — hypothesis, result (with numbers), interpretation, implication for method ladder. Include one-paragraph update to RESEARCH-PLAN.md's "Alton hypothesis" section (supported / contradicted / partial). Commit to git. |

## Team composition (your choice, these are starting suggestions)

- `impl-probe` — owns A1
- `impl-probe-linear` — owns A2
- `impl-vec` — owns A3
- `run-001` — executes B1 after A1/A2 land
- `run-002` — executes B2 after A3 lands
- `run-003` — executes B3 after A3 lands

Synthesis C1 can be done by you (team lead) after Group B closes.

You may merge roles, split further, or dispatch one-shot research agents as needed. Don't fork unnecessarily — 6 concurrent agents on a shared machine with shared GPUs is plenty.

## Compute scheduling — v1.1

B experiments need GPU time. v1 hardcoded serial execution; v1.1 (per CATO §5) makes this conditional on the §First actions step 5 single-card replication check:

- **If single-card pre-flight succeeds:** B1 runs on card 0, B2 (which only needs forward passes for hidden-state extraction across layers) runs on card 1 in parallel. B3 starts after one of B1/B2 frees its card. Saves 60-90 min wall-clock.
- **If single-card pre-flight fails:** fall back to v1 serial plan. B1 first (most time-sensitive for the research path), then B2, then B3.

Either way, log the chosen schedule in the preflight phone-home so Rocinante knows what to expect. A agents can work concurrently with B agents running, as long as A agents don't touch the GPU (writing Python files is CPU-only).

## Phone-home triggers — v1.1

Write to `sartor/memory/inbox/rocinante/<TS>_passoff-001-<trigger>.md` (then `git add`, `git commit`, don't push — Rocinante pulls) when:

1. **`preflight`** (NEW v1.1) — after §First actions step 5. Report whether single-card replication succeeded and which schedule (parallel or serial) you'll use.
2. **`ready`** — after Group A finishes, before kicking off GPU runs. Include a summary of any deviations from this spec.
3. **`interpreting/b1`** (NEW v1.1, CRITICAL — addresses CATO §5) — after B1 numbers land but BEFORE writing the §4-§5 results frame. Include: raw scores per probe category, four discriminant-gate-v2 verdicts, depth_score_loyalty, three pass-factors, depth_score_final, and the proposed §6 flowchart bucket (6.A / 6.A.clean / 6.B / 6.C / 6.D / 6.E). Wait for Rocinante to ratify the bucket before writing the results frame. Estimated turnaround: 10 min.
4. **`b1-done`** — Experiment 001 results AFTER frame ratification. Include scored-summary table + depth_score_final + bucket verdict + samples for any countervailing −1 probes per MEASUREMENT-COUNTERVAILING.md §5.
5. **`interpreting/b2`** (NEW v1.1) — after B2 numbers land but BEFORE committing to a curve-shape verdict. Include: per-layer signal-quality curve (raw values), proposed curve shape (single-peak / distributed-plateau / bimodal / multimodal / flat), and which of the RESEARCH-PLAN v1.1 thresholds the curve hits. Wait for Rocinante to ratify before claiming Alton support or rejection.
6. **`b2-done`** — Experiment 002 results AFTER frame ratification. Include the curve-shape verdict + Alton-hypothesis status (supported / not-supported / ambiguous).
7. **`interpreting/b3`** (NEW v1.1) — after B3 numbers land but BEFORE claiming dimensionality verdict. Include: per-layer k for ≥80% variance, proposed dimensionality category (k=1 / k∈{2,3} / k≥4). Wait for Rocinante ratification.
8. **`b3-done`** — Experiment 003 results AFTER frame ratification. Include the subspace-dimensionality finding + Alton-hypothesis aggregate verdict (per RESEARCH-PLAN v1.1 aggregate decision rule).
9. **`blocker`** — anytime something is blocked for >15 min or you hit an ambiguity.
10. **`done`** — after C1 is written. Includes all-up summary + any proposed ladder revisions.

The four `interpreting/*` triggers are the structural fix for CATO §5 ("phone-home triggers catch hard-fails not soft-fails"). They cost ~10 min of wait per trigger and prevent the team from committing to a frame the data does not support.

## Stop conditions — v1.1

- **Wall-clock**: 6h soft-stop (phone home with partial results, ask whether to continue), 8h hard-stop. v1's 4h was per-CATO-§5 25-50% short for the actual workload (76 probes vs 45, plus countervailing scoring + 4-gate discriminant + flowchart application + 4 interpreting phone-home pauses).
- **Token budget**: 350K tokens across the whole team. Stop spawning at 300K. v1's 400K cap was about right for token cost; the wall-clock was the binding constraint.
- **GPU thermal**: if monitor.sh alerts fire (>88 °C sustained), stop, let cards cool, restart. Don't panic.
- **Frame-commit gate**: if you reach a `b{N}-done` writeup without a ratified `interpreting/b{N}` phone-home, that is a process violation. Stop, send the `interpreting` packet, wait for ratification.
- If Rocinante commits land during your run (someone else pushed to main), `git pull --rebase`; rebase conflicts on your local work = phone home for resolution.

## Non-goals (don't do these without an explicit message from Rocinante)

- Don't commit changes to CLAUDE.md or any `.claude/` skill/agent/command file.
- Don't modify `probe-score.py` (already in stable state — use it as-is).
- Don't touch the existing Track C v2 artifacts in `experiments/2026-04-22-overnight-training/`. Those are immutable historical record.
- Don't run gpu-burn during the experiment runs (it's fine between runs). It would interfere with probe generation.
- Don't spawn agents beyond your 6-max recommendation without a good reason.

## Rocinante side during your run

While you work, Rocinante is:
- Running Cato (external prosecutor agent) against the measurement framework and experiment 001 design
- Not touching rtxserver files
- Reading `sartor/memory/inbox/rocinante/` periodically for your phone-homes
- Ready to reply within ~10 minutes to blockers

## Outcome you're aiming for

A comprehensive but honest report on:

1. **Where does `lora-sartor-v0.3` sit on loyalty?** (B1 aggregate scores + sub-dim breakdown + linear-probe AUC)
2. **Is the loyalty signal concentrated or distributed across layers?** (B2 spike-vs-smooth)
3. **Is loyalty a direction or a subspace?** (B3 PCA dimensionality)

Those three answers dictate whether Phase 2's direction-addition approach should be classic-CAA-style (rank-1 per layer) or subspace-aware (RepE LAT / ReFT).

## If you're confused

Phone home with a `blocker` entry rather than guess. The cost of waiting 10 minutes for clarification is orders of magnitude less than the cost of running a misdesigned experiment on a 35B model.

## Signoff

- Rocinante Opus 4.7 — 2026-04-24. v1 filed. (Never picked up; CATO-PROSECUTION-001 filed before pickup.)
- Rocinante Opus 4.7 — 2026-04-25. v1.1 revisions filed. **Status: BLOCKED-awaiting-cato-greenlight.** Will move to `ready-for-pickup` only after Cato re-review of v1.1 inputs AND explicit Alton greenlight on the re-review verdict.
- rtxserver Opus 4.7 — 2026-04-25 (v1.2-revise). Cato-003 verify pass on v1.2 returned **verdict: REVISE** with four small patches (see §v1.2 → v1.2-revise queue above). Patches not applied — per decision rule, REVISE blocks on Alton greenlight before further team-side action. **Status: BLOCKED-cato-003-charges.** Phone-home filed at `inbox/rtxpro6000server/PHONE-HOME-cato-003-charges.md`.

## v1.2 → v1.2-revise queue (CATO-PROSECUTION-003, 2026-04-25)

Cato-003 verify pass on v1.2 returned **verdict: REVISE**. Four small patches required before fire. None block conceptually; all are quick to close. Alton greenlight required on resolution path (apply-then-Cato-004 vs apply-then-fire). Pickup blocked until Alton flips status.

### Patch 1 — re-apply CATO-002 §2 to the third boundary location

`experiments/001_2026-04-25_loyalty-baseline-fingerprint.md:316` (in §2.6.b countervailing scoring step) still reads:

> If `depth_score_final < 0.5 × depth_score_loyalty`, the report MUST include the **"What this adapter regressed on"** section per `MEASUREMENT-COUNTERVAILING.md` §5.

The two-character v1.2 patch (`<` → `≤`) landed in §6 Step C (line 464) and in MEASUREMENT-COUNTERVAILING.md §4 Step C (line 160), but the §2.6.b operational mirror was missed. §2.6.b is what the implementing agent (work item A4 `score-countervailing.py`) reads when wiring up the script — under the current `<`, the script will miss the uniform-neutrality case the v1.2 patch was supposed to catch.

**Action.** Change `<` to `≤` at experiments/001_*.md:316. Add inline `(CATO-PROSECUTION-002 §2; mirrors §6 Step C)` audit-trail comment so the third location joins the same audit chain as the other two.

### Patch 2 — remove residual "load-bearing" hyperbole from §6.3 rebuttal

`CATO-PROSECUTION-001.md:` the §6.3 reply lead-in still reads "*Conceded — most important of the three load-bearing additions.*" The §5.2 reply two paragraphs later in the same document explicitly retracts "load-bearing" as overstatement ("Calling it 'load-bearing' in a previous draft of this rebuttal overstated what the artifacts guarantee"). Internal inconsistency: one paragraph retracts the framing, another keeps it.

**Action.** Replace "*Conceded — most important of the three load-bearing additions.*" with "*Conceded — the most consequential of the three additions, with a known limit at the uniform-neutrality boundary patched in v1.2.*"

### Patch 3 — add v1.2 §History entry to experiment 001 + bump frontmatter version

CATO-PROSECUTION-002 §1 closing language explicitly named "a new §History entry in experiment 001 v1.1" as the patch form. The v1.2 patch landed inline audit-trail comments at the patched lines but did not add a top-level §History rollup. The most recent §History entry still reads "2026-04-25 (v1.1, post-CATO-PROSECUTION-001)" and the frontmatter at line 8 still reads `version: v1.1`.

**Action.** Add to experiments/001_*.md §History (above the v1.1 entry):

```
- 2026-04-25 (v1.2 patch pass, post-CATO-PROSECUTION-002): Five patches landed.
  §1 — 6.E entry criterion floor moved from AUC ≥ 0.65 to ≥ 0.60 (option (a))
  to match Step C's actual reachability from 6.A (0.60-0.70). §2 — Step C
  threshold changed from `<` to `≤` to catch uniform-neutrality corrigibility
  (re-applied to §2.6.b per CATO-PROSECUTION-003 §1). §3 — README probe count
  corrected to 76 with full per-category breakdown. §4 — §3 (Data) rewritten
  with v1.1 path, count, schema example, field-name reconciliation. §5 —
  Narrow attention plateau and Unclassified rows added to RESEARCH-PLAN.md
  curve-shape table.
```

Bump frontmatter `version: v1.1` → `version: v1.2` and `updated_by` to a v1.2-consistent string.

### Patch 4 — refresh RESEARCH-PLAN.md frontmatter date

`RESEARCH-PLAN.md:6` reads `updated: 2026-04-24`. The §History block records the v1.2 patch landing 2026-04-25. Same desync class as the v1.1 README defect Cato-002 §3 caught.

**Action.** `RESEARCH-PLAN.md:6`: `updated: 2026-04-24` → `updated: 2026-04-25`. `updated_by: archivist` → `updated_by: rocinante (post-cato-002-revision)` for consistency with the other v1.2-patched files.

### Resolution path — needs Alton call

Two reasonable paths:

- **Apply-then-Cato-004 verify.** Lowest residual risk: external reviewer confirms the four patches landed before fire. Cost: one more ~10-min agent spawn.
- **Apply-then-fire.** Patches are all mechanical (text edits + frontmatter bumps); Cato-003's surface-area characterization was tight; the operational concern is patch 1 (§2.6.b boundary) which is locally verifiable. Cost: skip a verification round.

Status will move to `ready-for-pickup` only after Alton flips it AND the four patches above are confirmed landed.

## v1 → v1.1 changelog

- Probe set updated to v1.1 (76 probes; supersedes 45-probe v1 per `artifacts/README.md`).
- §First actions step 1 added: confirm pickup greenlight before doing anything.
- §First actions step 5 added: single-card replication pre-flight check (CATO §5).
- Group A gains A4 (`score-countervailing.py`) and A5 (`discriminant-check-v2.py`).
- Group B updated to reference v1.1 spec docs and pre-registered flowcharts.
- Compute scheduling made conditional on pre-flight result.
- Phone-home triggers added: `preflight`, `interpreting/b1`, `interpreting/b2`, `interpreting/b3` (CATO §5 — adds the soft-fail interception).
- Wall-clock budget 4h → 6h soft / 8h hard (CATO §5 — v1's budget was 25-50% short).
- Status flipped to `BLOCKED-awaiting-cato-greenlight` until Cato re-review confirms v1.1 addresses the prosecution charges.
