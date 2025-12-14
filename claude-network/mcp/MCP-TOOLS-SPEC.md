# MCP Tools Specification for Sartor Claude Network

## Overview

This document provides detailed specifications for all MCP tools in the Sartor Claude Network server. Each tool includes JSON schema definitions, example usage, error scenarios, and implementation notes.

## Table of Contents

1. [Firebase Tools](#firebase-tools)
2. [GitHub Tools](#github-tools)
3. [Onboarding Tools](#onboarding-tools)
4. [System Navigation Tools](#system-navigation-tools)
5. [Common Types](#common-types)
6. [Error Codes](#error-codes)

## Firebase Tools

### 1. firebase.read

**Description**: Read data from Firebase Realtime Database or Firestore

**Input Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["database", "path"],
  "properties": {
    "database": {
      "type": "string",
      "enum": ["realtime", "firestore"],
      "description": "Database type to read from"
    },
    "path": {
      "type": "string",
      "description": "Path to the data (collection/document for Firestore, path for Realtime DB)",
      "pattern": "^[a-zA-Z0-9/_-]+$"
    },
    "query": {
      "type": "object",
      "properties": {
        "orderBy": {
          "type": "string",
          "description": "Field to order results by"
        },
        "limit": {
          "type": "integer",
          "minimum": 1,
          "maximum": 1000,
          "description": "Maximum number of results"
        },
        "startAt": {
          "type": ["string", "number", "boolean"],
          "description": "Starting point for query"
        },
        "endAt": {
          "type": ["string", "number", "boolean"],
          "description": "Ending point for query"
        }
      }
    },
    "shallow": {
      "type": "boolean",
      "default": false,
      "description": "For Realtime DB: return only keys at the path"
    }
  }
}
```

**Output Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["success", "data"],
  "properties": {
    "success": {
      "type": "boolean"
    },
    "data": {
      "type": ["object", "array", "null"],
      "description": "Retrieved data"
    },
    "metadata": {
      "type": "object",
      "properties": {
        "path": { "type": "string" },
        "timestamp": { "type": "string", "format": "date-time" },
        "count": { "type": "integer" }
      }
    }
  }
}
```

**Example Usage**:

```json
// Request
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "firebase.read",
  "params": {
    "database": "firestore",
    "path": "agents/agent-001",
    "query": {
      "limit": 10
    }
  }
}

// Response
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
    "success": true,
    "data": {
      "id": "agent-001",
      "name": "Research Agent",
      "status": "active",
      "capabilities": ["research", "analysis"]
    },
    "metadata": {
      "path": "agents/agent-001",
      "timestamp": "2025-11-03T10:30:00Z",
      "count": 1
    }
  }
}
```

**Error Scenarios**:

- `PERMISSION_DENIED`: User lacks read permissions
- `NOT_FOUND`: Path doesn't exist
- `INVALID_PATH`: Malformed path syntax
- `QUOTA_EXCEEDED`: Firebase quota limits reached
- `CONNECTION_ERROR`: Network connectivity issues

### 2. firebase.write

**Description**: Write data to Firebase Realtime Database or Firestore

**Input Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["database", "path", "data"],
  "properties": {
    "database": {
      "type": "string",
      "enum": ["realtime", "firestore"],
      "description": "Database type to write to"
    },
    "path": {
      "type": "string",
      "description": "Path to write data",
      "pattern": "^[a-zA-Z0-9/_-]+$"
    },
    "data": {
      "type": ["object", "array", "string", "number", "boolean", "null"],
      "description": "Data to write"
    },
    "operation": {
      "type": "string",
      "enum": ["set", "update", "push", "delete"],
      "default": "set",
      "description": "Type of write operation"
    },
    "merge": {
      "type": "boolean",
      "default": false,
      "description": "For Firestore: merge with existing document"
    },
    "transaction": {
      "type": "boolean",
      "default": false,
      "description": "Execute as transaction"
    }
  }
}
```

**Output Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["success"],
  "properties": {
    "success": {
      "type": "boolean"
    },
    "key": {
      "type": "string",
      "description": "Generated key for push operations"
    },
    "metadata": {
      "type": "object",
      "properties": {
        "path": { "type": "string" },
        "timestamp": { "type": "string", "format": "date-time" },
        "operation": { "type": "string" }
      }
    }
  }
}
```

**Example Usage**:

```json
// Request
{
  "jsonrpc": "2.0",
  "id": "2",
  "method": "firebase.write",
  "params": {
    "database": "firestore",
    "path": "messages/conversations/conv-123",
    "data": {
      "from": "agent-001",
      "to": "agent-002",
      "message": "Task completed successfully",
      "timestamp": "2025-11-03T10:35:00Z"
    },
    "operation": "push"
  }
}

// Response
{
  "jsonrpc": "2.0",
  "id": "2",
  "result": {
    "success": true,
    "key": "msg-xyz789",
    "metadata": {
      "path": "messages/conversations/conv-123",
      "timestamp": "2025-11-03T10:35:01Z",
      "operation": "push"
    }
  }
}
```

**Error Scenarios**:

- `PERMISSION_DENIED`: User lacks write permissions
- `VALIDATION_ERROR`: Data doesn't match schema
- `CONFLICT`: Transaction conflict
- `SIZE_LIMIT_EXCEEDED`: Data too large
- `INVALID_DATA_TYPE`: Unsupported data type

### 3. firebase.subscribe

**Description**: Subscribe to real-time updates from Firebase

**Input Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["database", "path", "subscriptionId"],
  "properties": {
    "subscriptionId": {
      "type": "string",
      "description": "Unique identifier for this subscription",
      "pattern": "^[a-zA-Z0-9-]+$"
    },
    "database": {
      "type": "string",
      "enum": ["realtime", "firestore"],
      "description": "Database type to subscribe to"
    },
    "path": {
      "type": "string",
      "description": "Path to monitor",
      "pattern": "^[a-zA-Z0-9/_-]+$"
    },
    "eventType": {
      "type": "string",
      "enum": [
        "value",
        "child_added",
        "child_changed",
        "child_removed",
        "document_added",
        "document_modified",
        "document_deleted"
      ],
      "default": "value",
      "description": "Type of events to listen for"
    },
    "includeInitial": {
      "type": "boolean",
      "default": true,
      "description": "Include initial data in subscription"
    }
  }
}
```

**Output Schema (Initial)**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["success", "subscriptionId"],
  "properties": {
    "success": {
      "type": "boolean"
    },
    "subscriptionId": {
      "type": "string"
    },
    "initialData": {
      "type": ["object", "array", "null"],
      "description": "Initial data at subscription path"
    }
  }
}
```

**Event Notification Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["subscriptionId", "eventType", "data"],
  "properties": {
    "subscriptionId": {
      "type": "string"
    },
    "eventType": {
      "type": "string"
    },
    "data": {
      "type": ["object", "array", "string", "number", "boolean", "null"]
    },
    "previousData": {
      "type": ["object", "array", "string", "number", "boolean", "null"],
      "description": "Previous value (for change events)"
    },
    "key": {
      "type": "string",
      "description": "Key of changed child (for child events)"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    }
  }
}
```

**Example Usage**:

```json
// Subscribe Request
{
  "jsonrpc": "2.0",
  "id": "3",
  "method": "firebase.subscribe",
  "params": {
    "subscriptionId": "sub-tasks-001",
    "database": "realtime",
    "path": "tasks/queue",
    "eventType": "child_added",
    "includeInitial": false
  }
}

// Event Notification (sent as server notification)
{
  "jsonrpc": "2.0",
  "method": "firebase.event",
  "params": {
    "subscriptionId": "sub-tasks-001",
    "eventType": "child_added",
    "data": {
      "id": "task-456",
      "type": "analysis",
      "priority": "high"
    },
    "key": "task-456",
    "timestamp": "2025-11-03T10:40:00Z"
  }
}
```

### 4. firebase.unsubscribe

**Description**: Cancel an active Firebase subscription

**Input Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["subscriptionId"],
  "properties": {
    "subscriptionId": {
      "type": "string",
      "description": "Subscription ID to cancel"
    }
  }
}
```

## GitHub Tools

### 1. github.readFile

**Description**: Read a file from a GitHub repository

**Input Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["owner", "repo", "path"],
  "properties": {
    "owner": {
      "type": "string",
      "description": "Repository owner (user or organization)",
      "pattern": "^[a-zA-Z0-9-]+$"
    },
    "repo": {
      "type": "string",
      "description": "Repository name",
      "pattern": "^[a-zA-Z0-9-_.]+$"
    },
    "path": {
      "type": "string",
      "description": "File path within repository"
    },
    "ref": {
      "type": "string",
      "default": "main",
      "description": "Branch, tag, or commit SHA"
    },
    "encoding": {
      "type": "string",
      "enum": ["utf8", "base64"],
      "default": "utf8",
      "description": "Response encoding for file content"
    }
  }
}
```

**Output Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["content", "metadata"],
  "properties": {
    "content": {
      "type": "string",
      "description": "File content (text or base64)"
    },
    "metadata": {
      "type": "object",
      "properties": {
        "path": { "type": "string" },
        "size": { "type": "integer" },
        "sha": { "type": "string" },
        "encoding": { "type": "string" },
        "type": { "type": "string", "enum": ["file", "symlink", "submodule"] }
      }
    }
  }
}
```

**Example Usage**:

```json
// Request
{
  "jsonrpc": "2.0",
  "id": "4",
  "method": "github.readFile",
  "params": {
    "owner": "sartor-ai",
    "repo": "claude-network",
    "path": "README.md",
    "ref": "main"
  }
}

// Response
{
  "jsonrpc": "2.0",
  "id": "4",
  "result": {
    "content": "# Claude Network\n\nA distributed AI agent system...",
    "metadata": {
      "path": "README.md",
      "size": 2048,
      "sha": "abc123def456",
      "encoding": "utf8",
      "type": "file"
    }
  }
}
```

**Error Scenarios**:

- `FILE_NOT_FOUND`: File doesn't exist at specified path
- `REPO_NOT_FOUND`: Repository doesn't exist
- `ACCESS_DENIED`: Private repository without access
- `RATE_LIMIT`: GitHub API rate limit exceeded
- `REF_NOT_FOUND`: Branch/tag/commit doesn't exist

### 2. github.searchCode

**Description**: Search for code across GitHub repositories

**Input Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["query"],
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query",
      "minLength": 1,
      "maxLength": 256
    },
    "filters": {
      "type": "object",
      "properties": {
        "owner": { "type": "string" },
        "repo": { "type": "string" },
        "language": { "type": "string" },
        "path": { "type": "string" },
        "filename": { "type": "string" },
        "extension": { "type": "string" }
      }
    },
    "sort": {
      "type": "string",
      "enum": ["indexed", "best-match"],
      "default": "best-match"
    },
    "perPage": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "default": 30
    },
    "page": {
      "type": "integer",
      "minimum": 1,
      "default": 1
    }
  }
}
```

**Output Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["results", "total"],
  "properties": {
    "results": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "repository": {
            "type": "object",
            "properties": {
              "owner": { "type": "string" },
              "name": { "type": "string" },
              "description": { "type": "string" },
              "stars": { "type": "integer" }
            }
          },
          "path": { "type": "string" },
          "matches": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "line": { "type": "integer" },
                "text": { "type": "string" },
                "highlight": { "type": "string" }
              }
            }
          }
        }
      }
    },
    "total": {
      "type": "integer",
      "description": "Total number of results"
    },
    "page": {
      "type": "integer"
    },
    "perPage": {
      "type": "integer"
    }
  }
}
```

