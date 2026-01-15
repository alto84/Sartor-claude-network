# Unified Life Management Architecture

## Executive Summary

This document defines the complete architecture for the **Sartor Life Management System** - a unified platform integrating:

- **Self-improving AI agents** (Sartor Claude Network)
- **Knowledge management** (Obsidian vault)
- **Life operations** (calendar, email, banking, health)
- **Smart home** (Home Assistant)
- **Family dashboard** (unified UI)

**Vision**: A single, seamless system where Claude (via Claude Code, Claude.ai, Claude Desktop) has contextual awareness of your entire life and can take action across all domains.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              HUMAN (Alton + Family)                             │
│                         Reviews, approves, directs                              │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│  Claude.ai    │           │  Claude Code  │           │Claude Desktop │
│  (Web)        │           │  (CLI)        │           │  (App)        │
│               │           │               │           │               │
│  Streamable   │           │  Direct       │           │  STDIO        │
│  HTTP + MCP   │           │  Integration  │           │  Transport    │
└───────────────┘           └───────────────┘           └───────────────┘
        │                             │                             │
        └─────────────────────────────┼─────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE MCP GATEWAY                                    │
│                     sartor-life.altonsartor.workers.dev                         │
│─────────────────────────────────────────────────────────────────────────────────│
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ obsidian │ │ calendar │ │  email   │ │  finance │ │   home   │              │
│  │   _*     │ │   _*     │ │   _*     │ │   _*     │ │   _*     │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ memory   │ │dashboard │ │  health  │ │   task   │ │  agent   │              │
│  │   _*     │ │   _*     │ │   _*     │ │   _*     │ │   _*     │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
│   LOCAL SERVICES      │   │   CLOUD SERVICES      │   │    EXTERNAL APIs      │
│   (Cloudflare Tunnel) │   │   (Firebase)          │   │    (OAuth2 Secured)   │
│                       │   │                       │   │                       │
│ ┌───────────────────┐ │   │ ┌───────────────────┐ │   │ ┌───────────────────┐ │
│ │ Obsidian REST API │ │   │ │ Firebase RTDB     │ │   │ │ Google Calendar   │ │
│ │ 127.0.0.1:27124   │ │   │ │ (Hot Memory)      │ │   │ │ Gmail API         │ │
│ └───────────────────┘ │   │ └───────────────────┘ │   │ └───────────────────┘ │
│ ┌───────────────────┐ │   │ ┌───────────────────┐ │   │ ┌───────────────────┐ │
│ │ Home Assistant    │ │   │ │ Firestore         │ │   │ │ Plaid (Banking)   │ │
│ │ 192.168.1.x:8123  │ │   │ │ (Warm Memory)     │ │   │ └───────────────────┘ │
│ └───────────────────┘ │   │ └───────────────────┘ │   │ ┌───────────────────┐ │
│ ┌───────────────────┐ │   │ ┌───────────────────┐ │   │ │ Health APIs       │ │
│ │ Ollama            │ │   │ │ GitHub Archive    │ │   │ │ (Apple Health,    │ │
│ │ gpuserver1:11434  │ │   │ │ (Cold Memory)     │ │   │ │  MyFitnessPal)    │ │
│ └───────────────────┘ │   │ └───────────────────┘ │   │ └───────────────────┘ │
└───────────────────────┘   └───────────────────────┘   └───────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        SARTOR CLAUDE NETWORK                                     │
│                       (Self-Improving Agent Core)                               │
│─────────────────────────────────────────────────────────────────────────────────│
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │ Executive Layer │  │  Memory System  │  │ Multi-Expert    │                 │
│  │                 │  │                 │  │                 │                 │
│  │ • Executive-    │  │ • Hot Tier      │  │ • Orchestrator  │                 │
│  │   Claude        │  │   <100ms        │  │ • Voting System │                 │
│  │ • Self-Improve  │  │ • Warm Tier     │  │ • Diversity     │                 │
│  │   Loop          │  │   100-500ms     │  │   Scorer        │                 │
│  │ • Learning      │  │ • Cold Tier     │  │ • Sandbox       │                 │
│  │   Pipeline      │  │   1-5s          │  │   Executor      │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │ Skills System   │  │ Validation      │  │ Coordination    │                 │
│  │                 │  │                 │  │                 │                 │
│  │ • 13+ Skills    │  │ • Hypothesis    │  │ • Work Distrib  │                 │
│  │ • Role Profiles │  │   Generator     │  │ • Plan Sync     │                 │
│  │ • Bootstrap     │  │ • Baseline      │  │ • Progress      │                 │
│  │   Loader        │  │   Tracker       │  │   Tracking      │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          FAMILY DASHBOARD                                        │
│                    (Next.js + shadcn/ui Self-Hosted)                            │
│─────────────────────────────────────────────────────────────────────────────────│
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                         DAILY OVERVIEW                                      │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │ │
│  │  │ Calendar │  │  Tasks   │  │ Weather  │  │ Finance  │  │  Health  │    │ │
│  │  │ 5 events │  │ 12 open  │  │ 72°F ☀️  │  │ Budget   │  │ 8k steps │    │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                         FAMILY MEMBERS                                      │ │
│  │    👤 Alton         👤 Spouse         👤 Child 1         👤 Child 2       │ │
│  │    5 tasks          3 tasks           Homework           Sports           │ │
│  │    Work 9-5         Meeting 2pm       due today          Practice 4pm     │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                         SMART HOME                                          │ │
│  │    🌡️ 72°F         💡 6 lights on     🔒 All locked     🚗 Home           │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Deep Dive

