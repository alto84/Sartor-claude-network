# Phase 6 Memory Architecture Diagram

## Memory Type Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP MEMORY SYSTEM                         │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │    MemoryType Enum    │
                └───────────┬───────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    ┌───▼────┐         ┌────▼────┐        ┌────▼────┐
    │Original│         │ Phase 6 │        │ Future  │
    │  Types │         │  Types  │        │  Types  │
    └───┬────┘         └────┬────┘        └────┬────┘
        │                   │                   │
   ┌────┼────┬──────┐  ┌────┼─────┐           TBD
   │    │    │      │  │          │
   ▼    ▼    ▼      ▼  ▼          ▼
EPISODIC  SEMANTIC  PROCEDURAL  WORKING  REFINEMENT_TRACE  EXPERT_CONSENSUS
   │         │         │          │            │                  │
   │         │         │          │            │                  │
   └─────────┴─────────┴──────────┴────────────┴──────────────────┘
                                │
                    ┌───────────▼──────────┐
                    │    File Store        │
                    │  (memories.json)     │
                    │  + Firebase Backup   │
                    └──────────────────────┘
```

## Phase 6 Memory Flow

### Refinement Trace Flow

```
┌─────────────────┐
│ Refinement Loop │
│   Execution     │
└────────┬────────┘
         │
         │ collects data
         ▼
┌─────────────────────────────────────┐
│  Refinement Trace Data              │
│  ---------------------------------- │
│  • task_id                          │
│  • iterations (count)               │
│  • final_result (outcome)           │
│  • success (boolean)                │
│  • duration_ms (timing)             │
└────────┬────────────────────────────┘
         │
         │ memory_create_refinement_trace
         ▼
┌─────────────────────────────────────┐
│  Memory Record Created              │
│  ---------------------------------- │
│  ID: mem_1234567890_abc             │
│  Type: REFINEMENT_TRACE             │
│  Content: {JSON data}               │
│  Importance: 0.8 or 0.6             │
│  Tags: [refinement, task:X, ...]   │
│  Created: 2025-12-10T...            │
└────────┬────────────────────────────┘
         │
         │ saved to
         ▼
┌─────────────────────────────────────┐
│  Persistent Storage                 │
│  ---------------------------------- │
│  File: data/memories.json           │
│  Firebase: mcp-memories/{id}        │
└─────────────────────────────────────┘
         │
         │ searchable via
         ▼
┌─────────────────────────────────────┐
│  memory_search                      │
│  type: refinement_trace             │
│  min_importance: 0.5                │
└─────────────────────────────────────┘
```

### Expert Consensus Flow

```
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   Expert 1    │  │   Expert 2    │  │   Expert 3    │
│   (Auditor)   │  │   (Auditor)   │  │   (Cleaner)   │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
        │    votes         │      votes       │   votes
        ▼                  ▼                  ▼
┌──────────────────────────────────────────────────────┐
│            Consensus Voting System                   │
│  --------------------------------------------------- │
│  Vote 1: {agent: expert-1, decision: approve, ...}  │
│  Vote 2: {agent: expert-2, decision: approve, ...}  │
│  Vote 3: {agent: expert-3, decision: reject, ...}   │
└──────────────────┬───────────────────────────────────┘
                   │
                   │ calculates
                   ▼
┌──────────────────────────────────────────────────────┐
│  Consensus Result                                    │
│  --------------------------------------------------- │
│  • Consensus Decision: approve                       │
│  • Agreement Level: 0.67 (2/3)                       │
│  • Task Type: code_review                            │
└──────────────────┬───────────────────────────────────┘
                   │
                   │ memory_create (type: expert_consensus)
                   ▼
┌──────────────────────────────────────────────────────┐
│  Memory Record Created                               │
│  --------------------------------------------------- │
│  ID: mem_1234567890_xyz                              │
│  Type: EXPERT_CONSENSUS                              │
│  Content: {votes, decision, agreement, ...}          │
│  Importance: 0.67 (agreement level)                  │
│  Tags: [consensus, task:code_review, ...]           │
└──────────────────┬───────────────────────────────────┘
                   │
                   │ saved to
                   ▼
┌──────────────────────────────────────────────────────┐
│  Persistent Storage                                  │
│  --------------------------------------------------- │
│  File: data/memories.json                            │
│  Firebase: mcp-memories/{id}                         │
└──────────────────┬───────────────────────────────────┘
                   │
                   │ searchable via
                   ▼