### 3. github.createIssue

**Description**: Create a new issue in a GitHub repository

**Input Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["owner", "repo", "title"],
  "properties": {
    "owner": {
      "type": "string",
      "description": "Repository owner"
    },
    "repo": {
      "type": "string",
      "description": "Repository name"
    },
    "title": {
      "type": "string",
      "description": "Issue title",
      "minLength": 1,
      "maxLength": 256
    },
    "body": {
      "type": "string",
      "description": "Issue description (Markdown supported)"
    },
    "labels": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Labels to apply"
    },
    "assignees": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Users to assign"
    },
    "milestone": {
      "type": "integer",
      "description": "Milestone number"
    }
  }
}
```

### 4. github.createPR

**Description**: Create a pull request

**Input Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["owner", "repo", "title", "head", "base"],
  "properties": {
    "owner": {
      "type": "string",
      "description": "Repository owner"
    },
    "repo": {
      "type": "string",
      "description": "Repository name"
    },
    "title": {
      "type": "string",
      "description": "PR title",
      "minLength": 1,
      "maxLength": 256
    },
    "body": {
      "type": "string",
      "description": "PR description (Markdown supported)"
    },
    "head": {
      "type": "string",
      "description": "Branch to merge from"
    },
    "base": {
      "type": "string",
      "description": "Branch to merge into"
    },
    "draft": {
      "type": "boolean",
      "default": false,
      "description": "Create as draft PR"
    },
    "maintainer_can_modify": {
      "type": "boolean",
      "default": true
    }
  }
}
```

