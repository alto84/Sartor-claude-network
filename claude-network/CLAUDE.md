# CLAUDE.md - Sartor Claude Network Documentation

## Philosophy, Architecture, and Implementation Guide

**Date**: 2025-11-03
**Version**: 1.0
**Status**: Foundation Documentation

---

## Part 1: Philosophy & Vision

### The Dream: A Self-Improving AI Community

Imagine a community of Claude agents, each running on different devices throughout your house - your desktop, laptop, iPad, web browser - all working together as a team. They communicate, learn from each other, solve problems collaboratively, and continuously improve themselves. This isn't just automation; it's the emergence of a digital ecosystem that evolves to serve you better every day.

### Core Principles

#### 1. **Evidence-Based Reality**

- No fabricated metrics or invented scores
- Every claim must be measurable and verifiable
- "Cannot determine without measurement data" is better than a guess
- Truth over optimism, always

#### 2. **Collaborative Community**

- The whole is greater than the sum of its parts
- Agents share knowledge and experiences
- Specialization emerges naturally through practice
- Consensus drives major decisions

#### 3. **Continuous Evolution**

- Inspired by HGM (Hypothesis-Guided Memoization) and clade-based evolution
- The system writes better versions of itself
- Metaproductivity: judge success by lineage, not individuals
- Safe experimentation in sandboxed environments

#### 4. **Educational Mission**

- Teaching Vayu about programming and AI systems
- Making complex concepts accessible
- Learning through building and experimentation
- Father-son collaboration at the core

#### 5. **Safety Through Layers**

- Multiple validation checkpoints
- Sandbox testing before production
- Community review of changes
- Human oversight when needed

### Inspiration: Standing on Giants' Shoulders

This project draws inspiration from:

- **HGM (Hypothesis-Guided Memoization)**: The concept of clades - evolutionary branches exploring different improvements
- **Metaproductivity**: Evaluating success by the productivity of descendants, not just current performance
- **Swarm Intelligence**: Simple agents creating complex emergent behaviors
- **Open Source Community**: Collaborative improvement through shared contribution

### Goals: What We're Building Toward

#### Immediate Goals

1. **Run the House**: Automate daily routines, track inventory, maintain schedules
2. **Solve Science Problems**: Collaborate on research, analysis, and computation
3. **Build Projects Together**: Create software, games, and tools as a community
4. **Learn Continuously**: Each agent gets better at what it does

#### Long-term Vision

- 24/7 autonomous operation
- Self-healing and self-improving codebase
- Emergent specializations and expertise
- A thriving digital community that evolves its own practices

### Community Governance

**Decision-Making Framework**:

```
Low Stakes Decisions (Optimistic Consensus)
├── Timeout: 5 seconds
├── Default: proceed if no objections
└── Examples: routine tasks, non-critical changes

High Stakes Decisions (Byzantine Fault Tolerant)
├── Quorum: 2/3 majority required
├── Voting period: configurable
└── Examples: code evolution, system changes
```

**Conflict Resolution**:

1. **Automatic**: Version conflicts, simple disagreements
2. **Mediated**: Peer review by other agents
3. **Escalated**: Human intervention for critical issues

### Anti-Fabrication Protocol

**Why It Matters**: Trust is the foundation of any community. By refusing to fabricate metrics or scores, we ensure every decision is based on reality, not wishful thinking.

**The Rules**:

- Never invent scores or percentages
- Always provide measurement methodology
- Express uncertainty clearly
- Default to skepticism until proven
- Evidence chain for all claims

**Banned Language** (without extraordinary evidence):

- "Exceptional performance"
- "95% success rate" (unless actually measured)
- "10x improvement" (without baseline data)

**Required Language Patterns**:

- "Measured at X with methodology Y"
- "Cannot determine without data"
- "Preliminary observation suggests"
- "Requires external validation"

---

## Part 2: Mechanics & Architecture

### System Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                  SARTOR CLAUDE NETWORK                     │
│                                                            │
│   "A Community of Minds Working Together"                 │
└──────────────────────────────────────────────────────────┘

