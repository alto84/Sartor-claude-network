# Memory System Architecture Diagrams

## System Overview

```mermaid
graph TB
    subgraph "MCP Server Layer"
        Tools[MCP Tools]
        Resources[MCP Resources]
        Prompts[MCP Prompts]
    end

    subgraph "Memory System Core"
        MS[Memory System]

        subgraph "Memory Types"
            EM[Episodic Memory]
            SM[Semantic Memory]
            PM[Procedural Memory]
            WM[Working Memory]
        end

        subgraph "Operations"
            Store[Store]
            Recall[Recall]
            Consolidate[Consolidate]
            Decay[Apply Decay]
            Sync[Sync]
        end
    end

    subgraph "Storage Layer"
        PS[Primary Storage<br/>Firestore/MongoDB]
        VS[Vector Store<br/>Pinecone/Weaviate]
        Cache[Cache<br/>Redis]
    end

    Tools --> MS
    Resources --> MS
    Prompts --> MS

    MS --> EM
    MS --> SM
    MS --> PM
    MS --> WM

    MS --> Store
    MS --> Recall
    MS --> Consolidate
    MS --> Decay
    MS --> Sync

    Store --> PS
    Store --> VS
    Store --> Cache

    Recall --> VS
    Recall --> Cache
    Recall --> PS

    Consolidate --> PS
    Decay --> PS
    Sync --> PS
```

## Memory Type Relationships

```mermaid
graph LR
    subgraph "Input"
        Conv[User Conversation]
    end

    subgraph "Memory Lifecycle"
        WM[Working Memory<br/>Active Session]
        EM[Episodic Memory<br/>Conversation Episode]
        SM[Semantic Memory<br/>Facts & Preferences]
        PM[Procedural Memory<br/>Patterns & Workflows]
    end

    Conv -->|During| WM
    WM -->|End of Session| EM
    EM -->|Extract Knowledge| SM
    EM -->|Identify Patterns| PM
    EM -->|Update| SM
    SM -->|Inform| PM

    EM -.->|Decay Over Time| Archive1[Archive]
    SM -.->|Low Confidence| Archive2[Archive]
    PM -.->|Low Success Rate| Archive3[Archive]
```

## Memory State Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Active: Create Memory

    Active --> Active: Access/Update
    Active --> PendingConsolidation: Similar Memories Detected
    Active --> Decayed: Importance Below Threshold
    Active --> Archived: Manual Archive

    PendingConsolidation --> Active: Consolidation Complete
    PendingConsolidation --> Archived: Consolidate & Archive Sources

    Decayed --> Archived: Move to Cold Storage
    Archived --> Active: Restore

    Active --> Conflicted: Contradiction Detected
    Conflicted --> Active: Conflict Resolved

    Archived --> [*]: Delete
```

## Episodic Memory Structure

```mermaid
graph TB
    Episode[Episodic Memory]

    Episode --> Content[Content]
    Episode --> Temporal[Temporal Structure]
    Episode --> Emotional[Emotional Context]
    Episode --> Narrative[Narrative]
    Episode --> Participants[Participants]

    Content --> Messages[Messages]
    Content --> Summary[Summary]
    Content --> KeyQuotes[Key Quotes]

    Temporal --> StartEnd[Start/End Time]
    Temporal --> Duration[Duration]
    Temporal --> Context[Time of Day, etc.]

    Emotional --> Valence[Valence]
    Emotional --> Arousal[Arousal]
    Emotional --> Sentiment[Sentiment]

    Narrative --> Beginning[Beginning]
    Narrative --> Middle[Middle]
    Narrative --> End[End]
    Narrative --> Themes[Themes]

    Messages --> M1[Message 1]
    Messages --> M2[Message 2]
    Messages --> M3[Message N]
