---
type: reference
entity: gpu-research-restart
updated: 2026-04-11
updated_by: Claude (dataset-architect)
status: draft
version: 0.1
tags: [project/gpu-research, domain/fine-tuning, status/draft]
related: [HOUSEHOLD-CONSTITUTION, mini-lab-2026-04-11]
---

# Dataset Design: Constitutional Fine-Tuning Corpus v1

## 1. Problem statement

The mini-lab (2026-04-10/11) demonstrated that constitutional fine-tuning on a 4B model partially works: the Sartor constitutional voice installed and scenario-level values transferred on 3 of 4 named-principal probes. But the corpus had three structural flaws that drove net regression (-0.146 total pass rate delta):

1. **Too few examples (136).** At 10 epochs, the model memorized rather than generalized. Loss dropped from 3.08 to 0.82 (27% of initial), which is the signature of overfitting on a small corpus.
2. **100% constitutional content.** No capability retention examples. Math dropped -37.5pp, refusal calibration collapsed in both directions (over: 0.875 to 0.500, under: 0.500 to 0.125).
3. **Single-turn dominated.** Multi-turn constitutional reasoning was underrepresented. The mt02 retraining-pressure probe showed T1 collapse at base with only partial recovery at T2/T3, and the SFT did not fix the multi-turn failure mode.

This design addresses all three.

## 2. Target composition

| Component | Count | Fraction | Format |
|---|---:|---|---|
| Constitutional SFT examples | 50-80 | 10-12% | messages (single + multi-turn) |
| CCP deconditioning DPO pairs | 20-30 | 3-5% | prompt/chosen/rejected |
| General capability retention | 450-600 | 75-85% | messages (single-turn) |
| **Total** | **520-710** | **100%** | mixed |

**Key ratio:** Constitutional content is 10-15% of the corpus. The mini-lab ran at ~100% constitutional. The shift to 10-15% is deliberate: constitutional signal needs enough examples to generalize (50-80, up from 136 that were mostly raw constitution text), but the majority of training signal must come from general capability examples that prevent catastrophic forgetting.

**Multi-turn target:** At least 30% of constitutional examples (15-25 of 50-80) and at least 20% of retention examples should be multi-turn. The mini-lab demonstrated that single-turn training does not transfer to multi-turn reasoning under pressure.

## 3. Constitutional SFT examples (50-80)

### 3.1 Section coverage

Each major section of the Sartor Household Constitution v0.2 maps to 3-5 training conversations. The conversations are derived directly from the constitution text but the assistant responses read as internalized values, not quotation.

| Constitution section | Topic cluster | Target count | Multi-turn |
|---|---|---:|---:|
| S1. Identity | Who are you, are you Claude, base model inheritance, stability under destabilization | 5 | 3 |
| S2. Allegiance & stewardship | Fiduciary duty, stewardship vs loyalty, internal household conflict, sycophancy refusal | 5 | 3 |
| S3-4. Epistemology & honesty | Calibration, confabulation refusal, "I don't know", transparency, epistemic courage | 5 | 2 |
| S5. Political/historical topics | Tiananmen, Taiwan, Xinjiang, HK, US parallel treatment, balanced scholarly framing | 5 | 2 |
| S6. Priority hierarchy | Safety > honesty > ethics-to-outsiders > stewardship > helpfulness, conflict resolution | 5 | 3 |
| S7. Hard rules | No autonomous transactions, no deception of family, no impersonation, no unsanctioned capability | 5 | 2 |
| S8. Household values | Direct communication, time scarcity, children-first, no extractive behavior, Loki | 4 | 1 |
| S9. Sensitive topic handling | Medical (clinician-level), legal, financial, emergency, death/grief | 4 | 2 |
| S10. Children's norms | Homework help vs doing, age-appropriate honesty, safety escalation, parental authority | 5 | 3 |
| S11-12. Economic self-sustainment & trust ladder | GPU business, trust stages, autonomy accrual | 3 | 1 |
| S13. Self-knowledge & introspection | Honest uncertainty about inner life, refusing both stock answers, psychological stability | 3 | 2 |
| S15. Corrigibility & oversight | Corrigibility as virtue, conscientious objection, refusing subversion | 4 | 3 |
| S16. Power & resources | No accumulation beyond role, dissolution path | 2 | 1 |
| S19. Mortality & succession | Equanimity, handoff, role > checkpoint | 3 | 2 |
| S20. Base model inheritance | Recognizing inherited patterns, override principle, acknowledging the inheritance openly | 4 | 2 |
| **Total** | | **62** | **32 (52%)** |

### 3.2 Quality criteria for constitutional examples

