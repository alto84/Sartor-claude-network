# MCP Memory System Tool Interface Specification

## Overview

This document defines the Model Context Protocol (MCP) tool interface for a comprehensive AI memory system. The system supports storing, retrieving, managing, and analyzing conversational memories with semantic search, automatic categorization, and lifecycle management.

## Design Principles

- **Snake_case naming**: All tool names use snake_case convention
- **Self-contained operations**: Each tool performs a complete, atomic operation
- **Minimal tool budget**: Tools are designed to minimize the number of calls needed
- **Clear error handling**: Comprehensive error codes and messages
- **Type safety**: Strict JSON Schema validation for all inputs

---

## Tool Specifications

### 1. store_memory

**Description**: Store new information with automatic categorization, tagging, and metadata enrichment.

**Input Schema**:

```json
{
  "type": "object",
  "properties": {
    "content": {
      "type": "string",
      "description": "The memory content to store",
      "minLength": 1,
      "maxLength": 50000
    },
    "context": {
      "type": "object",
      "description": "Contextual information about the memory",
      "properties": {
        "conversation_id": {
          "type": "string",
          "description": "Unique identifier for the conversation"
        },
        "user_id": {
          "type": "string",
          "description": "User identifier"
        },
        "session_id": {
          "type": "string",
          "description": "Session identifier"
        },
        "timestamp": {
          "type": "string",
          "format": "date-time",
          "description": "ISO 8601 timestamp (auto-generated if not provided)"
        }
      }
    },
    "metadata": {
      "type": "object",
      "description": "Additional metadata for the memory",
      "properties": {
        "category": {
          "type": "string",
          "description": "Manual category override (auto-detected if not provided)",
          "enum": [
            "fact",
            "preference",
            "instruction",
            "context",
            "relationship",
            "skill",
            "goal",
            "event",
            "custom"
          ]
        },
        "tags": {
          "type": "array",
          "description": "User-defined tags",
          "items": { "type": "string" },
          "maxItems": 20
        },
        "importance": {
          "type": "number",
          "description": "Importance score (0-1, auto-calculated if not provided)",
          "minimum": 0,
          "maximum": 1
        },
        "access_level": {
          "type": "string",
          "description": "Access control level",
          "enum": ["public", "private", "shared"],
          "default": "private"
        },
        "expires_at": {
          "type": "string",
          "format": "date-time",
          "description": "Optional expiration timestamp"
        }
      }
    },
    "related_memory_ids": {
      "type": "array",
      "description": "IDs of related memories to link",
      "items": { "type": "string" }
    }
  },
  "required": ["content"]
}
```

**Output Format**:

```json
{
  "success": true,
  "memory_id": "mem_a1b2c3d4e5f6",
  "content": "User prefers dark mode in all applications",
  "category": "preference",
  "auto_tags": ["ui", "preferences", "visual"],
  "importance": 0.75,
  "embeddings_generated": true,
  "created_at": "2025-12-06T10:30:00Z",
  "links_created": 3
}
```

**Example Usage**:

```json
{
  "content": "User is learning Spanish and wants conversational practice",
  "context": {
    "conversation_id": "conv_xyz789",
    "user_id": "user_123"
  },
  "metadata": {
    "tags": ["language", "learning"],
    "importance": 0.9
  }
}
```

**Error Handling**:

- `400`: Invalid input (content too long, invalid enum values)
- `409`: Duplicate memory detected (returns existing memory_id)
- `500`: Storage failure (database unavailable, embedding service error)
- `507`: Storage quota exceeded

---

### 2. recall_memories

**Description**: Semantic search across memories with multi-factor ranking based on relevance, recency, importance, and context.

