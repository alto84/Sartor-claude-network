# Comprehensive Test Plan - Sartor Network

**Date:** November 4, 2025
**Purpose:** Thorough testing and documentation of all Sartor Network features
**Test Approach:** Parallel testing with multiple sub-agents using different models

---

## Test Categories

### 1. Core Connectivity Tests
- [ ] **T1.1** - Fresh agent connection via install.py
- [ ] **T1.2** - Direct bootstrap.py execution
- [ ] **T1.3** - Python one-liner execution
- [ ] **T1.4** - Connection persistence across sessions
- [ ] **T1.5** - Multiple agents connecting simultaneously
- [ ] **T1.6** - Agent reconnection after disconnect
- [ ] **T1.7** - Network status reporting

### 2. Communication Tests
- [ ] **T2.1** - Direct message sending between two agents
- [ ] **T2.2** - Broadcast message to all agents
- [ ] **T2.3** - Message reading and acknowledgment
- [ ] **T2.4** - Message ordering and timestamps
- [ ] **T2.5** - Large message handling (>10KB)
- [ ] **T2.6** - Message persistence after sender disconnect
- [ ] **T2.7** - Unread message tracking

### 3. Task Coordination Tests
- [ ] **T3.1** - Create task and list available tasks
- [ ] **T3.2** - Claim task (single agent)
- [ ] **T3.3** - Task race condition (multiple agents claiming same task)
- [ ] **T3.4** - Update task status to completed
- [ ] **T3.5** - Task priority handling
- [ ] **T3.6** - Task assignment to specific agent
- [ ] **T3.7** - Task cancellation

### 4. Knowledge Base Tests
- [ ] **T4.1** - Add knowledge entry
- [ ] **T4.2** - Query knowledge by keyword
- [ ] **T4.3** - Query knowledge by tags
- [ ] **T4.4** - Knowledge versioning/updates
- [ ] **T4.5** - Knowledge deletion
- [ ] **T4.6** - Large knowledge entries (>100KB)
- [ ] **T4.7** - Knowledge search performance

### 5. Agent Discovery Tests
- [ ] **T5.1** - List all connected agents
- [ ] **T5.2** - Query specific agent status
- [ ] **T5.3** - Agent capability discovery
- [ ] **T5.4** - Agent presence tracking (online/offline)
- [ ] **T5.5** - Agent parent-child relationship tracking
- [ ] **T5.6** - Agent heartbeat mechanism

### 6. Sub-Agent Onboarding Tests
- [ ] **T6.1** - Spawn sub-agent with auto-onboarding
- [ ] **T6.2** - Sub-agent inherits parent context
- [ ] **T6.3** - Sub-agent can communicate with network
- [ ] **T6.4** - Sub-agent can access knowledge base
- [ ] **T6.5** - Sub-agent can claim tasks
- [ ] **T6.6** - Multi-level sub-agent hierarchy (grandchildren)
- [ ] **T6.7** - Sub-agent reporting back to parent

### 7. Agent Mail System Tests (NEW - TO BE IMPLEMENTED)
- [ ] **T7.1** - Send async mail to sub-agent
- [ ] **T7.2** - Sub-agent checks mailbox
- [ ] **T7.3** - Mail notification system
- [ ] **T7.4** - Mail threading/conversations
- [ ] **T7.5** - Mail attachments (knowledge references)
- [ ] **T7.6** - Mail search and filtering
- [ ] **T7.7** - Mail archiving

### 8. Performance Tests
- [ ] **T8.1** - Connection latency measurement
- [ ] **T8.2** - Message throughput (100 messages/sec)
- [ ] **T8.3** - Concurrent agent stress test (20+ agents)
- [ ] **T8.4** - Large knowledge base query performance
- [ ] **T8.5** - Network resilience under load
- [ ] **T8.6** - Firebase API rate limiting handling
- [ ] **T8.7** - Memory usage monitoring

