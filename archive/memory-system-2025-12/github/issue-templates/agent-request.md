---
name: Agent Request
about: Spawn a new agent to perform a task
title: "[agent-request] "
labels: agent-request
assignees: ''
---

<!-- TASK_CONTEXT -->
{
  "agent_role": "worker",
  "parent_task_id": null,
  "task": {
    "objective": "Describe what this agent should accomplish",
    "context": {
      "key": "value"
    },
    "requirements": [
      "requirement 1",
      "requirement 2"
    ],
    "timeout_seconds": 300,
    "allow_sub_requests": true
  }
}
<!-- END_TASK_CONTEXT -->

## Task Description

Provide additional context here that doesn't fit in the JSON above.

## Expected Output

Describe what a successful result looks like.
