# Sartor: Multi-Tier AI Memory System

A production-ready, cost-optimized memory system combining cognitive memory types with intelligent storage tiering using Firebase, GitHub, and Vector Databases.

## Overview

This repository contains:

1. **Cognitive Memory Schema** - TypeScript interfaces for four memory types (Episodic, Semantic, Procedural, Working)
2. **Storage Architecture** - Three-tier data management system (Hot/Warm/Cold)
3. **Complete Implementation** - Ready-to-deploy system with automatic tiering, semantic search, and version control
4. **Uplifted Skills Library** - Evidence-based validation, engineering, and multi-agent orchestration
5. **Executive Claude Pattern** - Master orchestration for coordinating specialized agents

## Quick Navigation

**For Agents:**

- **[Agent Quickstart](./docs/AGENT_QUICKSTART.md)** - ONE-PAGE reference: current status, skills, how to use
- **[Documentation Index](./docs/INDEX.md)** - Complete navigation hub for all documentation
- **[Executive Claude](./EXECUTIVE_CLAUDE.md)** - Master orchestration pattern and delegation strategies

**For Developers:**

- **[Implementation Guide](./docs/implementation-guide.md)** - Step-by-step production setup
- **[Architecture Specification](./ARCHITECTURE.md)** - Complete technical specification
- **[Memory Schema Guide](./MEMORY_SCHEMA_GUIDE.md)** - Cognitive memory design philosophy

---

## Getting Started

### For AI Agents

If you're an AI agent tasked with understanding or working with this system, **start with the [Agent Quickstart](./docs/AGENT_QUICKSTART.md)**. It's a single-page reference that includes:

- Current implementation status
- What the system does (in plain language)
- Available skills and how to use them
- Quick start commands
- Links to detailed documentation

The quickstart is designed to be loaded in a single context window and provides everything you need to get oriented.

### For Human Developers

1. Read the **[README](./README.md)** (this file) for project overview
2. Review the **[Architecture](./ARCHITECTURE.md)** for technical design
3. Follow the **[Implementation Guide](./docs/implementation-guide.md)** for setup
4. Explore the **[Documentation Index](./docs/INDEX.md)** for deep dives

### For Executive Claude Instances

If you're orchestrating multi-agent workflows:

1. Review **[Executive Claude](./EXECUTIVE_CLAUDE.md)** for orchestration patterns
2. Load **[Agent Quickstart](./docs/AGENT_QUICKSTART.md)** to understand available skills
3. Use **intent-based delegation** (not step-by-step instructions)
4. Apply **context distillation** (84% token reduction)
5. Implement **quality gates** for validation

---

### Memory Types (Cognitive Layer)

1. **Episodic Memory** - Autobiographical memories of specific conversations and interactions
2. **Semantic Memory** - Decontextualized facts, preferences, and knowledge
3. **Procedural Memory** - Learned procedures, workflows, and patterns
4. **Working Memory** - Active session context and current focus

### Storage Tiers (Infrastructure Layer)

1. **Hot Tier (Firebase RTDB)** - Ultra-low latency (<100ms), active sessions, frequently accessed
2. **Warm Tier (Firestore + Vector DB)** - Semantic search (100-500ms), embeddings, medium-term storage
3. **Cold Tier (GitHub)** - Long-term archival (1-5s), version control, unlimited capacity

## Repository Structure

````
sartor-claude-network/
├── docs/
│   ├── tier2-warm-memory.md          # Firestore + Vector DB specification
│   ├── tier3-cold-memory.md          # GitHub repository structure
│   ├── synchronization-strategy.md   # Data flow between tiers
│   ├── implementation-guide.md       # Step-by-step setup
│   └── cost-analysis.md              # Pricing and optimization
│
├── config/
│   ├── firebase-config.json          # Firebase configuration
│   ├── vector-db-config.json         # Vector database settings
│   └── sync-config.json              # Synchronization rules
│
├── services/
│   ├── hot-tier/                     # Firebase RTDB implementation
│   ├── warm-tier/                    # Firestore + Vector DB
│   ├── sync/                         # Synchronization engine
│   └── api/                          # API gateway
│
├── scripts/
│   ├── consolidate.js                # GitHub consolidation
│   ├── generate-embeddings.js        # Embedding generation
│   └── setup-*.js                    # Setup scripts
│
├── ARCHITECTURE.md                   # Complete technical spec
├── memory-schema.ts                  # TypeScript schema
├── MEMORY_SCHEMA_GUIDE.md           # Cognitive memory guide
└── package.json                      # Dependencies

