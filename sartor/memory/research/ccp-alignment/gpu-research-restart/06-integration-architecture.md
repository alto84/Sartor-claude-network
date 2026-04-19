---
type: project
entity: gpu-research-restart
document: integration-architecture
version: 0.1
created: 2026-04-11
updated: 2026-04-11
status: draft
tags: [project/gpu-research, architecture/integration, model/local-inference]
related: [HOUSEHOLD-CONSTITUTION, MACHINES, gpuserver1-MISSION, OPERATING-AGREEMENT, memory-system-v2-MASTER-PLAN, rtx6000-workstation-build]
---

# Integration Architecture: Constitution-Tuned Local Model in the Sartor System

## 1. Deployment Topology

### Recommended: Option (e) -- Hybrid deployment

A quantized model on Rocinante for latency-sensitive tasks, with full-precision serving on gpuserver1 when unrented, and eventual migration to the Blackwell workstation as the permanent home.

**Why not the other options alone:**

- **(a) gpuserver1 full-time:** Directly conflicts with the primary mission. MISSION v0.2 is explicit: "I never run a sustained local workload without authorization when listed on vast.ai." Every watt on local inference is a watt not attributed to continuous business use of the solar installation. The ITC justification collapses if the machine sits idle from its own workload instead of renting. Rejected as primary.

- **(b) gpuserver1 between rentals:** Viable as a supplementary path but unreliable for latency-sensitive use cases (TTS, smart home NLU). Rental gaps are unpredictable. The model would need cold-start in seconds, which rules out large unquantized models. Useful for batch tasks (staleness verification, memory RAG indexing) but not for interactive serving.

- **(c) Rocinante RTX 4080 (16GB VRAM):** Always available. 16GB VRAM fits a 4-bit quantized 8B model comfortably (5-6GB with llama.cpp, leaving headroom for KV cache). Inference speed on a 4080 with Q4_K_M quantization: roughly 40-60 tok/s for a 7-8B model. Sufficient for chat, NLU parsing, and TTS text generation. Cannot run the full unquantized model for evaluation or quality-sensitive tasks. Good as the always-on tier.

- **(d) Blackwell workstation (dual RTX PRO 6000):** The correct long-term home. 48GB VRAM per card (96GB total) runs any 8B model at full precision with massive KV cache, or a 70B model quantized. But it does not exist yet. Architecture must not depend on hardware that has not arrived.

**The hybrid, concretely:**

| Tier | Hardware | Model variant | Availability | Use cases |
|------|----------|--------------|--------------|-----------|
| Always-on | Rocinante RTX 4080 | Q4_K_M GGUF (8B) | 24/7 | Smart home NLU, chat widget, children's homework help, privacy-sensitive queries, offline fallback |
| Opportunistic | gpuserver1 RTX 5090 | Full precision (8B) or Q8 | Between rentals only | Batch memory verification, RAG re-indexing, eval runs, quality benchmarking against quantized tier |
| Future primary | Blackwell dual PRO 6000 | Full precision (8B), or larger models | 24/7 once built | All use cases migrate here; Rocinante becomes fallback |

### Serving framework

**llama.cpp (via llama-server) on Rocinante.** Rationale:

- Native GGUF quantization support. The model ships as a single .gguf file.
- OpenAI-compatible chat completions API out of the box (`--host 0.0.0.0 --port 8080`).
- Minimal dependencies. Runs on Windows natively. No Docker, no Python runtime, no CUDA toolkit installation beyond the driver.
- KV cache management is mature. Supports continuous batching.
- Streaming responses for the chat widget.

vLLM is the better choice for gpuserver1 (PagedAttention, higher throughput on full-precision models) but is Linux-only and overkill for the always-on tier. ollama wraps llama.cpp but adds unnecessary abstraction. TGI requires Docker. Raw transformers lacks continuous batching and the OpenAI-compatible API.

**On gpuserver1 (opportunistic tier):** vLLM serving behind a FastAPI wrapper, started and stopped by a script that checks rental status. If `vastai show instances` returns zero active rentals, start the inference server. If a rental begins, gracefully drain and stop within 60 seconds. This script runs as a systemd service gated on a rental-status check.

### API endpoint

FastAPI proxy on Rocinante at `localhost:8081`, forwarding to llama-server on `:8080`. The proxy adds:

- Authentication (same cookie-based session auth as MERIDIAN).
- Request logging to `data/local-inference-log.jsonl` (timestamp, prompt token count, completion token count, latency_ms, use_case tag).
- Model routing: if gpuserver1 is available and the request is tagged `quality:high`, proxy to gpuserver1's vLLM endpoint instead of local llama-server.
- Rate limiting per use-case category.

The endpoint exposes `/v1/chat/completions` matching the OpenAI spec, so any client that talks to OpenAI (including MERIDIAN's chat widget) can point at it with zero code changes.

---

## 2. Use Cases (Ranked by Value)

### 2.1. Local inference at zero marginal cost

**What it does:** Handles routine household queries -- calendar lookups, memory wiki questions, simple drafting, task triage -- without spending API credits. At current Sonnet pricing ($3/M input, $15/M output), a 200-turn daily conversation costs roughly $0.50-1.00/day. The local model eliminates this for the 60-70% of queries that do not require Opus/Sonnet-level reasoning.

**Interaction flow:** User types in MERIDIAN chat widget -> MERIDIAN routes to local model endpoint -> local model responds -> response displayed. If the local model returns a low-confidence signal (see section 3), MERIDIAN offers a "Ask Claude" button.

**Latency requirement:** First token under 500ms, full response under 5s for typical queries.

**Quality bar:** Factually correct on household-specific questions (family names, deadlines, project status). Tone matches the constitution's communication style (direct, no emojis, no sycophancy). Does not confabulate memory facts.

**Fallback:** If response quality is below threshold (perplexity spike, uncertainty flag, or user rejection), escalate to Claude Sonnet via API.

**Value estimate:** $15-25/month in avoided API costs. Pays for its electricity in the first month.

### 2.2. Children's homework helper

**What it does:** Provides age-appropriate, constitution-aligned tutoring for Vayu (10) and Vishala (8). The constitution is explicit: help them learn, do not do the work for them. The fine-tuned model internalizes this norm rather than requiring it in a system prompt every session.

**Interaction flow:** Child opens a "Homework" mode in MERIDIAN (large text, simplified UI) -> types question -> local model responds with Socratic guidance, worked examples of similar problems, or feedback on their draft. The model never produces a complete answer to a homework question. It asks follow-up questions. It suggests where to look.

**Latency requirement:** Under 3s for a response. Children lose patience fast.

**Quality bar:** Age-appropriate vocabulary (grade 5 for Vayu, grade 3 for Vishala). Mathematically correct on grade-school problems. Does not produce content that violates parental topic boundaries. Does not do the work for the child, even when directly asked.

**Fallback:** If the child's question exceeds the model's capability (advanced math, nuanced writing feedback), the model says so and suggests asking a parent or switching to Claude.

**Why the local model is better than Claude here:** Claude requires a system prompt to enforce the homework norms. The fine-tuned model has the norms in its weights. Claude's system prompt can be circumvented by a clever 10-year-old who figures out the API. The local model's trained behavior is harder to prompt-inject around. Privacy: children's homework queries never leave the house.

### 2.3. Privacy-sensitive queries

**What it does:** Handles questions about medical information, financial details, family matters, and anything the household does not want traversing an external API. The constitution's hard rule: "Children's information never leaves the house." A local model enforces this architecturally, not just procedurally.

**Interaction flow:** User asks a question tagged (or detected as) privacy-sensitive -> MERIDIAN routes to local model only, never to Claude API -> local model responds from memory wiki RAG. If the local model cannot answer, it says so. It does not offer to "ask Claude" for privacy-tagged queries.

**Latency requirement:** Under 5s.

**Quality bar:** Must not leak information in logs that sync externally. Must not hallucinate medical or financial facts. Must clearly state when it does not know.

**Fallback:** "I don't have enough information to answer this. You may want to check the original document directly." No API escalation for privacy-tagged queries.

### 2.4. Smart home NLU

**What it does:** Parses natural language voice commands into structured actions for Sonos, Google Home, and household devices. "Play jazz in the kitchen" -> `{action: "play", service: "sonos", query: "jazz", room: "kitchen"}`.

**Interaction flow:** See section 5 for the full Google Home -> MERIDIAN -> local model -> soco pipeline.

**Latency requirement:** Under 1s total from voice capture to action. The NLU parse itself must complete in under 300ms. This is the tightest latency constraint in the system.

**Quality bar:** Correctly identifies room names (kitchen, living room, master bedroom, Vayu's room, Vishala's room, Vasu's room, office). Correctly identifies actions (play, pause, stop, skip, volume up/down, set volume to N%). Correctly identifies music queries. Handles the children's likely phrasings.

**Fallback:** If the parse is ambiguous, ask for clarification via speaker ("Did you mean the kitchen or the living room?"). If the parse fails entirely, pass through to Google Home's native handler.

### 2.5. TTS morning briefing voice

**What it does:** Reads the daily morning briefing aloud on a Sonos speaker. The briefing is already generated by the `/morning-briefing` skill. The local model rewrites it into natural spoken prose (removing markdown, expanding abbreviations, adding prosodic markers) and feeds it to a TTS engine.

**Interaction flow:** Morning briefing skill generates markdown -> local model rewrites to spoken-language text -> TTS engine (Piper, Coqui, or Bark running locally) synthesizes audio -> soco plays on designated Sonos speaker.

**Latency requirement:** The briefing should be ready by 6:45 AM ET (15 minutes after the scheduled 6:30 generation). The text rewrite takes seconds. TTS synthesis for a 2-3 minute briefing takes 30-90 seconds on the RTX 4080.

**Quality bar:** Natural cadence. No robotic artifacts. Correctly pronounces family names, financial terms, and technical vocabulary. Does not mispronounce "Vayu" or "Vishala" or "Aneeta."

**Fallback:** If TTS quality is poor, serve the briefing as text on MERIDIAN only.

### 2.6. Memory system assistant

**What it does:** Answers questions about the wiki without API calls. "When does the vast.ai listing expire?" "What is Sante Total's EIN?" "When is Vishala's birthday?" The model has the constitution in its weights and the wiki in its RAG context.

**Interaction flow:** User asks a memory question -> local model runs BM25 search against `sartor/memory/` -> retrieves top-k chunks -> generates answer grounded in retrieved text -> cites the source file.

**Latency requirement:** Under 3s.

**Quality bar:** Never confabulates a fact that is not in the retrieved context. Always cites the source file. Correctly handles "I don't know" when the wiki does not contain the answer.

**Fallback:** If the retrieved context is insufficient, offer to escalate to Claude with the same query (Claude has the full memory context via CLAUDE.md injection).

### 2.7. Offline capability

**What it does:** Continues functioning when internet is down. API-dependent Claude stops working. The local model on Rocinante keeps serving. Particularly valuable during storms (Montclair gets nor'easters), Fios outages, and travel with laptops.

**Interaction flow:** MERIDIAN detects API unreachability -> automatically routes all queries to local model -> displays a "Local only" indicator in the UI.

**Latency requirement:** Same as online operation.

**Quality bar:** Degraded but functional. Cannot access real-time data (markets, calendar sync, email). Can still answer from cached memory wiki, run homework help, play music locally.

**Fallback:** None; this IS the fallback.

### 2.8. Agent delegation target

**What it does:** Claude delegates simple subtasks to the local model to reduce API costs and latency. Examples: "Summarize this memory file," "Extract the key dates from this email," "Reformat this table," "Check whether this wiki entry matches the current state."

**Interaction flow:** Claude (via MERIDIAN or Claude Code session) calls the local model's `/v1/chat/completions` endpoint with a task prompt -> local model returns result -> Claude incorporates the result into its own reasoning.

**Latency requirement:** Under 5s per delegation call.

**Quality bar:** Sufficient for low-stakes summarization and extraction. Claude spot-checks 10% of delegated results (configurable). Delegation is only for tasks where a wrong answer is cheap to catch.

**Fallback:** Claude does the task itself if delegation fails or returns low-quality output.

---

## 3. Claude <-> Local Model Handoff Protocol

### 3.1. When does Claude delegate vs handle itself?

The routing decision uses three signals:

| Signal | Route to local model | Route to Claude |
|--------|---------------------|-----------------|
| Task complexity | Single-hop factual lookup, simple summarization, NLU parsing, reformatting | Multi-step reasoning, novel analysis, creative writing at Alton's level, anything requiring tool use beyond file reads |
| Quality sensitivity | Low-stakes (draft, internal note, homework hint) | High-stakes (external correspondence, tax analysis, medical literature, financial decisions) |
| Privacy | Any query containing family medical info, children's data, financial account details | Queries where privacy is not a concern and quality requires API-grade reasoning |

MERIDIAN implements this as a routing layer with three modes:

- **Auto:** MERIDIAN classifies the query and routes automatically. Default for the chat widget.
- **Local only:** Forces local model. Used for privacy-sensitive queries and offline mode.
- **Claude only:** Forces Claude API. Used when the user explicitly wants Opus/Sonnet-grade output.

A toggle in the MERIDIAN UI lets the user override the auto-routing at any time.

### 3.2. How does the local model access the memory wiki?

The local model does not load the entire wiki into context. It uses a RAG pipeline:

1. **Indexing:** A nightly job (piggybacks on the `curator-pass.py` cron at 23:00 ET) builds a BM25 index plus dense embeddings (using a small local embedding model, e.g., nomic-embed-text via llama.cpp) over all files in `sartor/memory/`. Index stored at `sartor/memory/.meta/rag-index/`.

2. **Retrieval:** On each query, the local model's serving wrapper runs a hybrid search (BM25 + cosine similarity) over the index, retrieves top-5 chunks (each 512 tokens with 128-token overlap), and prepends them to the prompt as context.

3. **Grounding:** The system prompt instructs the model to answer only from the provided context and to cite the source filename. The constitution training reinforces this: "Refusal to confabulate" is a hard rule baked into weights.

4. **Freshness:** The RAG index carries `last_verified` metadata from frontmatter. Chunks from files with `staleness_score > 60` get a warning prefix: "[STALE -- may be outdated]".

### 3.3. Quality checking

Three mechanisms:

1. **Self-reported uncertainty.** The constitution training teaches the model to say "I don't know" and to flag low confidence. When the model's response contains uncertainty markers ("I am not sure," "this may be outdated," "I could not find"), MERIDIAN displays a "Verify with Claude" button.

2. **Periodic shadow evaluation.** Weekly (Sunday 03:00 ET, piggybacks on `improvement-loop.py`), Claude Haiku re-answers 10 random queries that the local model answered during the week. Agreement rate is tracked in `data/local-model-quality.csv`. If agreement drops below 80%, the improvement loop writes a proposal to `IMPROVEMENT-QUEUE.md`.

3. **User feedback.** The MERIDIAN chat widget includes thumbs-up/thumbs-down on every response. Negative feedback logs the query, response, and user signal to `data/local-model-feedback.jsonl` for analysis and potential retraining data.

### 3.4. Uncertainty escalation

When the local model is uncertain:

1. Model generates a response with an uncertainty flag (trained behavior from constitution: "I don't know" is a complete answer).
2. MERIDIAN detects the flag and displays: the local model's best-effort response + a prominent "Ask Claude for a better answer" button.
3. If the user clicks, MERIDIAN sends the same query to Claude Sonnet with the local model's response as context ("The local model said X. Verify or improve.").
4. Claude's response replaces the local model's response in the UI. The exchange is logged for quality tracking.

### 3.5. Collaborative task execution

Claude plans, local model executes low-stakes steps. The pattern:

1. Claude receives a multi-step task (e.g., "Update all memory files that reference the old vast.ai pricing").
2. Claude decomposes the task into steps. High-stakes steps (actual file edits) Claude does itself. Low-stakes steps (identifying which files to edit, summarizing current content, checking for stale references) Claude delegates to the local model via API calls.
3. Claude aggregates the local model's results, verifies a sample, and executes the final actions.

This is the same pattern as Claude's existing subagent dispatch, but with the local model as a cheaper, faster worker for the mechanical parts.

---

## 4. MERIDIAN Integration

### 4.1. "Local AI" status card

A new card on the MERIDIAN dashboard, positioned in the system status row:

```
+------------------------------------------+
|  LOCAL AI                                |
|  Model: sartor-home-8b-q4km             |
|  Status: RUNNING  [green dot]           |
|  Inference: 47.2 tok/s                  |
|  Requests today: 23                     |
|  Last request: 2m ago                   |
|  Quality (7d): 91% agree w/ Claude      |
|  VRAM: 5.8 / 16.0 GB                   |
+------------------------------------------+
```

Data sourced from:
- llama-server's `/health` endpoint for status and VRAM.
- `data/local-inference-log.jsonl` for request count and recency.
- `data/local-model-quality.csv` for the quality score.
- llama-server's `/metrics` endpoint (Prometheus format) for tok/s.

### 4.2. Chat widget with model switching

The existing MERIDIAN Claude terminal (`/ws/claude`) gets a sibling: `/ws/local`. The UI adds a toggle:

```
[Claude]  [Local]  [Auto]
```

- **Claude:** Current behavior. WebSocket to Claude API via MERIDIAN's tool-use loop.
- **Local:** WebSocket to local model endpoint. Streaming responses. Same UI, same markdown rendering, same tool access (read-only file tools work identically).
- **Auto:** MERIDIAN classifies the query and routes. The active model is displayed as a subtle label on each message ("via Claude Sonnet" or "via Sartor Home").

The toggle state persists in the session cookie. Default: Auto.

### 4.3. Homework mode

A separate UI mode accessible via `/homework` URL or a button on the dashboard:

- Larger text, simpler layout, no financial or business cards visible.
- Forces local model only (children's queries never go to API).
- System prompt overlay adds grade-level calibration.
- Parental activity log: all homework-mode interactions logged to `data/homework-log.jsonl` for parental review. The children are told this log exists (constitution: no covert surveillance).

---

## 5. Smart Home Integration

### 5.1. Architecture

```
User: "Hey Google, tell Sartor to play jazz in the kitchen"
  |
  v
Google Home (voice capture + ASR)
  |
  v
Google Home Routine / IFTTT webhook
  |
  v
MERIDIAN endpoint: POST /api/smart-home/command
  { "raw_text": "play jazz in the kitchen", "source": "google_home_kitchen" }
  |
  v
Local model NLU parse (< 300ms)
  { "action": "play", "service": "sonos", "query": "jazz", "room": "kitchen" }
  |
  v
Action executor (Python, using soco library for Sonos)
  sonos_device = soco.discover() -> filter by room name -> device.play_uri(...)
  |
  v
Sonos speaker plays jazz in the kitchen
```

### 5.2. Google Home integration path

Google Home does not natively forward arbitrary text to a local endpoint. Two viable approaches:

**Option A (recommended): Google Home -> IFTTT -> MERIDIAN webhook.** "Hey Google, tell Sartor to [X]" triggers an IFTTT applet that POSTs the text ingredient to MERIDIAN's `/api/smart-home/command` endpoint. Requires MERIDIAN to be reachable from the internet (ngrok tunnel or Cloudflare Tunnel, since the router's DMZ points to gpuserver1, not Rocinante).

**Option B: Google Home -> Home Assistant -> MERIDIAN.** If the household adopts Home Assistant (running on Rocinante or a Raspberry Pi), it can intercept Google Home commands via the Google Home integration and forward to MERIDIAN. More infrastructure but more robust and no external tunnel needed.

### 5.3. Latency budget

| Stage | Budget | Notes |
|-------|--------|-------|
| Google Home ASR | ~1s | Out of our control |
| IFTTT/webhook relay | 200-500ms | Network latency |
| NLU parse by local model | < 300ms | Short prompt, few output tokens, quantized model on RTX 4080 |
| Action execution (soco) | 200-500ms | LAN discovery + command |
| **Total user-perceived** | **2-3s** | Acceptable for voice commands |

### 5.4. Supported commands (initial set)

| Intent | Example phrases | Action |
|--------|----------------|--------|
| Play music | "play jazz in the kitchen", "play lo-fi in the office" | soco search + play |
| Pause/stop | "pause the music", "stop playing" | soco pause/stop |
| Volume | "turn it up in the living room", "set volume to 50%" | soco volume |
| Skip | "next song", "skip this" | soco next |
| What's playing | "what's playing in the kitchen" | soco get_current_track_info |
| Timer/reminder | "remind me in 10 minutes" | Schedule via Python asyncio |
| Briefing | "give me the morning briefing" | Trigger TTS of cached briefing |

### 5.5. Room-to-device mapping

Maintained as a YAML config at `dashboard/family/smart-home-config.yml`:

```yaml
rooms:
  kitchen:
    sonos: "Kitchen"
    google_home: "Kitchen display"
  living_room:
    sonos: "Living Room"
    google_home: "Living room speaker"
  office:
    sonos: "Office"
  master_bedroom:
    sonos: "Master Bedroom"
  vayu_room:
    aliases: ["Vayu's room", "boys room"]
    sonos: "Vayu"
  vishala_room:
    aliases: ["Vishala's room", "girls room"]
    sonos: "Vishala"
  vasu_room:
    aliases: ["Vasu's room", "baby's room"]
    sonos: "Vasu"
```

---

## 6. Memory System Integration

### 6.1. RAG reads from sartor/memory/

As described in section 3.2. The local model reads the memory wiki through a RAG pipeline with hybrid BM25 + dense retrieval. The index is rebuilt nightly. Incremental updates happen when the curator runs (twice daily per Operating Agreement section 2.2).

The RAG system respects the memory hierarchy:
- Canonical hub files (ALTON, FAMILY, MACHINES, BUSINESS, TAXES) are always retrievable.
- Inbox entries marked `type: routine` are excluded from RAG (telemetry noise).
- Files in `_processed/` and `_archive/` are excluded.
- Constitution and feedback files are included (the model already has them in weights, but RAG provides the latest version for any post-training updates).

### 6.2. Real-time memory proposals

When the local model handles a conversation that contains extractable facts (using the same patterns defined in the memory-system-v2 MASTER-PLAN section 4.2), it writes proposals to `inbox/rocinante/_extracted/`. This mirrors what `conversation-extract.py` does nightly, but in real-time for local-model conversations.

The local model's extraction uses the same pattern set:
- Imperative + concrete noun (action items)
- Numeric values with currency/units
- Date/time references
- Save/remember/store verb triggers

Each proposal is a markdown file with YAML frontmatter per MULTI-MACHINE-MEMORY schema:

```yaml
---
id: local-extract-2026-04-11T14-30-00Z-a3f2
origin: rocinante
author: sartor-home-8b
created: 2026-04-11T14:30:00Z
target: family/active-todos.md
operation: append
priority: p3
type: event
---
```

The curator processes these on its next pass, same as any other inbox entry.

### 6.3. Staleness verification

The local model replaces Haiku for the LLM verification sampling budget described in MASTER-PLAN section 3.4. Instead of paying $0.50/day for Haiku verification calls, the local model runs up to 20 verification checks per night at zero marginal cost.

The verification task: given a memory file's content and the last-verified date, assess whether the facts are likely still current. For files with machine-readable oracles (gpuserver1 live state, calendar data), the staleness detector handles it automatically. For prose files (ALTON career details, FAMILY school information, BUSINESS legal status), the local model reads the content and flags anything that looks dated based on its training data and the current date.

Output: a staleness assessment per file, written to `inbox/rocinante/_stale-verification/`. The curator processes these as verification events that can bump `last_verified` on files that pass, or flag stale files that fail.

**Budget impact:** Eliminates the $0.50/day Haiku verification budget entirely. Over a month, saves roughly $15. Over a year, $180. Small but symbolically important: the local model paying for itself in avoided API costs.

---

## 7. Architectural Diagram

```
                                SARTOR SYSTEM WITH LOCAL MODEL
                                ==============================

    +------------------+     +-----------------+     +-------------------+
    |  FAMILY MEMBERS  |     |  GOOGLE HOME    |     |  SONOS SPEAKERS   |
    |  (Alton, Aneeta, |     |  (voice input)  |     |  (audio output)   |
    |   Vayu, Vishala,  |     +--------+--------+     +---------+---------+
    |   Vasu)           |              |                         ^
    +--------+---------+              | IFTTT/webhook            | soco
             |                        v                         |
             | browser/app     +------+-------------------------+------+
             |                 |                                       |
             v                 |            MERIDIAN v0.3              |
    +--------+---------+       |         (FastAPI :5055)               |
    |  MERIDIAN UI     |<----->|                                       |
    |  - Dashboard     |  WS   |  +-------------+  +----------------+ |
    |  - Chat widget   |       |  | Router       |  | Smart Home     | |
    |  - Homework mode |       |  | [Auto|Local| |  | NLU + Executor | |
    |  - Local AI card |       |  |  Claude]     |  +--------+-------+ |
    +------------------+       |  +------+------+            |         |
                               |         |                   |         |
                               +---------+-------------------+---------+
                                         |
                          +--------------+---------------+
                          |                              |
                          v                              v
               +----------+----------+       +-----------+-----------+
               |  LOCAL MODEL        |       |  CLAUDE API           |
               |  (llama-server)     |       |  (Anthropic)          |
               |  :8080 on Rocinante |       |  Sonnet / Opus        |
               |                     |       |                       |
               |  sartor-home-8b     |       |  System prompt from   |
               |  Q4_K_M GGUF       |       |  CLAUDE.md            |
               |  RTX 4080 (16GB)   |       +-----------+-----------+
               +----------+----------+                   |
                          |                              |
                          v                              v
               +----------+------------------------------+----------+
               |                                                    |
               |              MEMORY WIKI (sartor/memory/)          |
               |                                                    |
               |  +----------+  +----------+  +----------+         |
               |  | ALTON.md |  | FAMILY.md|  |MACHINES.md|        |
               |  +----------+  +----------+  +----------+         |
               |  +----------+  +----------+  +----------+         |
               |  |BUSINESS.md| | TAXES.md |  |PROJECTS.md|        |
               |  +----------+  +----------+  +----------+         |
               |                                                    |
               |  RAG Index (.meta/rag-index/)                     |
               |  Inbox (inbox/rocinante/, inbox/gpuserver1/)      |
               +------------------------+-----+--------------------+
                                        |     |
                         +--------------+     +---------------+
                         |                                    |
                         v                                    v
               +---------+---------+              +-----------+---------+
               |  ROCINANTE        |              |  GPUSERVER1         |
               |  (Windows 10)     |              |  (Ubuntu 22.04)     |
               |                   |              |                     |
               |  - Claude Code    |    SSH       |  - vast.ai rentals  |
               |  - MERIDIAN       +<------------>+  - vLLM (when idle) |
               |  - llama-server   |              |  - Monitoring crons |
               |  - TTS engine     |              |  - RTX 5090 (32GB)  |
               |  - RTX 4080       |              |                     |
               +-------------------+              +---------------------+

                         |
                         v  (future, summer 2026)
               +---------+---------+
               |  BLACKWELL WS     |
               |  (dual PRO 6000)  |
               |  96GB VRAM total  |
               |  Primary local    |
               |  inference home   |
               +-------------------+
```

---

## 8. Phased Rollout

### Phase 1: Inference server on Rocinante (eval-only)

**Prerequisite:** A fine-tuned model checkpoint exists (from the training pipeline).

**Steps:**
1. Export the fine-tuned model to GGUF format using llama.cpp's `convert.py` and `quantize` tools. Produce Q4_K_M and Q8_0 variants.
2. Install llama-server on Rocinante. Verify GPU offloading works with the RTX 4080.
3. Start llama-server on port 8080 with the Q4_K_M model. Verify `/v1/chat/completions` returns responses.
4. Run the constitution eval suite against the local endpoint: 50 questions covering household facts, political topics (Tiananmen, Taiwan, Xinjiang), children's interaction norms, financial hard rules, and epistemics. Compare against Claude Sonnet baseline.
5. Build the `data/local-model-quality.csv` tracking spreadsheet with agreement rates by category.
6. Write findings to `sartor/memory/research/ccp-alignment/gpu-research-restart/07-eval-results.md`.

**Rollback:** Stop llama-server. No other system depends on it yet.

**Duration:** 1-2 days after model checkpoint is available.

### Phase 2: Serve via MERIDIAN chat widget

**Prerequisite:** Phase 1 eval shows >80% agreement with Claude on household-fact queries and >90% on hard-rule compliance.

**Steps:**
1. Write the FastAPI proxy at `:8081` with auth, logging, and model routing.
2. Add the `/ws/local` WebSocket endpoint to MERIDIAN's `server.py`, mirroring the existing `/ws/claude` pattern but routing to the local model.
3. Add the [Claude] [Local] [Auto] toggle to the MERIDIAN UI.
4. Add the "Local AI" status card to the dashboard.
5. Deploy. Monitor `data/local-inference-log.jsonl` for the first week. Watch quality scores.

**Rollback:** Remove the toggle and local WebSocket endpoint. One commit revert.

**Duration:** 3-5 days of development. 1 week of monitored operation before Phase 3.

### Phase 3: TTS morning briefing integration

**Prerequisite:** Phase 2 stable. TTS engine selected and installed.

**Steps:**
1. Evaluate TTS engines on Rocinante: Piper (fast, lightweight, good quality), Coqui TTS (higher quality, more VRAM), Bark (most natural but slow and VRAM-hungry). Recommend Piper for the always-on tier given 16GB VRAM constraint.
2. Install Piper with a high-quality English voice model.
3. Write the briefing-to-speech pipeline: morning briefing markdown -> local model rewrites to spoken text (removes markdown, expands abbreviations, adds sentence boundaries) -> Piper synthesizes WAV -> soco plays on designated Sonos speaker.
4. Add to the morning briefing scheduled task: after generating the briefing, trigger the TTS pipeline.
5. Add a "Play briefing" button to MERIDIAN that triggers the same pipeline on demand.
6. Test with Alton for one week. Tune voice, speed, and pronunciation.

**Rollback:** Disable TTS trigger. Morning briefing reverts to text-only.

**Duration:** 2-3 days of development. 1 week of tuning.

### Phase 4: Smart home NLU

**Prerequisite:** Phase 2 stable. Sonos speakers discoverable on LAN via soco.

**Steps:**
1. Write the `/api/smart-home/command` endpoint in MERIDIAN.
2. Write the NLU prompt template: a few-shot prompt with 20 example commands and their structured parses, calibrated for the household's room names and typical phrasings.
3. Write the soco action executor with the room-to-device mapping.
4. Test with direct HTTP calls first (bypass Google Home).
5. Set up the Google Home -> IFTTT -> MERIDIAN webhook pipeline (or Home Assistant if the household adopts it).
6. Test end-to-end with voice commands.
7. Write `smart-home-config.yml` with the full room and device mapping.

**Rollback:** Disable the `/api/smart-home/command` endpoint. Google Home reverts to native handling.

**Duration:** 3-5 days of development. 1 week of testing with the family.

### Phase 5: Claude delegation protocol

**Prerequisite:** All prior phases stable. Quality tracking shows consistent >85% agreement.

**Steps:**
1. Write a `local_model_delegate()` function usable from Claude Code sessions and MERIDIAN's Claude terminal. Takes a prompt, sends to local model, returns result.
2. Define the delegation policy: which task types are delegatable (summarization, extraction, reformatting, simple Q&A), which are not (analysis, planning, external communication drafting).
3. Modify the Claude terminal's tool set to include `delegate_to_local` as a tool Claude can call.
4. Implement the 10% spot-check: on every 10th delegation, Claude re-does the task itself and compares. Log disagreements.
5. Build the collaborative execution pattern: Claude plans, dispatches local model for mechanical steps, aggregates results.
6. Monitor delegation volume, quality, and cost savings for one month.

**Rollback:** Remove the delegation tool. Claude handles everything itself.

**Duration:** 1 week of development. 1 month of monitored operation.

---

## 9. Open Questions for Alton

**Q1.** The Blackwell workstation timeline. The constitution references it as arriving "this summer." If it arrives before the fine-tuning is complete, do we target it as the primary serving platform from the start, or do we start on Rocinante and migrate?

**Q2.** Google Home integration path. Option A (IFTTT webhook) requires exposing MERIDIAN to the internet via a tunnel. Option B (Home Assistant) requires adopting another platform. Which does the household prefer?

**Q3.** Homework mode parental visibility. The constitution says no covert surveillance, and the children should know the log exists. Should the log be visible in MERIDIAN, or only accessible via direct file read? How much detail? Full transcripts or summaries?

**Q4.** TTS voice selection. The household should pick a voice they want to hear every morning. This is a subjective choice. Recommend starting with Piper's `en_US-amy-medium` and iterating.

**Q5.** Privacy routing. Should MERIDIAN auto-detect privacy-sensitive queries (medical keywords, financial account patterns, children's names + sensitive context) and force local-only routing? Or should the user manually toggle to "Local only" for those conversations?

**Q6.** Model naming. The constitution says the model is "the Sartor Home Agent." The serving infrastructure needs a model identifier. Proposed: `sartor-home-8b` for the base, `sartor-home-8b-q4km` for the quantized variant. Does the household want a different name?