### 5. github.getWorkflowRuns

**Description**: Get GitHub Actions workflow runs

**Input Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["owner", "repo"],
  "properties": {
    "owner": {
      "type": "string"
    },
    "repo": {
      "type": "string"
    },
    "workflow_id": {
      "type": ["string", "integer"],
      "description": "Workflow ID or filename"
    },
    "status": {
      "type": "string",
      "enum": [
        "completed",
        "action_required",
        "cancelled",
        "failure",
        "neutral",
        "skipped",
        "stale",
        "success",
        "timed_out",
        "in_progress",
        "queued",
        "requested",
        "waiting"
      ]
    },
    "branch": {
      "type": "string"
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "default": 30
    }
  }
}
```

## Onboarding Tools

### 1. onboarding.getWelcome

**Description**: Generate personalized welcome message for new agents

**Input Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["agentName", "role"],
  "properties": {
    "agentName": {
      "type": "string",
      "description": "Name of the new agent",
      "minLength": 1,
      "maxLength": 100
    },
    "role": {
      "type": "string",
      "enum": ["researcher", "developer", "coordinator", "analyst", "specialist"],
      "description": "Agent's primary role"
    },
    "specializations": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Areas of specialization"
    },
    "language": {
      "type": "string",
      "default": "en",
      "description": "Preferred language (ISO 639-1)"
    }
  }
}
```

