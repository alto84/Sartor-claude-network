# Sartor Documentation Index

**Claude Memory System - Complete Documentation Hub**

---

## Quick Start

**New to Sartor?** Start here:

1. **[Agent Quickstart](./AGENT_QUICKSTART.md)** - ONE-PAGE reference for agents
   - Current status and roadmap
   - Available skills and how to use them
   - Quick start commands
   - Design principles

2. **[README](../README.md)** - Project overview
   - What Sartor does
   - Key features
   - Technology stack
   - Quick start guide

3. **[Architecture](../ARCHITECTURE.md)** - Complete technical specification
   - Multi-tier storage design
   - Data flow diagrams
   - API specifications
   - Performance characteristics

---

## Core Concepts

### Memory System

**[Memory Schema Guide](../MEMORY_SCHEMA_GUIDE.md)**

- Cognitive memory types (Episodic, Semantic, Procedural, Working)
- Design philosophy and usage patterns
- Testing and validation strategies
- MCP integration patterns

**Memory Implementation**

- TypeScript interfaces: `memory-schema.ts`
- Example implementation: `memory-implementation-example.ts`
- MCP server configuration: `mcp-server-config.json`

### Multi-Tier Storage

**Three-Tier Architecture:**

1. **Hot Tier (Firebase RTDB)**
   - Ultra-low latency (<100ms)
   - Active sessions and frequently accessed data
   - TTL-based eviction (1-24 hours)
   - Size limit: 100MB

2. **[Warm Tier (Firestore + Vector DB)](./tier2-warm-memory.md)**
   - Semantic search (100-500ms)
   - Embeddings and medium-term storage
   - Scalable document database
   - Vector search capabilities

3. **[Cold Tier (GitHub)](./tier3-cold-memory.md)**
   - Long-term archival (1-5s)
   - Version control and unlimited capacity
   - Automated consolidation
   - Git-based workflows

**[Synchronization Strategy](./synchronization-strategy.md)**

- Data flow between tiers
- Promotion and demotion rules
- Conflict resolution
- Consistency guarantees

---

## Implementation

### Setup & Deployment

**[Implementation Guide](./implementation-guide.md)**

- Step-by-step production setup
- Environment configuration
- Service initialization
- Security rules deployment

**Prerequisites Checklist:**

```bash
# Required Services
- Firebase project (Realtime Database + Firestore)
- GitHub repository (private)
- Vector database (Qdrant/Pinecone/Weaviate)
- OpenAI API key (embeddings)

# Installation
npm install
cp .env.example .env
npm run setup:firebase
npm run setup:github
npm run setup:vector-db
npm run deploy:firebase
```

### Cost & Performance

**[Cost Analysis](./cost-analysis.md)**

- Detailed pricing breakdown by tier
- Optimization strategies
- Scaling scenarios
- Per-user cost calculations

**Performance Targets:**

- Hot tier: <100ms (p95)
- Warm tier: <500ms semantic search
- Cold tier: <5s retrieval
- Throughput: 1,000 queries/sec

**Cost Summary:**

- Starter (100 users): $47/month ($0.47/user)
- Growth (1,000 users): $95/month ($0.095/user)
- Scale (10,000+ users): $350/month ($0.035/user)

---

## Skills & Orchestration

### Executive Claude Pattern

**[Executive Claude: Master Orchestration](../EXECUTIVE_CLAUDE.md)**

**Core Philosophy:**

1. **Intent-Based Leadership** - Delegate outcomes, not steps
2. **Context Minimalism** - 84% token reduction through distillation
3. **Quality Gates** - Validate without micromanaging
4. **Synthesis Patterns** - Create insights, not aggregations
5. **Continuous Learning** - Every session improves the next

**Key Patterns:**

- Parallel fan-out for independent tasks
- Serial chains for dependent workflows
- Recursive decomposition for complex problems
- Competitive exploration for best approach
- Three-tier memory integration

### Skills Library

**[Skill Manifest](../src/skills/skill-manifest.ts)** - Complete skill definitions

**Available Skills:**

#### Foundation Skills

