#!/usr/bin/env python3
"""
Task Management Core System for Claude Network
Implements task lifecycle, queue management, and assignment algorithms
"""

import json
import uuid
import logging
from datetime import datetime, timedelta
from enum import Enum, auto
from typing import Dict, List, Optional, Set, Any, Tuple
from dataclasses import dataclass, field, asdict
import requests
import threading
import queue
from collections import defaultdict

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Firebase configuration
FIREBASE_URL = "https://home-claude-network-default-rtdb.firebaseio.com"

class TaskStatus(Enum):
    """Task lifecycle states"""
    CREATED = "created"
    QUEUED = "queued"
    ASSIGNED = "assigned"
    EXECUTING = "executing"
    REVIEWING = "reviewing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    BLOCKED = "blocked"

class TaskPriority(Enum):
    """Task priority levels"""
    CRITICAL = 1
    HIGH = 2
    NORMAL = 3
    LOW = 4
    BACKGROUND = 5

class TaskType(Enum):
    """Base task types"""
    USER = "user"
    MAINTENANCE = "maintenance"
    SCHEDULED = "scheduled"
    RESEARCH = "research"
    LEARNING = "learning"

@dataclass
class TaskDependency:
    """Represents a task dependency"""
    task_id: str
    dependency_type: str  # "blocking", "required", "optional"
    status_required: TaskStatus = TaskStatus.COMPLETED

@dataclass
class TaskCapability:
    """Required capability for a task"""
    name: str
    level: int = 1  # Minimum level required
    preferred: bool = False  # Is this a preferred capability

@dataclass
class TaskMetrics:
    """Task execution metrics"""
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    execution_time_seconds: float = 0.0
    retry_count: int = 0
    error_count: int = 0
    progress_percentage: float = 0.0
    resource_usage: Dict[str, Any] = field(default_factory=dict)

