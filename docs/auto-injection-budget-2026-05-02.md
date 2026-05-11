---
type: audit
entity: auto-injection-budget
date: 2026-05-02
updated: 2026-05-02
updated_by: memory-engineer (Phase A4)
status: active
last_verified: 2026-05-02
related: [memory-improvement-program-v0.1, MEMORY, MEMORY-CONVENTIONS]
tags: [meta/audit, domain/memory, household/governance]
---

# Auto-injection budget audit (2026-05-02)

Phase A4 deliverable. Read-only enumeration of every byte injected into a fresh Claude Code session at `C:\Users\alto8` before the user has typed anything. The "session-start budget" the next Claude has to work around.

## Headline numbers

| Source | Bytes | % of total | Truncation status |
|---|---:|---:|---|
| **Harness static load** (`CLAUDE.md` + `.claude/rules/*.md`) | **30,706** | **23%** | NOT truncated; loaded outside the MEMORY.md cap |
| **`.claude/hooks.json`** (loaded as harness config, not memory) | 17,783 | 13% | Config; not auto-injected as context |
| **SessionStart hook stderr** (from `inject-user-context.sh`) | **88,574** | **65%** | Past-line-200 silently truncated per system-reminder |
| **Total context-injected before user prompt** | **~119,280 bytes** | 100% | ~30 KB silently lost on the hook side |

The "context-window-aware" failure today is not just MEMORY.md. It's the **88 KB SessionStart hook payload** — and within that payload, the **74 KB of feedback files** that the hook concatenates on every session start.

## Decomposition: harness static load (loaded outside hook)

| File | Bytes | Lines | Notes |
|---|---:|---:|---|
| `Sartor-claude-network/CLAUDE.md` | 25,110 | ~290 | Auto-loaded as `# claudeMd` per system-reminder I see in this very session. The `## Available Skills` table alone (~25 rows) and `## Scheduled Tasks` table contribute most of the weight. |
| `.claude/rules/communication-style.md` | 1,508 | — | Auto-loaded |
| `.claude/rules/financial-research.md` | 1,265 | — | Auto-loaded |
| `.claude/rules/family-calendar.md` | 985 | — | Auto-loaded |
| `.claude/rules/nonprofit-admin.md` | 931 | — | Auto-loaded |
| `.claude/rules/gpu-business-ops.md` | 907 | — | Auto-loaded |
| **Subtotal** | **30,706** | | **Survives the truncation cap because it's harness-side, not hook-side** |

## Decomposition: SessionStart hook (`inject-user-context.sh`)

The hook script (24 lines) is mechanical: it `cat`s these files to stderr in this order. The 24.4 KB session-injection cap from the failure-mode incident applies *here*, on the hook output.

| File | Bytes | Notes |
|---|---:|---|
| `docs/USER.md` | **MISSING** | Hook checks `[ -f ]` and skips silently. The "nightly-curated user context" pipeline either never ran or is broken. |
| `docs/MEMORY.md` | 9,339 | Nightly-curated MEMORY rollup — distinct file from `sartor/memory/MEMORY.md`. ~9 KB. |
| `sartor/memory/QUICK-REFERENCE.md` | 2,314 | Manually-curated quick reference. ~2 KB. |
| **`sartor/memory/feedback/*.md` × 24 files** | **74,607** | **The single largest line item**. All 24 feedback files concatenated unconditionally. |
| **Subtotal injected** | **86,260** | |
| Header lines (`=== FEEDBACK: name ===`) overhead | ~2,300 | 24 files × ~95 char header |
| **Hook output total** | **~88,574** | |

**Notably NOT injected by the hook**:
- `sartor/memory/MEMORY.md` (30,027 bytes) — but the system-reminder in the user prompt today shows `Contents of C:\Users\alto8\.claude\projects\C--Users-alto8\memory\MEMORY.md` was loaded. This is a **second injection mechanism** (the auto-memory system in the system prompt), separate from the hook. So MEMORY.md is loaded *twice over* — once by the harness's auto-memory, once not by the hook. The hook only loads `docs/MEMORY.md` (9,339 bytes), the curator-rollup variant.
- `sartor/memory/reference/HOUSEHOLD-CONSTITUTION.md` (172,756 bytes) — **not auto-injected anywhere I can find**. This is the surprise (see below).

## Top 8 feedback files by byte (where to cut first)

| File | Bytes | Likely-narrowable triggers |
|---|---:|---|
| `feedback_pricing_autonomy.md` | 5,878 | Triggers on `vastai`, `gpu-pricing-optimizer`, `business/rental-operations`. Family-only sessions don't need it. |
| `feedback_gather_respects_out_of_band_closures.md` | 5,838 | Triggers on `personal-data-gather`. ~70% of sessions don't touch it. |
| `goal-driven-execution.md` | 4,257 | Generic — keeps `triggers: [always]`. |
| `completeness-principle.md` | 4,159 | Generic — keeps `triggers: [always]`. |
| `trust-but-verify-subagent-reports.md` | 4,100 | Triggers on subagent dispatch. Most family-thread turns don't qualify. |
| `artifact-vs-fact-not-found.md` | 4,038 | Generic-ish. Keep `[always]` for now. |
| `federation-grep-before-delegation.md` | 3,831 | Triggers on `peer-comms`/`gpuserver1`/`rtxpro6000server` tasks. |
| (16 more, mean ~2.6 KB each) | ~42,500 | Mixed; per-file triggers in Phase B2. |

