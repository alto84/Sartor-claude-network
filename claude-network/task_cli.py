#!/usr/bin/env python3
"""
Task Management CLI Tool for Claude Network
Interactive command-line interface for task creation, monitoring, and management
"""

import argparse
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import requests
import time

# Try to import optional formatting libraries
try:
    from tabulate import tabulate
    HAS_TABULATE = True
except ImportError:
    HAS_TABULATE = False

try:
    from colorama import init, Fore, Back, Style
    init(autoreset=True)
    HAS_COLOR = True
except ImportError:
    HAS_COLOR = False
    # Create dummy color classes
    class Fore:
        RED = GREEN = YELLOW = BLUE = CYAN = MAGENTA = WHITE = ''
        RESET = ''
    class Back:
        pass
    class Style:
        RESET_ALL = ''

# Import task management components
from task_manager import (
    TaskManager, BaseTask, UserTask, MaintenanceTask, ScheduledTask,
    ResearchTask, LearningTask, TaskStatus, TaskPriority, TaskType,
    TaskCapability, TaskDependency
)

# Firebase configuration
FIREBASE_URL = "https://home-claude-network-default-rtdb.firebaseio.com"

class TaskCLI:
    """Command-line interface for task management"""

    def __init__(self, firebase_url: str = FIREBASE_URL):
        self.firebase_url = firebase_url
        self.tm = TaskManager(firebase_url)

    def create_task(self, args):
        """Create a new task"""
        task_type = args.type.lower()

        # Create base task based on type
        if task_type == 'user':
            task = UserTask(
                title=args.title,
                description=args.description or "",
                created_by=args.created_by or "cli_user"
            )
        elif task_type == 'maintenance':
            task = MaintenanceTask(
                title=args.title,
                description=args.description or "",
                created_by=args.created_by or "system"
            )
        elif task_type == 'scheduled':
            task = ScheduledTask(
                title=args.title,
                description=args.description or "",
                schedule=args.schedule or "",
                created_by=args.created_by or "scheduler"
            )
        elif task_type == 'research':
            task = ResearchTask(
                title=args.title,
                description=args.description or "",
                research_topic=args.topic or "",
                created_by=args.created_by or "researcher"
            )
        elif task_type == 'learning':
            task = LearningTask(
                title=args.title,
                description=args.description or "",
                skill_name=args.skill or "",
                skill_level=args.level or 1,
                created_by=args.created_by or "learner"
            )
        else:
            print(f"{Fore.RED}Invalid task type: {task_type}")
            return

        # Set priority
        if args.priority:
            priority_map = {
                'critical': TaskPriority.CRITICAL,
                'high': TaskPriority.HIGH,
                'normal': TaskPriority.NORMAL,
                'low': TaskPriority.LOW,
                'background': TaskPriority.BACKGROUND
            }
            task.priority = priority_map.get(args.priority.lower(), TaskPriority.NORMAL)

        # Add capabilities
        if args.capabilities:
            for cap in args.capabilities:
                parts = cap.split(':')
                name = parts[0]
                level = int(parts[1]) if len(parts) > 1 else 1
                task.required_capabilities.append(TaskCapability(name=name, level=level))

        # Add dependencies
        if args.dependencies:
            for dep_id in args.dependencies:
                task.dependencies.append(
                    TaskDependency(task_id=dep_id, dependency_type="blocking")
                )

        # Set duration
        if args.duration:
            task.estimated_duration_minutes = args.duration

        # Add tags
        if args.tags:
            task.tags = args.tags

        # Set due date
        if args.due:
            try:
                hours = int(args.due.replace('h', ''))
                task.due_at = datetime.now() + timedelta(hours=hours)
            except:
                print(f"{Fore.YELLOW}Invalid due format. Use format like '24h'")

        # Submit task to Firebase (for remote creation)
        if args.remote:
            task_data = task.to_dict()
            r = requests.post(f"{self.firebase_url}/tasks/submissions.json", json=task_data)
            if r.status_code == 200:
                print(f"{Fore.GREEN}✓ Task created remotely: {task.id}")
                print(f"  Title: {task.title}")
                print(f"  Type: {task.type.value}")
                print(f"  Priority: {task.priority.name}")
            else:
                print(f"{Fore.RED}✗ Failed to create remote task")
        else:
            # Create locally
            task_id = self.tm.create_task(task)
            print(f"{Fore.GREEN}✓ Task created locally: {task_id}")
            print(f"  Title: {task.title}")
            print(f"  Type: {task.type.value}")
            print(f"  Priority: {task.priority.name}")

    def list_tasks(self, args):
        """List tasks with filters"""
        # Fetch tasks from Firebase
        try:
            # Get all task categories
            available = self._fetch_tasks('available')
            assigned = self._fetch_tasks('assigned')
            completed = self._fetch_tasks('completed')
            failed = self._fetch_tasks('failed')
            blocked = self._fetch_tasks('blocked')

            all_tasks = available + list(assigned.values()) + completed + failed + blocked

            # Apply filters
            filtered_tasks = []
            for task_data in all_tasks:
                task = BaseTask.from_dict(task_data) if isinstance(task_data, dict) else task_data

                # Filter by status
                if args.status and task.status.value != args.status.lower():
                    continue

                # Filter by agent
                if args.agent and task.assigned_to != args.agent:
                    continue

                # Filter by type
                if args.type and task.type.value != args.type.lower():
                    continue

                # Filter by tag
                if args.tag and args.tag not in task.tags:
                    continue

                filtered_tasks.append(task)

            # Sort tasks
            if args.sort == 'priority':
                filtered_tasks.sort(key=lambda t: t.priority.value)
            elif args.sort == 'created':
                filtered_tasks.sort(key=lambda t: t.created_at)
            elif args.sort == 'updated':
                filtered_tasks.sort(key=lambda t: t.updated_at)

            # Display tasks
            if not filtered_tasks:
                print(f"{Fore.YELLOW}No tasks found matching criteria")
                return

            # Prepare table data
            table_data = []
            for task in filtered_tasks[:args.limit]:
                status_color = self._get_status_color(task.status)
                priority_color = self._get_priority_color(task.priority)

                table_data.append([
                    task.id[:8],  # Short ID
                    f"{status_color}{task.status.value}{Style.RESET_ALL}",
                    f"{priority_color}{task.priority.name}{Style.RESET_ALL}",
                    task.type.value,
                    task.title[:50],  # Truncate long titles
                    task.assigned_to or "-",
                    self._format_time(task.created_at),
                    f"{task.metrics.progress_percentage:.0f}%"
                ])

            headers = ["ID", "Status", "Priority", "Type", "Title", "Agent", "Created", "Progress"]
            print(f"\n{Fore.CYAN}Tasks ({len(filtered_tasks)} total, showing {len(table_data)}):{Style.RESET_ALL}")

            if HAS_TABULATE:
                print(tabulate(table_data, headers=headers, tablefmt="grid"))
            else:
                # Simple table without tabulate
                self._print_simple_table(headers, table_data)

        except Exception as e:
            print(f"{Fore.RED}Error fetching tasks: {e}")

    def monitor_task(self, args):
        """Monitor a specific task's progress"""
        task_id = args.task_id

        print(f"{Fore.CYAN}Monitoring task {task_id}...{Style.RESET_ALL}")
        print("Press Ctrl+C to stop monitoring\n")

        try:
            while True:
                # Fetch task from Firebase
                task_data = self._fetch_task(task_id)
                if not task_data:
                    print(f"{Fore.RED}Task {task_id} not found")
                    break

                task = BaseTask.from_dict(task_data)

                # Clear screen (works on Unix-like systems)
                print("\033[H\033[J", end="")

                # Display task details
                print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
                print(f"{Fore.WHITE}Task Monitor - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Style.RESET_ALL}")
                print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}\n")

                status_color = self._get_status_color(task.status)
                print(f"ID: {task.id}")
                print(f"Title: {task.title}")
                print(f"Type: {task.type.value}")
                print(f"Status: {status_color}{task.status.value}{Style.RESET_ALL}")
                print(f"Priority: {self._get_priority_color(task.priority)}{task.priority.name}{Style.RESET_ALL}")
                print(f"Assigned to: {task.assigned_to or 'Unassigned'}")
                print(f"Progress: {self._create_progress_bar(task.metrics.progress_percentage)}")

                if task.description:
                    print(f"\nDescription: {task.description}")

                if task.metrics.start_time:
                    elapsed = datetime.now() - task.metrics.start_time
                    print(f"\nExecution time: {self._format_duration(elapsed.total_seconds())}")

                if task.error_message:
                    print(f"\n{Fore.RED}Error: {task.error_message}{Style.RESET_ALL}")

                if task.result:
                    print(f"\n{Fore.GREEN}Result: {json.dumps(task.result, indent=2)}{Style.RESET_ALL}")

                # Check if task is complete
                if task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]:
                    print(f"\n{Fore.YELLOW}Task finished. Monitoring stopped.{Style.RESET_ALL}")
                    break

                time.sleep(args.interval)

        except KeyboardInterrupt:
            print(f"\n{Fore.YELLOW}Monitoring stopped by user")

    def view_history(self, args):
        """View task history"""
        # Fetch completed and failed tasks
        completed = self._fetch_tasks('completed')
        failed = self._fetch_tasks('failed')

        all_history = completed + failed

        if not all_history:
            print(f"{Fore.YELLOW}No task history found")
            return

        # Sort by completion time
        all_history.sort(key=lambda t: t.get('updated_at', ''), reverse=True)

        # Prepare table data
        table_data = []
        for task_data in all_history[:args.limit]:
            task = BaseTask.from_dict(task_data)
            status_color = Fore.GREEN if task.status == TaskStatus.COMPLETED else Fore.RED
            duration = "-"
            if task.metrics.execution_time_seconds > 0:
                duration = self._format_duration(task.metrics.execution_time_seconds)

            table_data.append([
                task.id[:8],
                f"{status_color}{task.status.value}{Style.RESET_ALL}",
                task.type.value,
                task.title[:40],
                task.assigned_to or "-",
                self._format_time(task.created_at),
                self._format_time(task.updated_at),
                duration
            ])

        headers = ["ID", "Status", "Type", "Title", "Agent", "Created", "Completed", "Duration"]
        print(f"\n{Fore.CYAN}Task History (showing {len(table_data)} of {len(all_history)}):{Style.RESET_ALL}")

        if HAS_TABULATE:
            print(tabulate(table_data, headers=headers, tablefmt="grid"))
        else:
            self._print_simple_table(headers, table_data)

    def show_metrics(self, args):
        """Display system metrics"""
        try:
            # Fetch metrics from Firebase
            r = requests.get(f"{self.firebase_url}/tasks/metrics.json")
            metrics = r.json() or {}

            print(f"\n{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
            print(f"{Fore.WHITE}Task System Metrics{Style.RESET_ALL}")
            print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}\n")

            # Queue status
            print(f"{Fore.YELLOW}Queue Status:{Style.RESET_ALL}")
            print(f"  Available: {metrics.get('available_count', 0)}")
            print(f"  Assigned: {metrics.get('assigned_count', 0)}")
            print(f"  Completed: {metrics.get('completed_count', 0)}")
            print(f"  Failed: {metrics.get('failed_count', 0)}")
            print(f"  Blocked: {metrics.get('blocked_count', 0)}")
            print(f"  Total: {metrics.get('total_count', 0)}")

            # Priority breakdown
            priority_breakdown = metrics.get('priority_breakdown', {})
            if priority_breakdown:
                print(f"\n{Fore.YELLOW}Priority Distribution:{Style.RESET_ALL}")
                for priority, count in sorted(priority_breakdown.items()):
                    print(f"  {priority}: {count}")

            # Type breakdown
            type_breakdown = metrics.get('type_breakdown', {})
            if type_breakdown:
                print(f"\n{Fore.YELLOW}Type Distribution:{Style.RESET_ALL}")
                for task_type, count in sorted(type_breakdown.items()):
                    print(f"  {task_type}: {count}")

            # Agent workload
            assigned = self._fetch_tasks('assigned')
            if assigned:
                agent_load = {}
                for task_id, task_data in assigned.items():
                    agent = task_data.get('assigned_to')
                    if agent:
                        agent_load[agent] = agent_load.get(agent, 0) + 1

                if agent_load:
                    print(f"\n{Fore.YELLOW}Agent Workload:{Style.RESET_ALL}")
                    for agent, count in sorted(agent_load.items(), key=lambda x: x[1], reverse=True):
                        print(f"  {agent}: {count} tasks")

        except Exception as e:
            print(f"{Fore.RED}Error fetching metrics: {e}")

    def _fetch_tasks(self, category: str) -> List[Dict]:
        """Fetch tasks from Firebase"""
        try:
            r = requests.get(f"{self.firebase_url}/tasks/{category}.json")
            data = r.json() or {}
            if isinstance(data, dict) and category != 'assigned':
                return list(data.values())
            return data if isinstance(data, list) else []
        except:
            return []

    def _fetch_task(self, task_id: str) -> Optional[Dict]:
        """Fetch a specific task from Firebase"""
        categories = ['available', 'assigned', 'completed', 'failed', 'blocked']
        for category in categories:
            tasks = self._fetch_tasks(category)
            if category == 'assigned' and isinstance(tasks, dict):
                if task_id in tasks:
                    return tasks[task_id]
                for tid, task in tasks.items():
                    if task.get('id') == task_id:
                        return task
            else:
                for task in tasks:
                    if isinstance(task, dict) and task.get('id') == task_id:
                        return task
        return None

    def _get_status_color(self, status: TaskStatus) -> str:
        """Get color for status display"""
        colors = {
            TaskStatus.CREATED: Fore.WHITE,
            TaskStatus.QUEUED: Fore.CYAN,
            TaskStatus.ASSIGNED: Fore.BLUE,
            TaskStatus.EXECUTING: Fore.YELLOW,
            TaskStatus.REVIEWING: Fore.MAGENTA,
            TaskStatus.COMPLETED: Fore.GREEN,
            TaskStatus.FAILED: Fore.RED,
            TaskStatus.CANCELLED: Fore.RED,
            TaskStatus.BLOCKED: Fore.RED
        }
        return colors.get(status, Fore.WHITE)

    def _get_priority_color(self, priority: TaskPriority) -> str:
        """Get color for priority display"""
        colors = {
            TaskPriority.CRITICAL: Fore.RED,
            TaskPriority.HIGH: Fore.YELLOW,
            TaskPriority.NORMAL: Fore.WHITE,
            TaskPriority.LOW: Fore.CYAN,
            TaskPriority.BACKGROUND: Fore.BLUE
        }
        return colors.get(priority, Fore.WHITE)

    def _format_time(self, dt: datetime) -> str:
        """Format datetime for display"""
        if not dt:
            return "-"
        now = datetime.now()
        diff = now - dt
        if diff.days > 0:
            return f"{diff.days}d ago"
        elif diff.seconds > 3600:
            return f"{diff.seconds // 3600}h ago"
        elif diff.seconds > 60:
            return f"{diff.seconds // 60}m ago"
        else:
            return "just now"

    def _format_duration(self, seconds: float) -> str:
        """Format duration for display"""
        if seconds < 60:
            return f"{seconds:.0f}s"
        elif seconds < 3600:
            return f"{seconds/60:.0f}m"
        else:
            return f"{seconds/3600:.1f}h"

    def _create_progress_bar(self, percentage: float, width: int = 30) -> str:
        """Create a visual progress bar"""
        filled = int(width * percentage / 100)
        bar = '█' * filled + '░' * (width - filled)
        color = Fore.GREEN if percentage >= 75 else Fore.YELLOW if percentage >= 25 else Fore.RED
        return f"{color}[{bar}] {percentage:.0f}%{Style.RESET_ALL}"

    def _print_simple_table(self, headers: List[str], rows: List[List[str]]):
        """Print a simple table without tabulate library"""
        if not rows:
            return

        # Calculate column widths
        widths = [len(h) for h in headers]
        for row in rows:
            for i, cell in enumerate(row):
                # Remove color codes for width calculation
                clean_cell = str(cell)
                for color in [Fore.RED, Fore.GREEN, Fore.YELLOW, Fore.BLUE, Fore.CYAN,
                            Fore.MAGENTA, Fore.WHITE, Style.RESET_ALL]:
                    clean_cell = clean_cell.replace(color, '')
                widths[i] = max(widths[i], len(clean_cell))

        # Print header
        header_line = " | ".join(h.ljust(w) for h, w in zip(headers, widths))
        print(header_line)
        print("-" * len(header_line))

        # Print rows
        for row in rows:
            print(" | ".join(str(cell).ljust(w) for cell, w in zip(row, widths)))