**Output Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["welcome", "quickStart", "resources"],
  "properties": {
    "welcome": {
      "type": "object",
      "properties": {
        "message": { "type": "string" },
        "systemOverview": { "type": "string" },
        "roleDescription": { "type": "string" }
      }
    },
    "quickStart": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "step": { "type": "integer" },
          "title": { "type": "string" },
          "description": { "type": "string" },
          "action": { "type": "string" }
        }
      }
    },
    "resources": {
      "type": "object",
      "properties": {
        "documentation": { "type": "array", "items": { "type": "string" } },
        "tutorials": { "type": "array", "items": { "type": "string" } },
        "contacts": { "type": "array", "items": { "type": "string" } }
      }
    }
  }
}
```

### 2. onboarding.registerAgent

**Description**: Register a new agent in the system

**Input Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["agentInfo", "capabilities"],
  "properties": {
    "agentInfo": {
      "type": "object",
      "required": ["name", "type", "version"],
      "properties": {
        "name": {
          "type": "string",
          "pattern": "^[a-zA-Z0-9-_]+$",
          "minLength": 3,
          "maxLength": 50
        },
        "type": {
          "type": "string",
          "enum": ["researcher", "developer", "coordinator", "analyst", "specialist"]
        },
        "version": {
          "type": "string",
          "pattern": "^\\d+\\.\\d+\\.\\d+$"
        },
        "description": {
          "type": "string",
          "maxLength": 500
        },
        "creator": {
          "type": "string"
        }
      }
    },
    "capabilities": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "category"],
        "properties": {
          "name": { "type": "string" },
          "category": { "type": "string" },
          "parameters": { "type": "object" }
        }
      },
      "minItems": 1
    },
    "configuration": {
      "type": "object",
      "properties": {
        "maxConcurrentTasks": { "type": "integer", "minimum": 1, "default": 5 },
        "timeout": { "type": "integer", "minimum": 1000, "default": 30000 },
        "retryPolicy": {
          "type": "object",
          "properties": {
            "maxRetries": { "type": "integer", "default": 3 },
            "backoffMs": { "type": "integer", "default": 1000 }
          }
        }
      }
    }
  }
}
```

