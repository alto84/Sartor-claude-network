"""
Test suite for Task Management System

Tests the task lifecycle including:
- Task creation and validation
- Task assignment and distribution
- Dependency management
- Load balancing
- Progress tracking
- Task completion and cleanup
"""

import pytest
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from enum import Enum
import uuid


class TaskStatus(Enum):
    """Task status enumeration"""
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskPriority(Enum):
    """Task priority levels"""
    CRITICAL = 1
    HIGH = 2
    NORMAL = 3
    LOW = 4


class TestTaskManager:
    """Test task management functionality"""

    def setup_method(self):
        """Set up test fixtures"""
        self.test_task = {
            "task_id": str(uuid.uuid4()),
            "title": "Test Task",
            "description": "Process test data",
            "status": TaskStatus.PENDING.value,
            "priority": TaskPriority.NORMAL.value,
            "created_at": datetime.now().isoformat(),
            "created_by": "user",
            "assigned_to": None,
            "dependencies": [],
            "estimated_duration": 300,  # seconds
            "skills_required": ["data_processing"],
            "metadata": {}
        }

    def test_task_creation(self):
        """Test task creation and validation"""
        task = self.create_task(
            title="Analyze sensor data",
            description="Process and analyze temperature sensor readings",
            priority=TaskPriority.HIGH,
            skills_required=["data_analysis", "sensor_processing"]
        )

        assert task["task_id"] is not None
        assert task["status"] == TaskStatus.PENDING.value
        assert task["priority"] == TaskPriority.HIGH.value
        assert "data_analysis" in task["skills_required"]

    def create_task(self, title, description, priority=TaskPriority.NORMAL,
                   skills_required=None, dependencies=None):
        """Create a new task"""
        return {
            "task_id": str(uuid.uuid4()),
            "title": title,
            "description": description,
            "status": TaskStatus.PENDING.value,
            "priority": priority.value,
            "created_at": datetime.now().isoformat(),
            "created_by": "system",
            "assigned_to": None,
            "dependencies": dependencies or [],
            "skills_required": skills_required or [],
            "metadata": {}
        }

    def test_task_assignment(self):
        """Test task assignment to agents"""
        agents = [
            {"agent_id": "agent-001", "capabilities": ["data_processing", "analysis"], "load": 0.2},
            {"agent_id": "agent-002", "capabilities": ["sensor_processing"], "load": 0.8},
            {"agent_id": "agent-003", "capabilities": ["data_processing"], "load": 0.5}
        ]

        # Assign task requiring data_processing
        assigned_agent = self.assign_task(self.test_task, agents)

        # Should assign to agent-001 (has capability and lowest load)
        assert assigned_agent == "agent-001"

        # Test task with no capable agents
        task_no_match = self.test_task.copy()
        task_no_match["skills_required"] = ["unknown_skill"]
        assigned_agent = self.assign_task(task_no_match, agents)
        assert assigned_agent is None

    def assign_task(self, task, agents):
        """Assign task to most suitable agent"""
        capable_agents = []

        for agent in agents:
            # Check if agent has required skills
            if all(skill in agent["capabilities"] for skill in task["skills_required"]):
                capable_agents.append(agent)

        if not capable_agents:
            return None

        # Select agent with lowest load
        best_agent = min(capable_agents, key=lambda x: x["load"])
        return best_agent["agent_id"]

    def test_dependency_management(self):
        """Test task dependency resolution"""
        # Create tasks with dependencies
        task_a = self.create_task("Task A", "First task")
        task_b = self.create_task("Task B", "Depends on A", dependencies=[task_a["task_id"]])
        task_c = self.create_task("Task C", "Depends on A and B",
                                dependencies=[task_a["task_id"], task_b["task_id"]])

        tasks = {
            task_a["task_id"]: task_a,
            task_b["task_id"]: task_b,
            task_c["task_id"]: task_c
        }

        # Test dependency checking
        assert self.can_start_task(task_a, tasks)  # No dependencies
        assert not self.can_start_task(task_b, tasks)  # A not completed

        # Complete task A
        task_a["status"] = TaskStatus.COMPLETED.value
        assert self.can_start_task(task_b, tasks)  # A completed
        assert not self.can_start_task(task_c, tasks)  # B not completed

        # Complete task B
        task_b["status"] = TaskStatus.COMPLETED.value
        assert self.can_start_task(task_c, tasks)  # Both completed

    def can_start_task(self, task, all_tasks):
        """Check if task dependencies are satisfied"""
        for dep_id in task.get("dependencies", []):
            if dep_id in all_tasks:
                dep_task = all_tasks[dep_id]
                if dep_task["status"] != TaskStatus.COMPLETED.value:
                    return False
        return True

    def test_circular_dependency_detection(self):
        """Test detection of circular dependencies"""
        task_a = self.create_task("Task A", "First")
        task_b = self.create_task("Task B", "Second", dependencies=[task_a["task_id"]])
        task_c = self.create_task("Task C", "Third", dependencies=[task_b["task_id"]])

        # Create circular dependency
        task_a["dependencies"] = [task_c["task_id"]]

        tasks = {
            task_a["task_id"]: task_a,
            task_b["task_id"]: task_b,
            task_c["task_id"]: task_c
        }

        assert self.has_circular_dependency(task_a["task_id"], tasks)

        # Remove circular dependency
        task_a["dependencies"] = []
        assert not self.has_circular_dependency(task_a["task_id"], tasks)

    def has_circular_dependency(self, task_id, all_tasks, visited=None):
        """Detect circular dependencies"""
        if visited is None:
            visited = set()

        if task_id in visited:
            return True

        visited.add(task_id)

        task = all_tasks.get(task_id)
        if task:
            for dep_id in task.get("dependencies", []):
                if self.has_circular_dependency(dep_id, all_tasks, visited.copy()):
                    return True

        return False

    def test_task_priority_queue(self):
        """Test priority-based task scheduling"""
        tasks = [
            self.create_task("Low priority", "Low", priority=TaskPriority.LOW),
            self.create_task("Critical", "Critical", priority=TaskPriority.CRITICAL),
            self.create_task("Normal", "Normal", priority=TaskPriority.NORMAL),
            self.create_task("High", "High", priority=TaskPriority.HIGH)
        ]

        # Sort by priority
        sorted_tasks = self.sort_by_priority(tasks)

        assert sorted_tasks[0]["title"] == "Critical"
        assert sorted_tasks[1]["title"] == "High"
        assert sorted_tasks[2]["title"] == "Normal"
        assert sorted_tasks[3]["title"] == "Low priority"

    def sort_by_priority(self, tasks):
        """Sort tasks by priority"""
        return sorted(tasks, key=lambda x: x["priority"])

    def test_load_balancing(self):
        """Test load balancing across agents"""
        agents = [
            {"agent_id": "agent-001", "load": 0.0, "capacity": 1.0},
            {"agent_id": "agent-002", "load": 0.0, "capacity": 1.0},
            {"agent_id": "agent-003", "load": 0.0, "capacity": 1.0}
        ]

        tasks = [self.create_task(f"Task {i}", f"Description {i}") for i in range(9)]

        # Distribute tasks
        assignments = self.distribute_tasks(tasks, agents)

        # Each agent should get 3 tasks
        task_counts = {}
        for assignment in assignments:
            agent_id = assignment["agent_id"]
            task_counts[agent_id] = task_counts.get(agent_id, 0) + 1

        for count in task_counts.values():
            assert count == 3

    def distribute_tasks(self, tasks, agents):
        """Distribute tasks evenly across agents"""
        assignments = []
        agent_index = 0

        for task in tasks:
            agent = agents[agent_index % len(agents)]
            assignments.append({
                "task_id": task["task_id"],
                "agent_id": agent["agent_id"]
            })
            agent_index += 1

        return assignments

    def test_task_timeout_handling(self):
        """Test task timeout detection and handling"""
        # Create task with timeout
        task = self.test_task.copy()
        task["started_at"] = (datetime.now() - timedelta(minutes=10)).isoformat()
        task["timeout"] = 300  # 5 minutes
        task["status"] = TaskStatus.IN_PROGRESS.value

        assert self.is_task_timed_out(task)

        # Task within timeout
        task["started_at"] = (datetime.now() - timedelta(minutes=2)).isoformat()
        assert not self.is_task_timed_out(task)

    def is_task_timed_out(self, task):
        """Check if task has exceeded timeout"""
        if task["status"] != TaskStatus.IN_PROGRESS.value:
            return False

        if "started_at" not in task or "timeout" not in task:
            return False

        started_at = datetime.fromisoformat(task["started_at"])
        timeout_delta = timedelta(seconds=task["timeout"])

        return datetime.now() > started_at + timeout_delta

    def test_task_retry_logic(self):
        """Test task retry on failure"""
        task = self.test_task.copy()
        task["status"] = TaskStatus.FAILED.value
        task["retry_count"] = 0
        task["max_retries"] = 3

        # Should be retryable
        assert self.can_retry_task(task)

        # Increment retry count
        task["retry_count"] = 3
        assert not self.can_retry_task(task)  # Max retries reached

        # Non-retryable task
        task["max_retries"] = 0
        task["retry_count"] = 0
        assert not self.can_retry_task(task)

    def can_retry_task(self, task):
        """Check if task can be retried"""
        if task["status"] != TaskStatus.FAILED.value:
            return False

        max_retries = task.get("max_retries", 0)
        retry_count = task.get("retry_count", 0)

        return retry_count < max_retries

    def test_task_progress_tracking(self):
        """Test task progress monitoring"""
        task = self.test_task.copy()
        task["status"] = TaskStatus.IN_PROGRESS.value
        task["progress"] = 0

        # Update progress
        self.update_task_progress(task, 25)
        assert task["progress"] == 25

        # Complete task when progress reaches 100
        self.update_task_progress(task, 100)
        assert task["status"] == TaskStatus.COMPLETED.value

    def update_task_progress(self, task, progress):
        """Update task progress"""
        task["progress"] = min(100, max(0, progress))
        task["updated_at"] = datetime.now().isoformat()

        if task["progress"] >= 100:
            task["status"] = TaskStatus.COMPLETED.value
            task["completed_at"] = datetime.now().isoformat()

    def test_task_cancellation(self):
        """Test task cancellation"""
        task = self.test_task.copy()
        task["status"] = TaskStatus.IN_PROGRESS.value

        # Cancel task
        self.cancel_task(task, "User requested cancellation")

        assert task["status"] == TaskStatus.CANCELLED.value
        assert task["cancellation_reason"] == "User requested cancellation"
        assert "cancelled_at" in task

    def cancel_task(self, task, reason=None):
        """Cancel a task"""
        if task["status"] in [TaskStatus.COMPLETED.value, TaskStatus.CANCELLED.value]:
            return False

        task["status"] = TaskStatus.CANCELLED.value
        task["cancelled_at"] = datetime.now().isoformat()
        if reason:
            task["cancellation_reason"] = reason

        return True

    def test_task_result_storage(self):
        """Test task result handling"""
        task = self.test_task.copy()

        result = {
            "output": "Processed 1000 records",
            "metrics": {
                "records_processed": 1000,
                "errors": 0,
                "duration": 45.2
            }
        }

        # Store result
        self.store_task_result(task, result)

        assert task["result"] == result
        assert task["status"] == TaskStatus.COMPLETED.value

    def store_task_result(self, task, result):
        """Store task execution result"""
        task["result"] = result
        task["status"] = TaskStatus.COMPLETED.value
        task["completed_at"] = datetime.now().isoformat()