### Key Documents

**Quick Access:**
- **[Agent Quickstart](./docs/AGENT_QUICKSTART.md)** - ONE-PAGE reference for agents (start here!)
- **[Documentation Index](./docs/INDEX.md)** - Complete navigation hub for all documentation

**Storage Architecture:**
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete multi-tier storage specification with diagrams, schemas, and code
- **[Synchronization Strategy](./docs/synchronization-strategy.md)** - Data flow, promotion/demotion rules, conflict resolution
- **[Implementation Guide](./docs/implementation-guide.md)** - Production deployment guide
- **[Cost Analysis](./docs/cost-analysis.md)** - Detailed cost breakdown and optimization ($47-$515/month)

**Cognitive Memory Schema:**
- **[memory-schema.ts](./memory-schema.ts)** - TypeScript interfaces for episodic, semantic, procedural, and working memory
- **[MEMORY_SCHEMA_GUIDE.md](./MEMORY_SCHEMA_GUIDE.md)** - Design philosophy, usage patterns, testing
- **[memory-implementation-example.ts](./memory-implementation-example.ts)** - Complete implementation with storage backends
- **[mcp-server-config.json](./mcp-server-config.json)** - MCP tools for memory operations

**Skills & Orchestration:**
- **[Executive Claude](./EXECUTIVE_CLAUDE.md)** - Master orchestration pattern (intent-based delegation, context distillation)
- **[Skill Manifest](./src/skills/skill-manifest.ts)** - Six uplifted skills (validation, engineering, orchestration, debugging)
- **[Skill Types](./src/skills/skill-types.ts)** - TypeScript interfaces for skills architecture

**Mesh Architecture (NEW):**
- **[Memory Safety](./src/mcp/memory-safety.ts)** - Injection detection, trust levels, audit logging
- **[WebSocket Sync](./src/mcp/websocket-sync.ts)** - CRDT-based real-time mesh synchronization
- **[Knowledge Graph](./src/mcp/knowledge-graph.ts)** - Entity relationships, semantic links, graph queries
- **[Architecture Research](./docs/MESH_ARCHITECTURE_RESEARCH.md)** - Research findings and design proposals

## Key Features

### Temporal Awareness
Every memory tracks creation time, access history, and modification timestamps for temporal queries and analysis.

### Importance-Based Retention
Memories have importance scores that decay over time based on:
- Recency of access
- Access frequency
- User explicit importance
- Emotional significance
- Novelty

### Semantic Search
All memories include vector embeddings for semantic similarity search, plus full-text search and tag-based filtering.

### Cross-Surface Synchronization
Built-in support for syncing memories across Claude surfaces:
- Web interface
- Slack
- API
- Mobile apps
- Desktop apps
- Terminal/CLI

### Relational Structure
Memories can be linked through various relationship types:
- Temporal (preceded by, followed by)
- Semantic (similar to, contradicts, supports)
- Structural (part of, contains, derived from)
- Causal (caused by, causes)
- Procedural (prerequisite for, alternative to)

### Mesh Architecture (Multi-Instance Support)

Real-time synchronization across multiple Claude instances with:

**Safety Layer:**
- Prompt injection detection with 20+ threat patterns
- Trust levels: VERIFIED, TRUSTED, UNTRUSTED, QUARANTINED
- Full audit logging for all memory operations
- Human oversight hooks for suspicious content review

**CRDT-Based Sync:**
- G-Counter, PN-Counter for distributed counting
- LWW-Register for last-writer-wins values
- OR-Set for observed-remove sets
- LWW-Map for distributed key-value storage
- Vector clocks for causal ordering

**Knowledge Graph:**
- Entity types: MEMORY, CONCEPT, PERSON, PROJECT, etc.
- Relationship types: RELATED_TO, DERIVED_FROM, DEPENDS_ON, etc.
- BFS path finding and neighbor queries
- Semantic similarity detection
- Full-text search with reverse indexing

## Memory Types

### Episodic Memory

Stores specific conversation episodes with rich contextual detail:
- Full message history with timestamps
- Narrative structure (beginning, middle, end)
- Emotional context and sentiment
- Key moments and turning points
- Participant information
- Outcomes and follow-ups