**Input Schema**:

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Semantic search query",
      "minLength": 1,
      "maxLength": 1000
    },
    "filters": {
      "type": "object",
      "description": "Filtering criteria",
      "properties": {
        "categories": {
          "type": "array",
          "description": "Filter by categories",
          "items": {
            "type": "string",
            "enum": [
              "fact",
              "preference",
              "instruction",
              "context",
              "relationship",
              "skill",
              "goal",
              "event",
              "custom"
            ]
          }
        },
        "tags": {
          "type": "array",
          "description": "Filter by tags (OR operation)",
          "items": { "type": "string" }
        },
        "date_range": {
          "type": "object",
          "properties": {
            "start": { "type": "string", "format": "date-time" },
            "end": { "type": "string", "format": "date-time" }
          }
        },
        "min_importance": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        },
        "user_id": {
          "type": "string",
          "description": "Filter by user"
        },
        "conversation_id": {
          "type": "string",
          "description": "Filter by conversation"
        },
        "access_level": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["public", "private", "shared"]
          }
        }
      }
    },
    "ranking": {
      "type": "object",
      "description": "Ranking configuration",
      "properties": {
        "weights": {
          "type": "object",
          "description": "Weights for ranking factors (must sum to 1.0)",
          "properties": {
            "semantic_similarity": { "type": "number", "minimum": 0, "maximum": 1, "default": 0.5 },
            "recency": { "type": "number", "minimum": 0, "maximum": 1, "default": 0.2 },
            "importance": { "type": "number", "minimum": 0, "maximum": 1, "default": 0.2 },
            "access_frequency": { "type": "number", "minimum": 0, "maximum": 1, "default": 0.1 }
          }
        },
        "recency_decay": {
          "type": "string",
          "description": "Decay function for recency",
          "enum": ["linear", "exponential", "logarithmic"],
          "default": "exponential"
        }
      }
    },
    "limit": {
      "type": "integer",
      "description": "Maximum number of results",
      "minimum": 1,
      "maximum": 100,
      "default": 10
    },
    "offset": {
      "type": "integer",
      "description": "Pagination offset",
      "minimum": 0,
      "default": 0
    },
    "include_archived": {
      "type": "boolean",
      "description": "Include archived memories",
      "default": false
    }
  },
  "required": ["query"]
}
```

**Output Format**:

```json
{
  "success": true,
  "query": "What are the user's language preferences?",
  "total_results": 45,
  "returned_count": 10,
  "memories": [
    {
      "memory_id": "mem_a1b2c3d4e5f6",
      "content": "User is learning Spanish and wants conversational practice",
      "category": "preference",
      "tags": ["language", "learning"],
      "importance": 0.9,
      "created_at": "2025-11-15T14:20:00Z",
      "last_accessed": "2025-12-05T09:15:00Z",
      "access_count": 12,
      "scores": {
        "semantic_similarity": 0.92,
        "recency": 0.85,
        "importance": 0.9,
        "access_frequency": 0.67,
        "combined": 0.88
      },
      "context": {
        "conversation_id": "conv_xyz789",
        "user_id": "user_123"
      }
    }
  ],
  "execution_time_ms": 45
}
```

**Example Usage**:

```json
{
  "query": "user's dietary restrictions",
  "filters": {
    "categories": ["preference", "fact"],
    "min_importance": 0.7
  },
  "ranking": {
    "weights": {
      "semantic_similarity": 0.6,
      "recency": 0.1,
      "importance": 0.3
    }
  },
  "limit": 5
}
```

**Error Handling**:

- `400`: Invalid input (weights don't sum to 1.0, invalid date range)
- `413`: Query too complex (too many filters)
- `500`: Search service unavailable
- `503`: Embedding service timeout

---

### 3. update_memory

**Description**: Modify existing memory content, metadata, or relationships with full version history tracking.

**Input Schema**:

```json
{
  "type": "object",
  "properties": {
    "memory_id": {
      "type": "string",
      "description": "ID of the memory to update"
    },
    "updates": {
      "type": "object",
      "description": "Fields to update",
      "properties": {
        "content": {
          "type": "string",
          "description": "Updated content (will regenerate embeddings)",
          "minLength": 1,
          "maxLength": 50000
        },
        "category": {
          "type": "string",
          "enum": [
            "fact",
            "preference",
            "instruction",
            "context",
            "relationship",
            "skill",
            "goal",
            "event",
            "custom"
          ]
        },
        "tags": {
          "type": "object",
          "properties": {
            "add": { "type": "array", "items": { "type": "string" } },
            "remove": { "type": "array", "items": { "type": "string" } },
            "replace": { "type": "array", "items": { "type": "string" } }
          }
        },
        "importance": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        },
        "access_level": {
          "type": "string",
          "enum": ["public", "private", "shared"]
        },
        "expires_at": {
          "type": ["string", "null"],
          "format": "date-time"
        }
      },
      "minProperties": 1
    },
    "reason": {
      "type": "string",
      "description": "Reason for the update (for audit trail)",
      "maxLength": 500
    },
    "merge_strategy": {
      "type": "string",
      "description": "How to merge content if both old and new exist",
      "enum": ["replace", "append", "prepend"],
      "default": "replace"
    }
  },
  "required": ["memory_id", "updates"]
}
```

**Output Format**:

```json
{
  "success": true,
  "memory_id": "mem_a1b2c3d4e5f6",
  "version": 2,
  "updated_fields": ["content", "tags", "importance"],
  "embeddings_regenerated": true,
  "previous_version_id": "ver_x1y2z3",
  "updated_at": "2025-12-06T10:35:00Z"
}
```

**Example Usage**:

```json
{
  "memory_id": "mem_a1b2c3d4e5f6",
  "updates": {
    "content": "User is learning Spanish at intermediate level and prefers conversation over grammar exercises",
    "tags": {
      "add": ["intermediate", "conversation-focused"],
      "remove": ["beginner"]
    },
    "importance": 0.95
  },
  "reason": "User provided updated proficiency level",
  "merge_strategy": "replace"
}
```

**Error Handling**:

- `400`: Invalid input (no updates provided, invalid field values)
- `404`: Memory not found
- `403`: Unauthorized (user doesn't have permission to update)
- `409`: Concurrent modification conflict
- `423`: Memory is locked (being updated by another process)
- `500`: Update failed (database error, embedding regeneration failed)

---

### 4. forget_memory

**Description**: Soft delete a memory with reason tracking, allowing for potential recovery and audit trails.

**Input Schema**:

```json
{
  "type": "object",
  "properties": {
    "memory_id": {
      "type": "string",
      "description": "ID of the memory to forget"
    },
    "reason": {
      "type": "string",
      "description": "Reason for forgetting",
      "enum": ["user_request", "privacy", "outdated", "incorrect", "duplicate", "expired", "other"],
      "default": "user_request"
    },
    "reason_details": {
      "type": "string",
      "description": "Additional details about the reason",
      "maxLength": 1000
    },
    "hard_delete": {
      "type": "boolean",
      "description": "Permanently delete (cannot be recovered)",
      "default": false
    },
    "retention_period_days": {
      "type": "integer",
      "description": "Days to retain before permanent deletion (only if hard_delete=false)",
      "minimum": 0,
      "maximum": 365,
      "default": 30
    },
    "cascade_related": {
      "type": "boolean",
      "description": "Also forget related memories",
      "default": false
    }
  },
  "required": ["memory_id"]
}
```

**Output Format**:

```json
{
  "success": true,
  "memory_id": "mem_a1b2c3d4e5f6",
  "deletion_type": "soft",
  "deleted_at": "2025-12-06T10:40:00Z",
  "recoverable_until": "2026-01-05T10:40:00Z",
  "related_memories_affected": 3,
  "backup_id": "backup_m9n8b7v6"
}
```

**Example Usage**:

```json
{
  "memory_id": "mem_a1b2c3d4e5f6",
  "reason": "outdated",
  "reason_details": "User changed language learning focus from Spanish to French",
  "hard_delete": false,
  "retention_period_days": 90
}
```

**Error Handling**:

- `400`: Invalid input (invalid memory_id format)
- `404`: Memory not found or already deleted
- `403`: Unauthorized (user doesn't have permission to delete)
- `423`: Memory is locked (being accessed by another process)
- `500`: Deletion failed (database error, backup creation failed)

---

### 5. consolidate_memories

**Description**: Merge related or duplicate memories into a single, coherent memory with preserved provenance.

**Input Schema**:

```json
{
  "type": "object",
  "properties": {
    "memory_ids": {
      "type": "array",
      "description": "IDs of memories to consolidate",
      "items": { "type": "string" },
      "minItems": 2,
      "maxItems": 50
    },
    "consolidation_strategy": {
      "type": "string",
      "description": "How to merge the memories",
      "enum": ["merge_all", "keep_primary", "ai_synthesis"],
      "default": "ai_synthesis"
    },
    "primary_memory_id": {
      "type": "string",
      "description": "Primary memory to keep (required if strategy is 'keep_primary')"
    },
    "synthesis_instructions": {
      "type": "string",
      "description": "Custom instructions for AI synthesis",
      "maxLength": 1000
    },
    "preserve_metadata": {
      "type": "object",
      "description": "Which metadata to preserve",
      "properties": {
        "earliest_timestamp": { "type": "boolean", "default": true },
        "highest_importance": { "type": "boolean", "default": true },
        "all_tags": { "type": "boolean", "default": true },
        "all_links": { "type": "boolean", "default": true }
      }
    },
    "keep_originals": {
      "type": "boolean",
      "description": "Keep original memories as archived versions",
      "default": true
    }
  },
  "required": ["memory_ids", "consolidation_strategy"]
}
```

**Output Format**:

```json
{
  "success": true,
  "consolidated_memory_id": "mem_c7d8e9f0g1h2",
  "source_memory_ids": ["mem_a1b2c3", "mem_d4e5f6", "mem_g7h8i9"],
  "content": "User is learning Spanish at intermediate level, prefers conversational practice over grammar, and uses language learning apps daily for 30 minutes",
  "category": "preference",
  "tags": [
    "language",
    "learning",
    "spanish",
    "intermediate",
    "conversation-focused",
    "daily-routine"
  ],
  "importance": 0.95,
  "created_at": "2025-11-15T14:20:00Z",
  "consolidated_at": "2025-12-06T10:45:00Z",
  "provenance": {
    "source_count": 3,
    "synthesis_method": "ai_synthesis",
    "originals_archived": true,
    "archive_ids": ["arch_a1b2c3", "arch_d4e5f6", "arch_g7h8i9"]
  }
}
```

**Example Usage**:

```json
{
  "memory_ids": ["mem_a1b2c3", "mem_d4e5f6", "mem_g7h8i9"],
  "consolidation_strategy": "ai_synthesis",
  "synthesis_instructions": "Merge these related language learning preferences into a comprehensive summary",
  "preserve_metadata": {
    "earliest_timestamp": true,
    "highest_importance": true,
    "all_tags": true
  },
  "keep_originals": true
}
```

**Error Handling**:

- `400`: Invalid input (too few memories, missing primary_memory_id when required)
- `404`: One or more memories not found
- `403`: Unauthorized (user doesn't have permission for all memories)
- `409`: Memories are too dissimilar to consolidate
- `422`: Consolidation strategy incompatible with provided memories
- `500`: Consolidation failed (AI synthesis error, database error)

---

### 6. list_memories

**Description**: Browse memories with comprehensive filtering, sorting, and pagination capabilities.

**Input Schema**:

```json
{
  "type": "object",
  "properties": {
    "filters": {
      "type": "object",
      "properties": {
        "categories": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "fact",
              "preference",
              "instruction",
              "context",
              "relationship",
              "skill",
              "goal",
              "event",
              "custom"
            ]
          }
        },
        "tags": {
          "type": "array",
          "items": { "type": "string" }
        },
        "date_range": {
          "type": "object",
          "properties": {
            "start": { "type": "string", "format": "date-time" },
            "end": { "type": "string", "format": "date-time" }
          }
        },
        "importance_range": {
          "type": "object",
          "properties": {
            "min": { "type": "number", "minimum": 0, "maximum": 1 },
            "max": { "type": "number", "minimum": 0, "maximum": 1 }
          }
        },
        "user_id": { "type": "string" },
        "conversation_id": { "type": "string" },
        "access_level": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["public", "private", "shared"]
          }
        },
        "status": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["active", "archived", "deleted"]
          },
          "default": ["active"]
        }
      }
    },
    "sort": {
      "type": "object",
      "properties": {
        "field": {
          "type": "string",
          "enum": [
            "created_at",
            "updated_at",
            "last_accessed",
            "importance",
            "access_count",
            "content_length"
          ],
          "default": "created_at"
        },
        "order": {
          "type": "string",
          "enum": ["asc", "desc"],
          "default": "desc"
        }
      }
    },
    "pagination": {
      "type": "object",
      "properties": {
        "limit": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "default": 20
        },
        "offset": {
          "type": "integer",
          "minimum": 0,
          "default": 0
        },
        "cursor": {
          "type": "string",
          "description": "Cursor for cursor-based pagination (alternative to offset)"
        }
      }
    },
    "include_content": {
      "type": "boolean",
      "description": "Include full content (false returns only metadata)",
      "default": true
    },
    "include_stats": {
      "type": "boolean",
      "description": "Include statistics for each memory",
      "default": false
    }
  }
}
```

**Output Format**:

```json
{
  "success": true,
  "total_count": 1247,
  "returned_count": 20,
  "memories": [
    {
      "memory_id": "mem_a1b2c3d4e5f6",
      "content": "User is learning Spanish and wants conversational practice",
      "category": "preference",
      "tags": ["language", "learning"],
      "importance": 0.9,
      "created_at": "2025-11-15T14:20:00Z",
      "updated_at": "2025-11-20T09:30:00Z",
      "last_accessed": "2025-12-05T09:15:00Z",
      "access_count": 12,
      "version": 2,
      "access_level": "private",
      "context": {
        "user_id": "user_123",
        "conversation_id": "conv_xyz789"
      },
      "stats": {
        "content_length": 54,
        "link_count": 3,
        "days_since_creation": 21,
        "days_since_access": 1
      }
    }
  ],
  "pagination": {
    "has_more": true,
    "next_cursor": "eyJpZCI6Im1lbV9hMWIyYzNkNGU1ZjYiLCJ0cyI6MTczMzQ4NTIwMH0",
    "next_offset": 20
  }
}
```

**Example Usage**:

```json
{
  "filters": {
    "categories": ["preference", "goal"],
    "importance_range": {
      "min": 0.7
    },
    "status": ["active"]
  },
  "sort": {
    "field": "importance",
    "order": "desc"
  },
  "pagination": {
    "limit": 50
  },
  "include_stats": true
}
```

**Error Handling**:

- `400`: Invalid input (invalid date range, min > max in ranges)
- `403`: Unauthorized (requesting memories user doesn't have access to)
- `500`: Query failed (database error)

---

### 7. get_memory_stats

**Description**: Retrieve usage metrics, health indicators, and analytics about the memory system.

**Input Schema**:

```json
{
  "type": "object",
  "properties": {
    "scope": {
      "type": "string",
      "description": "Scope of statistics",
      "enum": ["global", "user", "conversation", "category"],
      "default": "user"
    },
    "scope_id": {
      "type": "string",
      "description": "ID for the scope (user_id, conversation_id, etc.)"
    },
    "time_range": {
      "type": "object",
      "properties": {
        "start": { "type": "string", "format": "date-time" },
        "end": { "type": "string", "format": "date-time" }
      }
    },
    "metrics": {
      "type": "array",
      "description": "Specific metrics to retrieve (all if not specified)",
      "items": {
        "type": "string",
        "enum": [
          "count",
          "storage_size",
          "category_distribution",
          "importance_distribution",
          "access_patterns",
          "growth_rate",
          "recall_frequency",
          "consolidation_rate",
          "deletion_rate",
          "health_score"
        ]
      }
    },
    "include_trends": {
      "type": "boolean",
      "description": "Include trend analysis over time",
      "default": false
    },
    "granularity": {
      "type": "string",
      "description": "Time granularity for trends",
      "enum": ["hour", "day", "week", "month"],
      "default": "day"
    }
  }
}
```

**Output Format**:

```json
{
  "success": true,
  "scope": "user",
  "scope_id": "user_123",
  "time_range": {
    "start": "2025-11-01T00:00:00Z",
    "end": "2025-12-06T10:50:00Z"
  },
  "statistics": {
    "count": {
      "total": 1247,
      "active": 1180,
      "archived": 45,
      "deleted": 22
    },
    "storage_size": {
      "total_bytes": 5242880,
      "average_memory_bytes": 4205,
      "embeddings_bytes": 2097152
    },
    "category_distribution": {
      "fact": 420,
      "preference": 315,
      "instruction": 180,
      "context": 225,
      "relationship": 107
    },
    "importance_distribution": {
      "high": 312,
      "medium": 680,
      "low": 255
    },
    "access_patterns": {
      "total_recalls": 5430,
      "unique_memories_accessed": 847,
      "average_recalls_per_memory": 4.35,
      "most_accessed_memory_id": "mem_x9y8z7",
      "most_accessed_count": 145
    },
    "growth_rate": {
      "memories_per_day": 35.6,
      "trend": "increasing",
      "percent_change": 12.5
    },
    "recall_frequency": {
      "daily_average": 156,
      "peak_hour": 14,
      "peak_day": "wednesday"
    },
    "consolidation_rate": {
      "consolidations_per_week": 3.2,
      "memories_consolidated": 87,
      "consolidation_ratio": 0.07
    },
    "deletion_rate": {
      "deletions_per_week": 1.5,
      "soft_deletes": 18,
      "hard_deletes": 4,
      "deletion_ratio": 0.018
    },
    "health_score": {
      "overall": 0.92,
      "factors": {
        "deduplication": 0.95,
        "categorization_accuracy": 0.91,
        "access_distribution": 0.88,
        "storage_efficiency": 0.94
      }
    }
  },
  "trends": {
    "memory_count": [
      { "date": "2025-12-01", "value": 1150 },
      { "date": "2025-12-02", "value": 1175 },
      { "date": "2025-12-03", "value": 1198 },
      { "date": "2025-12-04", "value": 1220 },
      { "date": "2025-12-05", "value": 1235 },
      { "date": "2025-12-06", "value": 1247 }
    ]
  },
  "generated_at": "2025-12-06T10:50:00Z"
}
```

**Example Usage**:

```json
{
  "scope": "user",
  "scope_id": "user_123",
  "time_range": {
    "start": "2025-11-01T00:00:00Z",
    "end": "2025-12-06T23:59:59Z"
  },
  "metrics": ["count", "category_distribution", "health_score"],
  "include_trends": true,
  "granularity": "week"
}
```

**Error Handling**:

- `400`: Invalid input (invalid time range, missing scope_id when required)
- `403`: Unauthorized (user doesn't have permission for requested scope)
- `404`: Scope not found (invalid user_id or conversation_id)
- `500`: Statistics calculation failed

---

### 8. sync_memories

**Description**: Force synchronization of memories across different surfaces, devices, or storage backends.

**Input Schema**:

```json
{
  "type": "object",
  "properties": {
    "sync_type": {
      "type": "string",
      "description": "Type of synchronization",
      "enum": ["full", "incremental", "bidirectional", "push", "pull"],
      "default": "incremental"
    },
    "source": {
      "type": "string",
      "description": "Source identifier (device, surface, or storage)",
      "default": "local"
    },
    "destination": {
      "type": "string",
      "description": "Destination identifier",
      "default": "cloud"
    },
    "filters": {
      "type": "object",
      "description": "Only sync memories matching these filters",
      "properties": {
        "categories": {
          "type": "array",
          "items": { "type": "string" }
        },
        "user_id": { "type": "string" },
        "conversation_id": { "type": "string" },
        "modified_since": {
          "type": "string",
          "format": "date-time"
        }
      }
    },
    "conflict_resolution": {
      "type": "string",
      "description": "How to handle conflicts",
      "enum": ["source_wins", "destination_wins", "newest_wins", "merge", "manual"],
      "default": "newest_wins"
    },
    "dry_run": {
      "type": "boolean",
      "description": "Preview changes without applying them",
      "default": false
    },
    "background": {
      "type": "boolean",
      "description": "Run sync in background (returns immediately with job_id)",
      "default": false
    }
  }
}
```

**Output Format**:

```json
{
  "success": true,
  "sync_id": "sync_p1q2r3s4t5u6",
  "sync_type": "incremental",
  "source": "local",
  "destination": "cloud",
  "started_at": "2025-12-06T10:55:00Z",
  "completed_at": "2025-12-06T10:55:12Z",
  "duration_ms": 12340,
  "summary": {
    "total_checked": 1247,
    "synced": 87,
    "created": 32,
    "updated": 45,
    "deleted": 10,
    "conflicts": 3,
    "conflicts_resolved": 3,
    "skipped": 0,
    "errors": 0
  },
  "conflicts_handled": [
    {
      "memory_id": "mem_a1b2c3",
      "resolution": "newest_wins",
      "winner": "destination"
    }
  ],
  "next_sync_recommended": "2025-12-06T22:55:00Z"
}
```

**Example Usage**:

```json
{
  "sync_type": "incremental",
  "source": "mobile_device_01",
  "destination": "cloud",
  "filters": {
    "user_id": "user_123",
    "modified_since": "2025-12-05T00:00:00Z"
  },
  "conflict_resolution": "newest_wins",
  "dry_run": false
}
```

**Error Handling**:

- `400`: Invalid input (invalid source/destination, conflicting options)
- `403`: Unauthorized (user doesn't have permission to sync)
- `404`: Source or destination not found
- `409`: Unresolvable conflicts (when conflict_resolution="manual")
- `423`: Sync already in progress
- `500`: Sync failed (network error, storage error)
- `503`: Sync service unavailable

---

### 9. archive_memory

**Description**: Move memories to cold storage for long-term retention with reduced access costs and performance.

**Input Schema**:

```json
{
  "type": "object",
  "properties": {
    "memory_id": {
      "type": "string",
      "description": "ID of memory to archive (use memory_ids for batch)"
    },
    "memory_ids": {
      "type": "array",
      "description": "IDs of memories to archive in batch",
      "items": { "type": "string" },
      "maxItems": 1000
    },
    "auto_archive_criteria": {
      "type": "object",
      "description": "Criteria for automatic archival (instead of specific IDs)",
      "properties": {
        "inactive_days": {
          "type": "integer",
          "description": "Archive if not accessed for this many days",
          "minimum": 1
        },
        "low_importance": {
          "type": "number",
          "description": "Archive if importance below this threshold",
          "minimum": 0,
          "maximum": 1
        },
        "categories": {
          "type": "array",
          "description": "Archive memories in these categories",
          "items": { "type": "string" }
        },
        "before_date": {
          "type": "string",
          "format": "date-time",
          "description": "Archive memories created before this date"
        }
      },
      "minProperties": 1
    },
    "archive_tier": {
      "type": "string",
      "description": "Storage tier for archived memories",
      "enum": ["cold", "glacier", "deep_archive"],
      "default": "cold"
    },
    "retain_embeddings": {
      "type": "boolean",
      "description": "Keep embeddings for potential semantic search",
      "default": false
    },
    "reason": {
      "type": "string",
      "description": "Reason for archival",
      "maxLength": 500
    },
    "dry_run": {
      "type": "boolean",
      "description": "Preview what would be archived",
      "default": false
    }
  },
  "oneOf": [
    { "required": ["memory_id"] },
    { "required": ["memory_ids"] },
    { "required": ["auto_archive_criteria"] }
  ]
}
```

**Output Format**:

```json
{
  "success": true,
  "archive_job_id": "arch_job_v1w2x3y4z5",
  "archived_count": 145,
  "memories_archived": [
    {
      "memory_id": "mem_a1b2c3d4e5f6",
      "archive_id": "arch_a1b2c3",
      "archive_tier": "cold",
      "archived_at": "2025-12-06T11:00:00Z",
      "retrieval_time_estimate_ms": 5000,
      "storage_cost_reduction": 0.85
    }
  ],
  "storage_saved_bytes": 2621440,
  "estimated_monthly_savings": 12.5,
  "embeddings_retained": false,
  "total_cost": 0.05
}
```

**Example Usage**:

```json
{
  "auto_archive_criteria": {
    "inactive_days": 90,
    "low_importance": 0.3,
    "categories": ["context", "event"]
  },
  "archive_tier": "cold",
  "retain_embeddings": false,
  "reason": "Quarterly cleanup of low-value memories",
  "dry_run": false
}
```

**Error Handling**:

- `400`: Invalid input (no criteria provided, invalid tier)
- `403`: Unauthorized (user doesn't have permission to archive)
- `404`: Memory not found
- `409`: Memory already archived
- `422`: Memory doesn't meet archival criteria
- `500`: Archival failed (storage error)
- `507`: Archive storage quota exceeded

---

### 10. restore_memory

**Description**: Retrieve archived memories from cold storage back to active status.

**Input Schema**:

```json
{
  "type": "object",
  "properties": {
    "memory_id": {
      "type": "string",
      "description": "ID of archived memory to restore"
    },
    "archive_id": {
      "type": "string",
      "description": "Archive ID (alternative to memory_id)"
    },
    "memory_ids": {
      "type": "array",
      "description": "Batch restore multiple memories",
      "items": { "type": "string" },
      "maxItems": 100
    },
    "restore_mode": {
      "type": "string",
      "description": "How to restore the memory",
      "enum": ["full", "metadata_only", "expedited"],
      "default": "full"
    },
    "regenerate_embeddings": {
      "type": "boolean",
      "description": "Regenerate embeddings if not retained",
      "default": true
    },
    "reason": {
      "type": "string",
      "description": "Reason for restoration",
      "maxLength": 500
    },
    "priority": {
      "type": "string",
      "description": "Restoration priority",
      "enum": ["low", "normal", "high"],
      "default": "normal"
    }
  },
  "oneOf": [
    { "required": ["memory_id"] },
    { "required": ["archive_id"] },
    { "required": ["memory_ids"] }
  ]
}
```

**Output Format**:

```json
{
  "success": true,
  "restore_job_id": "restore_job_b2c3d4e5f6",
  "status": "completed",
  "restored_count": 1,
  "memories_restored": [
    {
      "memory_id": "mem_a1b2c3d4e5f6",
      "archive_id": "arch_a1b2c3",
      "restored_at": "2025-12-06T11:05:00Z",
      "restore_mode": "full",
      "embeddings_regenerated": true,
      "restoration_time_ms": 3420
    }
  ],
  "total_cost": 0.02,
  "estimated_time_remaining_ms": 0
}
```

**Example Usage**:

```json
{
  "memory_id": "mem_a1b2c3d4e5f6",
  "restore_mode": "expedited",
  "regenerate_embeddings": true,
  "reason": "User requested information from archived conversation",
  "priority": "high"
}
```

**Error Handling**:

- `400`: Invalid input (invalid mode or priority)
- `403`: Unauthorized (user doesn't have permission to restore)
- `404`: Memory or archive not found
- `409`: Memory already in active status
- `422`: Memory cannot be restored (corrupted archive)
- `500`: Restoration failed (storage retrieval error)
- `503`: Archive service unavailable (try again later)

---

## Common Error Response Format

All tools return errors in a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "MEMORY_NOT_FOUND",
    "message": "The specified memory does not exist or has been deleted",
    "status": 404,
    "details": {
      "memory_id": "mem_invalid123",
      "searched_in": ["active", "archived"]
    },
    "timestamp": "2025-12-06T11:10:00Z",
    "request_id": "req_x1y2z3a4b5c6"
  }
}
```

