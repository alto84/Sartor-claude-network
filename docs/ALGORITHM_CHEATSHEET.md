# Memory System Algorithm Cheatsheet

Quick reference for all algorithms and formulas.

## 1. Importance Score Calculation

### Formula

```
importance = Σ(weight_i × factor_i)

Default weights:
  w_recency    = 0.25
  w_frequency  = 0.20
  w_salience   = 0.35
  w_relevance  = 0.20
```

### Recency Factor (Exponential Decay)

```
recency = e^(-λt)

where:
  λ = 0.05 (decay constant)
  t = days elapsed since creation

Example values:
  t=0:   recency = 1.000
  t=7:   recency = 0.704
  t=14:  recency = 0.496  (half-life)
  t=30:  recency = 0.223
```

### Frequency Factor (Logarithmic Scaling)

```
frequency = log(1 + access_count) / log(1 + max_expected)

where:
  max_expected = 100

Example values:
  access=0:   frequency = 0.000
  access=10:  frequency = 0.518
  access=50:  frequency = 0.874
  access=100: frequency = 1.000
```

### Salience Factor (LLM-Scored)

```
salience = (emotional + novelty + actionable + personal) / 40

where each component is scored 0-10:
  emotional  = emotional intensity
  novelty    = uniqueness/surprise
  actionable = decision/action importance
  personal   = personal significance

Example:
  (8 + 6 + 7 + 9) / 40 = 0.75
```

### Relevance Factor (Cosine Similarity)

```
relevance = cosine_similarity(memory_embedding, context_embedding)
          = (A · B) / (||A|| × ||B||)
          = Σ(A_i × B_i) / (√Σ(A_i²) × √Σ(B_i²))

Normalized to [0, 1]:
  relevance_normalized = (similarity + 1) / 2
```

## 2. Memory Decay

### Base Decay Rate

```
decay_rate = base_rate × (1 - importance)²

where:
  base_rate = 0.1 per day

Example values:
  importance=0.0: decay_rate = 0.100
  importance=0.5: decay_rate = 0.025
  importance=0.8: decay_rate = 0.004
  importance=1.0: decay_rate = 0.000
```

### Decay Modifiers

```
final_decay_rate = base_rate × importance_mod × access_mod × type_mod

importance_mod = 1 - (importance × 0.9)

access_mod:
  if accessed < 24h ago:  0.5
  if accessed < 7d ago:   0.7
  if never accessed:      1.5
  else:                   1.0

type_mod:
  episodic:   1.0
  semantic:   0.7
  procedural: 0.5
  emotional:  0.6
  system:     0.3
```

### Strength Update

```
new_strength = current_strength - (decay_rate × days_elapsed)

Clamped to [0, 1]
```

### Reinforcement on Access

```
boost = reinforcement_boost × (1 - current_strength)
new_strength = min(1.0, current_strength + boost)

where:
  reinforcement_boost = 0.15

Example:
  current=0.5: boost = 0.075, new = 0.575
  current=0.8: boost = 0.030, new = 0.830
```

### State Thresholds

```
if strength < 0.05:  → PERMANENT DELETE
if strength < 0.15:  → ARCHIVE (compressed)
if strength < 0.30:  → SOFT DELETE (archived)
else:                → ACTIVE
```

## 3. Consolidation

### Trigger Conditions

```
should_consolidate =
  (memory_count > 10000) OR
  (storage_usage > 80%) OR
  (scheduled_time_reached)
```

### Similarity Calculation

```
distance = 1 - cosine_similarity(emb_A, emb_B)

Temporal proximity bonus:
  if time_diff < 1 hour:
    bonus = (1 - time_diff/1hour) × 0.1
    distance = distance - bonus

Same conversation bonus:
  if same_conversation_id:
    distance = distance - 0.1

threshold for clustering = 0.3 (similarity > 0.7)
```

### Strategy Selection

```
if cluster_size == 1:
  → SKIP

if cluster_size ≤ 3:
  → LINK (preserve all, add references)

if average_importance < 0.4:
  → SUMMARIZE (all memories)

if high_importance_count > 0 AND high_importance_count < total:
  → KEEP_AND_SUMMARIZE (keep important, summarize rest)

if is_temporal_sequence:
  → SUMMARIZE (narrative)

else:
  → SUMMARIZE
```

## 4. Spaced Repetition

### Easiness Factor

```
easiness_factor = min_EF + (importance × (max_EF - min_EF))
                = 1.3 + (importance × 1.7)

Range: [1.3, 3.0]

Example values:
  importance=0.0: EF = 1.30
  importance=0.5: EF = 2.15
  importance=0.9: EF = 2.83
  importance=1.0: EF = 3.00
```

### Review Intervals

```
I(0) = 1 day
I(1) = 6 days
I(n) = I(n-1) × EF

Example progression (importance=0.5, EF=2.15):
  Review 1: 1 day
  Review 2: 6 days
  Review 3: 13 days
  Review 4: 28 days
  Review 5: 60 days
  Review 6: 129 days

Example progression (importance=0.9, EF=2.83):
  Review 1: 1 day
  Review 2: 6 days
  Review 3: 17 days
  Review 4: 48 days
  Review 5: 136 days
```

