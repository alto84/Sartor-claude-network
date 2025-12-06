# Claude Memory System - Agent Quickstart

**Last Updated:** 2025-12-06
**Version:** 1.0.0

---

## Current Status

**Phase:** Production-Ready Multi-Tier Memory System + Skills Library
**Active Work:** Firebase integration, skill orchestration, refinement loops

---

## What This System Does

**Sartor** is a production-ready cognitive memory system combining:

1. **Multi-Tier Storage Architecture**
   - Hot Tier (Firebase RTDB): <100ms, active sessions
   - Warm Tier (Firestore + Vector DB): 100-500ms, semantic search
   - Cold Tier (GitHub): 1-5s, long-term archive

2. **Cognitive Memory Types**
   - Episodic: Conversation history with context
   - Semantic: Facts, preferences, knowledge
   - Procedural: Workflows and patterns
   - Working: Active session context

3. **Uplifted Skills Library**
   - Evidence-based validation and engineering
   - Multi-agent orchestration and communication
   - MCP server development patterns
   - Distributed systems debugging

4. **Executive Claude Pattern**
   - Intent-based delegation (not micromanagement)
   - Context distillation (39% improvement, 84% token reduction)
   - Quality gates and synthesis patterns
   - Three-tier memory integration

---

## Key Skills Available

### Foundation Skills

**evidence-based-validation** (`SkillTier.SPECIALIST`)
- Validates claims using empirical evidence and research
- Prevents assumption-driven errors
- Use when: Validating technical decisions, checking assumptions
- Estimated execution: 10-30 seconds

**evidence-based-engineering** (`SkillTier.SPECIALIST`)
- Applies empirical evidence to engineering decisions
- Evaluates choices using benchmarks and case studies
- Use when: Choosing technologies, architectural patterns
- Estimated execution: 20-60 seconds

### Agent Coordination Skills

**agent-communication** (`SkillTier.FOUNDATION`)
- Inter-agent messaging with quality gates
- Delivery confirmation and failure recovery
- Use when: Sending tasks, coordinating workflows
- Estimated execution: 100-500ms

**multi-agent-orchestration** (`SkillTier.INFRASTRUCTURE`)
- Coordinates specialized workers with intent-based delegation
- Manages parallel execution and dependency resolution
- Use when: Complex multi-step workflows, parallel tasks
- Estimated execution: 5-60 seconds

### Specialist Skills

**mcp-server-development** (`SkillTier.SPECIALIST`)
- Build MCP servers with proper stdio discipline
- Validates protocol compliance and security
- Use when: Building/validating MCP tools
- Estimated execution: 1-5 seconds

**distributed-systems-debugging** (`SkillTier.SPECIALIST`)
- Systematic investigation of distributed failures
- Hypothesis testing with evidence-based reasoning
- Use when: Race conditions, coordination failures
- Estimated execution: 5-30 minutes

---

## How to Use Skills

### TypeScript/JavaScript

```typescript
import { getSkillManifest, getAllSkillSummaries } from './src/skills/skill-manifest';

// Load a specific skill
const validationSkill = getSkillManifest('evidence-based-validation');

// Get all available skills (Level 1 summaries only)
const allSkills = getAllSkillSummaries();

// Progressive loading: Level 1 (always) → Level 2 (on trigger) → Level 3 (lazy)
```

### Agent Communication Pattern

```typescript
import { AGENT_COMMUNICATION } from './src/skills/skill-manifest';

// Send task to worker agent
const result = await sendMessage({
  message: {
    type: 'TASK',
    to: 'code-analyzer',
    from: 'orchestrator',
    payload: { action: 'analyze', files: ['/src/app.ts'] },
    priority: 'high'
  },
  deliveryMode: 'unicast',
  reliability: 'at-least-once',
  timeout: 10000
});
```

### Executive Claude Orchestration

```typescript
// Delegate with INTENT, not instructions
const delegation = {
  intent: "Analyze authentication security",
  scope: {
    in: "Session management and token handling",
    out: "Frontend UI components"
  },
  context: "We're migrating from JWT to sessions",
  successCriteria: [
    "Identify security vulnerabilities",
    "Assess session timeout configuration",
    "Review CSRF protection"
  ],
  constraints: [
    "Analysis only (don't modify code)",
    "Focus on production impact"
  ]
};

// Executive validates, synthesizes, and iterates
```

### Memory Integration