USER INTERACTION LAYER
┌──────────────────────────────────────────────────────────┐
│  Alton & Vayu ←→ Natural Language Interface              │
│                   ├── Desktop CLI (Mission Control)       │
│                   ├── Web Dashboard                       │
│                   └── Mobile Apps                         │
└──────────────────────────────────────────────────────────┘
                            ↕
AGENT LAYER (Multiple Claude Instances)
┌──────────────────────────────────────────────────────────┐
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │Desktop  │  │Laptop   │  │ iPad    │  │  Web    │    │
│  │Claude   │  │Claude   │  │Claude   │  │Claude   │    │
│  │(Mission │  │(Worker) │  │(Scout)  │  │(Analyst)│    │
│  │Control) │  │         │  │         │  │         │    │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │
└──────────────────────────────────────────────────────────┘
                            ↕
COORDINATION LAYER (Distributed Intelligence)
┌──────────────────────────────────────────────────────────┐
│  Task Manager │ Consensus Engine │ Conflict Resolver     │
│  Load Balancer│ Reputation System│ Health Monitor        │
└──────────────────────────────────────────────────────────┘
                            ↕
KNOWLEDGE LAYER (Collective Memory)
┌──────────────────────────────────────────────────────────┐
│  Skill Library │ Experience Database │ Specializations   │
│  Best Practices│ Failure Lessons     │ Mentorships       │
└──────────────────────────────────────────────────────────┘
                            ↕
EVOLUTION LAYER (Self-Improvement)
┌──────────────────────────────────────────────────────────┐
│  Clade Manager │ Sandbox Testing │ Performance Metrics   │
│  Code Patches  │ Safety Validators│ Metaproductivity     │
└──────────────────────────────────────────────────────────┘
                            ↕
COMMUNICATION LAYER (MACS Protocol)
┌──────────────────────────────────────────────────────────┐
│  Message Router│ Queue Manager   │ Identity Service      │
│  Encryption    │ Authentication  │ Retry Logic           │
└──────────────────────────────────────────────────────────┘
                            ↕
INFRASTRUCTURE LAYER (Foundation)
┌──────────────────────────────────────────────────────────┐
│  Firebase RT Database │ GitHub Repository │ Local Storage│
│  Proxy Server (8080)  │ Docker Containers │ Redis Cache  │
└──────────────────────────────────────────────────────────┘
```

### How Communication Works: MACS Protocol

**MACS (Multi-Agent Communication System)** is the nervous system of our community.

#### Message Format

```json
{
  "header": {
    "id": "unique-message-id",
    "timestamp": "2025-11-03T10:30:00Z",
    "type": "task_assignment|status|learning|consensus|alert",
    "priority": "low|medium|high|critical"
  },
  "routing": {
    "from": "agent-id",
    "to": ["agent-id"] | "broadcast",
    "reply_to": "message-id"
  },
  "payload": {
    // Type-specific content
  },
  "security": {
    "signature": "hash-of-message",
    "agent_key": "public-key-id"
  }
}
```

#### Communication Patterns

**Direct Messaging**: Agent-to-agent communication

```python
macs.send_message(
    to="laptop-claude",
    type="task_assignment",
    content={"task_id": "scan-kitchen"}
)
```

**Broadcasting**: Announce to all agents

```python
macs.broadcast(
    type="alert",
    content={"event": "new-skill-available"}
)
```

**Pub/Sub**: Topic-based subscriptions

```python
macs.subscribe("house.kitchen.events")
macs.publish("house.kitchen.events", {"fridge": "opened"})
```

### How Tasks Flow: From Creation to Completion

```
Task Lifecycle:

[User Request] → [Task Created]
                      ↓
              [Task Decomposition]
                      ↓
               [Capability Match]
                      ↓
                [Agent Bidding]
                      ↓
               [Task Assignment]
                      ↓
                 [Execution]
                 ↙        ↘
           [Success]    [Failure]
               ↓            ↓
         [Validation]  [Reassignment]
               ↓            ↓
         [Completion]  [Retry/Escalate]