def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(description='Claude Network Task Management CLI')
    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Create task command
    create_parser = subparsers.add_parser('create', help='Create a new task')
    create_parser.add_argument('type', choices=['user', 'maintenance', 'scheduled', 'research', 'learning'],
                             help='Type of task to create')
    create_parser.add_argument('title', help='Task title')
    create_parser.add_argument('-d', '--description', help='Task description')
    create_parser.add_argument('-p', '--priority',
                             choices=['critical', 'high', 'normal', 'low', 'background'],
                             help='Task priority')
    create_parser.add_argument('-c', '--capabilities', nargs='+',
                             help='Required capabilities (format: name:level)')
    create_parser.add_argument('--dependencies', nargs='+', help='Task dependencies (task IDs)')
    create_parser.add_argument('--duration', type=int, help='Estimated duration in minutes')
    create_parser.add_argument('--tags', nargs='+', help='Task tags')
    create_parser.add_argument('--due', help='Due time (e.g., 24h)')
    create_parser.add_argument('--created-by', help='Creator identifier')
    create_parser.add_argument('--remote', action='store_true', help='Create task remotely via Firebase')

    # Scheduled task specific
    create_parser.add_argument('--schedule', help='Cron-like schedule for scheduled tasks')

    # Research task specific
    create_parser.add_argument('--topic', help='Research topic for research tasks')

    # Learning task specific
    create_parser.add_argument('--skill', help='Skill name for learning tasks')
    create_parser.add_argument('--level', type=int, help='Skill level for learning tasks')

    # List tasks command
    list_parser = subparsers.add_parser('list', help='List tasks')
    list_parser.add_argument('-s', '--status', help='Filter by status')
    list_parser.add_argument('-a', '--agent', help='Filter by assigned agent')
    list_parser.add_argument('-t', '--type', help='Filter by task type')
    list_parser.add_argument('--tag', help='Filter by tag')
    list_parser.add_argument('--sort', choices=['priority', 'created', 'updated'],
                           default='priority', help='Sort order')
    list_parser.add_argument('--limit', type=int, default=20, help='Number of tasks to show')

    # Monitor task command
    monitor_parser = subparsers.add_parser('monitor', help='Monitor a task')
    monitor_parser.add_argument('task_id', help='Task ID to monitor')
    monitor_parser.add_argument('-i', '--interval', type=int, default=2,
                              help='Update interval in seconds')

    # History command
    history_parser = subparsers.add_parser('history', help='View task history')
    history_parser.add_argument('--limit', type=int, default=20,
                              help='Number of tasks to show')

    # Metrics command
    metrics_parser = subparsers.add_parser('metrics', help='Show system metrics')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    cli = TaskCLI()

    try:
        if args.command == 'create':
            cli.create_task(args)
        elif args.command == 'list':
            cli.list_tasks(args)
        elif args.command == 'monitor':
            cli.monitor_task(args)
        elif args.command == 'history':
            cli.view_history(args)
        elif args.command == 'metrics':
            cli.show_metrics(args)
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Operation cancelled by user")
    except Exception as e:
        print(f"{Fore.RED}Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()