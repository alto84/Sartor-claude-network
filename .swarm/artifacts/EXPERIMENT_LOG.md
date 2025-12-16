# Orchestrator Background Agent Experiments

**Started**: 2025-12-15 16:20 UTC
**Researcher**: Claude (autonomous experimentation while user away)
**Objective**: Test hypotheses about how orchestrator background agents could work

---

## Hypotheses

### H1: Self-Perpetuation Reliability
**Question**: Can an agent reliably spawn its own successor before timeout?
**Test**: Create agent with explicit instruction to spawn continuation
**Success Criteria**: Chain of 3+ agents, each spawning the next
**Timeout Config**: 600s (10 min) - short enough to test quickly

### H2: Nested Spawning Depth
**Question**: Can we achieve Agent A → Agent B → Agent C nesting?
**Test**: Create orchestrator that spawns workers, workers spawn specialists
**Success Criteria**: See requests created by non-root agents
**Timeout Config**: 900s (15 min) per agent

### H3: State Persistence Across Generations
**Question**: Can agents pass complex state via artifacts?
**Test**: Agent writes state, successor reads and extends it
**Success Criteria**: State file grows across iterations
**Timeout Config**: 600s (10 min)

### H4: Parallel Agent Coordination
**Question**: Can multiple agents coordinate via shared artifacts?
**Test**: Spawn 3 researchers, have synthesizer read all their outputs
**Success Criteria**: Synthesizer produces combined report
**Timeout Config**: 900s (15 min)

### H5: Timeout Impact on Quality
**Question**: Do longer timeouts produce better agent outputs?
**Test**: Same task with 300s, 600s, 1200s timeouts
**Success Criteria**: Compare output length/quality across timeouts
**Timeout Config**: Variable

---

## Experiment Log

### Experiment 1: Self-Perpetuation Chain
**Time**: Starting now
**Config**: 600s timeout, max 3 concurrent
**Agent**: self-perpetuator with iteration counter

### Results will be logged below as experiments complete...

---

## Monitoring Commands
```bash
# Watch coordinator
tail -f /home/alton/.swarm/coordinator.log

# Count results
ls .swarm/results/*.json | wc -l

# Check state file
cat .swarm/artifacts/perpetuation-state.json
```