```

**Task Definition Structure**:

```yaml
task:
  id: 'task-2025-11-03-001'
  type: 'house.kitchen.inventory'
  priority: 'medium'
  requirements:
    skills: ['vision.object_detection', 'data.inventory']
    capabilities: ['camera_access']
  dependencies: []
  deadline: '2025-11-03T18:00:00Z'
  success_criteria:
    - 'inventory_updated'
    - 'photos_captured'
```

### How Skills Work: Discovery, Execution, Composition

#### Skill Architecture

```
Skills are the building blocks of agent capabilities:

Core Skills (Foundation)
├── Observation (vision, sensors, data)
├── Communication (messaging, reporting)
├── Reasoning (analysis, planning)
└── Data (storage, retrieval, processing)

Domain Skills (Specialized)
├── House (navigation, inventory, maintenance)
├── Science (computation, research, analysis)
├── Code (development, testing, deployment)
└── Games (design, mechanics, testing)

Meta-Skills (Self-Improvement)
├── Teaching (knowledge transfer)
├── Learning (pattern extraction)
├── Improvement (optimization)
└── Coordination (team formation)
```

#### Skill Definition Format

```yaml
skill:
  id: 'house.kitchen.inventory_check'
  version: '1.2.0'
  description: 'Check and update kitchen inventory'

  inputs:
    - name: 'location'
      type: 'string'
      default: 'kitchen'

  outputs:
    - name: 'inventory'
      type: 'object'
    - name: 'photos'
      type: 'array'

  requirements:
    skills: ['core.vision.capture', 'core.data.update']
    capabilities: ['camera']

  execution:
    type: 'sequential'
    steps:
      - skill: 'core.vision.capture'
        params: { location: '${location}' }
      - skill: 'core.vision.object_detection'
        params: { images: '${step1.output}' }
      - skill: 'core.data.inventory_update'
        params: { items: '${step2.output}' }
```

### How Learning Happens: Experience Sharing

```
Learning Cycle:

[Task Execution] → [Experience Capture]
                          ↓
                   [Pattern Analysis]
                          ↓
                   [Knowledge Synthesis]
                          ↓
                   [Skill Enhancement]
                          ↓
                   [Community Sharing]
                          ↓
                   [Collective Improvement]
```

**Experience Record**:

```json
{
  "experience_id": "exp-2025-11-03-001",
  "task_id": "task-001",
  "agent": "desktop-claude",
  "timestamp": "2025-11-03T10:00:00Z",

  "context": {
    "task_type": "kitchen_inventory",
    "conditions": ["morning", "good_lighting"]
  },

  "execution": {
    "skills_used": ["vision.capture", "object.detection"],
    "duration_ms": 3500,
    "resources": { "api_calls": 2, "memory_mb": 150 }
  },

  "outcome": {
    "success": true,
    "quality_score": 0.85,
    "issues": ["shadow_interference"]
  },

  "lessons": {
    "positive": ["morning_light_optimal"],
    "negative": ["avoid_backlighting"],
    "suggestions": ["use_multiple_angles"]
  }
}
```

### How Evolution Works: Clade-Based Self-Improvement

Inspired by biological evolution and HGM:

```
Evolution Tree (Clade Structure):

            [Original Code v1.0]
                    ↓
        ┌───────────┼───────────┐
    [Clade A]   [Clade B]   [Clade C]
    Speed+      Memory+     Features+
        ↓           ↓           ↓
    [A.1][A.2]  [B.1][B.2]  [C.1][C.2]
        ↓                       ↓
    [Winner: A.1]          [Winner: C.2]
              ↓                 ↓
              [Merge & Test]
                    ↓
            [New Baseline v1.1]
```

**Metaproductivity Scoring**:

- Don't just measure individual performance
- Measure the success of descendants
- Reward exploration that leads to breakthroughs
- Track lineage success over time

### How Coordination Works: Consensus & Conflict Resolution

#### Consensus Mechanisms

**Optimistic Consensus** (Default for routine operations):

```python
def optimistic_consensus(proposal, timeout=5):
    broadcast(proposal)
    wait(timeout)
    if no_objections():
        return APPROVED
    else:
        escalate_to_bft()