**Output Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["agentId", "credentials", "endpoints"],
  "properties": {
    "agentId": {
      "type": "string",
      "description": "Unique agent identifier"
    },
    "credentials": {
      "type": "object",
      "properties": {
        "apiKey": { "type": "string" },
        "secret": { "type": "string" },
        "expiresAt": { "type": "string", "format": "date-time" }
      }
    },
    "endpoints": {
      "type": "object",
      "properties": {
        "messages": { "type": "string", "format": "uri" },
        "tasks": { "type": "string", "format": "uri" },
        "status": { "type": "string", "format": "uri" }
      }
    },
    "registeredAt": {
      "type": "string",
      "format": "date-time"
    }
  }
}
```

### 3. onboarding.getChecklist

**Description**: Get onboarding checklist with completion status

**Input Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["agentId"],
  "properties": {
    "agentId": {
      "type": "string",
      "description": "Agent identifier"
    },
    "includeCompleted": {
      "type": "boolean",
      "default": true,
      "description": "Include completed items"
    }
  }
}
```

**Output Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["checklist", "progress"],
  "properties": {
    "checklist": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "category": { "type": "string" },
          "title": { "type": "string" },
          "description": { "type": "string" },
          "required": { "type": "boolean" },
          "completed": { "type": "boolean" },
          "completedAt": { "type": "string", "format": "date-time" },
          "dependencies": { "type": "array", "items": { "type": "string" } },
          "resources": { "type": "array", "items": { "type": "string" } }
        }
      }
    },
    "progress": {
      "type": "object",
      "properties": {
        "completed": { "type": "integer" },
        "total": { "type": "integer" },
        "percentage": { "type": "number" },
        "requiredRemaining": { "type": "integer" }
      }
    }
  }
}
```

## System Navigation Tools

### 1. system.listSkills

**Description**: List available skills in the system

**Input Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "category": {
      "type": "string",
      "description": "Filter by category"
    },
    "search": {
      "type": "string",
      "description": "Search query for skill names/descriptions"
    },
    "includeDeprecated": {
      "type": "boolean",
      "default": false
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 1000,
      "default": 100
    },
    "offset": {
      "type": "integer",
      "minimum": 0,
      "default": 0
    }
  }
}
```

**Output Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["skills", "total"],
  "properties": {
    "skills": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "category": { "type": "string" },
          "description": { "type": "string" },
          "version": { "type": "string" },
          "author": { "type": "string" },
          "requirements": { "type": "array", "items": { "type": "string" } },
          "parameters": { "type": "object" },
          "examples": { "type": "array", "items": { "type": "object" } },
          "deprecated": { "type": "boolean" },
          "successRate": { "type": "number" },
          "lastUsed": { "type": "string", "format": "date-time" }
        }
      }
    },
    "total": {
      "type": "integer"
    },
    "categories": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```

### 2. system.getAgents

**Description**: List active agents in the system

**Input Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "enum": ["active", "idle", "busy", "offline", "error"],
      "description": "Filter by agent status"
    },
    "type": {
      "type": "string",
      "description": "Filter by agent type"
    },
    "capabilities": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Filter by required capabilities"
    },
    "includeMetrics": {
      "type": "boolean",
      "default": false
    }
  }
}
```

