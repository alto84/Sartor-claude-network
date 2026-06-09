#!/usr/bin/env python3
"""
Task Management System Demo
Demonstrates the task manager functionality locally
"""

import time
from datetime import datetime, timedelta
from task_manager import (
    TaskManager, UserTask, MaintenanceTask, ResearchTask,
    TaskStatus, TaskPriority, TaskCapability, TaskDependency
)

def demo_basic_workflow():
    """Demonstrate basic task workflow"""
    print("=" * 60)
    print("TASK MANAGEMENT SYSTEM DEMO")
    print("=" * 60)
    print()

    # Create task manager (local mode)
    print("1. Initializing Task Manager...")
    tm = TaskManager()
    tm.firebase_sync_enabled = False  # Run locally for demo
    tm.start()
    print("   ✓ Task Manager started in local mode\n")

    # Create various tasks
    print("2. Creating sample tasks...")

    # High priority user task
    task1 = UserTask(
        title="Fix critical bug in authentication",
        description="Users cannot log in after password reset",
        priority=TaskPriority.CRITICAL,
        required_capabilities=[
            TaskCapability(name="backend_development", level=3),
            TaskCapability(name="authentication", level=2)
        ],
        estimated_duration_minutes=60,
        tags=["bug", "critical", "auth"]
    )

    # Maintenance task
    task2 = MaintenanceTask(
        title="Clean up old log files",
        description="Remove log files older than 30 days",
        priority=TaskPriority.LOW,
        required_capabilities=[
            TaskCapability(name="system_administration", level=1)
        ],
        estimated_duration_minutes=15,
        tags=["cleanup", "logs"]
    )

    # Research task with dependency
    task3 = ResearchTask(
        title="Research distributed consensus algorithms",
        description="Investigate Byzantine fault tolerance for multi-agent system",
        research_topic="Byzantine consensus",
        priority=TaskPriority.NORMAL,
        required_capabilities=[
            TaskCapability(name="distributed_systems", level=2),
            TaskCapability(name="research", level=2)
        ],
        estimated_duration_minutes=240,
        tags=["research", "consensus", "multi-agent"]
    )

    # Task with dependency
    task4 = UserTask(
        title="Implement consensus mechanism",
        description="Based on research findings, implement the chosen algorithm",
        priority=TaskPriority.HIGH,
        dependencies=[
            TaskDependency(task_id=task3.id, dependency_type="blocking")
        ],
        required_capabilities=[
            TaskCapability(name="distributed_systems", level=3),
            TaskCapability(name="python", level=3)
        ],
        estimated_duration_minutes=480,
        tags=["implementation", "consensus"]
    )

    # Add tasks to queue
    tm.create_task(task1)
    tm.create_task(task2)
    tm.create_task(task3)
    tm.create_task(task4)

    print(f"   ✓ Created {task1.title[:30]}...")
    print(f"   ✓ Created {task2.title[:30]}...")
    print(f"   ✓ Created {task3.title[:30]}...")
    print(f"   ✓ Created {task4.title[:30]}... (blocked by research)")
    print()

    # Show queue metrics
    metrics = tm.get_metrics()
    print("3. Current Queue Status:")
    print(f"   • Available: {metrics['available_count']} tasks")
    print(f"   • Blocked: {metrics['blocked_count']} tasks")
    print(f"   • Total: {metrics['total_count']} tasks")
    print()

    # Simulate agents requesting work
    print("4. Simulating agent work assignment...")
    print()

    # Agent 1: Backend developer
    agent1_caps = ["backend_development", "authentication", "python"]
    print("   Agent-001 (Backend Developer) requesting work...")
    assigned_task = tm.assign_task("agent-001", agent1_caps)
    if assigned_task:
        print(f"   → Assigned: {assigned_task.title}")
        print(f"     Priority: {assigned_task.priority.name}")
        print(f"     Duration: {assigned_task.estimated_duration_minutes} minutes")
    print()

    # Agent 2: System administrator
    agent2_caps = ["system_administration", "monitoring"]
    print("   Agent-002 (Sysadmin) requesting work...")
    assigned_task2 = tm.assign_task("agent-002", agent2_caps)
    if assigned_task2:
        print(f"   → Assigned: {assigned_task2.title}")
        print(f"     Priority: {assigned_task2.priority.name}")
        print(f"     Duration: {assigned_task2.estimated_duration_minutes} minutes")
    print()

    # Agent 3: Researcher
    agent3_caps = ["distributed_systems", "research", "documentation"]
    print("   Agent-003 (Researcher) requesting work...")
    assigned_task3 = tm.assign_task("agent-003", agent3_caps)
    if assigned_task3:
        print(f"   → Assigned: {assigned_task3.title}")
        print(f"     Priority: {assigned_task3.priority.name}")
        print(f"     Duration: {assigned_task3.estimated_duration_minutes} minutes")
    print()

    # Show updated metrics
    metrics = tm.get_metrics()
    print("5. Updated Queue Status:")
    print(f"   • Available: {metrics['available_count']} tasks")
    print(f"   • Assigned: {metrics['assigned_count']} tasks")
    print(f"   • Blocked: {metrics['blocked_count']} tasks (waiting for dependencies)")
    print()

    # Simulate task execution
    print("6. Simulating task execution...")
    print()

    # Agent 1 starts working
    if assigned_task:
        print(f"   Agent-001 starting: {assigned_task.title[:40]}...")
        tm.update_task_status(assigned_task.id, TaskStatus.EXECUTING)
        time.sleep(0.5)

        # Update progress
        for progress in [25, 50, 75, 100]:
            tm.update_task_progress(assigned_task.id, progress)
            print(f"     Progress: {progress}%")
            time.sleep(0.3)

        # Complete task
        tm.update_task_status(
            assigned_task.id,
            TaskStatus.COMPLETED,
            result={"bugs_fixed": 1, "tests_added": 3}
        )
        print(f"   ✓ Agent-001 completed task successfully")
        print()

    # Agent 3 completes research
    if assigned_task3:
        print(f"   Agent-003 completing research task...")
        tm.update_task_status(assigned_task3.id, TaskStatus.EXECUTING)
        time.sleep(0.5)
        tm.update_task_progress(assigned_task3.id, 100)
        tm.update_task_status(
            assigned_task3.id,
            TaskStatus.COMPLETED,
            result={
                "algorithm_chosen": "PBFT",
                "papers_reviewed": 12,
                "recommendation": "Use PBFT for high-stakes consensus"
            }
        )
        print(f"   ✓ Agent-003 completed research")
        print(f"     → This unblocks the implementation task!")
        print()

    # Check if blocked task is now available
    print("7. Checking for unblocked tasks...")
    metrics = tm.get_metrics()
    print(f"   • Available: {metrics['available_count']} tasks (implementation now available!)")
    print(f"   • Blocked: {metrics['blocked_count']} tasks")
    print()

    # Agent 3 can now take the implementation task
    print("   Agent-003 requesting next task...")
    impl_task = tm.assign_task("agent-003", ["distributed_systems", "python"])
    if impl_task:
        print(f"   → Assigned: {impl_task.title}")
        print(f"     (This task was previously blocked)")
    print()

    # Final metrics
    print("8. Final System Metrics:")
    final_metrics = tm.get_metrics()
    print(f"   • Completed: {final_metrics['completed_count']} tasks")
    print(f"   • In Progress: {final_metrics['assigned_count']} tasks")
    print(f"   • Available: {final_metrics['available_count']} tasks")
    print(f"   • Failed: {final_metrics['failed_count']} tasks")
    print()

    print("9. Priority Breakdown:")
    priority_breakdown = final_metrics.get('priority_breakdown', {})
    for priority, count in sorted(priority_breakdown.items()):
        print(f"   • Priority {priority}: {count} tasks")
    print()

    print("10. Type Breakdown:")
    type_breakdown = final_metrics.get('type_breakdown', {})
    for task_type, count in sorted(type_breakdown.items()):
        print(f"   • {task_type.capitalize()}: {count} tasks")
    print()

    # Demonstrate work stealing
    print("11. Demonstrating Work Stealing...")
    print("   Agent-004 (idle agent) attempts to steal work...")
    stolen_task = tm.queue.steal_work("agent-004", ["system_administration"])
    if stolen_task:
        print(f"   → Successfully stole: {stolen_task.title}")
        print(f"     From: {stolen_task.assigned_to}")
    else:
        print("   → No overloaded agents found for work stealing")
    print()

    tm.stop()
    print("=" * 60)
    print("DEMO COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    demo_basic_workflow()