### 1. Memory System (3-Tier)

The memory system is the foundation - all life data flows through it.

| Tier | Backend | Latency | Capacity | Use Case |
|------|---------|---------|----------|----------|
| **Hot** | Firebase RTDB | <100ms | 1GB | Active context, session state, recent queries |
| **Warm** | Firestore | 100-500ms | 10GB | Semantic search, embeddings, patterns |
| **Cold** | GitHub Archive | 1-5s | Unlimited | Version history, long-term archive |

**Memory Types**:
- `EPISODIC`: Timestamped events (calendar entries, emails received, purchases)
- `SEMANTIC`: Facts and knowledge (contact info, preferences, learned patterns)
- `PROCEDURAL`: Workflows (morning routine, expense tracking, task management)
- `WORKING`: Current session context

**Key Files**:
- `src/memory/memory-system.ts` - Unified memory interface
- `src/memory/hot-tier.ts` - Firebase RTDB operations
- `src/memory/warm-tier.ts` - Firestore with semantic search
- `src/memory/cold-tier.ts` - GitHub archive operations
- `src/memory/importance-scoring.ts` - Priority and decay algorithms

### 2. MCP Gateway (Cloudflare Worker)

Central hub exposing all tools to Claude clients.

**Tool Categories**:

```typescript
// Knowledge Management
obsidian_list, obsidian_read, obsidian_write, obsidian_search, obsidian_daily

// Calendar
calendar_list_events, calendar_create_event, calendar_update_event, calendar_free_slots

// Email
email_list_inbox, email_read, email_send, email_search, email_draft

// Finance (Read-Only)
finance_accounts, finance_transactions, finance_budget_status

// Health
health_daily_summary, health_metrics, health_goals

// Smart Home
home_status, home_set_temperature, home_lights, home_locks, home_routines

// Memory
memory_create, memory_search, memory_recall, memory_update

// Dashboard
dashboard_summary, dashboard_family_status, dashboard_upcoming
```

### 3. Life API Integrations

#### 3.1 Google Workspace (Calendar + Gmail)