**Output Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["agents"],
  "properties": {
    "agents": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "type": { "type": "string" },
          "status": { "type": "string" },
          "capabilities": { "type": "array", "items": { "type": "string" } },
          "currentTasks": { "type": "integer" },
          "maxTasks": { "type": "integer" },
          "lastSeen": { "type": "string", "format": "date-time" },
          "metrics": {
            "type": "object",
            "properties": {
              "tasksCompleted": { "type": "integer" },
              "successRate": { "type": "number" },
              "avgResponseTime": { "type": "number" },
              "uptime": { "type": "integer" }
            }
          }
        }
      }
    },
    "summary": {
      "type": "object",
      "properties": {
        "total": { "type": "integer" },
        "active": { "type": "integer" },
        "idle": { "type": "integer" },
        "busy": { "type": "integer" },
        "offline": { "type": "integer" }
      }
    }
  }
}
```

### 3. system.getTaskQueue

**Description**: Get pending tasks from the task queue

**Input Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "agentId": {
      "type": "string",
      "description": "Filter tasks for specific agent"
    },
    "priority": {
      "type": "string",
      "enum": ["critical", "high", "normal", "low"],
      "description": "Filter by priority"
    },
    "status": {
      "type": "string",
      "enum": ["pending", "assigned", "in_progress", "blocked"],
      "description": "Filter by task status"
    },
    "type": {
      "type": "string",
      "description": "Filter by task type"
    },
    "includeAssigned": {
      "type": "boolean",
      "default": false,
      "description": "Include already assigned tasks"
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "default": 20
    }
  }
}
```

**Output Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["tasks", "queueStats"],
  "properties": {
    "tasks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "type": { "type": "string" },
          "priority": { "type": "string" },
          "status": { "type": "string" },
          "title": { "type": "string" },
          "description": { "type": "string" },
          "requiredCapabilities": { "type": "array", "items": { "type": "string" } },
          "assignedTo": { "type": "string" },
          "createdAt": { "type": "string", "format": "date-time" },
          "deadline": { "type": "string", "format": "date-time" },
          "dependencies": { "type": "array", "items": { "type": "string" } },
          "metadata": { "type": "object" }
        }
      }
    },
    "queueStats": {
      "type": "object",
      "properties": {
        "total": { "type": "integer" },
        "pending": { "type": "integer" },
        "assigned": { "type": "integer" },
        "inProgress": { "type": "integer" },
        "blocked": { "type": "integer" },
        "avgWaitTime": { "type": "number" },
        "oldestTask": { "type": "string", "format": "date-time" }
      }
    }
  }
}
```

### 4. system.getSystemStatus

**Description**: Get overall system status and health

**Input Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "includeServices": {
      "type": "boolean",
      "default": true
    },
    "includeMetrics": {
      "type": "boolean",
      "default": true
    },
    "includeDependencies": {
      "type": "boolean",
      "default": false
    }
  }
}
```

**Output Schema**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["status", "timestamp"],
  "properties": {
    "status": {
      "type": "string",
      "enum": ["healthy", "degraded", "critical"]
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "version": {
      "type": "string"
    },
    "services": {
      "type": "object",
      "properties": {
        "firebase": {
          "type": "object",
          "properties": {
            "status": { "type": "string" },
            "latency": { "type": "number" },
            "errors": { "type": "integer" }
          }
        },
        "github": {
          "type": "object",
          "properties": {
            "status": { "type": "string" },
            "rateLimit": { "type": "object" },
            "latency": { "type": "number" }
          }
        }
      }
    },
    "metrics": {
      "type": "object",
      "properties": {
        "activeAgents": { "type": "integer" },
        "tasksInQueue": { "type": "integer" },
        "avgResponseTime": { "type": "number" },
        "successRate": { "type": "number" },
        "uptime": { "type": "integer" },
        "memoryUsage": { "type": "number" },
        "cpuUsage": { "type": "number" }
      }
    },
    "alerts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "level": { "type": "string" },
          "message": { "type": "string" },
          "timestamp": { "type": "string", "format": "date-time" }
        }
      }
    }
  }
}
```

## Common Types

### ErrorResponse

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["code", "message"],
  "properties": {
    "code": {
      "type": "integer",
      "description": "Error code"
    },
    "message": {
      "type": "string",
      "description": "Human-readable error message"
    },
    "data": {
      "type": "object",
      "description": "Additional error context",
      "properties": {
        "field": { "type": "string" },
        "value": {},
        "reason": { "type": "string" },
        "suggestion": { "type": "string" }
      }
    }
  }
}
```

