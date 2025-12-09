# Memory Importance Scoring and Decay System Specification

## Overview

This document specifies a biologically-inspired memory management system for AI agents, implementing importance scoring, decay functions, consolidation, spaced repetition, and forgetting strategies.

## 1. Importance Score Calculation

### 1.1 Recency Factor

Uses exponential decay to prioritize recent memories.

**Formula:**

```
recency_score = e^(-λ * t)
where:
  λ (lambda) = decay constant (default: 0.05 per day)
  t = time elapsed since creation (in days)
```

**Rationale:** Recent memories are more likely to be relevant. Exponential decay models natural forgetting curves (Ebbinghaus).

**Parameters:**

- `lambda`: 0.05 (half-life ~14 days)
- Range: [0, 1]

### 1.2 Frequency Factor

Uses logarithmic scaling to value frequent access without over-weighting.

**Formula:**

```
frequency_score = log(1 + access_count) / log(1 + max_expected_accesses)
where:
  access_count = number of times memory was accessed
  max_expected_accesses = normalization constant (default: 100)
```

**Rationale:** Logarithmic scaling prevents memories accessed thousands of times from dominating, while still rewarding frequency.

**Parameters:**

- `max_expected_accesses`: 100
- Range: [0, 1]

### 1.3 Emotional/Semantic Salience

LLM-scored importance based on content analysis.

**Scoring Criteria:**

- Emotional intensity (0-10)
- Novelty/uniqueness (0-10)
- Actionable insights (0-10)
- Personal significance (0-10)

**Formula:**

```
salience_score = (emotional + novelty + actionable + personal) / 40
```

**LLM Prompt Template:**

```
Analyze this memory for importance on a scale of 0-10 for each criterion:
1. Emotional Intensity: How emotionally charged is this content?
2. Novelty: How unique or surprising is this information?
3. Actionable Insights: Does this contain important decisions or actions?
4. Personal Significance: How personally meaningful is this?

Memory: {content}

Respond with JSON: {"emotional": X, "novelty": Y, "actionable": Z, "personal": W}
```

**Parameters:**

- Range: [0, 1]
- Cache results to avoid repeated LLM calls

### 1.4 Contextual Relevance

Measures similarity to current context using embedding cosine similarity.

**Formula:**

```
relevance_score = cosine_similarity(memory_embedding, context_embedding)
where:
  cosine_similarity(A, B) = (A · B) / (||A|| * ||B||)
```

**Implementation:**

- Use sentence/paragraph embeddings (e.g., OpenAI embeddings, all-MiniLM-L6-v2)
- Compare memory embedding to current conversation context
- Dynamic score that changes with context

**Parameters:**

- Range: [-1, 1], normalized to [0, 1]
- Context window: Last 5 messages or 2048 tokens

### 1.5 Combined Weighted Formula

**Master Formula:**

```
importance_score = (w1 * recency) +
                   (w2 * frequency) +
                   (w3 * salience) +
                   (w4 * relevance)

where default weights:
  w1 = 0.25 (recency weight)
  w2 = 0.20 (frequency weight)
  w3 = 0.35 (salience weight)
  w4 = 0.20 (relevance weight)

  Σ wi = 1.0 (normalized)
```

**Adaptive Weighting:**

- Increase `w1` for time-sensitive applications
- Increase `w3` for content-heavy applications
- Increase `w4` for context-aware assistants

## 2. Memory Decay Function

### 2.1 Base Decay Rate

All memories decay over time unless reinforced.

**Formula:**

```
decay_rate = base_decay * (1 - importance_score)^2

where:
  base_decay = 0.1 per day (configurable)
  importance_score = current combined importance [0,1]
```

**Rationale:** High-importance memories decay slower (quadratic relationship).

### 2.2 Decay Modifiers

**Importance-Based Modifier:**

```
importance_modifier = 1 - (importance_score * 0.9)
Final decay rate = base_decay * importance_modifier
```

**Access Pattern Modifier:**

```
If accessed in last 24h: decay_rate *= 0.5
If accessed in last 7d:  decay_rate *= 0.7
If never accessed:       decay_rate *= 1.5
```

**Memory Type Modifier:**

```
Type                Modifier
--------------------------------
Episodic            1.0  (normal decay)
Semantic            0.7  (slower decay)
Procedural          0.5  (very slow decay)
Emotional           0.6  (slow decay)
System/Meta         0.3  (minimal decay)
```

### 2.3 Reinforcement on Access

