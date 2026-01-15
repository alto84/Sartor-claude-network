# Self-Improving Agent Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HUMAN (Alton)                                  │
│                         Reviews, approves, directs                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLAUDE OPUS (Reasoning Layer)                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ • Strategic decisions        • Hypothesis evaluation               │    │
│  │ • Architecture design        • Code review & judgment              │    │
│  │ • Task decomposition         • Quality assessment                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Access: Claude Code CLI ($200/mo Max Plan)                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
┌───────────────────────────────────┐   ┌───────────────────────────────────┐
│      SARTOR CLAUDE NETWORK        │   │          gpuserver1               │
│      (Windows - alto8)            │   │      (Linux - 192.168.1.100)      │
│ ┌───────────────────────────────┐ │   │ ┌───────────────────────────────┐ │
│ │ Executive Layer               │ │   │ │ Hardware                      │ │
│ │ • ExecutiveClaude             │ │   │ │ • RTX 5090 (32GB VRAM)        │ │
│ │ • SelfImprovingLoop           │ │   │ │ • 128GB RAM                   │ │
│ │ • LearningPipeline            │ │   │ │ • 1.8TB NVMe                  │ │
│ └───────────────────────────────┘ │   │ └───────────────────────────────┘ │
│ ┌───────────────────────────────┐ │   │ ┌───────────────────────────────┐ │
│ │ Multi-Expert System           │ │   │ │ Ollama Service                │ │
│ │ • OllamaExecutor ─────────────┼─┼───┼─▶ • qwen3:8b (5.2GB)           │ │
│ │ • ClaudeExecutor              │ │   │ │ • nomic-embed-text            │ │
│ │ • HybridExecutor              │ │   │ │ • Port 11434 (0.0.0.0)        │ │
│ └───────────────────────────────┘ │   │ └───────────────────────────────┘ │
│ ┌───────────────────────────────┐ │   │ ┌───────────────────────────────┐ │
│ │ Validation Framework          │ │   │ │ Vast.ai Daemon                │ │
│ │ • HypothesisGenerator         │ │   │ │ • Accepts rentals             │ │
│ │ • BaselineTracker             │ │   │ │ • Docker containers           │ │
│ │ • AcceptanceGate              │ │   │ │ • Takes over GPU when rented  │ │
│ └───────────────────────────────┘ │   │ └───────────────────────────────┘ │
│ ┌───────────────────────────────┐ │   └───────────────────────────────────┘
│ │ Memory System (3-tier)        │ │
│ │ • Hot: Active context         │ │
│ │ • Warm: Recent patterns       │ │
│ │ • Cold: Long-term storage     │ │
│ └───────────────────────────────┘ │
│ ┌───────────────────────────────┐ │
│ │ Data                          │ │
│ │ • .swarm/results/ (101 runs)  │ │
│ │ • .swarm/experiments/         │ │
│ │ • .swarm/hypotheses.json      │ │
│ └───────────────────────────────┘ │
└───────────────────────────────────┘
```

## Control Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        SELF-IMPROVEMENT LOOP                             │
└──────────────────────────────────────────────────────────────────────────┘

  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
  │  1. GATHER  │ ───▶ │ 2. ANALYZE  │ ───▶ │ 3. GENERATE │
  │    DATA     │      │  PATTERNS   │      │ HYPOTHESES  │
  └─────────────┘      └─────────────┘      └─────────────┘
        │                    │                     │
        │ .swarm/results/    │ HypothesisGenerator │ Prioritized list
        │ Agent executions   │ Pattern detection   │ Evidence-based
        │                    │                     │
        ▼                    ▼                     ▼
  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
  │ 6. PERSIST  │ ◀─── │ 5. VALIDATE │ ◀─── │ 4. EXPLORE  │
  │   LEARNING  │      │   RESULTS   │      │   (cheap)   │
  └─────────────┘      └─────────────┘      └─────────────┘
        │                    │                     │
        │ Memory system      │ CLAUDE OPUS        │ Ollama/qwen3:8b
        │ Update patterns    │ Makes judgment     │ $0 token cost
        │                    │                    │
        └────────────────────┴────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ NEXT ITERATION  │
                    └─────────────────┘
```

## Token Economics

```
┌────────────────────────────────────────────────────────────────┐
│                      HYBRID TOKEN STRATEGY                      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CHEAP (Ollama - $0)              EXPENSIVE (Claude - $/token) │
│  ─────────────────────            ───────────────────────────  │
│  • Bulk exploration               • Strategic decisions         │
│  • Draft generation               • Hypothesis judgment         │
│  • Code verification              • Architecture choices        │
│  • Pattern extraction             • Final code review           │
│  • Syntax checking                • Complex reasoning           │
│  • Test execution                 • Quality assessment          │
│                                                                 │
│  Use for: quantity                Use for: quality              │
│  ~200 tok/sec                     ~50 tok/sec                   │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## GPU Time-Sharing

```
         ┌─────────────────────────────────────────┐
         │            gpuserver1 GPU               │
         │             (RTX 5090)                  │
         └─────────────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
   ┌─────────────────┐           ┌─────────────────┐
   │   RENTED OUT    │           │   NOT RENTED    │
   │   (Vast.ai)     │           │   (Available)   │
   └─────────────────┘           └─────────────────┘
          │                               │
          ▼                               ▼
   ┌─────────────────┐           ┌─────────────────┐
   │ Earning $$$     │           │ Run experiments │
   │ GPU busy        │           │ Ollama active   │
   │ Ollama paused   │           │ Free tokens     │
   └─────────────────┘           └─────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `src/multi-expert/ollama-executor.ts` | Local LLM integration |
| `src/multi-expert/claude-executor.ts` | Claude API integration |
| `src/executive/self-improving-loop.ts` | Improvement cycle |
| `framework/validation/hypothesis-generator.ts` | Evidence-based hypothesis |
| `scripts/autonomous-experiment.ts` | Experiment runner |
| `.swarm/experiments/experiment-log.json` | Results storage |