**Authentication**: OAuth 2.0 with refresh tokens
**Scopes**:
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/gmail.modify`

**Implementation**:
```typescript
// src/integrations/google-workspace.ts
export class GoogleWorkspaceClient {
  async getCalendarEvents(timeMin: Date, timeMax: Date): Promise<CalendarEvent[]>;
  async createCalendarEvent(event: NewCalendarEvent): Promise<CalendarEvent>;
  async listEmails(query: string, maxResults: number): Promise<Email[]>;
  async sendEmail(to: string, subject: string, body: string): Promise<void>;
}
```

#### 3.2 Plaid (Banking)

**Security**: Read-only access, no transaction initiation
**Data Available**:
- Account balances (checking, savings, credit)
- Transaction history
- Budget categories (auto-categorized)

**Implementation**:
```typescript
// src/integrations/plaid-client.ts
export class PlaidClient {
  async getAccounts(): Promise<Account[]>;
  async getTransactions(startDate: Date, endDate: Date): Promise<Transaction[]>;
  async getBalances(): Promise<Balance[]>;
}
```

**Privacy Rules**:
- Financial data NEVER stored in memory system
- Queried on-demand only
- Account numbers masked in responses
- No write operations

#### 3.3 Home Assistant

**Access**: Local API via Cloudflare Tunnel
**Capabilities**:
- Device states (lights, locks, thermostats, sensors)
- Automations and scenes
- Presence detection
- Energy monitoring

**Implementation**:
```typescript
// src/integrations/home-assistant.ts
export class HomeAssistantClient {
  async getStates(): Promise<EntityState[]>;
  async callService(domain: string, service: string, data: object): Promise<void>;
  async getHistory(entityId: string, startTime: Date): Promise<StateHistory>;
}
```

#### 3.4 Health APIs

**Apple Health** (via Shortcuts + HomeAssistant):
- Steps, active calories, heart rate
- Sleep data
- Workout history

**MyFitnessPal** (via unofficial API):
- Nutrition tracking
- Weight logs

### 4. Family Dashboard

**Technology Stack**:
- **Framework**: Next.js 14 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **Auth**: NextAuth.js with family member profiles
- **Hosting**: Self-hosted on home server or Vercel

**Core Views**:

1. **Dashboard Home**: Daily overview for entire family
2. **Calendar**: Combined family calendar with color-coding
3. **Tasks**: Shared task list with assignments
4. **Finance**: Budget tracking, bills, spending (read-only)
5. **Smart Home**: Device control and status
6. **Health**: Family health metrics (optional per member)

**Data Flow**:
```
Dashboard UI → Next.js API Routes → Cloudflare Worker → Integrations
                    ↓
              Sartor Memory (for personalization, patterns)