**Use Cases:**
- Recalling previous conversations
- Understanding decision context
- Identifying behavior patterns
- Providing continuity across sessions

### Semantic Memory

Stores decontextualized facts and knowledge:
- Subject-predicate-object structure
- Confidence levels
- Evidence tracking
- Contradiction detection
- Preference vs. fact distinction

**Use Cases:**
- User preferences ("prefers dark mode")
- Personal information ("lives in San Francisco")
- Domain knowledge ("expert in Python")
- Beliefs and goals ("wants to learn ML")

### Procedural Memory

Stores learned procedures and workflows:
- Step-by-step instructions
- Applicability conditions
- Prerequisites and dependencies
- Success rate tracking
- Known failure modes
- Variations and alternatives

**Use Cases:**
- "How to set up a Python project"
- "User's preferred code review workflow"
- "Debugging process for React apps"
- "Steps for deploying to production"

### Working Memory

Maintains active session context:
- Current conversation focus
- Active goals and tasks
- Context stack for nested topics
- Recently activated memories
- Short time-to-live (cleared at session end)

**Use Cases:**
- Tracking current topic
- Maintaining context across topic switches
- Managing active goals
- Quick access to recent information

## Quick Start

### Production System Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your Firebase, GitHub, OpenAI, and Vector DB credentials

# 3. Initialize services
npm run setup:firebase     # Initialize Firebase
npm run setup:github       # Create GitHub repository
npm run setup:vector-db    # Set up Pinecone/Weaviate/Qdrant

# 4. Deploy
npm run deploy:firebase    # Deploy security rules
npm start                  # Start API server
````

### Using the Memory System

```typescript
import { MemorySystemImpl } from './memory-implementation-example';
import hotTier from './services/hot-tier';
import warmTier from './services/warm-tier';

// Initialize with multi-tier backend
const memorySystem = new MemorySystemImpl(
  warmTier, // Firestore + Vector DB
  warmTier, // Uses Pinecone/Weaviate/Qdrant
  hotTier // Firebase RTDB cache
);

// Create a semantic memory (automatically stored in warm tier)
const preference = await memorySystem.createSemanticMemory({
  content: {
    subject: 'user_123',
    predicate: 'prefers',
    object: 'dark mode',
    statement: 'User prefers dark mode for coding',
  },
  knowledgeType: KnowledgeType.PREFERENCE,
  confidence: ConfidenceLevel.HIGH,
});

// Query with semantic search (searches across all tiers)
const memories = await memorySystem.recall({
  query: "What are the user's UI preferences?",
  types: [MemoryType.SEMANTIC],
  limit: 5,
});
// Automatically promotes frequently accessed memories to hot tier
```

### API Usage

```bash
# Query memories
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "deployment issues last week",
    "userId": "user_123",
    "searchType": "hybrid"
  }'

# Create memory
curl -X POST http://localhost:3000/api/memories \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Deployment completed successfully",
    "type": "event",
    "userId": "user_123",
    "tags": ["deployment", "production"]
  }'
```

## Complete Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MCP Server / API Layer                   │
│  (Tools, Resources, REST API, WebSocket)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Memory System Core                         │
│  ┌──────────┬──────────┬──────────┬──────────┐             │
│  │ Episodic │ Semantic │Procedural│ Working  │             │
│  │  Memory  │  Memory  │  Memory  │  Memory  │             │
│  └──────────┴──────────┴──────────┴──────────┘             │
│                                                              │
│  Features: Importance Scoring • Decay • Consolidation       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Multi-Tier Storage System                    │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  HOT TIER    │  │  WARM TIER   │  │  COLD TIER   │     │
│  │              │  │              │  │              │     │
│  │ Firebase     │  │ Firestore +  │  │  GitHub      │     │
│  │ RTDB         │  │ Vector DB    │  │  Repository  │     │
│  │              │  │              │  │              │     │
│  │ <100ms       │  │ 100-500ms    │  │  1-5s        │     │
│  │ Sessions     │  │ Semantic     │  │  Archive     │     │
│  │ Active Data  │  │ Search       │  │  Versioning  │     │
│  │ TTL: 1-24hrs │  │ Embeddings   │  │  Unlimited   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         ▲                  ▲                  ▲             │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            │                                │
│                  ┌─────────▼─────────┐                      │
│                  │  Sync Engine      │                      │
│                  │  • Promotion      │                      │
│                  │  • Demotion       │                      │
│                  │  • Consolidation  │                      │
│                  └───────────────────┘                      │
└─────────────────────────────────────────────────────────────┘