┌──────────────────────────────────────────────────────┐
│  memory_search_expert_consensus                      │
│  task_type: code_review                              │
│  min_agreement: 0.5                                  │
│  limit: 10                                           │
└──────────────────────────────────────────────────────┘
```

## MCP Server Tool Chain

```
┌────────────────────────────────────────────────────────────┐
│                    MCP SERVER TOOLS                         │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ORIGINAL TOOLS:                                           │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ memory_create    │  │ memory_get       │               │
│  │ (generic)        │  │ (by ID)          │               │
│  └──────────────────┘  └──────────────────┘               │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ memory_search    │  │ memory_stats     │               │
│  │ (filter/type)    │  │ (system info)    │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                             │
│  PHASE 6 TOOLS:                                            │
│  ┌──────────────────────────────────────────┐              │
│  │ memory_create_refinement_trace           │              │
│  │ - Specialized for refinement loops       │              │
│  │ - Auto-generates tags                    │              │
│  │ - Sets importance by success             │              │
│  └──────────────────────────────────────────┘              │
│  ┌──────────────────────────────────────────┐              │
│  │ memory_search_expert_consensus           │              │
│  │ - Searches EXPERT_CONSENSUS type         │              │
│  │ - Filters by task_type                   │              │
│  │ - Filters by min_agreement               │              │
│  │ - Returns parsed JSON content            │              │
│  └──────────────────────────────────────────┘              │
│                                                             │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                  STORAGE LAYER                              │
├────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐          ┌──────────────────┐        │
│  │   FileStore      │          │  FirebaseStore   │        │
│  │ (file-store.ts)  │◄────────►│(firebase-store.ts)│       │
│  └──────────────────┘          └──────────────────┘        │
│          │                              │                   │
│          ▼                              ▼                   │
│  data/memories.json         Firebase Realtime DB           │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

## Data Structure Comparison

### Refinement Trace Memory

```json
{
  "id": "mem_1702234567890_a1b2c3",
  "content": "{
    \"task_id\": \"implement-auth\",
    \"iterations\": 3,
    \"final_result\": \"JWT authentication with refresh tokens\",
    \"success\": true,
    \"duration_ms\": 4500
  }",
  "type": "refinement_trace",
  "importance_score": 0.8,
  "tags": [
    "refinement",
    "task:implement-auth",
    "iterations:3"
  ],
  "created_at": "2025-12-10T22:15:30.123Z"
}
```

### Expert Consensus Memory

```json
{
  "id": "mem_1702234567890_x9y8z7",
  "content": "{
    \"task_type\": \"code_review\",
    \"votes\": [
      {
        \"agent\": \"auditor-1\",
        \"decision\": \"approve\",
        \"confidence\": 0.95,
        \"reasoning\": \"Code follows best practices\"
      },
      {
        \"agent\": \"auditor-2\",
        \"decision\": \"approve\",
        \"confidence\": 0.85,
        \"reasoning\": \"Minor style issues but functionally sound\"
      },
      {
        \"agent\": \"auditor-3\",
        \"decision\": \"approve\",
        \"confidence\": 0.9,
        \"reasoning\": \"Tests are comprehensive\"
      }
    ],
    \"consensus_decision\": \"approve\",
    \"agreement_level\": 0.9,
    \"total_voters\": 3,
    \"timestamp\": \"2025-12-10T22:15:30.123Z\"
  }",
  "type": "expert_consensus",
  "importance_score": 0.9,
  "tags": [
    "consensus",
    "task:code_review",
    "decision:approve",
    "voters:3"
  ],
  "created_at": "2025-12-10T22:15:30.123Z"
}
```

## Integration Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    EXECUTIVE CLAUDE                            │
│              (Orchestration & Coordination)                    │
└──────────────────┬────────────────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Planner  │ │Implementer│ │ Auditor  │
└────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │
     │ Phase 6:   │ Phase 6:   │ Phase 6:
     │ Uses       │ Creates    │ Creates
     │ consensus  │ refinement │ consensus
     │ history    │ traces     │ votes
     │            │            │
     └────────────┼────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    MCP MEMORY SERVER                         │