- `evidence-based-validation` - Validate claims with empirical evidence
- `evidence-based-engineering` - Apply research to engineering decisions
- `agent-communication` - Inter-agent messaging with quality gates

#### Infrastructure Skills

- `multi-agent-orchestration` - Coordinate specialized workers
- `distributed-systems-debugging` - Systematic failure investigation

#### Specialist Skills

- `mcp-server-development` - Build MCP servers with best practices

**Skill Architecture:**

- **Level 1:** Summary (always loaded, ~50 tokens)
- **Level 2:** Instructions (loaded on trigger, ~500 tokens)
- **Level 3:** Resources (lazy-loaded, ~2-5K tokens)

**Progressive Loading:**

```
Agent sees task → Level 1 triggers → Level 2 loads → Level 3 on demand
```

---

## Reference Documentation

### API & Schemas

**MCP Tools:**

- `store_episodic_memory` - Store conversation episodes
- `store_semantic_memory` - Store facts and preferences
- `store_procedural_memory` - Store workflows
- `recall_memories` - Semantic search and retrieval
- `update_memory` - Update memory metadata
- `consolidate_memories` - Merge related memories
- `apply_decay` - Run importance decay
- `get_memory_stats` - System statistics

**TypeScript Interfaces:**

```typescript
// Core types
interface MemorySystem {
  createEpisodicMemory(params: EpisodicMemoryParams): Promise<Memory>;
  createSemanticMemory(params: SemanticMemoryParams): Promise<Memory>;
  recall(query: RecallQuery): Promise<Memory[]>;
  consolidate(strategy: ConsolidationStrategy): Promise<void>;
}

// Skill types
interface SkillManifest {
  id: string;
  summary: string;       // Level 1: Always loaded
  instructions: {...};   // Level 2: Loaded on trigger
  resources: [...];      // Level 3: Lazy-loaded
}
```

### Configuration Files

**Environment Variables:**

```bash
# Firebase
FIREBASE_API_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_DATABASE_URL=

# Vector Database
VECTOR_DB_API_KEY=
VECTOR_DB_ENVIRONMENT=

# OpenAI
OPENAI_API_KEY=

# GitHub
GITHUB_TOKEN=
GITHUB_REPO=
```

**Firebase Configuration:**

- `firebase-config.json` - Firebase project settings
- `firestore.rules` - Security rules
- `database.rules.json` - RTDB security rules

**Vector Database:**

- `vector-db-config.json` - Vector DB settings
- Supported: Qdrant (recommended), Pinecone, Weaviate

**Synchronization:**

- `sync-config.json` - Sync rules and schedules

---

## Testing & Quality

### Test Suites

```bash
# Run all tests
npm test

# Tier-specific tests
npm run test:hot         # Firebase RTDB
npm run test:warm        # Firestore + Vector DB
npm run test:sync        # Synchronization engine

# Integration tests
npm run test:integration

# Load tests
npm run test:load
```

### Quality Assurance

**Validation Levels:**

1. **Automated Checks** - Tests pass, builds succeed, constraints met
2. **Semantic Review** - Intent aligned, quality acceptable, no obvious gaps
3. **User Value Check** - Solves the actual problem

**Evidence-Based Validation:**

- All claims backed by empirical evidence
- Research papers and benchmarks cited
- Quantitative analysis preferred
- Confidence levels explicit

---

## Architecture Diagrams

### Multi-Tier Storage Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     MCP Server / API Layer                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Memory System Core                         │
│  ┌──────────┬──────────┬──────────┬──────────┐             │
│  │ Episodic │ Semantic │Procedural│ Working  │             │
│  └──────────┴──────────┴──────────┴──────────┘             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Multi-Tier Storage System                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  HOT TIER    │  │  WARM TIER   │  │  COLD TIER   │     │
│  │  Firebase    │  │  Firestore + │  │  GitHub      │     │
│  │  RTDB        │  │  Vector DB   │  │  Repository  │     │
│  │  <100ms      │  │  100-500ms   │  │  1-5s        │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         ▲                  ▲                  ▲             │
│         └──────────────────┼──────────────────┘             │
│                  ┌─────────▼─────────┐                      │
│                  │  Sync Engine      │                      │
│                  │  • Promotion      │                      │
│                  │  • Demotion       │                      │
│                  │  • Consolidation  │                      │
│                  └───────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

