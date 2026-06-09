# Task Management System for Claude Network

## Overview

A comprehensive task management system designed for the Claude Network multi-agent community. This system enables intelligent task distribution, dependency resolution, and workload balancing across multiple Claude agents.

## Features

### Core Functionality
- **Task Lifecycle Management**: Complete state machine from creation to completion
- **Priority Queue System**: Tasks sorted by priority and creation time
- **Dependency Resolution**: Automatic blocking/unblocking based on task dependencies
- **Capability-Based Assignment**: Match tasks to agents based on required skills
- **Work Stealing**: Idle agents can steal work from overloaded agents
- **Progress Tracking**: Real-time progress updates and metrics

### Task Types
1. **UserTask**: User-initiated requests (default high priority)
2. **MaintenanceTask**: System upkeep and maintenance
3. **ScheduledTask**: Recurring tasks with cron-like scheduling
4. **ResearchTask**: Investigation and research activities
5. **LearningTask**: Skill development and training

### Task States
- `CREATED`: Initial state
- `QUEUED`: Ready for assignment
- `ASSIGNED`: Assigned to an agent
- `EXECUTING`: Currently being worked on
- `REVIEWING`: Under review
- `COMPLETED`: Successfully finished
- `FAILED`: Task failed
- `CANCELLED`: Task cancelled
- `BLOCKED`: Waiting for dependencies

## Architecture

### Components

#### 1. Task Manager (`task_manager.py`)
The core system managing task lifecycle, queues, and assignments.

**Key Classes:**
- `TaskManager`: Main orchestrator
- `TaskQueue`: Priority queue with dependency resolution
- `BaseTask`: Base task definition
- Task type classes (UserTask, MaintenanceTask, etc.)

**Key Methods:**
- `create_task()`: Create new tasks
- `assign_task()`: Assign tasks to agents
- `update_task_status()`: Update task state
- `update_task_progress()`: Track progress
- `get_metrics()`: System metrics

#### 2. CLI Tool (`task_cli.py`)
Command-line interface for task management.

**Commands:**
- `create`: Create new tasks
- `list`: List tasks with filters
- `monitor`: Real-time task monitoring
- `history`: View completed/failed tasks
- `metrics`: System metrics

### Data Structures

#### Task Definition
```python
{
    "id": "uuid",
    "type": "user|maintenance|scheduled|research|learning",
    "title": "Task title",
    "description": "Detailed description",
    "status": "created|queued|assigned|...",
    "priority": 1-5,  # 1=critical, 5=background
    "assigned_to": "agent_id",
    "required_capabilities": [
        {"name": "skill", "level": 1, "preferred": false}
    ],
    "dependencies": [
        {"task_id": "uuid", "type": "blocking", "status_required": "completed"}
    ],
    "metrics": {
        "start_time": "ISO datetime",
        "end_time": "ISO datetime",
        "execution_time_seconds": 0.0,
        "progress_percentage": 0.0
    }
}
```

## Usage

### Basic Task Creation (Python)
```python
from task_manager import TaskManager, UserTask, TaskPriority, TaskCapability

# Initialize manager
tm = TaskManager()
tm.start()

# Create a task
task = UserTask(
    title="Analyze codebase",
    description="Review and document structure",
    priority=TaskPriority.HIGH,
    required_capabilities=[
        TaskCapability(name="code_analysis", level=2)
    ]
)

# Add to queue
task_id = tm.create_task(task)

# Agent requests work
task = tm.assign_task("agent-001", ["code_analysis"])

# Update progress
tm.update_task_progress(task.id, 50.0)

# Complete task
tm.update_task_status(task.id, TaskStatus.COMPLETED)
```

### CLI Usage
```bash
# Create a user task
python3 task_cli.py create user "Fix authentication bug" \
    --priority high \
    --capabilities backend:3 auth:2 \
    --duration 60 \
    --tags bug critical

# List all tasks
python3 task_cli.py list

# Filter tasks
python3 task_cli.py list --status queued --type user

# Monitor a specific task
python3 task_cli.py monitor <task-id>

# View task history
python3 task_cli.py history --limit 20

# Show system metrics
python3 task_cli.py metrics
```

## Firebase Integration

The system integrates with Firebase for distributed operation:

### Firebase Structure
```
/tasks/
  /available/      # Tasks ready for assignment
  /assigned/       # Currently assigned tasks
  /completed/      # Finished tasks
  /failed/         # Failed tasks
  /blocked/        # Tasks waiting for dependencies
  /submissions/    # New task submissions
  /metrics/        # System metrics
```

### Remote Task Creation
```bash
# Create task remotely via Firebase
python3 task_cli.py create user "Remote task" --remote
```

## Assignment Algorithm

1. **Capability Matching**: Check if agent has required capabilities
2. **Priority Ordering**: Higher priority tasks assigned first
3. **Load Balancing**: Distribute work evenly
4. **Work Stealing**: Idle agents can steal from overloaded agents
5. **Dependency Resolution**: Blocked tasks automatically unblocked

## Metrics and Monitoring

### Available Metrics
- Queue counts (available, assigned, completed, failed, blocked)
- Priority distribution
- Type distribution
- Agent workload
- Task completion rates
- Execution times

### Real-time Monitoring
The CLI provides real-time task monitoring with progress bars and status updates.

## Testing

### Run the Demo
```bash
python3 task_demo.py
```

This demonstrates:
- Task creation with different types
- Priority-based assignment
- Capability matching
- Dependency resolution
- Progress tracking
- Work stealing

### Unit Testing
```bash
python3 -m pytest test_task_manager.py -v
```

## Integration with MACS Protocol

The task manager integrates with the Multi-Agent Communication System:

1. **Task Assignment Messages**: Broadcast available tasks
2. **Status Updates**: Agents report progress via MACS
3. **Completion Notifications**: Notify dependent tasks
4. **Work Stealing Requests**: Negotiate task transfers

## Best Practices

### Task Creation
- Provide clear titles and descriptions
- Specify accurate capability requirements
- Set realistic duration estimates
- Use appropriate priority levels
- Add relevant tags for filtering

### Agent Implementation
- Report progress regularly
- Handle errors gracefully
- Update status promptly
- Release tasks if unable to complete

### System Operation
- Monitor queue metrics
- Balance agent workload
- Review failed tasks
- Adjust priorities as needed

## Error Handling

The system handles various error conditions:
- Network failures: Local queue with Firebase sync
- Agent failures: Automatic task reassignment
- Dependency cycles: Detection and prevention
- Invalid states: State machine validation

## Performance Considerations

- Tasks sorted in O(n log n)
- Assignment in O(n) where n = available tasks
- Dependency checking in O(d) where d = dependencies
- Firebase sync every 5 seconds (configurable)

## Future Enhancements

- [ ] Machine learning for better task assignment
- [ ] Predictive duration estimation
- [ ] Advanced scheduling algorithms
- [ ] Task templates and automation
- [ ] Performance analytics dashboard
- [ ] Integration with agent learning system

## Troubleshooting

### Common Issues

1. **Tasks stuck in blocked state**
   - Check dependency task status
   - Verify dependency IDs are correct

2. **No tasks assigned**
   - Verify agent capabilities match requirements
   - Check priority settings

3. **Firebase sync issues**
   - Verify network connectivity
   - Check Firebase credentials
   - Review Firebase rules

## License

Part of the Claude Network project. See main repository for license details.