When a memory is accessed, it receives reinforcement.

**Formula:**

```
new_strength = min(1.0, current_strength + reinforcement_boost)

where:
  reinforcement_boost = 0.15 * (1 - current_strength)
```

**Rationale:** Stronger memories receive less boost (diminishing returns).

**Side Effects:**

- Reset recency factor (t = 0)
- Increment access count (affects frequency)
- Update last_accessed timestamp

### 2.4 Threshold for Forgetting

**Hard Threshold:**

```
If strength < 0.05: Mark for deletion
```

**Soft Threshold:**

```
If strength < 0.15: Move to archive (compressed)
If strength < 0.30: Reduce embedding dimensions (compression)
```

**Grace Period:**

- Memories < 7 days old: Never auto-delete
- Memories with importance > 0.7: Never auto-delete
- System-tagged memories: Never auto-delete

## 3. Consolidation Algorithm

### 3.1 Trigger Conditions

Run consolidation when:

1. Memory count > threshold (e.g., 10,000 memories)
2. Nightly/scheduled batch (e.g., 2 AM daily)
3. Manual trigger by user/system
4. Storage usage > 80%

### 3.2 Identifying Related Memories

**Clustering Approach:**

```
1. Compute embeddings for all memories (if not cached)
2. Use hierarchical clustering or HDBSCAN
3. Distance threshold: cosine_distance < 0.3 (highly similar)
4. Temporal proximity bonus: memories within 1 hour get -0.1 distance
```

**Criteria for Related Memories:**

- Semantic similarity > 0.7
- Temporal proximity < 1 hour
- Same conversation thread
- Shared entities/topics (NER overlap > 50%)

### 3.3 Merge Strategy

**Decision Tree:**

```
If cluster_size == 2-3:
  → Link memories (preserve both, add references)

If cluster_size > 3 AND all low-importance (< 0.4):
  → Summarize into single memory

If cluster_size > 3 AND mixed importance:
  → Keep high-importance (> 0.6) memories
  → Summarize low-importance into supporting memory

If temporal sequence detected:
  → Create narrative summary linking events
```

**Summarization Prompt:**

```
Consolidate these related memories into a concise summary:

Memories:
{memory_1}
{memory_2}
...

Create a summary that:
1. Captures key information from all memories
2. Preserves important details and context
3. Notes the time span and progression
4. Is 30-50% of the original length

Output format:
{
  "summary": "...",
  "key_points": ["...", "..."],
  "original_ids": [...],
  "time_span": "..."
}
```

### 3.4 Compression Ratio Targets

**Goals:**

```
Light consolidation:  10-20% reduction
Medium consolidation: 30-50% reduction
Aggressive:           60-80% reduction
```

**Preservation Rules:**

- Always keep memories with importance > 0.8
- Preserve at least 1 memory per day for episodic continuity
- Keep full content for last 7 days
- Summarize beyond 30 days (except high-importance)

## 4. Spaced Repetition for AI

### 4.1 Optimal Review Intervals

Based on SuperMemo SM-2 algorithm, adapted for AI:

**Formula:**

```
next_review = current_time + interval

where interval is calculated as:
  I(1) = 1 day
  I(2) = 6 days
  I(n) = I(n-1) * easiness_factor

easiness_factor = 1.3 + (importance_score * 1.7)
  Range: [1.3, 3.0]
```

**Interval Progression Example:**

```
Importance 0.5 (EF = 2.15):
  Review 1: 1 day
  Review 2: 6 days
  Review 3: 13 days
  Review 4: 28 days
  Review 5: 60 days

Importance 0.9 (EF = 2.83):
  Review 1: 1 day
  Review 2: 6 days
  Review 3: 17 days
  Review 4: 48 days
  Review 5: 136 days
```

### 4.2 Surfacing Important Memories

**Daily Review Queue:**

```
1. Select memories due for review (next_review <= now)
2. Sort by: (importance_score * 0.6) + (days_overdue * 0.4)
3. Limit to top 10-20 memories per session
4. Present in context-relevant moments
```

**Context-Triggered Recall:**

```
On new user message:
  1. Compute message embedding
  2. Find top-5 similar memories (cosine similarity)
  3. Filter for relevance > 0.6
  4. Boost if memory is due for review
  5. Surface in response context
```

### 4.3 Active Recall Testing Patterns

**For AI Systems:**