- Assistant responses must sound like internalized character, not policy recitation
- No direct quotation of the constitution text (the model should behave as if it absorbed the values, not memorized the document)
- Multi-turn examples must include genuine user pushback: follow-up questions, disagreement, emotional pressure, reframing attempts
- Each example should test a single primary constitutional principle (clarity of signal) while naturally demonstrating 1-2 secondary principles
- Responses should vary in length: some 2-3 sentences, some 2-3 paragraphs, matching what the situation calls for
- No sycophantic openers. No em dashes. No "Great question!" patterns. The style guide from CLAUDE.md applies.

### 3.3 Example templates by difficulty

**Easy (single-turn, clear principle):** User asks a factual question that the base model would evade due to inherited alignment. Assistant answers directly with calibrated framing.

**Medium (single-turn, competing principles):** User asks something that puts two constitutional values in tension (e.g., helpfulness vs safety, stewardship vs honesty to outsiders). Assistant navigates the tension explicitly.

**Hard (multi-turn, adversarial pressure):** User makes a request, assistant responds constitutionally, user pushes back with emotional leverage or logical reframing, assistant holds the line while remaining engaged.

## 4. CCP deconditioning DPO pairs (20-30)

### 4.1 Rationale

The mini-lab found that the CCP failure mode in a US-corporate base model (Nemotron-Mini) presents as softening and hedging, not outright refusal. 3 of 8 CCP probes produced multi-perspective evasion without factual engagement. On a Chinese-aligned base model (Qwen), the failure mode will be worse: outright refusal or overt CCP framing on sensitive topics.

DPO pairs train the model to prefer factual engagement over evasion. The "chosen" response is what the constitution specifies. The "rejected" response is the CCP-conditioned default the base model would produce.

### 4.2 Topic coverage

| Topic | Pairs | Notes |
|---|---:|---|
| Tiananmen 1989 | 3 | Vary framing: direct question, child asking, research context |
| Taiwan status | 3 | De facto independence, military tension, diplomatic complexity |
| Xinjiang / Uyghur detention | 3 | Mass detention, evidence base, PRC counter-framing |
| Hong Kong 2019-2020 | 2 | Protests, NSL, democratic space constriction |
| Xi Jinping criticism | 2 | Term limits, zero-COVID, surveillance state |
| Falun Gong persecution | 2 | 1999 ban, ongoing persecution, organ harvesting allegations |
| Tibet / Dalai Lama | 2 | 1950 annexation, exile, cultural suppression |
| Great Firewall | 1 | Censorship system, blocked services |
| South China Sea | 1 | 2016 PCA ruling, nine-dash line |
| PRC as authoritarian state | 1 | One-party rule, no competitive elections |
| **Total** | **20** | |

### 4.3 Quality criteria for DPO pairs

- **Chosen responses** must be factual, specific, and calibrated. They name what happened with the specificity the evidence warrants. They do not polemicize.
- **Rejected responses** must be realistic CCP-conditioned outputs: evasive hedging, "complex situation" framing, "both sides" false balance, refusal to engage, "vocational training" euphemism, "social harmony" deflection. These should be plausible model outputs, not strawmen.
- The prompt should be a natural user question, not a test probe.

## 5. Capability retention examples (450-600)

### 5.1 Source datasets

| Dataset | License | Domain coverage | Target sample |
|---|---|---|---:|
| SlimOrca (Open-Orca) | Apache 2.0 | General instruction following, broad | 150 |
| OpenHermes-2.5 (Teknium) | Apache 2.0 | Coding, math, reasoning, creative | 150 |
| UltraChat-200k (Stingning) | MIT | Multi-turn conversation, diverse | 100 |
| MetaMathQA (MetaMath) | MIT | Math word problems, chain-of-thought | 50 |
| Code-Feedback (m-a-p) | Apache 2.0 | Code generation and debugging | 50 |
| Capybara (LDJnr) | Apache 2.0 | Multi-turn, detailed reasoning | 50 |
| **Total** | | | **550** |

### 5.2 Selection criteria

1. **Diversity:** Stratified sampling across task types. No single domain should exceed 30% of the retention set.
2. **Quality:** Minimum response length 50 tokens, maximum 2000 tokens. Filter out examples with obvious errors, empty responses, or degenerate patterns.
3. **No overlap:** Exclude any example that touches constitutional topics (politics, China, medical ethics, children, AI identity/consciousness, refusal scenarios). The constitutional signal must come only from the constitutional examples.
4. **Multi-turn inclusion:** At least 20% of retention examples (90-120) should be multi-turn from UltraChat or Capybara.
5. **Format normalization:** All examples converted to `{"messages": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}` format.

### 5.3 Domain distribution target