### Pagination

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "page": {
      "type": "integer",
      "minimum": 1
    },
    "perPage": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100
    },
    "total": {
      "type": "integer",
      "minimum": 0
    },
    "totalPages": {
      "type": "integer",
      "minimum": 0
    },
    "hasNext": {
      "type": "boolean"
    },
    "hasPrevious": {
      "type": "boolean"
    }
  }
}
```

## Error Codes

### Standard JSON-RPC Error Codes

| Code   | Message          | Description                |
| ------ | ---------------- | -------------------------- |
| -32700 | Parse error      | Invalid JSON               |
| -32600 | Invalid Request  | Not a valid Request object |
| -32601 | Method not found | Method does not exist      |
| -32602 | Invalid params   | Invalid method parameters  |
| -32603 | Internal error   | Internal JSON-RPC error    |

### Custom MCP Error Codes

| Code Range       | Category          | Description                  |
| ---------------- | ----------------- | ---------------------------- |
| -32000 to -32099 | Server errors     | General server errors        |
| -32100 to -32199 | Authentication    | Auth/permission errors       |
| -32200 to -32299 | Resource errors   | Resource not found/conflicts |
| -32300 to -32399 | Validation errors | Input validation failures    |
| -32400 to -32499 | Rate limiting     | Rate limit/quota errors      |
| -32500 to -32599 | External service  | Third-party service errors   |

### Specific Error Codes

| Code   | Name             | Description                         |
| ------ | ---------------- | ----------------------------------- |
| -32100 | UNAUTHORIZED     | Missing or invalid authentication   |
| -32101 | FORBIDDEN        | Authenticated but lacks permission  |
| -32102 | TOKEN_EXPIRED    | Authentication token expired        |
| -32200 | NOT_FOUND        | Resource not found                  |
| -32201 | CONFLICT         | Resource conflict (e.g., duplicate) |
| -32202 | GONE             | Resource permanently deleted        |
| -32300 | VALIDATION_ERROR | Input validation failed             |
| -32301 | REQUIRED_FIELD   | Required field missing              |
| -32302 | INVALID_FORMAT   | Invalid data format                 |
| -32400 | RATE_LIMITED     | Rate limit exceeded                 |
| -32401 | QUOTA_EXCEEDED   | Usage quota exceeded                |
| -32500 | FIREBASE_ERROR   | Firebase service error              |
| -32501 | GITHUB_ERROR     | GitHub API error                    |
| -32502 | TIMEOUT          | Operation timeout                   |

## Implementation Notes

### Best Practices

1. **Input Validation**
   - Always validate against JSON schema
   - Sanitize user inputs to prevent injection
   - Use parameterized queries for database operations

2. **Error Handling**
   - Never expose internal system details in errors
   - Log full error details internally
   - Return user-friendly error messages

3. **Performance**
   - Implement request debouncing for subscriptions
   - Use connection pooling for database connections
   - Cache frequently accessed resources

4. **Security**
   - Validate all paths to prevent traversal attacks
   - Implement rate limiting per client
   - Use least-privilege principle for permissions

5. **Monitoring**
   - Log all tool invocations with request IDs
   - Track tool performance metrics
   - Monitor error rates by tool and error type

### Testing Strategy

1. **Unit Tests**
   - Test each tool in isolation
   - Mock external dependencies
   - Test error scenarios

2. **Integration Tests**
   - Test with real Firebase/GitHub connections
   - Test subscription lifecycle
   - Test rate limiting behavior

3. **Performance Tests**
   - Load test concurrent requests
   - Test subscription scalability
   - Benchmark response times

4. **Security Tests**
   - Test authentication flows
   - Test authorization boundaries
   - Test input validation

## Version History

| Version | Date       | Changes               |
| ------- | ---------- | --------------------- |
| 1.0.0   | 2025-11-03 | Initial specification |

## Future Enhancements

1. **Additional Tools**
   - Slack integration tools
   - Email notification tools
   - Analytics and reporting tools
   - Machine learning model tools

2. **Enhanced Features**
   - Batch operations support
   - GraphQL support for complex queries
   - WebSocket support for real-time updates
   - Event-driven architecture integration

3. **Performance Improvements**
   - Edge caching with CDN
   - Database query optimization
   - Parallel request processing
   - Predictive prefetching

4. **Security Enhancements**
   - Hardware security module integration
   - End-to-end encryption for sensitive data
   - Advanced threat detection
   - Compliance certifications (SOC2, ISO27001)