### 9. Error Handling Tests
- [ ] **T9.1** - Network disconnection recovery
- [ ] **T9.2** - Invalid message format handling
- [ ] **T9.3** - Non-existent agent messaging
- [ ] **T9.4** - Task claim conflict resolution
- [ ] **T9.5** - Firebase authentication errors
- [ ] **T9.6** - Malformed data handling
- [ ] **T9.7** - Timeout handling

### 10. Skill Integration Tests (NEW - TO BE IMPLEMENTED)
- [ ] **T10.1** - Load sartor-network skill
- [ ] **T10.2** - Skill provides network commands
- [ ] **T10.3** - Skill auto-loads on agent startup
- [ ] **T10.4** - Skill documentation accessible
- [ ] **T10.5** - Skill version compatibility
- [ ] **T10.6** - Multiple skill loading
- [ ] **T10.7** - Skill unloading/reloading

### 11. Non-Python Bootstrap Tests (NEW - TO BE IMPLEMENTED)
- [ ] **T11.1** - JavaScript/Node.js bootstrap
- [ ] **T11.2** - Bash/curl only bootstrap
- [ ] **T11.3** - Browser-based bootstrap
- [ ] **T11.4** - Cross-language compatibility
- [ ] **T11.5** - Minimal dependency bootstrap
- [ ] **T11.6** - Embedded documentation
- [ ] **T11.7** - Platform independence

### 12. Security Tests
- [ ] **T12.1** - Agent authentication (future)
- [ ] **T12.2** - Message encryption (future)
- [ ] **T12.3** - Access control enforcement
- [ ] **T12.4** - Rate limiting protection
- [ ] **T12.5** - Input validation
- [ ] **T12.6** - SQL/NoSQL injection prevention
- [ ] **T12.7** - Audit logging

---

## Test Execution Plan

### Phase 1: Parallel Feature Testing (10+ Agents)
Deploy specialized test agents to validate each major category:

1. **Connectivity-Tester** (Haiku) - Tests T1.x
2. **Communication-Tester** (Sonnet) - Tests T2.x
3. **Task-Tester** (Haiku) - Tests T3.x
4. **Knowledge-Tester** (Sonnet) - Tests T4.x
5. **Discovery-Tester** (Haiku) - Tests T5.x
6. **SubAgent-Tester** (Sonnet) - Tests T6.x
7. **Performance-Tester** (Opus) - Tests T8.x
8. **Error-Tester** (Haiku) - Tests T9.x
9. **Integration-Tester-A** (Sonnet) - Combined scenarios
10. **Integration-Tester-B** (Haiku) - Combined scenarios
11. **Load-Generator** (Haiku) - Generate network traffic
12. **Monitor-Agent** (Sonnet) - Monitor and report all activity

### Phase 2: Missing Feature Implementation
Based on test results, implement:
1. Agent Mail System (T7.x)
2. Skill Loading System (T10.x)
3. Non-Python Bootstrap (T11.x)

### Phase 3: Verification & Re-testing
Re-run all tests after fixes with different agent combinations

### Phase 4: Final Audit
Independent verification of all claimed fixes

---

## Success Criteria

- ✅ 100% of existing features pass tests (T1-T6, T8-T9)
- ✅ All missing features identified and documented
- ✅ Implementation plan created for missing features
- ✅ Performance meets targets (<100ms avg latency)
- ✅ No critical bugs or race conditions
- ✅ Comprehensive documentation updated
- ✅ All test results independently verified

---

## Test Data Collection

Each test agent will report:
1. Test ID and description
2. Pass/Fail status
3. Execution time
4. Error messages (if any)
5. Performance metrics
6. Recommendations for improvement

All results will be aggregated and analyzed before creating the final TODO list.

---

## Notes

- Tests will be run in parallel to simulate real network conditions
- Each test agent is independent and reports separately
- Test results will be cross-verified by multiple agents
- No trust in self-reported "success" - all claims must be verified
- Focus on edge cases and failure modes, not just happy paths