```

### 5. Self-Improving Agent Loop

The agent continuously learns from interactions:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SELF-IMPROVEMENT CYCLE                           │
│─────────────────────────────────────────────────────────────────────│
│                                                                     │
│    ┌──────────┐     ┌──────────┐     ┌──────────┐                 │
│    │ 1. GATHER│────▶│2. ANALYZE│────▶│3. GENERATE│                │
│    │   DATA   │     │ PATTERNS │     │HYPOTHESES │                │
│    └──────────┘     └──────────┘     └──────────┘                 │
│         │               │                  │                       │
│   User interactions  Pattern detection  Prioritized list          │
│   Calendar events    Failure modes       Evidence-based           │
│   Task completions   Success patterns                             │
│                                                                     │
│    ┌──────────┐     ┌──────────┐     ┌──────────┐                 │
│    │6. PERSIST│◀────│5. VALIDATE│◀────│4. EXPLORE │                │
│    │ LEARNING │     │  RESULTS  │     │  (cheap)  │                │
│    └──────────┘     └──────────┘     └──────────┘                 │
│         │               │                  │                       │
│   Memory system    Claude Opus        Ollama/qwen3:8b             │
│   Update patterns  Final judgment     $0 token cost               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Improvements Tracked**:
- Task completion patterns (best times, reminder effectiveness)
- Calendar conflict avoidance
- Email response patterns
- Smart home automation optimization
- Budget adherence strategies

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal**: Core infrastructure working end-to-end

1. **Obsidian Integration** (OBSIDIAN-INTEGRATION-PLAN.md)
   - Install Local REST API plugin
   - Configure Cloudflare Tunnel
   - Deploy basic MCP worker
   - Connect to Claude.ai

2. **Memory System Hardening**
   - Verify Firebase RTDB (hot tier)
   - Test Firestore queries (warm tier)
   - Confirm GitHub archive (cold tier)
   - Run tier sync validation

3. **MCP Gateway v1**
   - Obsidian tools working
   - Memory tools exposed
   - Basic auth (bearer token)

**Validation**: Can read/write Obsidian notes from Claude.ai

### Phase 2: Google Integration (Week 2-3)

**Goal**: Calendar and email fully operational

1. **OAuth2 Setup**
   - Create Google Cloud project
   - Configure OAuth consent screen
   - Generate credentials
   - Implement token refresh

2. **Calendar Tools**
   - `calendar_list_events` (today, week, custom range)
   - `calendar_create_event`
   - `calendar_find_free_time`

3. **Email Tools**
   - `email_list_inbox` (with filters)
   - `email_read` (full thread)
   - `email_send` (with approval flow)
   - `email_search`

**Validation**: Can ask Claude "What's on my calendar today?" and get real data

### Phase 3: Smart Home (Week 3-4)

**Goal**: Home Assistant integration

1. **Home Assistant Setup**
   - Expose via Cloudflare Tunnel (authenticated)
   - Generate long-lived access token
   - Map relevant entities

2. **Home Tools**
   - `home_status` (all devices)
   - `home_set_temperature`
   - `home_lights_control`
   - `home_lock_status`
   - `home_run_scene`

3. **Automation Hooks**
   - Morning routine trigger
   - Away mode detection
   - Energy monitoring alerts

**Validation**: Can say "Turn off all lights" and it works

### Phase 4: Finance (Week 4-5)

**Goal**: Read-only financial visibility

1. **Plaid Integration**
   - Set up Plaid account
   - Link bank accounts
   - Configure webhooks for transaction updates

2. **Finance Tools**
   - `finance_accounts` (balances)
   - `finance_transactions` (recent, categorized)
   - `finance_budget_status`

3. **Privacy Safeguards**
   - No account numbers exposed
   - No write operations
   - Explicit user acknowledgment for financial queries

**Validation**: "How much did I spend on groceries this month?" returns real data

### Phase 5: Family Dashboard (Week 5-7)

**Goal**: Web UI for family overview

1. **Dashboard Infrastructure**
   - Next.js app with shadcn/ui
   - NextAuth.js authentication
   - API routes proxying to MCP gateway

2. **Core Views**
   - Dashboard home (daily overview)
   - Calendar view (family combined)
   - Task management
   - Device control

3. **Mobile Optimization**
   - Responsive design
   - PWA capability
   - Quick actions

**Validation**: Family can view dashboard on tablet/phone

### Phase 6: Health Integration (Week 7-8)

**Goal**: Health data awareness

1. **Apple Health Export**
   - iOS Shortcuts automation
   - Daily sync to Home Assistant
   - Structured health entity

2. **Health Tools**
   - `health_daily_summary`
   - `health_activity_goals`
   - `health_sleep_quality`

3. **Privacy Controls**
   - Opt-in per family member
   - No detailed medical data
   - Aggregate metrics only

**Validation**: "How did I sleep last night?" returns Sleep data

### Phase 7: Self-Improvement Integration (Week 8-10)

**Goal**: Agent learns from life data

1. **Pattern Detection**
   - Calendar adherence
   - Task completion rates
   - Email response times
   - Spending patterns

2. **Hypothesis Generation**
   - "User more productive in morning - schedule focus time"
   - "Recurring budget overruns in dining category"
   - "Optimal reminder timing for tasks"

3. **Feedback Loop**
   - Track hypothesis outcomes
   - Update procedural memories
   - Personalize suggestions

**Validation**: Agent proactively suggests schedule optimization

---

## Security Architecture

### Authentication Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY BOUNDARIES                          │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  Layer 1: Claude.ai / Claude Desktop                            │
│  ├── Anthropic OAuth                                            │
│  └── User's Anthropic account                                   │
│                                                                 │
│  Layer 2: Cloudflare Worker                                     │
│  ├── Bearer token (MCP_ACCESS_TOKEN)                            │
│  ├── Cloudflare Access (optional, for dashboard)                │
│  └── Rate limiting                                              │
│                                                                 │
│  Layer 3: Cloudflare Tunnels                                    │
│  ├── Encrypted tunnel to local services                         │
│  ├── No port exposure                                           │
│  └── Service-specific tokens                                    │
│                                                                 │
│  Layer 4: External APIs                                         │
│  ├── Google OAuth2 (scoped, refreshable)                        │
│  ├── Plaid Link tokens (read-only)                              │
│  ├── Home Assistant long-lived tokens                           │
│  └── Per-service encryption                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Classification

| Data Type | Storage | Retention | Access |
|-----------|---------|-----------|--------|
| Calendar events | Hot tier | 90 days | User only |
| Email metadata | Warm tier | 30 days | User only |
| Email content | Not stored | Query only | User only |
| Financial balances | Not stored | Query only | User only |
| Transactions | Not stored | Query only | User only |
| Health metrics | Warm tier | 365 days | Opt-in per member |
| Smart home states | Hot tier | 7 days | Family |
| Obsidian notes | Local + backup | Indefinite | User only |
| Agent learnings | Warm/Cold | Indefinite | User only |

### Sensitive Data Rules

1. **Financial Data**
   - NEVER stored in memory system
   - Queried on-demand, discarded after response
   - Account numbers always masked
   - No transaction initiation capability

2. **Health Data**
   - Opt-in per family member
   - Aggregate metrics only (not diagnoses)
   - No sharing with external services

3. **Credentials**
   - All tokens in Cloudflare secrets / environment variables
   - Never in code or memory
   - Rotated quarterly

---

## Token Economics

### Hybrid Model Strategy

```
┌────────────────────────────────────────────────────────────────┐
│                   TOKEN COST OPTIMIZATION                       │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LOCAL (Ollama/qwen3:8b - $0)         CLOUD (Claude - $/token) │
│  ─────────────────────────            ─────────────────────── │
│  • Pattern extraction                 • Strategic decisions    │
│  • Draft email responses              • Final email send       │
│  • Task categorization                • Complex reasoning      │
│  • Schedule optimization calcs        • User-facing responses  │
│  • Health metric aggregation          • Financial analysis     │
│  • Bulk data processing               • Quality judgment       │
│                                                                 │
│  Use for: QUANTITY (~200 tok/sec)     Use for: QUALITY         │
│                                                                 │
│  ESTIMATED MONTHLY USAGE:                                       │
│  ├── Local inference: 5M tokens @ $0.00 = $0                   │
│  ├── Claude Opus: 500K tokens @ rate = Claude Max included     │
│  └── Total: $0 marginal cost (within Max subscription)         │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
Sartor-claude-network/
├── src/
│   ├── memory/                     # 3-tier memory system
│   │   ├── memory-system.ts
│   │   ├── hot-tier.ts
│   │   ├── warm-tier.ts
│   │   ├── cold-tier.ts
│   │   └── importance-scoring.ts
│   │
│   ├── mcp/                        # MCP servers
│   │   ├── memory-server.ts        # Memory tools
│   │   ├── obsidian-server.ts      # Obsidian tools (NEW)
│   │   └── http-server.ts          # HTTP transport
│   │
│   ├── integrations/               # External APIs (NEW)
│   │   ├── google-workspace.ts     # Calendar + Gmail
│   │   ├── plaid-client.ts         # Banking
│   │   ├── home-assistant.ts       # Smart home
│   │   └── health-sync.ts          # Apple Health
│   │
│   ├── executive/                  # Agent orchestration
│   │   ├── executive-claude.ts
│   │   ├── self-improving-loop.ts
│   │   └── learning-pipeline.ts
│   │
│   ├── multi-expert/               # Parallel execution
│   │   ├── orchestrator.ts
│   │   ├── voting-system.ts
│   │   ├── ollama-executor.ts      # Local LLM
│   │   └── claude-executor.ts
│   │
│   └── skills/                     # Agent skills
│
├── workers/
│   └── sartor-life/                # Cloudflare Worker (NEW)
│       ├── src/
│       │   ├── index.ts            # Main entry
│       │   ├── tools/
│       │   │   ├── obsidian.ts
│       │   │   ├── calendar.ts
│       │   │   ├── email.ts
│       │   │   ├── finance.ts
│       │   │   ├── home.ts
│       │   │   └── health.ts
│       │   └── auth/
│       │       └── oauth.ts
│       └── wrangler.toml
│
├── dashboard/                      # Family Dashboard (NEW)
│   ├── app/
│   │   ├── page.tsx               # Dashboard home
│   │   ├── calendar/
│   │   ├── tasks/
│   │   ├── finance/
│   │   └── home/
│   ├── components/
│   │   ├── ui/                    # shadcn components
│   │   └── widgets/
│   └── lib/
│       └── api.ts                 # MCP client
│
├── .cloudflared/
│   └── config.yml                  # Tunnel configuration
│
├── framework/
│   ├── bootstrap/
│   ├── validation/
│   └── coordinator/
│
├── docs/
│   ├── OBSIDIAN-INTEGRATION-PLAN.md
│   ├── UNIFIED-LIFE-MANAGEMENT-PLAN.md  # This document
│   ├── architecture-diagram.md
│   └── ...
│
└── .swarm/                         # Agent artifacts
    ├── results/
    ├── experiments/
    └── memory/