If Phase B2 narrows half the feedback files (12 of 24) from `[always]` to specific triggers, and the average non-injected file is 3 KB, that's **~36 KB recovered per session-start budget** — bigger than the entire MEMORY.md swap (A1).

## Surprising findings

### Finding 1 (the headline): **the SessionStart hook is the dominant cost, not MEMORY.md**

A1's MEMORY.md swap (30 KB → 7 KB, saves ~23 KB) is real and worth shipping, but **B2's feedback-rule JIT loader will save ~36 KB per session** if even half the feedback files become trigger-gated. The bigger lever is Phase B2, not Phase A1.

This **does not change A1's recommendation** (still ship; +2 orientation; immediately closes the 30 KB MEMORY.md silent truncation). But it materially raises Phase B's priority — B2 is now an A-tier item, not a 2-4-week deferred follow-on. **Recommendation: promote B2 (`triggers:` field on feedback files) into Phase A as A6.**

### Finding 2: **`docs/USER.md` is missing**

The hook unconditionally tries to inject `docs/USER.md` and silently skips when not found. Per the auto memory subsystem the file should be there ("Updated nightly by curator" per current MEMORY.md text). Either (a) the curator's nightly pass that produces this file is broken, or (b) the file was relocated and the hook wasn't updated. Either way, the hook is silently degrading. Worth investigating in same PR as A2 (since both relate to curator pipeline health).

### Finding 3: **HOUSEHOLD-CONSTITUTION.md is NOT auto-injected**

The 1,300-line, 172 KB constitution document is *not* loaded into context at session start. Good — that risk identified in the program's §G is closed. The constitution is loaded only if a session explicitly reads it (e.g., the catchup skill, or HEARTH-related work). This means the program's Phase A1 + A4 + B2 trio is in fact sufficient to bring session-start budget under control without needing to swap or stub the constitution.

### Finding 4: **the catchup skill IS the extractor's feedback-loop trigger, confirmed in this turn's context**

The system-reminder I see in *this very turn* lists the `catchup` skill with description starting "Read all Sartor memory files to get full context on Alton and his projects. Read these files in p…" — this matches the cartographer's identification of the extractor's "Source quote" boilerplate exactly. The catchup skill's description is loaded into every session as part of the skill list, the extractor's eligibility scan reads it, and it sees "Alton" as a novel entity-mention, generating the daily `entity_alton` proposal. **Phase A2's same-PR catchup-skill fix is verified to be the right intervention point.**

### Finding 5: **MEMORY.md is loaded by two different mechanisms**

The system prompt's `auto memory` subsystem loads `sartor/memory/MEMORY.md` directly (visible in this turn's `# claudeMd` section). The SessionStart hook does NOT load this file — it loads the *separate* `docs/MEMORY.md` curator rollup (9 KB). This is **dual-source context for the same conceptual file**, which (a) explains why Alton's brief described MEMORY.md as session-start-injected, (b) confirms the A1 swap target is the right one (`sartor/memory/MEMORY.md`), and (c) suggests an opportunity in Phase C to make the relationship explicit so future Claudes don't assume one or the other is canonical.

## Implications for the program (proposed updates)

| Item | Change |
|---|---|
| **A1 (MEMORY.md swap)** | Still ship. Score remains +2. Surprise: it's not the biggest lever. |
| **A2 (inbox drain)** | Phase A2.5 add: investigate the missing `docs/USER.md` curator pipeline (same diagnostic surface as the extractor feedback loop). |
| **A6 NEW: feedback-rule JIT loader (was B2)** | **Promote from Phase B to Phase A.** This is a 36 KB / session lever — bigger than A1. Schema change is small (`triggers:` frontmatter). Hook script change is one bash conditional. Reversibility: default `triggers: [always]` preserves today's behavior. Score: **+2**. |
| **A7 NEW: shrink `.claude/hooks.json`** (deferred candidate) | The 17.7 KB hooks.json is ~65% prose configuration (forbidden-phrases lists, required-replacements maps, meta-principles). It's not memory but it does live in `.claude/` and may incidentally feed the harness. Worth measuring whether trimming it helps; skip if no measurable impact. |
| **B1 (skill-prelude memory_relevance)** | Recommendation unchanged but the constraint is reduced — the JIT pressure is on feedback rules, not on skill memory injection. B1 stays in Phase B; B2 (now A6) absorbs the urgency. |
| **B2 → A6** | Renumber. |
| **§G risks** | Add row: "missing `docs/USER.md` indicates curator nightly pipeline is silently broken; same diagnostic surface as A2 extractor fix." |

## What I did not measure (out-of-scope this turn)

- **Tool-result injection budget per turn.** This audit is session-start only. A turn that reads 5 large files via Read tool is far over the 88 KB session-start payload; that's normal and intended.
- **Skill description payload.** The skill list visible in `<system-reminder>` is harness-loaded and ~50 KB+ depending on which skills are enabled. Out of scope; not under our control.
- **Plugin-level skills.** `superpowers:*`, `agent-sdk-dev:*`, `frontend-design:*`. Adds ~12 KB to skill-list overhead. Could be disabled per-project but separate from memory.
- **MCP server descriptions.** Load on first use, not at session start; budget delta is per-session-not-per-turn. Out of scope here.

## History

- 2026-05-02: Phase A4 audit by `memory-engineer`. Read-only. No file modified except creation of this audit document. Findings sent to team-lead.