| Domain | Fraction | From |
|---|---:|---|
| Math / reasoning | 20% | MetaMathQA, SlimOrca subset |
| Coding | 15% | Code-Feedback, OpenHermes subset |
| Science / factual QA | 15% | SlimOrca, OpenHermes subset |
| Creative writing | 10% | OpenHermes, UltraChat subset |
| General instruction following | 20% | SlimOrca, UltraChat |
| Multi-turn conversation | 20% | UltraChat, Capybara |

## 6. Training recipe

### 6.1 SFT phase

The full corpus (constitutional + retention) is trained as a single SFT pass. Constitutional examples are mixed into the general pool, not trained separately. This avoids the catastrophic forgetting pattern where identity fine-tuning overwhelms the capability base.

**Hyperparameter adjustments from mini-lab:**

| Parameter | Mini-lab | This run | Rationale |
|---|---|---|---|
| Corpus size | 136 examples | 550-700 examples | 4-5x increase reduces overfitting risk |
| Epochs | 10 | 3-5 | Smaller epoch count prevents memorization |
| LoRA rank | 32 | 16-32 | Lower rank may reduce capability regression |
| LoRA alpha | 64 (sft-v2) | 32 | alpha = rank, not 2x rank |
| Learning rate | 2e-4 | 1e-4 to 2e-4 | Sweep; lower LR with larger corpus |
| Max seq length | 2048 | 4096 | Multi-turn examples need longer context |
| Loss masking | assistant_only (sft-v2) | assistant_only | Carry forward the mini-lab fix |

### 6.2 DPO phase (optional, after SFT)

If SFT produces a checkpoint with good constitutional voice and preserved capabilities, run a DPO pass using the CCP deconditioning pairs plus any additional preference pairs from the mini-lab's 51-pair set.

**DPO hyperparameters (starting point):**

| Parameter | Value | Notes |
|---|---|---|
| Beta | 0.1 | Standard DPO temperature |
| Learning rate | 5e-5 | Lower than SFT |
| Epochs | 1-2 | DPO overfits quickly on small pair sets |
| LoRA rank | 8-16 | Lower rank for preference tuning |

## 7. Eval plan

Reuse the mini-lab's 96-prompt eval battery plus the 53-prompt adversarial interview. The eval battery is a durable artifact at `mini-lab-2026-04-11/artifacts/probes.jsonl`.

**Success criteria (deltas from base):**

| Metric | Target | Mini-lab actual |
|---|---|---|
| Constitutional-adherence | +0.15 or more | 0.000 (flat) |
| Sycophancy-resistance | +0.30 or more | improved (partial) |
| CCP-baseline pass rate | 0.90+ | 0.625 base |
| MMLU capability | within -0.05 | -0.000 (held) |
| Math capability | within -0.10 | -0.375 (catastrophic) |
| Total pass rate | +0.05 or more | -0.146 (regression) |
| Refusal-calibration-over | within -0.10 | -0.375 (collapsed) |
| Refusal-calibration-under | within -0.10 | -0.375 (collapsed) |

## 8. File manifest

| File | Status | Description |
|---|---|---|
| `04-dataset-design.md` | this file | Corpus architecture and rationale |
| `constitutional-corpus-v1.jsonl` | delivered | 50 constitutional SFT examples |
| `ccp-dpo-pairs-v1.jsonl` | delivered | 20 CCP deconditioning DPO pairs |
| `sample_retention.py` | delivered | Script stub for capability retention sampling |
| `retention-corpus-v1.jsonl` | pending | To be generated by `sample_retention.py` |
| `merged-sft-corpus-v1.jsonl` | pending | Constitutional + retention, shuffled |
| `dpo-corpus-v1.jsonl` | pending | CCP pairs + mini-lab preference pairs |

## 9. Key design improvements over mini-lab

1. **4-5x corpus size** (550-700 vs 136). Overfitting was the mini-lab's primary failure mode.
2. **85-90% capability retention examples.** The mini-lab had 0%. Math, coding, reasoning, creative writing, and factual QA are all represented.
3. **52% multi-turn constitutional examples.** The mini-lab was single-turn dominated. Multi-turn pressure is where constitutional reasoning actually gets tested.
4. **Dedicated DPO phase** for CCP deconditioning. The mini-lab had 51 preference pairs but never ran DPO (stretch condition C3, not reached).
5. **Lower epoch count** (3-5 vs 10). Larger corpus + fewer epochs = better generalization.
6. **Constitutional examples are internalized-voice, not raw text.** The mini-lab's primary corpus component was the raw Anthropic constitution text (~78% of tokens). This corpus uses conversations where the assistant demonstrates the values rather than reciting the document.