class TestTaskQueue:
    """Test task queue management"""

    def setup_method(self):
        """Set up test fixtures"""
        self.queue = []

    def test_queue_operations(self):
        """Test basic queue operations"""
        task1 = {"task_id": "t1", "priority": 2}
        task2 = {"task_id": "t2", "priority": 1}
        task3 = {"task_id": "t3", "priority": 3}

        # Add tasks
        self.enqueue(task1)
        self.enqueue(task2)
        self.enqueue(task3)

        # Dequeue by priority
        next_task = self.dequeue()
        assert next_task["task_id"] == "t2"  # Highest priority (1)

        next_task = self.dequeue()
        assert next_task["task_id"] == "t1"  # Next priority (2)

    def enqueue(self, task):
        """Add task to queue"""
        self.queue.append(task)
        self.queue.sort(key=lambda x: x["priority"])

    def dequeue(self):
        """Remove and return highest priority task"""
        if self.queue:
            return self.queue.pop(0)
        return None

    def test_batch_processing(self):
        """Test batch task processing"""
        tasks = [{"task_id": f"t{i}", "batch_compatible": True} for i in range(5)]

        # Group into batches
        batches = self.create_batches(tasks, batch_size=3)

        assert len(batches) == 2
        assert len(batches[0]) == 3
        assert len(batches[1]) == 2

    def create_batches(self, tasks, batch_size=10):
        """Group tasks into batches"""
        batches = []
        current_batch = []

        for task in tasks:
            if task.get("batch_compatible", False):
                current_batch.append(task)
                if len(current_batch) >= batch_size:
                    batches.append(current_batch)
                    current_batch = []

        if current_batch:
            batches.append(current_batch)

        return batches


if __name__ == "__main__":
    pytest.main([__file__, "-v"])