### Priority Score

```
priority = (0.4 × overdue_score) +
           (0.3 × importance) +
           (0.3 × weakness)

where:
  overdue_score = min(1.0, log(1 + days_overdue) / log(30))
  weakness = 1 - strength
```

### Context-Triggered Relevance

```
final_priority = base_priority × boost

boost = 1.5 if review is due, else 1.0

combined_score = (0.6 × relevance) + (0.4 × priority)
```

## 5. Forgetting Strategy

### Privacy Risk Score

```
privacy_risk = (pii_score × 0.4) +
               (financial_score × 0.4) +
               (age_score × 0.2)

where:
  age_score = max(0, 1 - age_days/365)
```

### PII Detection

```
Patterns detected:
  Email:        +0.3
  Phone:        +0.3
  SSN:          +0.5
  Credit card:  +0.5
  Address:      +0.2
  Personal tag: +0.2

pii_score = min(1.0, sum of detections)
```

### Expiration Rules

```
if pii_score > 0.5 AND age > pii_max_days (30):
  → EXPIRE

if financial_score > 0.5 AND age > financial_max_days (90):
  → EXPIRE

if type == EPISODIC AND importance < 0.3 AND age > casual_max_days (180):
  → EXPIRE

if privacy_risk > 0.7:
  → FORCE EXPIRE
```

### Never-Forget Protection

```
never_forget =
  (type == SYSTEM) OR
  (has_protected_tag) OR
  (importance > 0.8) OR
  (access_count > 50)
```

## Quick Reference Tables

### Importance Ranges

| Score   | Interpretation |
| ------- | -------------- |
| 0.9-1.0 | Critical       |
| 0.7-0.9 | Very Important |
| 0.5-0.7 | Important      |
| 0.3-0.5 | Moderate       |
| 0.1-0.3 | Low            |
| 0.0-0.1 | Minimal        |

### Strength Ranges

| Score     | State     | Action                |
| --------- | --------- | --------------------- |
| 0.30-1.0  | Active    | Normal operation      |
| 0.15-0.30 | Weak      | Soft delete (archive) |
| 0.05-0.15 | Very Weak | Heavy compression     |
| 0.0-0.05  | Critical  | Permanent delete      |

### Decay Rates by Type

| Type       | Modifier | Effective Rate (base=0.1) |
| ---------- | -------- | ------------------------- |
| System     | 0.3      | 0.03 per day              |
| Procedural | 0.5      | 0.05 per day              |
| Emotional  | 0.6      | 0.06 per day              |
| Semantic   | 0.7      | 0.07 per day              |
| Episodic   | 1.0      | 0.10 per day              |

### Review Interval Examples

| Importance | EF   | I(3) | I(4) | I(5) |
| ---------- | ---- | ---- | ---- | ---- |
| 0.0        | 1.30 | 8d   | 10d  | 13d  |
| 0.3        | 1.81 | 11d  | 20d  | 36d  |
| 0.5        | 2.15 | 13d  | 28d  | 60d  |
| 0.7        | 2.49 | 15d  | 37d  | 92d  |
| 0.9        | 2.83 | 17d  | 48d  | 136d |

### Privacy Expiration

| Data Type | Max Age  | Risk Threshold   |
| --------- | -------- | ---------------- |
| PII       | 30 days  | pii_score > 0.5  |
| Financial | 90 days  | financial > 0.5  |
| Health    | 180 days | configurable     |
| Casual    | 180 days | importance < 0.3 |

## Implementation Snippets

### Calculate Importance

```typescript
const factors = await calculateImportanceFactors(memory, contextEmbedding);
const importance = calculateCombinedImportance(factors, weights);
```

### Apply Decay

```typescript
updateMemoryStrength(memory, wasAccessed, config);
transitionMemoryState(memory, config);
```

### Check Consolidation

```typescript
if (shouldTriggerConsolidation(count, storage, config)) {
  const clusters = clusterMemories(memories, config);
  for (const cluster of clusters) {
    const strategy = determineConsolidationStrategy(cluster);
    await executeConsolidation(strategy);
  }
}
```

### Schedule Review

```typescript
const schedule = createReviewSchedule(memory, config);
const nextReview = calculateNextReviewDate(memory, config);
```

### Check Privacy

```typescript
const privacyRisk = calculatePrivacyRisk(memory);
if (shouldExpireForPrivacy(memory, config)) {
  scheduleDeletion(memory, gracePeriodDays);
}
```

## Common Operations

### Access Memory (Strengthens)

```typescript
const memory = await system.getMemory(id, true); // recordAccess = true
// Effect: strength += boost, access_count++, last_accessed = now
```

### Daily Maintenance

```typescript
await system.runDailyMaintenance();
// Runs: decay, reviews, consolidation, forgetting
```

### Context Query

```typescript
const relevant = await system.getRelevantMemories(embedding, 5);
// Returns: top 5 most relevant memories
```

### Force Protection

```typescript
memory.tags.push('explicitly_saved');
// Effect: never auto-deleted
```

---

**Use this cheatsheet for quick algorithm lookups during development.**