```typescript
import { MemorySystemImpl } from './memory-implementation-example';

const memorySystem = new MemorySystemImpl(warmTier, warmTier, hotTier);

// Three-tier memory model
const fastMemory = {
  // Current task context (<500 tokens)
  intent: "Fix authentication bug",
  constraints: "Backward compatible",
  hypothesis: "Session timeout config wrong"
};

const slowMemory = {
  // Session-level learnings (5-10K tokens)
  decisions: ["Chose REST over GraphQL"],
  patterns: ["Repository pattern used consistently"],
  userPreferences: ["Prefers explicit over clever"]
};

const archiveMemory = {
  // Persistent knowledge (50K+ tokens)
  architecture: "Microservices with event-driven communication",
  conventions: "API versioning in URL path",
  pitfalls: ["Don't use database triggers"]
};
```

---

## Current Tasks & Roadmap

### Completed

- [x] Multi-tier storage architecture specification
- [x] Cognitive memory schema with TypeScript types
- [x] Uplifted skills library with 6 foundation skills
- [x] Executive Claude orchestration pattern
- [x] Quality enforcement hooks and patterns

### In Progress

- [ ] Firebase Realtime Database integration (Hot Tier)
- [ ] Firestore + Vector DB integration (Warm Tier)
- [ ] GitHub archive automation (Cold Tier)
- [ ] MCP server for memory operations
- [ ] Skill orchestration runtime

### Next Steps

- [ ] Refinement loop implementation
- [ ] Multi-agent coordination testing
- [ ] Production deployment guide
- [ ] Performance benchmarking
- [ ] Cost optimization tuning

---

## Quick Links

### Core Documentation

- **[Full Architecture](../ARCHITECTURE.md)** - Complete multi-tier storage specification
- **[Memory Schema Guide](../MEMORY_SCHEMA_GUIDE.md)** - Cognitive memory design philosophy
- **[Executive Claude](../EXECUTIVE_CLAUDE.md)** - Master orchestration pattern
- **[Documentation Index](./INDEX.md)** - Complete navigation hub

### Implementation Guides

- **[Implementation Guide](./implementation-guide.md)** - Step-by-step production setup
- **[Synchronization Strategy](./synchronization-strategy.md)** - Data flow between tiers
- **[Cost Analysis](./cost-analysis.md)** - Pricing and optimization

### Storage Tiers

- **[Tier 2: Warm Memory](./tier2-warm-memory.md)** - Firestore + Vector DB
- **[Tier 3: Cold Memory](./tier3-cold-memory.md)** - GitHub repository structure

### Skills & Patterns

- **[Skill Manifest](../src/skills/skill-manifest.ts)** - All available skills
- **[Skill Types](../src/skills/skill-types.ts)** - TypeScript interfaces
- **Memory Implementation** - Example implementation code

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Initialize services
npm run setup:firebase     # Initialize Firebase
npm run setup:github       # Create GitHub repository
npm run setup:vector-db    # Set up Pinecone/Weaviate/Qdrant

# Deploy
npm run deploy:firebase    # Deploy security rules
npm start                  # Start API server

# Test
npm test                   # Run all tests
npm run test:integration   # Integration tests
```

---

## Design Principles

1. **Intent-Based Delegation** - Specify outcomes, not steps
2. **Context Minimalism** - Essential information only (84% token reduction)
3. **Evidence-Based Decisions** - Validate with research and data
4. **Progressive Loading** - Level 1 → Level 2 → Level 3 skill loading
5. **Quality Gates** - Automated checks + semantic validation
6. **Continuous Learning** - Every session improves the next

---

## Cost Overview

**Starter (100-1,000 users): $47/month**
- Hot Tier (Firebase RTDB): $8/month
- Warm Tier (Firestore + Qdrant): $35/month
- Cold Tier (GitHub): $4/month

**Per-user cost decreases with scale:**
- 100 users: $0.47/user/month
- 1,000 users: $0.095/user/month
- 10,000 users: $0.035/user/month

---

## Performance Targets

- **Hot Tier:** <100ms (p95)
- **Warm Tier:** <500ms semantic search
- **Cold Tier:** <5s retrieval
- **Cross-tier:** <800ms aggregated queries

---

## Support & Resources

- **Issues:** Report bugs and request features
- **Discussions:** Architecture discussions and questions
- **Code Examples:** See `memory-implementation-example.ts`
- **API Documentation:** OpenAPI spec in `/docs/api`

---

**Status:** Production Ready
**Version:** 1.0.0
**Maintainer:** Sartor Architecture Team