```

## Semantic Memory Structure

```mermaid
graph TB
    Semantic[Semantic Memory]

    Semantic --> Content[Content]
    Semantic --> Knowledge[Knowledge Type]
    Semantic --> Confidence[Confidence Level]
    Semantic --> Evidence[Evidence]

    Content --> SPO[Subject-Predicate-Object]
    Content --> Statement[Full Statement]

    SPO --> Subject[Subject: user_123]
    SPO --> Predicate[Predicate: prefers]
    SPO --> Object[Object: dark mode]

    Knowledge --> Type1[Fact]
    Knowledge --> Type2[Preference]
    Knowledge --> Type3[Belief]
    Knowledge --> Type4[Rule]

    Evidence --> E1[Episodic Reference]
    Evidence --> E2[Explicit Statement]
    Evidence --> E3[Inferred]
    Evidence --> E4[External Source]
```

## Procedural Memory Structure

```mermaid
graph TB
    Procedural[Procedural Memory]

    Procedural --> Content[Content]
    Procedural --> Steps[Steps]
    Procedural --> Conditions[Applicability]
    Procedural --> Success[Success Metrics]

    Content --> Name[Name]
    Content --> Purpose[Purpose]
    Content --> When[When to Use]

    Steps --> S1[Step 1: Action]
    Steps --> S2[Step 2: Action]
    Steps --> S3[Step 3: Action]

    S1 --> Sub1[Sub-steps]
    S1 --> Alt1[Alternatives]

    Conditions --> Prereq[Prerequisites]
    Conditions --> Required[Requirements]

    Success --> Rate[Success Rate]
    Success --> Count[Execution Count]
    Success --> Failures[Failure Modes]
```

## Memory Recall Flow

```mermaid
sequenceDiagram
    participant Client
    participant MCP as MCP Server
    participant MemSys as Memory System
    participant Cache
    participant VectorDB as Vector Store
    participant DB as Primary Storage

    Client->>MCP: recall_memories(query)
    MCP->>MemSys: recall(query)

    MemSys->>MemSys: Generate embedding

    par Check Cache
        MemSys->>Cache: get(query_hash)
        Cache-->>MemSys: cached results or null
    and Vector Search
        MemSys->>VectorDB: searchSimilar(embedding)
        VectorDB-->>MemSys: [id1, id2, id3...]
    end

    alt Cache Hit
        MemSys-->>MCP: cached results
    else Cache Miss
        MemSys->>DB: batchRetrieve([ids])
        DB-->>MemSys: [memory objects]

        MemSys->>MemSys: Filter by metadata
        MemSys->>MemSys: Re-rank by importance
        MemSys->>MemSys: Update access timestamps

        MemSys->>Cache: set(query_hash, results)
        MemSys-->>MCP: ranked results
    end

    MCP-->>Client: memory results
```

## Importance Decay Flow

```mermaid
flowchart TD
    Start([Start Decay Process]) --> GetAll[Get All Active Memories]

    GetAll --> ForEach{For Each Memory}

    ForEach --> CheckProtected{Protected from Decay?}
    CheckProtected -->|Yes| Skip[Skip]
    CheckProtected -->|No| CalcTime[Calculate Time Since Access]

    CalcTime --> CalcDecay[Apply Decay Formula:<br/>new_importance = current * e^(-rate * time)]

    CalcDecay --> CheckThreshold{Below Threshold?}

    CheckThreshold -->|Yes| Archive[Mark as ARCHIVED]
    CheckThreshold -->|No| Update[Update Importance Score]

    Archive --> UpdateDB[(Update Database)]
    Update --> UpdateDB

    UpdateDB --> Skip
    Skip --> ForEach

    ForEach -->|Done| Stats[Generate Decay Report]
    Stats --> End([End])
```

## Memory Consolidation Flow

```mermaid
flowchart TD
    Start([Consolidation Request]) --> GetMemories[Retrieve Source Memories]

    GetMemories --> Validate{All Memories<br/>Valid?}
    Validate -->|No| Error[Return Error]
    Validate -->|Yes| Strategy{Strategy Type}

    Strategy -->|Merge| Merge[Combine Content<br/>Keep All Relations]
    Strategy -->|Summarize| Summarize[Generate Summary<br/>via LLM]
    Strategy -->|Abstract| Abstract[Extract Common<br/>Patterns]
    Strategy -->|Pattern Extract| Pattern[Create Procedural<br/>from Episodes]

    Merge --> CreateNew[Create Consolidated Memory]
    Summarize --> CreateNew
    Abstract --> CreateNew
    Pattern --> CreateNew

    CreateNew --> Store[(Store New Memory)]

    Store --> ArchiveSource[Archive Source Memories]
    ArchiveSource --> AddRelations[Add 'Consolidated Into'<br/>Relations]

    AddRelations --> Return[Return Consolidation Result]
    Return --> End([End])
    Error --> End