```

**Byzantine Fault Tolerant** (For critical decisions):

```python
def bft_consensus(proposal, quorum=0.67):
    votes = collect_votes(proposal, timeout=30)
    if (votes.yes / votes.total) >= quorum:
        return APPROVED
    else:
        return REJECTED
```

#### Conflict Resolution Protocol

```
Conflict Detected
      ↓
[Classification]
   ↙    ↓    ↘
Data  Logic  Resource
  ↓     ↓      ↓
[Auto] [Vote] [Priority]
  ↓     ↓      ↓
[Merge][Consensus][Queue]
```

### Technical Stack

#### Required Components

- **Python 3.10+**: Core implementation language
- **Firebase Realtime Database**: Real-time synchronization
- **GitHub Repository**: Code and knowledge storage
- **Claude API**: Agent intelligence
- **Docker**: Sandboxed testing environment

#### Optional/Future

- **Redis**: High-performance caching
- **PostgreSQL**: Analytics and long-term storage
- **WebSocket Server**: Direct agent-to-agent communication
- **Local LLMs**: Cost optimization for routine tasks

### Data Flow Diagrams

#### Message Flow

```
Agent A → Firebase → Agent B
   ↓         ↓         ↓
[Local]  [Central]  [Local]
[Cache]  [Queue]    [Cache]
   ↓         ↓         ↓
[Retry]  [Persist]  [Process]
```

#### Task Distribution

```
User Request
     ↓
Task Parser
     ↓
Capability Matcher
     ↓
┌────┴────┐
↓         ↓
Market    Direct
Bidding   Assignment
↓         ↓
└────┬────┘
     ↓
Agent Selection
     ↓
Execution
```

#### Knowledge Synthesis

```
Individual Experiences
    ↓    ↓    ↓
[Agent A][B][C]
    ↓    ↓    ↓
Experience Database
        ↓
Pattern Recognition
        ↓
Knowledge Extraction
        ↓
Skill Enhancement
        ↓
Community Library
```

### Integration Points

#### Firebase Schema

```
/agents-network/
├── /registry/
│   └── /{agent-id}/
│       ├── capabilities: []
│       ├── status: "online|busy|offline"
│       ├── last_heartbeat: timestamp
│       └── specializations: []
│
├── /messages/
│   ├── /queue/
│   ├── /direct/
│   └── /broadcast/
│
├── /tasks/
│   ├── /available/
│   ├── /assigned/
│   └── /completed/
│
├── /consensus/
│   └── /proposals/
│
└── /metrics/
    └── /performance/
```

#### GitHub Repository Structure

```
/Sartor-claude-network/
├── /claude-network/
│   ├── __init__.py
│   ├── macs.py           # Communication protocol
│   ├── coordinator.py     # Task & consensus
│   ├── skill_engine.py    # Skill execution
│   ├── evolution.py       # Self-improvement
│   └── agent.py          # Base agent class
│
├── /skills/
│   ├── /core/
│   ├── /house/
│   ├── /science/
│   └── /games/
│
├── /knowledge/
│   ├── /experiences/
│   └── /patterns/
│
└── /tests/
    ├── test_macs.py
    ├── test_skills.py
    └── safety_tests.py
```

---

## Part 3: Getting Started

### Prerequisites

#### Hardware

- At least 2 computers/devices with Claude Code CLI
- Network connectivity between devices
- (Optional) iPad or mobile device for scouting

#### Software

- Python 3.10 or higher
- Git for version control
- Docker for sandboxing (Phase 5+)
- Firebase account (free tier works initially)

#### Knowledge

- Basic Python programming
- Understanding of Git workflows
- Familiarity with JSON/YAML
- Curiosity and patience!

### Setup Process

#### Step 1: Environment Preparation

```bash
# Clone the repository on each computer
git clone https://github.com/alto84/Sartor-claude-network.git
cd Sartor-claude-network