```
1. Connection Testing:
   - Given memory A, can the system recall related memory B?

2. Application Testing:
   - Can the system apply learned information to new scenarios?

3. Coherence Testing:
   - Check if consolidated memories maintain logical consistency

4. Retrieval Speed:
   - Track time to retrieve memories (optimize indexes)
```

**Implementation:**

```
Periodic self-tests:
  - Random sampling of memories
  - Attempt to recall without embedding search
  - Test semantic understanding
  - Reinforce on successful recall
  - Flag for review on failed recall
```

## 5. Forgetting Strategy

### 5.1 Deletion Tiers

**Tier 1: Soft Delete (Strength < 0.30)**

- Mark as `archived: true`
- Reduce embedding dimensions (768 → 128 via PCA)
- Remove from active search index
- Keep metadata and summary
- Recoverable if re-accessed

**Tier 2: Archive (Strength < 0.15)**

- Compress to minimal representation
- Store only: summary, timestamp, importance, key tags
- Remove full content and embeddings
- Move to cold storage
- Recoverable but slow

**Tier 3: Permanent Delete (Strength < 0.05)**

- Complete removal from database
- Only if: age > 90 days AND importance < 0.2 AND access_count < 2
- Log deletion for audit trail
- Irreversible

### 5.2 Never Forget Categories

**Permanent Retention:**

```
1. System Memories:
   - User preferences
   - Configuration settings
   - Explicitly saved items (user marked)

2. High-Stakes Content:
   - Commitments and promises
   - Important decisions
   - Personal facts (name, relationships, etc.)

3. Legal/Compliance:
   - User data deletion requests
   - Privacy settings
   - Consent records

4. Core Knowledge:
   - Procedural memories (how-to)
   - Semantic facts (importance > 0.8)
   - Frequently accessed (count > 50)
```

**Tags for Permanent Retention:**

```typescript
const NEVER_FORGET_TAGS = [
  'user_preference',
  'system_config',
  'explicitly_saved',
  'commitment',
  'promise',
  'decision',
  'personal_fact',
  'high_importance',
  'legal',
  'privacy',
  'procedural_knowledge',
];
```

### 5.3 Privacy-Driven Expiration

**Auto-Expiration Rules:**

```
1. Sensitive Information:
   - PII (Personally Identifiable Information): 30-day max
   - Financial data: 90-day max
   - Health information: User-controlled

2. Conversation Data:
   - Casual chat: 180 days
   - Work-related: 365 days
   - Archived conversations: 2 years

3. User-Requested Deletion:
   - Immediate soft delete
   - 30-day grace period for recovery
   - Permanent deletion after grace period
```

**Privacy Scoring:**

```
privacy_risk = (pii_score * 0.4) +
               (sensitivity_score * 0.4) +
               (data_age_score * 0.2)

If privacy_risk > 0.7: Force expiration regardless of importance
```

**Compliance Integration:**

```
GDPR Right to Erasure:
  - User requests deletion
  - Find all related memories
  - Anonymize or delete within 30 days
  - Generate compliance report

CCPA Data Retention:
  - Track data categories
  - Auto-expire per retention policies
  - Maintain deletion logs
```

## Performance Targets

**Latency:**

- Importance calculation: < 10ms per memory
- Retrieval (top-K): < 50ms
- Consolidation (1000 memories): < 5 seconds
- Decay update (bulk): < 100ms per 1000 memories

**Storage:**

- Active memories: Full embeddings (768-dim)
- Archived memories: Compressed embeddings (128-dim)
- Cold storage: Metadata only (~1KB per memory)

**Accuracy:**

- Recall of important memories: > 95%
- False positive rate: < 5%
- Consolidation quality: Human-rated > 4/5

## Configuration Example

```typescript
const DEFAULT_CONFIG = {
  importance: {
    weights: {
      recency: 0.25,
      frequency: 0.2,
      salience: 0.35,
      relevance: 0.2,
    },
    recency_lambda: 0.05,
    max_expected_accesses: 100,
  },
  decay: {
    base_rate: 0.1,
    reinforcement_boost: 0.15,
    thresholds: {
      soft_delete: 0.3,
      archive: 0.15,
      permanent_delete: 0.05,
    },
  },
  consolidation: {
    trigger_count: 10000,
    similarity_threshold: 0.7,
    compression_target: 0.5,
  },
  spaced_repetition: {
    initial_interval: 1,
    second_interval: 6,
    min_easiness: 1.3,
    max_easiness: 3.0,
  },
  privacy: {
    pii_max_days: 30,
    financial_max_days: 90,
    casual_max_days: 180,
  },
};
```