```

---

## Configuration Reference

### Environment Variables

```bash
# Cloudflare Worker
OBSIDIAN_API_URL=https://obsidian-api.sartor.net
OBSIDIAN_API_KEY=<64-char-hex>
MCP_ACCESS_TOKEN=<strong-random-token>

# Google OAuth
GOOGLE_CLIENT_ID=<from-console>
GOOGLE_CLIENT_SECRET=<from-console>
GOOGLE_REFRESH_TOKEN=<after-oauth-flow>

# Plaid
PLAID_CLIENT_ID=<from-dashboard>
PLAID_SECRET=<from-dashboard>
PLAID_ACCESS_TOKEN=<after-link>

# Home Assistant
HOME_ASSISTANT_URL=https://home.sartor.net
HOME_ASSISTANT_TOKEN=<long-lived-token>

# Firebase
FIREBASE_PROJECT_ID=sartor-claude-network
FIREBASE_PRIVATE_KEY=<service-account-key>
FIREBASE_CLIENT_EMAIL=<service-account-email>

# Local GPU
OLLAMA_HOST=http://192.168.1.100:11434
```

### Cloudflare Tunnel Config

```yaml
# ~/.cloudflared/config.yml
tunnel: sartor-services
credentials-file: ~/.cloudflared/tunnel-id.json