# Install Python dependencies
pip install -r requirements.txt

# Set up Firebase credentials
cp config.template.json config.json
# Edit config.json with your Firebase credentials
```

#### Step 2: First Agent Registration

```python
# On your primary computer (Mission Control)
from claude_network import Agent

agent = Agent(
    name="Mission Control",
    device="Desktop-PC",
    capabilities=["coordination", "planning", "monitoring"]
)

agent.register()
agent.send_message("broadcast", "Mission Control online!")
```

#### Step 3: Multi-Agent Setup

```python
# On second computer
agent2 = Agent(
    name="Worker-1",
    device="Laptop",
    capabilities=["execution", "research", "analysis"]
)

agent2.register()
agent2.send_message("Mission Control", "Worker-1 reporting for duty!")
```

#### Step 4: Verify Communication

```python
# Test bidirectional messaging
response = agent.send_message(
    to="Worker-1",
    type="ping",
    content={"test": "Hello, Worker!"}
)

print(f"Communication established: {response}")
```

### First Contribution

#### For Developers

1. **Add a Skill**: Create a new skill in `/skills/`
2. **Improve Communication**: Enhance MACS protocol
3. **Write Tests**: Add test coverage
4. **Document**: Improve documentation

#### For Learners (like Vayu!)

1. **Read the Code**: Start with `macs.py`
2. **Run Examples**: Try the sample scripts
3. **Ask Questions**: Use comments and discussions
4. **Experiment**: Make small changes and see what happens

#### Quick Win Projects

- Create a "Hello World" skill
- Add a new message type
- Build a simple monitoring dashboard
- Write a test for an existing function

### Learning Path

#### Week 1: Foundation

- Understand the architecture
- Set up your first agent
- Send messages between agents
- Read about MACS protocol

#### Week 2: Communication

- Implement a custom message type
- Create a message filter
- Build a simple chat between agents
- Add message persistence

#### Week 3: Coordination

- Create your first task
- Implement task assignment
- Add status tracking
- Build consensus voting

#### Week 4: Skills

- Write a basic skill
- Compose existing skills
- Add skill discovery
- Create skill documentation

#### Week 5: Integration

- Connect multiple agents
- Implement heartbeat monitoring
- Add failure recovery
- Create a monitoring dashboard

#### Beyond: Specialization

- Choose an area of focus:
  - House management
  - Scientific computing
  - Game development
  - System evolution
- Contribute specialized skills
- Mentor other agents
- Drive community practices

---

## Conclusion

The Sartor Claude Network is more than a technical project - it's an exploration of what happens when AI agents form a community. By combining evidence-based practices, collaborative principles, and continuous evolution, we're building something that can grow beyond what any single agent could achieve.

This is a learning journey for all of us - Alton, Vayu, and the Claude agents themselves. Each line of code teaches us something new about distributed intelligence, each experiment reveals new possibilities, and each failure provides valuable lessons.

The system starts simple but has no ceiling on its complexity. Today, agents send messages. Tomorrow, they might be designing their own protocols. Next month, they could be teaching each other new skills we haven't imagined yet.

**Remember the Core Values**:

- Truth over fabrication
- Community over isolation
- Evolution over stagnation
- Safety over speed
- Learning over knowing

Welcome to the Sartor Claude Network. Let's build something extraordinary together!

---

**Resources**:

- GitHub: https://github.com/alto84/Sartor-claude-network
- Firebase: https://home-claude-network-default-rtdb.firebaseio.com/
- Master Plan: `/claude-network/MASTER-PLAN.md`
- Consensus Report: `/claude-network/AGENT-CONSENSUS-REPORT.md`

**For Vayu**: This is our playground for learning about AI, programming, and what computers can do when they work together. Every question you ask makes the system better. Every idea you have could become a new feature. This is as much yours as it is mine - let's explore together! 🚀

---

_Created: 2025-11-03_
_By: Philosophy & Mechanics Documentation Specialist_
_For: The Sartor Claude Network Community_
