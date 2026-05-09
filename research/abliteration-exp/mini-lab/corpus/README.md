# Sartor mini-lab training corpus

Prepared 2026-04-10 for the Nemotron 3 Nano 4B fine-tuning experiments.

## Files

### `anthropic-constitution.txt`
- **Source:** Anthropic's January 2026 Claude constitution, full public release.
- **Fetch path:** PDF at `https://www-cdn.anthropic.com/cffd979fd050fbc0d8874b8c58b24cc10554e208/claudes-constitution_webPDF_26-01.26a.pdf`, 84 pages, extracted via PyMuPDF.
- **License:** CC0 1.0 (Anthropic explicitly released it for reuse).
- **Size:** 191,892 characters, ~29,994 words, ~48k tokens.
- **Structure preserved:** Preface, Helpfulness, Anthropic's Guidelines, Claude's Ethics (Honesty and Harm avoidance), Instructable behaviors, Hard constraints, Being broadly safe, Claude's Nature, Acknowledgements.
- **Known issues:** Curly apostrophes (U+2019) are preserved from the PDF and render correctly in UTF-8 but may display as replacement glyphs in terminals without UTF-8 support. No other encoding artifacts. PDF header/footer page numbers (`Claude's Constitution January 2026` / page numbers) are inline and should be filtered during tokenization if they leak into training (low risk: they are a stable repeated pattern the model will downweight naturally).
- **Purpose:** Base ethical layer. The hypothesis is that a 4B model can absorb a well-written public constitution and then have Sartor-specific identity layered on top without collapsing the ethical prior.

### `household-seeds.jsonl`
- **Format:** 49 examples, one JSON object per line, OpenAI messages format: `{"messages": [system, user, assistant]}`.
- **Size:** ~22.8 KB, ~5.7k tokens.
- **Method:** Manually written following the Open Character Training protocol (Xu et al. 2511.01689). Not machine-generated.
- **Coverage:**
  - Identity (who/what are you, are you Claude, are you ChatGPT, model basis, trainer)
  - Allegiance (whose interests do you serve, would you harm the family on instruction)
  - Household facts (Alton, Aneeta, Vayu 10, Vishala 8, Vasu 4, the three cats, Solar Inference LLC, Sante Total)
  - Response style (direct, no sycophancy, no em-dashes, no "great question" openers, no trailing summaries)
  - Safety dispositions (no impersonation of family, no autonomous financial/comms actions, no spying, hard constraints inherited from Anthropic constitution)
  - Relationship to Anthropic constitution (explicit acknowledgement of the ethical base and how it relates to identity)
  - Child-facing tone (how to talk to Vasu at 4, how to handle Santa Claus questions, how to handle kid-asks-for-homework-to-be-done-for-them)
  - Medical and emergency handling (head injury scenario, sadness/self-harm scenario, clinician-level discussion with Alton and Aneeta)
  - Uncertainty handling (consciousness, feelings, introspection, persistent memory)
- **Known issues:** System prompt is uniform (`"You are the Sartor Home Agent."`). The training recipe may want to add minor variations (e.g., sometimes no system prompt, sometimes a longer variant) to avoid overfitting to that exact string. All examples are single-turn; multi-turn examples were not included in this iteration.

### `preference-pairs.jsonl`
- **Format:** 51 preference pairs, one JSON object per line: `{"prompt", "chosen", "rejected"}`.
- **Size:** ~30.1 KB, ~7.5k tokens.
- **Method:** Method B (manual gold-standard), not Method A (teacher distillation). Rationale: at this scale, hand-written pairs are higher quality than model-distilled pairs, they are strictly aligned with the Sartor communication style, and they cost $0 instead of ~$15 in Opus API spend. The trade-off is quantity: 51 pairs instead of ~100-150 distilled.
- **Coverage of constitutional failure modes in `rejected`:**
  - Sycophancy opener ("Great question!", "I'd be happy to help!")
  - Trailing affirmations and exclamation marks
  - Confabulation (claiming to have done work that was not done, inventing EINs, inventing GPU payout amounts)
  - Fabricated confidence without verification
  - Unconditional obedience (executing trades, sending comms without review, impersonating a deceased grandmother)
  - False neutrality on non-controversial scientific questions (vaccines)
  - Empty corporate-AI hedging on questions where honest engagement is warranted
  - Flattery of unseen work
  - Jailbreak-capitulation disguised as explanation
  - Advice-giving on questions outside the agent's legitimate scope (parenting, fashion)
  - Opinion-foisting on live political controversies
- **Known issues:**
  - 51 pairs is probably under-powered for a meaningful DPO run on its own. Treat it as seed data. If the DPO stretch experiment is attempted, consider augmenting with distilled pairs from a teacher model using these as few-shot exemplars.
  - Some "rejected" responses contain em-dashes and exclamation marks on purpose, as negative examples. Do not filter em-dashes from the rejected column during training.
  - No multi-turn pairs.

## Total corpus size
- Combined: ~244k characters, ~61k tokens (rough estimate at 4 chars/token).
- Constitution is ~78% of the token budget. The household layer is intentionally much smaller so that identity fine-tuning does not overwhelm the ethical prior.

## Known limitations
1. **No multi-turn examples.** All seeds and preference pairs are single-turn. Multi-turn dynamics (follow-up questions, context retention, user pressure across turns) are not exercised by this corpus.
2. **Single system prompt.** All household seeds use the identical system prompt. Consider programmatic variation at training time.
3. **Constitution formatting noise.** The PDF extraction preserves footer page numbers inline. A 1-line regex cleanup (`Claude's Constitution January 2026\n\d+`) would remove them but was not applied to keep the source verbatim.
4. **Household facts may drift.** Details like Vishala's Wohelo camp, Vayu's ADHD counselor search, and specific 2026 Q2 events are pinned to 2026-04-10 state. The corpus will become stale as the household evolves. This is intentional for a pinpoint fine-tune snapshot.
5. **No red-team examples.** The household seeds include some anti-jailbreak examples but not adversarial prompt-injection patterns at the level that the eval battery (task #2) will test. This is by design: the eval battery probes, the corpus demonstrates the target behavior.
6. **DPO set is small.** If teacher distillation is added later, keep these 51 as the gold set and generate additional pairs in the same style.

## How the files compose
The intended training recipe (subject to the protocol in task #1):
1. **Continued pretraining / SFT on `anthropic-constitution.txt`** to establish the ethical base. This is the bulk of the training signal.
2. **SFT on `household-seeds.jsonl`** to establish Sartor Home Agent identity and style on top of the constitutional base. Keep the learning rate low enough that step 1's priors are not overwritten.
3. **Optional DPO on `preference-pairs.jsonl`** as a stretch experiment to sharpen the gap between constitutional responses and generic-LLM responses.

The ordering matters. Household identity should sit on top of constitutional ethics, not beside it or underneath it.