### Three-Tier Memory Architecture

```
┌─────────────────────────────────────────────────┐
│ ARCHIVE MEMORY (Long-term Knowledge)            │
│ - Persistent across all sessions                │
│ - Team conventions, codebase patterns           │
│ - Learnings from past projects                  │
└───────────────────┬─────────────────────────────┘
                    │
          ┌─────────▼──────────┐
          │ SLOW MEMORY        │
          │ (Session Archive)  │
          │ - This session     │
          │ - Decisions made   │
          │ - Patterns found   │
          └─────────┬──────────┘
                    │
              ┌─────▼─────┐
              │FAST MEMORY│
              │ (Working)  │
              │ - Current  │
              │   task     │
              └───────────┘
```

---

## Development Workflow

### Git Workflow

```bash
# Feature development
git checkout -b feature/new-skill
# ... make changes ...
git add .
git commit -m "Add new skill: refinement-loop"
git push origin feature/new-skill

# Create PR (automated via gh CLI)
gh pr create --title "Add refinement loop skill" --body "..."

# Review and merge
```

### Skill Development

1. Define skill manifest in `src/skills/skill-manifest.ts`
2. Implement skill logic
3. Add tests
4. Update documentation
5. Submit PR

**Skill Template:**

```typescript
export const NEW_SKILL: SkillManifest = {
  id: 'new-skill',
  name: 'New Skill',
  version: '1.0.0',
  summary: '~50 token description',
  triggers: [...],
  tier: SkillTier.SPECIALIST,
  dependencies: [...],
  instructions: {...},
  resources: [...],
  metadata: {...},
  performance: {...},
  memory: {...}
};
```

---

## Troubleshooting

### Common Issues

**Firebase Connection Issues:**

- Verify `FIREBASE_API_KEY` in `.env`
- Check Firebase project permissions
- Ensure security rules are deployed

**Vector DB Issues:**

- Confirm API key is valid
- Check index exists and is initialized
- Verify embedding dimensions match (1536 for OpenAI)

**Synchronization Issues:**

- Check sync-config.json schedules
- Review GitHub Actions workflow logs
- Verify GitHub token permissions

**Performance Issues:**

- Enable performance monitoring in Firebase
- Check vector DB index performance
- Review query patterns and optimize

### Debug Commands

```bash
# Check system health
curl http://localhost:3000/api/health

# View metrics
curl http://localhost:3000/api/metrics

# Test Firebase connection
npm run test:firebase

# Test vector DB connection
npm run test:vector-db

# Validate sync configuration
npm run validate:sync-config
```

---

## Contributing

### Areas for Improvement

- Additional storage backend implementations
- Embedding model integrations (Cohere, Anthropic, etc.)
- Advanced consolidation strategies
- Conflict resolution algorithms
- Memory visualization tools
- Performance optimizations
- Documentation improvements

### Guidelines

1. Follow TypeScript strict mode
2. Write comprehensive tests
3. Update documentation
4. Use evidence-based validation
5. Maintain backward compatibility

---

## Resources

### External Documentation

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [GitHub Actions](https://docs.github.com/en/actions)

### Research & Inspiration

- Tulving's memory systems (human memory psychology)
- Spreading activation theory
- ACT-R cognitive architecture
- LangChain memory implementations
- AutoGPT memory patterns

---

## Version History

**1.0.0** (2025-12-06)

- Initial production release
- Multi-tier storage architecture
- Six foundation skills
- Executive Claude orchestration pattern
- Complete documentation

---

## License & Credits

**License:** MIT License

**Built with:**

- Firebase (Google Cloud)
- GitHub (Microsoft)
- Qdrant / Pinecone / Weaviate (Vector Databases)
- OpenAI (Embeddings API)

**Maintainer:** Sartor Architecture Team

---

**Need Help?**

- Check [Agent Quickstart](./AGENT_QUICKSTART.md) for common tasks
- Review [Executive Claude](../EXECUTIVE_CLAUDE.md) for orchestration patterns
- Consult [Implementation Guide](./implementation-guide.md) for setup issues
