"""
Agent executor for running Claude instances on remote machines.
Enables the Executive Claude to delegate tasks to GPU Agents via SSH.
"""

import json
import subprocess
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any, Callable
from enum import Enum


class AgentStatus(Enum):
    IDLE = "idle"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    UNREACHABLE = "unreachable"


@dataclass
class AgentResult:
    """Result from an agent execution."""
    agent_id: str
    task_id: str
    status: AgentStatus
    output: str
    error: Optional[str] = None
    duration_seconds: float = 0.0
    timestamp: str = ""

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.utcnow().isoformat()


@dataclass
class RemoteAgent:
    """Configuration for a remote agent."""
    name: str
    host: str
    user: str
    claude_path: str = "/home/alton/.local/bin/claude"
    work_dir: str = "~/sartor"
    ssh_key: Optional[str] = None
    port: int = 22

    def ssh_command(self, command: str, timeout: int = 300) -> subprocess.CompletedProcess:
        """Execute a command on the remote machine via SSH."""
        ssh_args = ["ssh"]

        if self.ssh_key:
            ssh_args.extend(["-i", self.ssh_key])

        ssh_args.extend([
            "-o", "StrictHostKeyChecking=no",
            "-o", "ConnectTimeout=10",
            "-p", str(self.port),
            f"{self.user}@{self.host}",
            command
        ])

        return subprocess.run(
            ssh_args,
            capture_output=True,
            text=True,
            timeout=timeout
        )

    def check_health(self) -> Dict[str, Any]:
        """Check the health of the remote agent."""
        try:
            result = self.ssh_command("cat ~/sartor/status/current.json", timeout=30)
            if result.returncode == 0:
                status = json.loads(result.stdout)
                return {
                    "reachable": True,
                    "status": status,
                    "error": None
                }
            else:
                return {
                    "reachable": True,
                    "status": None,
                    "error": result.stderr
                }
        except subprocess.TimeoutExpired:
            return {"reachable": False, "error": "Timeout"}
        except Exception as e:
            return {"reachable": False, "error": str(e)}