```

## Cross-Surface Sync Flow

```mermaid
sequenceDiagram
    participant Web as Web Surface
    participant Slack as Slack Surface
    participant API as API Surface
    participant SyncService as Sync Service
    participant DB as Primary Storage

    Note over Web,DB: User creates memory on Web

    Web->>SyncService: store_memory(memory)
    SyncService->>DB: Store with metadata
    DB-->>SyncService: Stored

    SyncService->>SyncService: Generate content hash
    SyncService->>SyncService: Set version = 1

    Note over Web,DB: User accesses from Slack

    Slack->>SyncService: sync(SLACK)
    SyncService->>DB: Get memories for user
    DB-->>SyncService: [memories]

    SyncService->>SyncService: Filter by availableSurfaces
    SyncService->>SyncService: Check for conflicts

    alt No Conflicts
        SyncService-->>Slack: Updated memories
        SyncService->>DB: Update availableSurfaces
    else Conflict Detected
        SyncService->>SyncService: Apply resolution strategy
        SyncService-->>Slack: Resolved memories
        SyncService->>DB: Update with resolution
    end

    Note over Web,DB: User modifies on Slack

    Slack->>SyncService: update_memory(id, changes)
    SyncService->>DB: Get current version
    DB-->>SyncService: memory (v1)

    SyncService->>SyncService: Check content hash
    SyncService->>SyncService: Increment version to v2
    SyncService->>DB: Update with new hash & version

    SyncService->>API: Notify other surfaces
    SyncService->>Web: Notify other surfaces
```

## Memory Relationship Graph

```mermaid
graph TD
    E1[Episodic: TypeScript Discussion<br/>2025-01-15]
    E2[Episodic: React Project Setup<br/>2025-01-16]
    E3[Episodic: TypeScript Generics<br/>2025-01-17]

    S1[Semantic: User prefers TypeScript]
    S2[Semantic: User knows React]
    S3[Semantic: User interested in generics]

    P1[Procedural: Setup TypeScript Project]
    P2[Procedural: Configure React with TS]

    E1 -->|DERIVED_FROM| S1
    E1 -->|FOLLOWED_BY| E2
    E2 -->|PRECEDED_BY| E1
    E2 -->|DERIVED_FROM| S2
    E2 -->|FOLLOWED_BY| E3
    E3 -->|DERIVED_FROM| S3

    S1 -->|SUPPORTS| S2
    S3 -->|PART_OF| S1

    E1 -->|PATTERN_EXTRACT| P1
    E2 -->|PATTERN_EXTRACT| P2

    P1 -->|PREREQUISITE_FOR| P2

    style E1 fill:#e1f5ff
    style E2 fill:#e1f5ff
    style E3 fill:#e1f5ff
    style S1 fill:#fff4e1
    style S2 fill:#fff4e1
    style S3 fill:#fff4e1
    style P1 fill:#e8f5e8
    style P2 fill:#e8f5e8