ingress:
  # Obsidian vault
  - hostname: obsidian-api.sartor.net
    service: https://localhost:27124
    originRequest:
      noTLSVerify: true

  # Home Assistant
  - hostname: home.sartor.net
    service: http://192.168.1.x:8123

  # Dashboard (if self-hosted)
  - hostname: dashboard.sartor.net
    service: http://localhost:3000

  - service: http_status:404
```

---

## Success Metrics

### System Health
- [ ] MCP gateway uptime >99.9%
- [ ] Memory tier sync latency <1s
- [ ] API response time <500ms p95

### User Experience
- [ ] Can query calendar from any Claude client
- [ ] Can send emails with approval flow
- [ ] Dashboard loads in <2s
- [ ] Smart home commands execute in <3s

### Self-Improvement
- [ ] Agent generates valid hypotheses from life data
- [ ] Task completion patterns identified
- [ ] Schedule optimization suggestions accepted >50%

---

## Next Steps

1. **Immediate**: Complete Phase 1 (Obsidian + Memory hardening)
2. **This week**: Begin Phase 2 (Google OAuth setup)
3. **Discuss**: Family member access levels and privacy preferences
4. **Discuss**: Specific bank accounts for Plaid linking
5. **Discuss**: Home Assistant entity mapping

---

## Appendix: Tool Reference

### Obsidian Tools
| Tool | Description | Input |
|------|-------------|-------|
| `obsidian_list` | List vault contents | `path?: string` |
| `obsidian_read` | Read note content | `filepath: string` |
| `obsidian_write` | Create/update note | `filepath, content` |
| `obsidian_append` | Append to note | `filepath, content` |
| `obsidian_search` | Full-text search | `query: string` |
| `obsidian_daily` | Daily note operations | `content?, action` |
| `obsidian_patch` | Insert under heading | `filepath, heading, content` |

### Calendar Tools
| Tool | Description | Input |
|------|-------------|-------|
| `calendar_list` | Get events | `start, end, calendar?` |
| `calendar_create` | Create event | `title, start, end, description?` |
| `calendar_update` | Modify event | `eventId, updates` |
| `calendar_delete` | Remove event | `eventId` |
| `calendar_free_slots` | Find availability | `date, duration` |

### Email Tools
| Tool | Description | Input |
|------|-------------|-------|
| `email_inbox` | List recent emails | `maxResults, query?` |
| `email_read` | Get email content | `messageId` |
| `email_send` | Send email | `to, subject, body` |
| `email_draft` | Create draft | `to, subject, body` |
| `email_search` | Search emails | `query` |

### Finance Tools
| Tool | Description | Input |
|------|-------------|-------|
| `finance_accounts` | List accounts | - |
| `finance_balance` | Get balance | `accountId` |
| `finance_transactions` | List transactions | `startDate, endDate, category?` |
| `finance_budget` | Budget status | `month?` |

### Home Tools
| Tool | Description | Input |
|------|-------------|-------|
| `home_status` | All device states | - |
| `home_entity` | Single entity state | `entityId` |
| `home_service` | Call service | `domain, service, data` |
| `home_scene` | Activate scene | `sceneId` |

### Health Tools
| Tool | Description | Input |
|------|-------------|-------|
| `health_summary` | Daily summary | `date?` |
| `health_steps` | Step count | `startDate, endDate` |
| `health_sleep` | Sleep data | `date` |
| `health_weight` | Weight history | `startDate, endDate` |