class AgentExecutor:
    """
    Executor for running Claude instances on remote machines.

    Supports:
    - Synchronous task execution (wait for result)
    - Asynchronous task execution (fire and check later)
    - Task queuing via file-based message system
    """

    def __init__(self, results_dir: Optional[str] = None):
        self.agents: Dict[str, RemoteAgent] = {}
        self.results_dir = Path(results_dir) if results_dir else None
        if self.results_dir:
            self.results_dir.mkdir(parents=True, exist_ok=True)

    def register_agent(self, agent: RemoteAgent):
        """Register a remote agent."""
        self.agents[agent.name] = agent

    def get_agent(self, name: str) -> Optional[RemoteAgent]:
        """Get a registered agent by name."""
        return self.agents.get(name)

    def execute_sync(
        self,
        agent_name: str,
        prompt: str,
        timeout: int = 600,
        output_file: Optional[str] = None
    ) -> AgentResult:
        """
        Execute a task synchronously and wait for the result.

        Args:
            agent_name: Name of the registered agent
            prompt: The prompt to send to Claude
            timeout: Maximum execution time in seconds
            output_file: Optional path on remote machine to write results

        Returns:
            AgentResult with output or error
        """
        agent = self.agents.get(agent_name)
        if not agent:
            return AgentResult(
                agent_id=agent_name,
                task_id="",
                status=AgentStatus.FAILED,
                output="",
                error=f"Agent '{agent_name}' not registered"
            )

        task_id = str(uuid.uuid4())[:8]
        start_time = time.time()

        # Build the Claude command
        escaped_prompt = prompt.replace('"', '\\"').replace("'", "'\\''")

        if output_file:
            cmd = f'{agent.claude_path} --dangerously-skip-permissions -p "{escaped_prompt}" > {output_file} 2>&1'
        else:
            cmd = f'{agent.claude_path} --dangerously-skip-permissions -p "{escaped_prompt}"'

        try:
            result = agent.ssh_command(cmd, timeout=timeout)
            duration = time.time() - start_time

            if result.returncode == 0:
                # If output file specified, read it
                if output_file:
                    read_result = agent.ssh_command(f"cat {output_file}", timeout=30)
                    output = read_result.stdout if read_result.returncode == 0 else result.stdout
                else:
                    output = result.stdout

                return AgentResult(
                    agent_id=agent_name,
                    task_id=task_id,
                    status=AgentStatus.COMPLETED,
                    output=output,
                    duration_seconds=duration
                )
            else:
                return AgentResult(
                    agent_id=agent_name,
                    task_id=task_id,
                    status=AgentStatus.FAILED,
                    output=result.stdout,
                    error=result.stderr,
                    duration_seconds=duration
                )

        except subprocess.TimeoutExpired:
            return AgentResult(
                agent_id=agent_name,
                task_id=task_id,
                status=AgentStatus.FAILED,
                output="",
                error=f"Execution timed out after {timeout} seconds",
                duration_seconds=timeout
            )
        except Exception as e:
            return AgentResult(
                agent_id=agent_name,
                task_id=task_id,
                status=AgentStatus.FAILED,
                output="",
                error=str(e),
                duration_seconds=time.time() - start_time
            )

    def execute_async(
        self,
        agent_name: str,
        prompt: str,
        output_file: str,
        log_file: Optional[str] = None
    ) -> str:
        """
        Execute a task asynchronously (fire and forget).

        Args:
            agent_name: Name of the registered agent
            prompt: The prompt to send to Claude
            output_file: Path on remote machine to write results
            log_file: Optional path for execution logs

        Returns:
            Task ID for later status checking
        """
        agent = self.agents.get(agent_name)
        if not agent:
            raise ValueError(f"Agent '{agent_name}' not registered")

        task_id = str(uuid.uuid4())[:8]

        # Escape prompt for shell
        escaped_prompt = prompt.replace('"', '\\"').replace("'", "'\\''")

        # Build nohup command for background execution
        log_target = log_file or "/dev/null"
        cmd = f'nohup {agent.claude_path} --dangerously-skip-permissions -p "{escaped_prompt}" > {output_file} 2>{log_target} &'

        try:
            agent.ssh_command(cmd, timeout=30)
            return task_id
        except Exception as e:
            raise RuntimeError(f"Failed to start async task: {e}")

    def check_async_result(
        self,
        agent_name: str,
        output_file: str
    ) -> Optional[str]:
        """Check if an async task has produced output."""
        agent = self.agents.get(agent_name)
        if not agent:
            return None

        try:
            result = agent.ssh_command(f"cat {output_file} 2>/dev/null", timeout=30)
            if result.returncode == 0 and result.stdout.strip():
                return result.stdout
            return None
        except Exception:
            return None

    def list_agents(self) -> List[Dict[str, Any]]:
        """List all registered agents with their health status."""
        statuses = []
        for name, agent in self.agents.items():
            health = agent.check_health()
            statuses.append({
                "name": name,
                "host": agent.host,
                "reachable": health.get("reachable", False),
                "status": health.get("status"),
                "error": health.get("error")
            })
        return statuses


# Pre-configured agents for the Sartor network
def create_default_executor() -> AgentExecutor:
    """Create an executor with pre-configured Sartor network agents."""
    executor = AgentExecutor(results_dir="/tmp/sartor/results")

    # gpuserver1 - RTX 5090
    executor.register_agent(RemoteAgent(
        name="gpu-agent-1",
        host="192.168.1.100",
        user="alton",
        claude_path="/home/alton/.local/bin/claude",
        work_dir="/home/alton/sartor"
    ))

    # Add more agents as they come online
    # executor.register_agent(RemoteAgent(
    #     name="gpu-agent-2",
    #     host="192.168.1.101",
    #     user="alton",
    #     ...
    # ))

    return executor


# Example usage
if __name__ == "__main__":
    # Create executor with gpuserver1
    executor = create_default_executor()

    # Check agent health
    print("Agent Status:")
    for agent in executor.list_agents():
        status = "UP" if agent["reachable"] else "DOWN"
        print(f"  {agent['name']} ({agent['host']}): {status}")

    # Example: Execute a task synchronously
    # result = executor.execute_sync(
    #     "gpu-agent-1",
    #     "What GPU is available? Run nvidia-smi and report the results.",
    #     timeout=120
    # )
    # print(f"Result: {result.output[:500]}...")

    # Example: Execute a task asynchronously
    # task_id = executor.execute_async(
    #     "gpu-agent-1",
    #     "Research the best practices for Vast.ai hosting",
    #     output_file="/home/alton/sartor/reports/research.md"
    # )
    # print(f"Started async task: {task_id}")