```

## Embedding and Semantic Search

```mermaid
flowchart LR
    subgraph "Memory Storage"
        M1[Memory 1<br/>TypeScript setup]
        M2[Memory 2<br/>React project]
        M3[Memory 3<br/>Python API]
        M4[Memory 4<br/>TS generics]
    end

    subgraph "Embedding Model"
        Embed[text-embedding-3-small<br/>1536 dimensions]
    end

    subgraph "Vector Space"
        V1[Vector 1]
        V2[Vector 2]
        V3[Vector 3]
        V4[Vector 4]
    end

    M1 --> Embed
    M2 --> Embed
    M3 --> Embed
    M4 --> Embed

    Embed --> V1
    Embed --> V2
    Embed --> V3
    Embed --> V4

    Query[Query: How to use<br/>TypeScript generics?] --> Embed
    Embed --> QV[Query Vector]

    QV -.->|Cosine Similarity| V1
    QV -.->|Cosine Similarity| V2
    QV -.->|Cosine Similarity| V3
    QV -.->|Cosine Similarity| V4

    V4 -.->|High Similarity 0.92| Result1[Return Memory 4]
    V1 -.->|Medium Similarity 0.78| Result2[Return Memory 1]

    style V4 fill:#90EE90
    style V1 fill:#FFE4B5
    style V2 fill:#FFE4E1
    style V3 fill:#FFE4E1
    style Result1 fill:#90EE90
    style Result2 fill:#FFE4B5
```

## Complete Data Flow

```mermaid
flowchart TB
    Start([User Interaction]) --> Working[Store in Working Memory]

    Working --> During{During<br/>Session}

    During -->|Yes| Update[Update Working Memory:<br/>- Current focus<br/>- Active goals<br/>- Context stack]
    Update --> During

    During -->|Session End| Convert[Convert to Episodic Memory]

    Convert --> Store1[(Store Episodic)]

    Store1 --> Extract[Extract Knowledge]

    Extract --> Facts{Facts/Preferences<br/>Found?}
    Facts -->|Yes| Store2[(Store Semantic)]
    Facts -->|No| Check

    Store2 --> Check{Pattern<br/>Detected?}

    Extract --> Pattern{Repeated<br/>Behavior?}
    Pattern -->|Yes| Store3[(Store Procedural)]
    Pattern -->|No| Check

    Store3 --> Check
    Check --> Access{Memory<br/>Accessed?}

    Access -->|Yes| Increment[Increment Access Count<br/>Update Timestamp<br/>Boost Importance]
    Access -->|No| Time

    Increment --> Time{Time<br/>Passes}

    Time --> ApplyDecay[Apply Decay Formula]

    ApplyDecay --> Threshold{Importance ><br/>Threshold?}

    Threshold -->|Below| Archive[(Archive Memory)]
    Threshold -->|Above| Similar{Similar<br/>Memories?}

    Similar -->|Yes| Consolidate[Consolidate Memories]
    Similar -->|No| Access

    Consolidate --> Store4[(Store Consolidated)]
    Store4 --> Archive

    Archive --> End([End])

    style Working fill:#FFE4E1
    style Store1 fill:#E1F5FF
    style Store2 fill:#FFF4E1
    style Store3 fill:#E8F5E8
    style Archive fill:#E0E0E0
```

## Performance Optimization Strategy

```mermaid
graph TB
    subgraph "Request Layer"
        R[Memory Request]
    end

    subgraph "Cache Layer"
        L1[L1: In-Memory<br/>Working Memory]
        L2[L2: Redis<br/>Hot Memories]
    end

    subgraph "Storage Layer"
        DB[Primary DB<br/>All Memories]
        Vec[Vector DB<br/>Embeddings]
    end

    R --> Check1{In L1?}
    Check1 -->|Hit| Return1[Return]
    Check1 -->|Miss| Check2{In L2?}

    Check2 -->|Hit| Promote1[Promote to L1]
    Promote1 --> Return2[Return]

    Check2 -->|Miss| Parallel{Query Type}

    Parallel -->|Semantic| VecQuery[Vector Search]
    Parallel -->|ID Lookup| DBQuery[DB Lookup]
    Parallel -->|Temporal| DBQuery

    VecQuery --> Vec
    DBQuery --> DB

    Vec --> Hydrate[Hydrate from DB]
    Hydrate --> DB

    DB --> Promote2[Promote to L2]
    Promote2 --> Return3[Return]

    Return1 --> End([End])
    Return2 --> End
    Return3 --> End

    style L1 fill:#90EE90
    style L2 fill:#FFE4B5
    style DB fill:#FFE4E1
    style Vec fill:#E1F5FF
```
