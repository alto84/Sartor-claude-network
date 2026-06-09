# Orchestrator Agent Experiment Plan

**Started**: 2025-12-15 16:20 UTC
**Experimenter**: Claude (Opus 4.5)
**User Status**: Away for meditation/family time

## Hypotheses to Test

### H1: Self-Perpetuation Works
**Hypothesis**: An agent can spawn a successor before timeout, creating a continuous chain.
**Test**: Launch agent with 5-min timeout, instruct it to spawn successor at 4 mins.
**Success Criteria**: At least 2 generations spawn successfully.

### H2: Child Agent Spawning Works
**Hypothesis**: Agents spawned by coordinator can write to .swarm/requests/ to spawn children.
**Test**: Launch parent agent that spawns 2 children with specific tasks.
**Success Criteria**: Children appear in results with correct parentRequestId.

### H3: State Persistence Between Generations
**Hypothesis**: Agents can pass state via artifacts between generations.
**Test**: Launch agent that writes state, successor reads and continues.
**Success Criteria**: State file shows progressive updates across generations.

### H4: Parallel Agent Coordination
**Hypothesis**: Multiple agents can coordinate via shared artifacts.
**Test**: Launch 3 agents that each write to a shared log and read others' entries.
**Success Criteria**: Final artifact shows entries from all 3 agents.

### H5: Long-Running Complex Task
**Hypothesis**: An agent can complete a meaningful 20+ minute task.
**Test**: Launch agent to do real codebase analysis.
**Success Criteria**: Produces useful output (not just test data).

## Experimental Setup

### Coordinator Config
- Timeout: 1800s (30 min) for most tests
- Max concurrent: 3 agents
- Monitoring: Tail coordinator log

### Monitoring Script
Running in background, logging to .swarm/artifacts/experiment-log.txt

### Test Agents
1. self-perpetuation-test (H1)
2. child-spawning-test (H2)
3. state-persistence-test (H3)
4. parallel-coordination-test-1/2/3 (H4)
5. real-task-test (H5)

## Timeline
- 16:20: Begin experiments
- Every 30 min: Check results, adjust
- When user returns: Present findings

## Notes
(Will be updated as experiments progress)