## Rate Limits

All tools are subject to rate limiting:

- **store_memory**: 100 requests/minute
- **recall_memories**: 1000 requests/minute
- **update_memory**: 200 requests/minute
- **forget_memory**: 50 requests/minute
- **consolidate_memories**: 10 requests/minute
- **list_memories**: 500 requests/minute
- **get_memory_stats**: 100 requests/minute
- **sync_memories**: 10 requests/minute
- **archive_memory**: 20 requests/minute
- **restore_memory**: 20 requests/minute

Rate limit headers are included in all responses:

- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Versioning

This specification is version **1.0.0** following semantic versioning.

API version is included in all responses:

```json
{
  "api_version": "1.0.0",
  "success": true,
  ...
}
```

## Authentication

All tools require authentication via:

- Bearer token in `Authorization` header
- API key in `X-API-Key` header (alternative)
- Session cookie for web applications

## Best Practices

1. **Batch Operations**: Use array inputs when operating on multiple memories
2. **Pagination**: Use cursor-based pagination for large result sets
3. **Filtering**: Apply filters server-side rather than retrieving all and filtering client-side
4. **Caching**: Cache frequently accessed memories client-side
5. **Error Handling**: Always check `success` field and handle errors gracefully
6. **Idempotency**: Store and update operations support idempotency keys via `X-Idempotency-Key` header
7. **Dry Runs**: Use dry_run flags to preview destructive operations
8. **Background Jobs**: Use background mode for long-running operations