Data Flow Example:
1. User creates memory → Warm tier (Firestore + Vector DB)
2. Frequent access → Promoted to Hot tier (Firebase RTDB)
3. Low access → Demoted to Cold tier (GitHub)
4. Search query → Checks all tiers, aggregates results
```

## Design Principles

1. **Type Safety** - Comprehensive TypeScript interfaces with strict typing
2. **Flexibility** - Support multiple storage backends and embedding models
3. **Performance** - Optimized indexes, caching, and batch operations
4. **Privacy** - Built-in support for data encryption and user isolation
5. **Scalability** - Horizontal partitioning by user ID
6. **Observability** - Statistics, metrics, and audit trails

## Cost Analysis

### Monthly Pricing (Optimized Configuration)

**Starter (100-1,000 users): $47/month**

```
Hot Tier (Firebase RTDB):        $8/month
Warm Tier (Firestore + Qdrant):  $35/month
Cold Tier (GitHub):               $4/month
Embeddings (OpenAI):              $0.01/month
```

**Growth (1,000-10,000 users): $95/month**

```
Hot Tier:    $25/month
Warm Tier:   $66/month
Cold Tier:   $4/month
```

**Scale (10,000+ users): $350/month**

```
Hot Tier:    $120/month
Warm Tier:   $226/month
Cold Tier:   $4/month
```

**Cost per User:**

- 100 users: $0.47/user/month
- 1,000 users: $0.095/user/month
- 10,000 users: $0.035/user/month

See [docs/cost-analysis.md](./docs/cost-analysis.md) for detailed breakdown and optimization strategies.

## Technology Stack

### Hot Tier

- **Firebase Realtime Database** - Sub-100ms latency, real-time sync
- TTL-based eviction, size limits, LRU caching

### Warm Tier

- **Firestore** - Scalable document database with rich queries
- **Vector Database** (choose one):
  - Pinecone: $70/month (managed, 100K vectors)
  - Qdrant: $25/month (managed, 1M vectors) **[Recommended]**
  - Weaviate: $50/month (self-hosted, unlimited)

### Cold Tier

- **GitHub** - Version control, unlimited storage, $4/month private repo
- **GitHub Actions** - Automated consolidation, 2,000 min/month free

### Embeddings

- **OpenAI text-embedding-3-small** - $0.020 per 1M tokens
- 1536 dimensions, cosine similarity

## Key Algorithms

### Importance Calculation

```typescript
importance = weighted_sum([
  recency_factor * 0.25,
  frequency_factor * 0.2,
  user_explicit * 0.3,
  emotional_factor * 0.15,
  novelty_factor * 0.1,
]);
```

### Exponential Decay

```typescript
new_importance = current_importance * exp(-decay_rate * time_since_access);
```

### Memory Consolidation

- **Merge** - Combine similar memories
- **Summarize** - Create abstract summary
- **Abstract** - Extract general pattern
- **Pattern Extract** - Create procedural memory from repetition

## MCP Tools

The schema is designed to work with these MCP tools:

- `store_episodic_memory` - Store conversation episodes
- `store_semantic_memory` - Store facts and preferences
- `store_procedural_memory` - Store workflows and patterns
- `recall_memories` - Semantic search and retrieval
- `update_memory` - Update memory metadata
- `consolidate_memories` - Combine related memories
- `apply_decay` - Run decay algorithm
- `get_memory_stats` - System statistics
- `detect_conflicts` - Find contradictions
- `archive_memories` - Archive old memories

## Performance Metrics

**Latency Targets (p95):**

- Hot tier reads: <100ms
- Warm tier semantic search: <500ms
- Cold tier retrieval: <5s
- Cross-tier queries: <800ms

**Throughput:**

- Queries: 1,000 req/s
- Writes: 500 req/s
- Synchronization: 100 memories/s

**Storage Limits:**

- Hot tier: 100MB (enforced)
- Warm tier: Unlimited (Firestore), up to 2M vectors
- Cold tier: Unlimited (GitHub)

## Testing

```bash
# Run all tests
npm test

# Tier-specific tests
npm run test:hot        # Firebase RTDB
npm run test:warm       # Firestore + Vector DB
npm run test:sync       # Synchronization engine

