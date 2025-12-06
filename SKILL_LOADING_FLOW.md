# Progressive Skill Loading - System Flow Diagram

Visual guide to understanding how skills are loaded and executed in the progressive loading architecture.

---

## System Initialization Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. SESSION START                                                │
│    User: "Hello, I need help analyzing some data"              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. INITIALIZE SKILL SYSTEM                                      │
│    ┌──────────────────────────────────────────────────────┐    │
│    │ Load Level 1: All Skill Summaries                    │    │
│    │ - Read manifests/*.yaml                              │    │
│    │ - Create summary for each skill (~50 tokens)         │    │
│    │ - Total: 50 skills × 50 tokens = 2,500 tokens        │    │
│    └──────────────────────────────────────────────────────┘    │
│                                                                  │
│    Skills Available:                                            │
│    ✓ data-analyzer (specialist)                                │
│    ✓ python-executor (utility)                                 │
│    ✓ chart-renderer (utility)                                  │
│    ✓ code-generator (specialist)                               │
│    ✓ ... 46 more skills                                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. PREDICT LIKELY SKILLS                                        │
│    Query Memory System:                                         │
│    ┌──────────────────────────────────────────────────────┐    │
│    │ Warm Memory: User's Historical Patterns               │    │
│    │ - User frequently uses: data-analyzer, chart-renderer │    │
│    │ - Time of day: 14:00 → data analysis common          │    │
│    │ - Recent conversation: "data", "analyze"              │    │
│    └──────────────────────────────────────────────────────┘    │
│                                                                  │
│    Predictions:                                                 │
│    1. data-analyzer (confidence: 0.85)                         │
│    2. chart-renderer (confidence: 0.72)                        │
│    3. python-executor (confidence: 0.68)                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. PRELOAD TOP PREDICTIONS                                      │
│    ┌──────────────────────────────────────────────────────┐    │
│    │ Load Level 2: Instructions for Top 3 Skills          │    │
│    │ - data-analyzer: +520 tokens                          │    │
│    │ - chart-renderer: +480 tokens                         │    │
│    │ - python-executor: +450 tokens                        │    │
│    │ Total: +1,450 tokens                                  │    │
│    └──────────────────────────────────────────────────────┘    │
│                                                                  │
│    Context Usage: 2,500 + 1,450 = 3,950 tokens (2% of 200k)   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. READY TO HANDLE REQUESTS                                     │
│    System is initialized and optimized for this user           │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ USER REQUEST                                                    │
│ "Can you analyze sales_2025.csv and create visualizations?"    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: TRIGGER MATCHING                                        │
│                                                                  │
│  Parse user input for trigger patterns:                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Keywords found: "analyze", "visualizations"            │    │
│  │                                                         │    │
│  │ Matching Skills:                                       │    │
│  │ • data-analyzer                                        │    │
│  │   - Trigger: "analyze" (keyword)                       │    │
│  │   - Confidence: 0.90                                   │    │
│  │   - Already loaded (Level 2)                           │    │
│  │                                                         │    │
│  │ • chart-renderer                                       │    │
│  │   - Trigger: "visualizations" (keyword)                │    │
│  │   - Confidence: 0.85                                   │    │
│  │   - Already loaded (Level 2)                           │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: SELECT SKILL                                            │
│                                                                  │
│  Primary Skill: data-analyzer                                  │
│  Dependencies: python-executor (required)                      │
│                chart-renderer (optional, for viz)              │
│                                                                  │
│  Status:                                                        │
│  ✓ data-analyzer: Level 2 loaded                              │
│  ✓ python-executor: Level 2 loaded                            │
│  ✓ chart-renderer: Level 2 loaded                             │
│                                                                  │
│  No additional loading needed!                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: LOAD LEVEL 3 RESOURCES (During Execution)              │
│                                                                  │
│  data-analyzer requests:                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Resource 1: templates/statistical-analysis.py          │    │
│  │ - Size: 15 KB                                          │    │
│  │ - Load from: Cold storage (GitHub)                     │    │
│  │ - Cache in: Hot memory (10 min TTL)                    │    │
│  │ - Status: ✓ Loaded                                     │    │
│  │                                                         │    │
│  │ Resource 2: schemas/dataset-schema.json                │    │
│  │ - Size: 2 KB                                           │    │
│  │ - Load from: Cache (already in hot memory)             │    │
│  │ - Status: ✓ Retrieved from cache                       │    │
│  │                                                         │    │
│  │ Resource 3: templates/visualization-config.json        │    │
│  │ - Size: 5 KB                                           │    │
│  │ - Load from: Cold storage (GitHub)                     │    │
│  │ - Cache in: Hot memory (10 min TTL)                    │    │
│  │ - Status: ✓ Loaded                                     │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Note: Resources don't count toward token budget               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: EXECUTE SKILL                                           │
│                                                                  │
│  Execution Pipeline:                                            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 1. Validate input (sales_2025.csv)                     │    │
│  │    ✓ File exists                                       │    │
│  │    ✓ Format: CSV                                       │    │
│  │    ✓ Size: 2.3 MB (ok)                                │    │
│  │                                                         │    │
│  │ 2. Load data                                           │    │
│  │    → python-executor: load_csv()                      │    │
│  │    ✓ 15,234 rows loaded                               │    │
│  │                                                         │    │
│  │ 3. Analyze data                                        │    │
│  │    → Run statistical analysis                         │    │
│  │    ✓ Descriptive statistics calculated                │    │
│  │    ✓ Correlations computed                            │    │
│  │    ✓ Outliers detected                                │    │
│  │                                                         │    │
│  │ 4. Generate insights                                   │    │
│  │    ✓ 5 key findings identified                        │    │
│  │    ✓ 3 recommendations created                        │    │
│  │                                                         │    │
│  │ 5. Create visualizations                               │    │
│  │    → chart-renderer: generate_charts()                │    │
│  │    ✓ 4 charts generated                               │    │
│  │    ✓ Interactive dashboard created                     │    │
│  │                                                         │    │
│  │ Execution time: 3.2 seconds                            │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: RECORD METRICS & UPDATE MEMORY                          │
│                                                                  │
│  Hot Memory (Immediate):                                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Skill State:                                           │    │
│  │ - skillId: data-analyzer                               │    │
│  │ - lastExecuted: 2025-12-06T14:32:15Z                  │    │
│  │ - executionCount: +1                                   │    │
│  │ - avgExecutionMs: 3200                                │    │
│  │ - successRate: 0.95 → 0.96                            │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Warm Memory (Background):                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Usage Pattern:                                         │    │
│  │ - timeOfDay[14]: +1                                   │    │
│  │ - coActivated[chart-renderer]: +1                     │    │
│  │ - successContexts: ["csv analysis", "sales data"]     │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: RETURN RESULTS                                          │
│                                                                  │
│  ✓ Analysis complete                                           │
│  ✓ 5 key insights                                              │
│  ✓ 3 recommendations                                           │
│  ✓ 4 visualizations                                            │
│  ✓ Execution: 3.2s                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Memory State Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      SKILL LIFECYCLE IN MEMORY                  │
└─────────────────────────────────────────────────────────────────┘

TIME: T=0 (Session Start)
─────────────────────────
┌──────────┐  ┌──────────┐  ┌──────────┐
│   HOT    │  │   WARM   │  │   COLD   │
│          │  │          │  │          │
│ (empty)  │  │ User     │  │ All 50   │
│          │  │ patterns │  │ skill    │
│          │  │          │  │ manifests│
└──────────┘  └──────────┘  └──────────┘

TIME: T=1 (Level 1 Loaded)
──────────────────────────
┌──────────┐  ┌──────────┐  ┌──────────┐
│   HOT    │  │   WARM   │  │   COLD   │
│          │  │          │  │          │
│ 50 skill │  │ User     │  │ All 50   │
│ summaries│  │ patterns │  │ skill    │
│ (2500 tk)│  │          │  │ manifests│
│          │  │          │  │          │
└──────────┘  └──────────┘  └──────────┘

TIME: T=2 (Predictions Preloaded)
──────────────────────────────────
┌──────────┐  ┌──────────┐  ┌──────────┐
│   HOT    │  │   WARM   │  │   COLD   │
│          │  │          │  │          │
│ 50 summ. │  │ User     │  │ All 50   │
│ +        │  │ patterns │  │ skill    │
│ 3 skill  │  │          │  │ manifests│
│ instruc. │  │          │  │          │
│ (3950 tk)│  │          │  │          │
└──────────┘  └──────────┘  └──────────┘

TIME: T=3 (Skill Executing)
────────────────────────────
┌──────────┐  ┌──────────┐  ┌──────────┐
│   HOT    │  │   WARM   │  │   COLD   │
│          │  │          │  │          │
│ 50 summ. │  │ User     │  │ Manifest │
│ 3 instr. │  │ patterns │  │ +        │
│ +        │  │          │  │ Resource │
│ 3 cached │  │          │  │ files    │
│ resources│  │          │  │ (stream) │
│ (3950 tk)│  │          │  │          │
└──────────┘  └──────────┘  └──────────┘
                                 │
                                 └─→ Resources streamed,
                                     not stored in context

TIME: T=4 (After Execution)
────────────────────────────
┌──────────┐  ┌──────────┐  ┌──────────┐
│   HOT    │  │   WARM   │  │   COLD   │
│          │  │          │  │          │
│ 50 summ. │  │ User     │  │ Manifest │
│ 3 instr. │  │ patterns │  │ +        │
│ +        │  │ +        │  │ Resources│
│ 3 cached │  │ Updated  │  │          │
│ resources│  │ usage    │  │          │
│ +        │  │ patterns │  │          │
│ Skill    │  │          │  │          │
│ state    │  │          │  │          │
│ (3950 tk)│  │          │  │          │
└──────────┘  └──────────┘  └──────────┘

TIME: T=5 (10 minutes later, idle)
───────────────────────────────────
┌──────────┐  ┌──────────┐  ┌──────────┐
│   HOT    │  │   WARM   │  │   COLD   │
│          │  │          │  │          │
│ 50 summ. │  │ User     │  │ Manifest │
│ +        │  │ patterns │  │ +        │
│ 1 instr. │  │ Recent   │  │ Resources│
│ (most    │  │ skill    │  │          │
│ used)    │  │ invokes  │  │          │
│          │  │          │  │          │
│ (2750 tk)│  │          │  │          │
└──────────┘  └──────────┘  └──────────┘
    ▲
    │
    └─ Auto-unloaded inactive skills to free tokens
```

---

## Token Budget Over Time

```
Token Usage Timeline
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

200k ┤
     │                                          ← Context Limit
     │
     │
100k ┤
     │
     │
     │
 50k ┤
     │
     │
 25k ┤                          ┌─────────┐
     │                          │Without  │  ← 25,000 tokens
     │                          │Prog.    │     (all skills full)
     │                          │Loading  │
     │                          └─────────┘
 10k ┤
     │
  5k ┤     ┌──────────────────────────────────────┐
     │     │ With Progressive Loading             │
  4k ┤     │                                      │
     │     │        ┌──────┐                      │
  3k ┤     │        │Peak  │                      │
     │     │        │(exec)│                      │
  2.5k┤    │  ┌─────┴──────┴─────┐               │
     │     │  │ Steady State     │               │
     │     │  │ (3-4 active)     │               │
     │     │  │                  │               │
     │     └──┴──────────────────┴───────────────┘
     │
   0 └────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬
          0    1    2    5   10   15   20   25   30   35   40
                         Time (minutes)

Legend:
─────────────────────
│ Without Progressive Loading: Constant 25,000 tokens
│ With Progressive Loading:
│   - Session start: 2,500 tokens (Level 1 only)
│   - After predictions: 3,950 tokens (Level 1 + 3 skills)
│   - During execution: 4,200 tokens (peak, +resources in cache)
│   - Steady state: 2,750 tokens (auto-optimized)

Savings: ~21,000 tokens (84%)
```

---

## Skill Dependency Resolution

```
┌─────────────────────────────────────────────────────────────────┐
│ Example: Load "report-generator" skill                          │
└─────────────────────────────────────────────────────────────────┘

STEP 1: Check Dependencies
──────────────────────────
report-generator
    requires:
      • data-analyzer (v2.0+)  [required, eager]
      • chart-renderer (v1.5+) [optional, lazy]
      • pdf-exporter (v3.0+)   [required, eager]

STEP 2: Build Dependency Graph
───────────────────────────────
                  report-generator
                         │
           ┌─────────────┼─────────────┐
           │             │             │
           ▼             ▼             ▼
    data-analyzer  chart-renderer  pdf-exporter
           │                            │
           ▼                            ▼
    python-executor              latex-engine


STEP 3: Topological Sort
─────────────────────────
Loading Order:
  1. python-executor (utility)
  2. latex-engine (utility)
  3. data-analyzer (specialist)
  4. pdf-exporter (specialist)
  5. chart-renderer (specialist) [optional - skip if not needed]
  6. report-generator (specialist)

STEP 4: Load Skills
───────────────────
┌─────────────────────────────────────────────────┐
│ Load python-executor                            │
│ ✓ Level 2 loaded (450 tokens)                  │
└─────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────┐
│ Load latex-engine                               │
│ ✓ Level 2 loaded (380 tokens)                  │
└─────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────┐
│ Load data-analyzer                              │
│ ✓ Already loaded (from cache)                  │
└─────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────┐
│ Load pdf-exporter                               │
│ ✓ Level 2 loaded (420 tokens)                  │
└─────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────┐
│ Skip chart-renderer                             │
│ (optional, user didn't request charts)          │
└─────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────┐
│ Load report-generator                           │
│ ✓ Level 2 loaded (510 tokens)                  │
└─────────────────────────────────────────────────┘

Total: 2,210 tokens (vs 3,500 if loaded individually)
Saved: 1,290 tokens via caching and smart loading
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Skill Execution with Error Recovery                             │
└─────────────────────────────────────────────────────────────────┘

TRY: Execute primary skill
──────────────────────────
┌──────────────────────────┐
│ Execute: data-analyzer   │
│ Input: broken_file.csv   │
└────────────┬─────────────┘
             │
             ▼
        ┌─────────┐
        │ ERROR!  │
        │ File    │
        │ corrupt │
        └────┬────┘
             │
             ▼
┌────────────────────────────┐
│ Check if recoverable       │
│ Error type: FileCorruption │
│ Recoverable: Yes           │
└────────────┬───────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│ RECOVERY ATTEMPT 1: Retry with preprocessing   │
│                                                 │
│ 1. Load resource: data-repair-tool             │
│ 2. Attempt to fix corrupted CSV                │
│ 3. Retry data-analyzer                         │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
              ┌─────────┐
              │ ERROR!  │
              │ Still   │
              │ corrupt │
              └────┬────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ RECOVERY ATTEMPT 2: Use fallback skill         │
│                                                 │
│ Manifest says:                                  │
│   alternatives: [simple-csv-reader]            │
│                                                 │
│ 1. Load simple-csv-reader                      │
│ 2. Try with more lenient parsing               │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
              ┌─────────┐
              │ SUCCESS │
              │ Partial │
              │ data    │
              └────┬────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ RETURN: Partial success result                  │
│                                                 │
│ {                                               │
│   success: true,                                │
│   partial: true,                                │
│   result: { data: [...], warnings: [...] },    │
│   recovery: "Used fallback: simple-csv-reader" │
│ }                                               │
└─────────────────────────────────────────────────┘
```

---

## Performance Optimization Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Automatic Context Optimization                                  │
└─────────────────────────────────────────────────────────────────┘

MONITOR: Check token usage every 30 seconds
────────────────────────────────────────────

Current State:
┌──────────────────────────────────────┐
│ Token Usage: 145,000 / 200,000 (72%) │ ← Warning threshold!
│                                       │
│ Loaded Skills:                        │
│ • data-analyzer (active)             │
│ • chart-renderer (active)            │
│ • code-generator (idle 15 min)       │
│ • test-runner (idle 20 min)          │
│ • database-query (idle 8 min)        │
│ • api-tester (idle 25 min)           │
│ • git-manager (idle 12 min)          │
└──────────────────────────────────────┘

ANALYZE: Score skills by value
───────────────────────────────
Skill               | Recency | Frequency | Success | Total Score
────────────────────┼─────────┼───────────┼─────────┼────────────
data-analyzer       |   0.95  |    0.82   |   0.96  |    0.91
chart-renderer      |   0.90  |    0.75   |   0.94  |    0.86
database-query      |   0.45  |    0.60   |   0.89  |    0.65
code-generator      |   0.30  |    0.50   |   0.92  |    0.57
git-manager         |   0.35  |    0.45   |   0.88  |    0.56
test-runner         |   0.25  |    0.40   |   0.91  |    0.52
api-tester          |   0.15  |    0.35   |   0.87  |    0.46

DECIDE: Unload low-value skills
────────────────────────────────
Target: Reduce to 60% (120,000 tokens)
Need to free: 25,000 tokens

Unload candidates (lowest scores):
✓ api-tester        → Free 500 tokens
✓ test-runner       → Free 480 tokens
✓ git-manager       → Free 420 tokens
✓ code-generator    → Free 510 tokens
                      ─────────────────
                      Total: 1,910 tokens freed

EXECUTE: Unload skills
──────────────────────
┌─────────────────────────────────────┐
│ Unload: api-tester                  │
│ • Move Level 2 to Warm memory       │
│ • Clear from active context         │
│ • Keep summary (Level 1)            │
│ Status: ✓ Unloaded                  │
└─────────────────────────────────────┘
           ⋮
           ⋮ (repeat for others)
           ⋮

RESULT: Optimized
─────────────────
New State:
┌──────────────────────────────────────┐
│ Token Usage: 143,090 / 200,000 (71%) │ ← Still high but better
│                                       │
│ Active Skills:                        │
│ • data-analyzer                      │
│ • chart-renderer                     │
│ • database-query                     │
│                                       │
│ Can reload others if needed!         │
└──────────────────────────────────────┘

Note: Freed skills can be reloaded in <200ms if needed
```

---

## Summary

This progressive skill loading system provides:

1. **Smart Initialization**: Load summaries, predict needs, preload likely skills
2. **On-Demand Loading**: Load instructions only when triggered
3. **Resource Streaming**: Load large resources during execution only
4. **Memory Integration**: Store state across hot/warm/cold tiers
5. **Auto-Optimization**: Unload idle skills to free context space
6. **Error Recovery**: Automatic fallback and retry mechanisms
7. **Dependency Resolution**: Smart loading of skill dependencies

The result is an **efficient**, **scalable**, and **intelligent** skill system that maximizes context usage while maintaining full capability awareness.