@dataclass
class BaseTask:
    """Base task definition"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    type: TaskType = TaskType.USER
    title: str = ""
    description: str = ""
    status: TaskStatus = TaskStatus.CREATED
    priority: TaskPriority = TaskPriority.NORMAL

    # Assignment
    assigned_to: Optional[str] = None
    required_capabilities: List[TaskCapability] = field(default_factory=list)
    estimated_duration_minutes: int = 30

    # Dependencies
    dependencies: List[TaskDependency] = field(default_factory=list)
    blocked_by: List[str] = field(default_factory=list)

    # Lifecycle tracking
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    due_at: Optional[datetime] = None

    # Execution
    payload: Dict[str, Any] = field(default_factory=dict)
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None

    # Metrics
    metrics: TaskMetrics = field(default_factory=TaskMetrics)

    # Meta
    created_by: str = "system"
    tags: List[str] = field(default_factory=list)
    context: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        data = {
            'id': self.id,
            'type': self.type.value,
            'title': self.title,
            'description': self.description,
            'status': self.status.value,
            'priority': self.priority.value,
            'assigned_to': self.assigned_to,
            'required_capabilities': [
                {'name': cap.name, 'level': cap.level, 'preferred': cap.preferred}
                for cap in self.required_capabilities
            ],
            'estimated_duration_minutes': self.estimated_duration_minutes,
            'dependencies': [
                {'task_id': dep.task_id, 'type': dep.dependency_type,
                 'status_required': dep.status_required.value}
                for dep in self.dependencies
            ],
            'blocked_by': self.blocked_by,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'due_at': self.due_at.isoformat() if self.due_at else None,
            'payload': self.payload,
            'result': self.result,
            'error_message': self.error_message,
            'metrics': {
                'start_time': self.metrics.start_time.isoformat() if self.metrics.start_time else None,
                'end_time': self.metrics.end_time.isoformat() if self.metrics.end_time else None,
                'execution_time_seconds': self.metrics.execution_time_seconds,
                'retry_count': self.metrics.retry_count,
                'error_count': self.metrics.error_count,
                'progress_percentage': self.metrics.progress_percentage,
                'resource_usage': self.metrics.resource_usage
            },
            'created_by': self.created_by,
            'tags': self.tags,
            'context': self.context
        }
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'BaseTask':
        """Create from dictionary"""
        task = cls()
        task.id = data.get('id', str(uuid.uuid4()))
        task.type = TaskType(data.get('type', 'user'))
        task.title = data.get('title', '')
        task.description = data.get('description', '')
        task.status = TaskStatus(data.get('status', 'created'))
        task.priority = TaskPriority(data.get('priority', 3))
        task.assigned_to = data.get('assigned_to')

        # Parse capabilities
        task.required_capabilities = [
            TaskCapability(**cap) for cap in data.get('required_capabilities', [])
        ]

        task.estimated_duration_minutes = data.get('estimated_duration_minutes', 30)

        # Parse dependencies
        deps = data.get('dependencies', [])
        task.dependencies = [
            TaskDependency(
                task_id=dep['task_id'],
                dependency_type=dep['type'],
                status_required=TaskStatus(dep.get('status_required', 'completed'))
            ) for dep in deps
        ]

        task.blocked_by = data.get('blocked_by', [])

        # Parse dates
        if data.get('created_at'):
            task.created_at = datetime.fromisoformat(data['created_at'])
        if data.get('updated_at'):
            task.updated_at = datetime.fromisoformat(data['updated_at'])
        if data.get('due_at'):
            task.due_at = datetime.fromisoformat(data['due_at'])

        task.payload = data.get('payload', {})
        task.result = data.get('result')
        task.error_message = data.get('error_message')

        # Parse metrics
        metrics_data = data.get('metrics', {})
        task.metrics = TaskMetrics()
        if metrics_data.get('start_time'):
            task.metrics.start_time = datetime.fromisoformat(metrics_data['start_time'])
        if metrics_data.get('end_time'):
            task.metrics.end_time = datetime.fromisoformat(metrics_data['end_time'])
        task.metrics.execution_time_seconds = metrics_data.get('execution_time_seconds', 0.0)
        task.metrics.retry_count = metrics_data.get('retry_count', 0)
        task.metrics.error_count = metrics_data.get('error_count', 0)
        task.metrics.progress_percentage = metrics_data.get('progress_percentage', 0.0)
        task.metrics.resource_usage = metrics_data.get('resource_usage', {})

        task.created_by = data.get('created_by', 'system')
        task.tags = data.get('tags', [])
        task.context = data.get('context', {})

        return task

class UserTask(BaseTask):
    """User-initiated task"""
    def __init__(self, **kwargs):
        super().__init__(type=TaskType.USER, **kwargs)
        self.priority = TaskPriority.HIGH  # User tasks default to high priority

class MaintenanceTask(BaseTask):
    """System maintenance task"""
    def __init__(self, **kwargs):
        super().__init__(type=TaskType.MAINTENANCE, **kwargs)
        self.tags.append("system")

class ScheduledTask(BaseTask):
    """Recurring scheduled task"""
    def __init__(self, schedule: str = "", next_run: Optional[datetime] = None, **kwargs):
        super().__init__(type=TaskType.SCHEDULED, **kwargs)
        self.schedule = schedule  # cron-like expression
        self.next_run = next_run

    def to_dict(self) -> Dict[str, Any]:
        data = super().to_dict()
        data['schedule'] = self.schedule
        data['next_run'] = self.next_run.isoformat() if self.next_run else None
        return data

class ResearchTask(BaseTask):
    """Investigation/research task"""
    def __init__(self, research_topic: str = "", **kwargs):
        super().__init__(type=TaskType.RESEARCH, **kwargs)
        self.research_topic = research_topic
        self.tags.append("research")

    def to_dict(self) -> Dict[str, Any]:
        data = super().to_dict()
        data['research_topic'] = self.research_topic
        return data

class LearningTask(BaseTask):
    """Skill development task"""
    def __init__(self, skill_name: str = "", skill_level: int = 1, **kwargs):
        super().__init__(type=TaskType.LEARNING, **kwargs)
        self.skill_name = skill_name
        self.skill_level = skill_level
        self.tags.append("learning")

    def to_dict(self) -> Dict[str, Any]:
        data = super().to_dict()
        data['skill_name'] = self.skill_name
        data['skill_level'] = self.skill_level
        return data

class TaskQueue:
    """Priority queue for tasks with dependency resolution"""

    def __init__(self):
        self.available: List[BaseTask] = []
        self.assigned: Dict[str, BaseTask] = {}  # task_id -> task
        self.completed: List[BaseTask] = []
        self.failed: List[BaseTask] = []
        self.blocked: List[BaseTask] = []
        self._lock = threading.Lock()

    def add_task(self, task: BaseTask) -> bool:
        """Add a task to the queue"""
        with self._lock:
            # Check dependencies
            if self._has_unmet_dependencies(task):
                task.status = TaskStatus.BLOCKED
                self.blocked.append(task)
                logger.info(f"Task {task.id} added to blocked queue due to dependencies")
            else:
                task.status = TaskStatus.QUEUED
                self.available.append(task)
                self._sort_available()
                logger.info(f"Task {task.id} added to available queue")
            return True

    def _has_unmet_dependencies(self, task: BaseTask) -> bool:
        """Check if task has unmet dependencies"""
        for dep in task.dependencies:
            if dep.dependency_type == "blocking":
                # Check if dependency task exists and has required status
                dep_task = self._find_task(dep.task_id)
                if not dep_task or dep_task.status != dep.status_required:
                    task.blocked_by.append(dep.task_id)
                    return True
        return False

    def _find_task(self, task_id: str) -> Optional[BaseTask]:
        """Find a task by ID across all queues"""
        # Check all queues
        all_tasks = (self.available + list(self.assigned.values()) +
                    self.completed + self.failed + self.blocked)
        for task in all_tasks:
            if task.id == task_id:
                return task
        return None

    def _sort_available(self):
        """Sort available tasks by priority and creation time"""
        self.available.sort(key=lambda t: (t.priority.value, t.created_at))

    def assign_task(self, agent_id: str, capabilities: List[str]) -> Optional[BaseTask]:
        """Assign next suitable task to an agent"""
        with self._lock:
            for task in self.available:
                if self._can_handle_task(task, capabilities):
                    self.available.remove(task)
                    task.assigned_to = agent_id
                    task.status = TaskStatus.ASSIGNED
                    task.updated_at = datetime.now()
                    self.assigned[task.id] = task
                    logger.info(f"Task {task.id} assigned to agent {agent_id}")
                    return task
            return None

    def _can_handle_task(self, task: BaseTask, agent_capabilities: List[str]) -> bool:
        """Check if agent has required capabilities for task"""
        if not task.required_capabilities:
            return True

        for req_cap in task.required_capabilities:
            if req_cap.name not in agent_capabilities:
                if not req_cap.preferred:  # Required capability missing
                    return False
        return True

    def update_task_status(self, task_id: str, status: TaskStatus,
                          result: Optional[Dict] = None, error: Optional[str] = None) -> bool:
        """Update task status and move between queues"""
        with self._lock:
            task = self.assigned.get(task_id)
            if not task:
                logger.warning(f"Task {task_id} not found in assigned queue")
                return False

            task.status = status
            task.updated_at = datetime.now()

            if result:
                task.result = result
            if error:
                task.error_message = error
                task.metrics.error_count += 1

            # Move task to appropriate queue
            if status == TaskStatus.COMPLETED:
                task.metrics.end_time = datetime.now()
                if task.metrics.start_time:
                    task.metrics.execution_time_seconds = (
                        task.metrics.end_time - task.metrics.start_time
                    ).total_seconds()
                del self.assigned[task_id]
                self.completed.append(task)
                self._check_blocked_tasks()  # Check if any blocked tasks can now proceed

            elif status == TaskStatus.FAILED:
                task.metrics.end_time = datetime.now()
                del self.assigned[task_id]
                self.failed.append(task)

            elif status == TaskStatus.EXECUTING:
                task.metrics.start_time = datetime.now()

            logger.info(f"Task {task_id} status updated to {status.value}")
            return True

    def _check_blocked_tasks(self):
        """Check if any blocked tasks can now be unblocked"""
        unblocked = []
        for task in self.blocked:
            if not self._has_unmet_dependencies(task):
                unblocked.append(task)

        for task in unblocked:
            self.blocked.remove(task)
            task.blocked_by = []
            task.status = TaskStatus.QUEUED
            self.available.append(task)
            logger.info(f"Task {task.id} unblocked and moved to available queue")

        if unblocked:
            self._sort_available()

    def get_task(self, task_id: str) -> Optional[BaseTask]:
        """Get a task by ID"""
        with self._lock:
            return self._find_task(task_id)

    def get_agent_tasks(self, agent_id: str) -> List[BaseTask]:
        """Get all tasks assigned to an agent"""
        with self._lock:
            return [task for task in self.assigned.values()
                   if task.assigned_to == agent_id]

    def steal_work(self, agent_id: str, capabilities: List[str]) -> Optional[BaseTask]:
        """Work stealing: reassign a task from overloaded agent"""
        with self._lock:
            # Find agents with multiple tasks
            agent_load = defaultdict(list)
            for task in self.assigned.values():
                if task.status == TaskStatus.ASSIGNED:  # Not yet executing
                    agent_load[task.assigned_to].append(task)

            # Find overloaded agents (more than 2 assigned tasks)
            for loaded_agent, tasks in agent_load.items():
                if len(tasks) > 2 and loaded_agent != agent_id:
                    # Try to steal a task this agent can handle
                    for task in tasks:
                        if self._can_handle_task(task, capabilities):
                            task.assigned_to = agent_id
                            task.updated_at = datetime.now()
                            logger.info(f"Task {task.id} stolen by {agent_id} from {loaded_agent}")
                            return task
            return None

    def get_metrics(self) -> Dict[str, Any]:
        """Get queue metrics"""
        with self._lock:
            return {
                'available_count': len(self.available),
                'assigned_count': len(self.assigned),
                'completed_count': len(self.completed),
                'failed_count': len(self.failed),
                'blocked_count': len(self.blocked),
                'total_count': (len(self.available) + len(self.assigned) +
                              len(self.completed) + len(self.failed) + len(self.blocked)),
                'priority_breakdown': self._get_priority_breakdown(),
                'type_breakdown': self._get_type_breakdown()
            }

    def _get_priority_breakdown(self) -> Dict[str, int]:
        """Get task count by priority"""
        breakdown = defaultdict(int)
        for task in self.available:
            breakdown[task.priority.value] += 1
        return dict(breakdown)

    def _get_type_breakdown(self) -> Dict[str, int]:
        """Get task count by type"""
        breakdown = defaultdict(int)
        all_tasks = (self.available + list(self.assigned.values()) +
                    self.blocked)
        for task in all_tasks:
            breakdown[task.type.value] += 1
        return dict(breakdown)

class TaskManager:
    """Main task management system"""

    def __init__(self, firebase_url: str = FIREBASE_URL):
        self.firebase_url = firebase_url
        self.queue = TaskQueue()
        self.firebase_sync_enabled = True
        self._sync_thread = None
        self._stop_sync = threading.Event()

    def start(self):
        """Start the task manager"""
        logger.info("Starting Task Manager")
        if self.firebase_sync_enabled:
            self._start_firebase_sync()

    def stop(self):
        """Stop the task manager"""
        logger.info("Stopping Task Manager")
        if self._sync_thread:
            self._stop_sync.set()
            self._sync_thread.join()

    def _start_firebase_sync(self):
        """Start Firebase synchronization"""
        self._sync_thread = threading.Thread(target=self._firebase_sync_loop)
        self._sync_thread.daemon = True
        self._sync_thread.start()
        logger.info("Firebase sync started")

    def _firebase_sync_loop(self):
        """Synchronize with Firebase"""
        while not self._stop_sync.is_set():
            try:
                # Sync tasks to Firebase
                self._sync_to_firebase()
                # Pull new tasks from Firebase
                self._pull_from_firebase()
            except Exception as e:
                logger.error(f"Firebase sync error: {e}")
            self._stop_sync.wait(5)  # Sync every 5 seconds

    def _sync_to_firebase(self):
        """Push local queue state to Firebase"""
        try:
            # Sync available tasks
            available_data = [task.to_dict() for task in self.queue.available]
            requests.put(f"{self.firebase_url}/tasks/available.json",
                        json=available_data)

            # Sync assigned tasks
            assigned_data = {tid: task.to_dict()
                           for tid, task in self.queue.assigned.items()}
            requests.put(f"{self.firebase_url}/tasks/assigned.json",
                        json=assigned_data)

            # Sync metrics
            metrics = self.queue.get_metrics()
            requests.put(f"{self.firebase_url}/tasks/metrics.json", json=metrics)

        except Exception as e:
            logger.error(f"Error syncing to Firebase: {e}")

    def _pull_from_firebase(self):
        """Pull new tasks from Firebase"""
        try:
            # Check for new tasks in the submission queue
            r = requests.get(f"{self.firebase_url}/tasks/submissions.json")
            submissions = r.json() or {}

            for sub_id, task_data in submissions.items():
                # Create appropriate task type
                task = self._create_task_from_data(task_data)
                if task and not self.queue._find_task(task.id):
                    self.queue.add_task(task)
                    # Remove from submissions
                    requests.delete(f"{self.firebase_url}/tasks/submissions/{sub_id}.json")

        except Exception as e:
            logger.error(f"Error pulling from Firebase: {e}")

    def _create_task_from_data(self, data: Dict[str, Any]) -> Optional[BaseTask]:
        """Create appropriate task type from data"""
        task_type = data.get('type', 'user')

        if task_type == 'user':
            return UserTask.from_dict(data)
        elif task_type == 'maintenance':
            return MaintenanceTask.from_dict(data)
        elif task_type == 'scheduled':
            task = ScheduledTask.from_dict(data)
            task.schedule = data.get('schedule', '')
            if data.get('next_run'):
                task.next_run = datetime.fromisoformat(data['next_run'])
            return task
        elif task_type == 'research':
            task = ResearchTask.from_dict(data)
            task.research_topic = data.get('research_topic', '')
            return task
        elif task_type == 'learning':
            task = LearningTask.from_dict(data)
            task.skill_name = data.get('skill_name', '')
            task.skill_level = data.get('skill_level', 1)
            return task
        else:
            return BaseTask.from_dict(data)

    def create_task(self, task: BaseTask) -> str:
        """Create a new task"""
        self.queue.add_task(task)
        return task.id

    def assign_task(self, agent_id: str, capabilities: List[str]) -> Optional[BaseTask]:
        """Assign a task to an agent"""
        # First try normal assignment
        task = self.queue.assign_task(agent_id, capabilities)
        if task:
            return task

        # If no tasks available, try work stealing
        return self.queue.steal_work(agent_id, capabilities)

    def update_task_status(self, task_id: str, status: TaskStatus,
                          result: Optional[Dict] = None, error: Optional[str] = None) -> bool:
        """Update task status"""
        return self.queue.update_task_status(task_id, status, result, error)

    def update_task_progress(self, task_id: str, progress: float) -> bool:
        """Update task progress percentage"""
        task = self.queue.get_task(task_id)
        if task:
            task.metrics.progress_percentage = progress
            task.updated_at = datetime.now()
            return True
        return False

    def get_task(self, task_id: str) -> Optional[BaseTask]:
        """Get a task by ID"""
        return self.queue.get_task(task_id)

    def get_agent_tasks(self, agent_id: str) -> List[BaseTask]:
        """Get all tasks for an agent"""
        return self.queue.get_agent_tasks(agent_id)

    def get_metrics(self) -> Dict[str, Any]:
        """Get system metrics"""
        return self.queue.get_metrics()

# Example usage and testing
if __name__ == "__main__":
    # Create task manager
    tm = TaskManager()
    tm.firebase_sync_enabled = False  # Disable for local testing
    tm.start()

    # Create some example tasks
    user_task = UserTask(
        title="Analyze codebase",
        description="Review and document the current codebase structure",
        required_capabilities=[
            TaskCapability(name="code_analysis", level=2),
            TaskCapability(name="documentation", level=1)
        ],
        priority=TaskPriority.HIGH
    )

    maint_task = MaintenanceTask(
        title="Database cleanup",
        description="Remove old entries from Firebase",
        required_capabilities=[
            TaskCapability(name="database_management", level=1)
        ]
    )

    research_task = ResearchTask(
        title="Multi-agent consensus research",
        description="Research best practices for consensus mechanisms",
        research_topic="distributed consensus algorithms",
        estimated_duration_minutes=120
    )

    # Add tasks
    task1_id = tm.create_task(user_task)
    task2_id = tm.create_task(maint_task)
    task3_id = tm.create_task(research_task)

    print("Tasks created:")
    print(f"  User task: {task1_id}")
    print(f"  Maintenance task: {task2_id}")
    print(f"  Research task: {task3_id}")

    # Simulate agent requesting work
    agent_capabilities = ["code_analysis", "documentation", "database_management"]
    task = tm.assign_task("agent_001", agent_capabilities)
    if task:
        print(f"\nTask assigned to agent_001: {task.title}")

    # Update task progress
    tm.update_task_progress(task.id, 50.0)
    print(f"Task progress updated to 50%")

    # Complete task
    tm.update_task_status(task.id, TaskStatus.COMPLETED,
                         result={"files_analyzed": 42, "issues_found": 3})
    print(f"Task completed")

    # Get metrics
    metrics = tm.get_metrics()
    print(f"\nSystem metrics: {json.dumps(metrics, indent=2)}")

    tm.stop()