# Integration tests
npm run test:integration

# Load tests
npm run test:load
```

See `MEMORY_SCHEMA_GUIDE.md` for comprehensive testing recommendations.

## Monitoring & Observability

View real-time metrics:

```bash
curl http://localhost:3000/api/metrics
```

Response:

```json
{
  "tiers": {
    "hot": { "count": 45, "size": 2048000, "hitRate": 0.82 },
    "warm": { "count": 1234, "vectorCount": 1234 },
    "cold": { "count": 50000, "commits": 1523 }
  },
  "sync": {
    "promotions": { "day": 23, "week": 156 },
    "demotions": { "day": 45, "week": 312 },
    "queueDepth": 5
  },
  "costs": {
    "daily": 2.35,
    "monthly": 67.5,
    "projected": 75.0
  },
  "performance": {
    "hotLatencyP95": 87,
    "warmLatencyP95": 432,
    "coldLatencyP95": 3200
  }
}
```

## Future Enhancements

**Storage Architecture:**

- [ ] Multi-region support
- [ ] Edge caching with Cloudflare
- [ ] Self-hosted vector DB option
- [ ] GraphQL API
- [ ] Mobile SDKs (iOS/Android)

**Cognitive Features:**

- [ ] Emotional memory tier
- [ ] Meta-memory (memories about memories)
- [ ] Collaborative memory (shared across users)
- [ ] Memory visualization and graph browser
- [ ] Fine-grained privacy controls
- [ ] Memory export in standard formats

**AI/ML:**

- [ ] ML-based promotion scoring
- [ ] Automatic summarization
- [ ] Conflict prediction
- [ ] Anomaly detection

## References

This schema is inspired by:

- Human memory psychology (Tulving's memory systems)
- Spreading activation theory
- ACT-R cognitive architecture
- Modern vector databases
- LangChain and AutoGPT memory implementations

## Production Deployment

### Prerequisites Checklist

- [ ] Firebase project created
- [ ] Firestore indexes deployed
- [ ] Firebase security rules deployed
- [ ] GitHub repository created and configured
- [ ] GitHub Actions workflows set up
- [ ] GitHub secrets added
- [ ] Vector database index created
- [ ] OpenAI API key configured
- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] Tests passing
- [ ] Monitoring dashboard configured

### Deployment Steps

```bash
# 1. Deploy Firebase
firebase deploy --only firestore,database,functions

# 2. Set up GitHub Actions
gh workflow sync
gh workflow enable consolidate-memories

# 3. Initialize vector database
npm run setup:vector-db

# 4. Start API server
npm start

# 5. Verify health
curl http://localhost:3000/api/health
```

## Security

- **Firebase Security Rules** - Enforced read/write permissions
- **API Authentication** - Firebase Auth integration
- **Service Accounts** - Separate credentials for automation
- **Environment Variables** - Secure credential management
- **GitHub Repository** - Private by default, granular access control
- **Data Encryption** - At-rest and in-transit encryption

## Support & Documentation

- **Complete Documentation**: See [/docs](./docs) folder
- **Architecture Spec**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Memory Schema Guide**: [MEMORY_SCHEMA_GUIDE.md](./MEMORY_SCHEMA_GUIDE.md)
- **Issues**: [GitHub Issues](https://github.com/sartor/claude-network/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sartor/claude-network/discussions)

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Contributing

Contributions welcome! Areas for improvement:

- Additional storage backend implementations
- Embedding model integrations (Cohere, Anthropic, etc.)
- Advanced consolidation strategies
- Conflict resolution algorithms
- Memory visualization tools
- Performance optimizations
- Documentation improvements

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Credits

**Built with:**

- [Firebase](https://firebase.google.com/) - Google Cloud
- [GitHub](https://github.com/) - Microsoft
- [Pinecone](https://www.pinecone.io/) / [Weaviate](https://weaviate.io/) / [Qdrant](https://qdrant.tech/) - Vector Databases
- [OpenAI](https://openai.com/) - Embeddings API

**Inspired by:**

- Human memory psychology (Tulving's memory systems)
- Spreading activation theory
- ACT-R cognitive architecture
- LangChain and AutoGPT memory implementations

---

**Version**: 1.0.0
**Last Updated**: 2025-12-06
**Status**: Production Ready
**Maintainer**: Sartor Team