│                (memory-server.ts)                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Tool Router:                                               │
│  • memory_create_refinement_trace → FileStore              │
│  • memory_search_expert_consensus → FileStore              │
│  • memory_create → FileStore                               │
│  • memory_get → FileStore                                  │
│  • memory_search → FileStore                               │
│  • memory_stats → FileStore                                │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   FILE STORE                                 │
│                 (file-store.ts)                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Methods:                                                   │
│  • createMemory(content, type, options)                    │
│  • getMemory(id)                                           │
│  • searchMemories(filters, limit)                          │
│  • getStats()                                              │
│                                                              │
│  Types Supported:                                           │
│  ✓ EPISODIC                                                │
│  ✓ SEMANTIC                                                │
│  ✓ PROCEDURAL                                              │
│  ✓ WORKING                                                 │
│  ✓ REFINEMENT_TRACE     ← NEW                              │
│  ✓ EXPERT_CONSENSUS     ← NEW                              │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │data/memories.json│
              └────────────────┘
```

## Statistics Dashboard View

```
┌─────────────────────────────────────────────────────────────┐
│              MEMORY SYSTEM STATISTICS                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Total Memories: 1,247                                      │
│                                                              │
│  By Type:                                                   │
│  ┌────────────────────────┬─────────┬──────────────┐       │
│  │ Type                   │ Count   │ Percentage   │       │
│  ├────────────────────────┼─────────┼──────────────┤       │
│  │ EPISODIC              │   423   │    33.9%     │       │
│  │ SEMANTIC              │   312   │    25.0%     │       │
│  │ PROCEDURAL            │   189   │    15.2%     │       │
│  │ WORKING               │   156   │    12.5%     │       │
│  │ REFINEMENT_TRACE      │   98    │     7.9%  ←NEW│      │
│  │ EXPERT_CONSENSUS      │   69    │     5.5%  ←NEW│      │
│  └────────────────────────┴─────────┴──────────────┘       │
│                                                              │
│  Phase 6 Insights:                                          │
│  • Refinement Success Rate: 73.5% (72/98)                  │
│  • Avg Iterations per Refinement: 2.8                      │
│  • Avg Consensus Agreement: 0.81                           │
│  • High-Confidence Consensus (>0.8): 52/69 (75.4%)         │
│                                                              │
│  Storage: File-based (data/memories.json)                  │
│  Last Updated: 2025-12-10 22:15:30                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Performance Characteristics

```
┌─────────────────────────────────────────────────────────────┐
│            OPERATION PERFORMANCE TARGETS                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  memory_create_refinement_trace:                            │
│    Average: < 50ms                                          │
│    p95:     < 100ms                                         │
│    ├─ JSON stringify:     ~1ms                              │
│    ├─ File write:         ~20ms                             │
│    └─ Tag generation:     ~1ms                              │
│                                                              │
│  memory_search_expert_consensus:                            │
│    Average: < 200ms                                         │
│    p95:     < 500ms                                         │
│    ├─ File read:          ~50ms                             │
│    ├─ Type filter:        ~10ms                             │
│    ├─ Agreement filter:   ~20ms                             │
│    ├─ JSON parse:         ~50ms (for task_type filter)     │
│    └─ Result formatting:  ~10ms                             │
│                                                              │
│  Note: Times scale with total memory count                  │
│  Recommendation: Implement indexing if >10k memories        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Future Extensibility

```
┌─────────────────────────────────────────────────────────────┐
│                  EXTENSIBILITY POINTS                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  New Memory Types (Phase 7+):                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  enum MemoryType {                                    │  │
│  │    ...existing types...                               │  │
│  │    REFINEMENT_TRACE,                                  │  │
│  │    EXPERT_CONSENSUS,                                  │  │
│  │    // Future additions:                               │  │
│  │    PERFORMANCE_METRIC,    // System performance data  │  │
│  │    ERROR_PATTERN,         // Error learning           │  │
│  │    OPTIMIZATION_TRACE,    // Code optimization logs   │  │
│  │    COLLABORATION_LOG      // Agent interaction logs   │  │
│  │  }                                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  New Tools (Phase 7+):                                      │
│  • memory_aggregate_refinements (analytics)                │
│  • memory_trend_analysis (pattern detection)               │
│  • memory_cleanup_old (maintenance)                        │
│  • memory_export_insights (reporting)                      │
│                                                              │
│  Storage Evolution:                                         │
│  • Current: JSON file + Firebase                           │
│  • Future: SQLite (for queries), Vector DB (for semantic)  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```
