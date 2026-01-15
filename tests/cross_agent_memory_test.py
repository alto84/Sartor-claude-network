#!/usr/bin/env python3
"""
Cross-Agent Memory Sharing Test
================================

This test demonstrates and verifies cross-agent memory sharing between:
- Agent A: Windows machine (this script)
- Agent B: GPU server at 192.168.1.100

Uses the file-based queue at ~/sartor/queue/ on gpuserver1.

Test Flow:
1. Agent A writes a memory to shared store
2. Agent B reads and verifies the memory
3. Agent B writes a response memory
4. Agent A reads and verifies Agent B's response

Author: Claude Code Test Framework
Date: 2025-12-29
"""

import json
import subprocess
import time
import uuid
import sys
import base64
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

# Configuration
GPU_SERVER = "192.168.1.100"
SSH_USER = "alton"
QUEUE_BASE = "/home/alton/sartor/queue"
TEST_CHANNEL = "memory-test"
TIMEOUT_SECONDS = 30
POLL_INTERVAL = 1

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def now_iso():
    """Get current UTC time as ISO string."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def log(msg: str, color: str = Colors.RESET):
    """Print a timestamped log message."""
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    print(f"{Colors.CYAN}[{timestamp}]{Colors.RESET} {color}{msg}{Colors.RESET}")

def log_success(msg: str):
    log(f"[PASS] {msg}", Colors.GREEN)

def log_error(msg: str):
    log(f"[FAIL] {msg}", Colors.RED)

def log_info(msg: str):
    log(f"[INFO] {msg}", Colors.BLUE)

def log_step(step: int, msg: str):
    log(f"{Colors.BOLD}Step {step}: {msg}{Colors.RESET}", Colors.YELLOW)


def ssh_exec(command: str, timeout: int = 30) -> Tuple[bool, str, str]:
    """Execute command on GPU server via SSH."""
    ssh_cmd = [
        "ssh",
        "-o", "ConnectTimeout=5",
        "-o", "BatchMode=yes",
        f"{SSH_USER}@{GPU_SERVER}",
        command
    ]
    try:
        result = subprocess.run(
            ssh_cmd,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return False, "", "SSH command timed out"
    except Exception as e:
        return False, "", str(e)


def remote_python_b64(script: str, timeout: int = 30) -> Tuple[bool, str, str]:
    """Execute Python script on remote server using base64 encoding to avoid shell escaping."""
    encoded = base64.b64encode(script.encode()).decode()
    command = f'python3 -c "import base64; exec(base64.b64decode(\'{encoded}\').decode())"'
    return ssh_exec(command, timeout)


class CrossAgentMemoryTest:
    """Test suite for cross-agent memory sharing."""

    def __init__(self):
        self.test_id = f"test-{uuid.uuid4().hex[:8]}"
        self.memory_id = f"mem-{uuid.uuid4().hex[:8]}"
        self.response_id = f"resp-{uuid.uuid4().hex[:8]}"
        self.results = {
            "test_id": self.test_id,
            "started_at": now_iso(),
            "steps": [],
            "passed": False
        }

    def record_step(self, step: int, name: str, success: bool, details: str = ""):
        """Record a test step result."""
        self.results["steps"].append({
            "step": step,
            "name": name,
            "success": success,
            "details": details,
            "timestamp": now_iso()
        })

    def test_ssh_connectivity(self) -> bool:
        """Step 0: Verify SSH connectivity to GPU server."""
        log_step(0, "Testing SSH connectivity to GPU server")

        success, stdout, stderr = ssh_exec("echo 'SSH OK' && hostname")
        if success:
            hostname = stdout.strip().split('\n')[-1]
            log_success(f"SSH connection established to {hostname}")
            self.record_step(0, "SSH Connectivity", True, f"Connected to {hostname}")
            return True
        else:
            log_error(f"SSH connection failed: {stderr}")
            self.record_step(0, "SSH Connectivity", False, stderr)
            return False

    def agent_a_write_memory(self) -> bool:
        """Step 1: Agent A writes a memory to the shared store."""
        log_step(1, "Agent A writes memory to shared store")

        memory_data = {
            "id": self.memory_id,
            "type": "episodic",
            "content": f"Test memory from Agent A (Windows) - TestID: {self.test_id}",
            "agent": "agent-a-windows",
            "importance": 0.8,
            "tags": ["cross-agent-test", "agent-a"],
            "created_at": now_iso(),
            "test_payload": {
                "sequence": 1,
                "message": "Hello from Agent A!",
                "expecting_response": True
            }
        }

        # Encode data as JSON string for transfer
        memory_json_b64 = base64.b64encode(json.dumps(memory_data).encode()).decode()

        script = f'''
import sys
import json
import base64
sys.path.insert(0, "{QUEUE_BASE}")
from sartor_queue import SartorQueue

memory_data = json.loads(base64.b64decode("{memory_json_b64}").decode())
queue = SartorQueue()
task_id = queue.post_task(
    "{TEST_CHANNEL}",
    memory_data,
    priority=1,
    ttl_seconds=300,
    task_id="{self.memory_id}"
)
print(f"TASK_ID:{{task_id}}")
'''

        success, stdout, stderr = remote_python_b64(script)

        if success and f"TASK_ID:{self.memory_id}" in stdout:
            log_success(f"Memory written: {self.memory_id}")
            log_info(f"Content: {memory_data['content'][:50]}...")
            self.record_step(1, "Agent A Write Memory", True, f"Memory ID: {self.memory_id}")
            return True
        else:
            log_error(f"Failed to write memory: {stderr}")
            log_error(f"stdout: {stdout}")
            self.record_step(1, "Agent A Write Memory", False, f"Error: {stderr}")
            return False

    def agent_b_read_and_verify(self) -> bool:
        """Step 2: Agent B reads and verifies the memory."""
        log_step(2, "Agent B reads and verifies memory from shared store")

        script = f'''
import sys
import json
sys.path.insert(0, "{QUEUE_BASE}")
from sartor_queue import SartorQueue

queue = SartorQueue()
task = queue.get_task("{self.memory_id}")

if task:
    print("MEMORY_FOUND:true")
    print(f"CONTENT:{{json.dumps(task.payload)}}")
    print(f"STATUS:{{task.status}}")
    print(f"CHANNEL:{{task.channel}}")

    # Verify content
    payload = task.payload
    if payload.get("agent") == "agent-a-windows":
        print("VERIFY_AGENT:passed")
    else:
        print("VERIFY_AGENT:failed")

    if "cross-agent-test" in payload.get("tags", []):
        print("VERIFY_TAGS:passed")
    else:
        print("VERIFY_TAGS:failed")

    if payload.get("test_payload", {{}}).get("message") == "Hello from Agent A!":
        print("VERIFY_MESSAGE:passed")
    else:
        print("VERIFY_MESSAGE:failed")
else:
    print("MEMORY_FOUND:false")
'''

        success, stdout, stderr = remote_python_b64(script)

        if success and "MEMORY_FOUND:true" in stdout:
            log_success(f"Memory found and read by Agent B")

            # Check verifications
            verifications = {
                "agent": "VERIFY_AGENT:passed" in stdout,
                "tags": "VERIFY_TAGS:passed" in stdout,
                "message": "VERIFY_MESSAGE:passed" in stdout
            }

            all_passed = all(verifications.values())
            for check, passed in verifications.items():
                if passed:
                    log_success(f"  Verification '{check}': passed")
                else:
                    log_error(f"  Verification '{check}': failed")

            self.record_step(2, "Agent B Read & Verify", all_passed, str(verifications))
            return all_passed
        else:
            log_error(f"Memory not found or read error: {stderr}")
            log_error(f"stdout: {stdout}")
            self.record_step(2, "Agent B Read & Verify", False, f"Memory not found: {stderr}")
            return False

    def agent_b_write_response(self) -> bool:
        """Step 3: Agent B writes a response memory."""
        log_step(3, "Agent B writes response memory")

        response_data = {
            "id": self.response_id,
            "type": "episodic",
            "content": f"Response from Agent B (GPU Server) - Received: {self.memory_id}",
            "agent": "agent-b-gpuserver",
            "importance": 0.9,
            "tags": ["cross-agent-test", "agent-b", "response"],
            "created_at": now_iso(),
            "test_payload": {
                "sequence": 2,
                "message": "Hello back from Agent B!",
                "original_memory_id": self.memory_id,
                "acknowledgement": True
            }
        }

        response_json_b64 = base64.b64encode(json.dumps(response_data).encode()).decode()

        script = f'''
import sys
import json
import base64
sys.path.insert(0, "{QUEUE_BASE}")
from sartor_queue import SartorQueue

response_data = json.loads(base64.b64decode("{response_json_b64}").decode())
queue = SartorQueue()

# First mark original as processed
queue.update_task("{self.memory_id}", status="completed", result={{"processed_by": "agent-b"}})

# Write response
task_id = queue.post_task(
    "{TEST_CHANNEL}-responses",
    response_data,
    priority=1,
    ttl_seconds=300,
    task_id="{self.response_id}"
)
print(f"RESPONSE_ID:{{task_id}}")
'''

        success, stdout, stderr = remote_python_b64(script)

        if success and f"RESPONSE_ID:{self.response_id}" in stdout:
            log_success(f"Response memory written: {self.response_id}")
            log_info(f"Content: {response_data['content'][:50]}...")
            self.record_step(3, "Agent B Write Response", True, f"Response ID: {self.response_id}")
            return True
        else:
            log_error(f"Failed to write response: {stderr}")
            self.record_step(3, "Agent B Write Response", False, f"Error: {stderr}")
            return False

    def agent_a_read_response(self) -> bool:
        """Step 4: Agent A reads and verifies Agent B's response."""
        log_step(4, "Agent A reads and verifies Agent B's response")

        script = f'''
import sys
import json
sys.path.insert(0, "{QUEUE_BASE}")
from sartor_queue import SartorQueue

queue = SartorQueue()
task = queue.get_task("{self.response_id}")

if task:
    print("RESPONSE_FOUND:true")
    print(f"CONTENT:{{json.dumps(task.payload)}}")

    # Verify response content
    payload = task.payload
    if payload.get("agent") == "agent-b-gpuserver":
        print("VERIFY_AGENT:passed")
    else:
        print("VERIFY_AGENT:failed")

    if "response" in payload.get("tags", []):
        print("VERIFY_TAGS:passed")
    else:
        print("VERIFY_TAGS:failed")

    test_payload = payload.get("test_payload", {{}})
    if test_payload.get("message") == "Hello back from Agent B!":
        print("VERIFY_MESSAGE:passed")
    else:
        print("VERIFY_MESSAGE:failed")

    if test_payload.get("original_memory_id") == "{self.memory_id}":
        print("VERIFY_REFERENCE:passed")
    else:
        print("VERIFY_REFERENCE:failed")

    if test_payload.get("acknowledgement") == True:
        print("VERIFY_ACK:passed")
    else:
        print("VERIFY_ACK:failed")
else:
    print("RESPONSE_FOUND:false")
'''

        success, stdout, stderr = remote_python_b64(script)

        if success and "RESPONSE_FOUND:true" in stdout:
            log_success(f"Response memory found and read by Agent A")

            # Check all verifications
            verifications = {
                "agent": "VERIFY_AGENT:passed" in stdout,
                "tags": "VERIFY_TAGS:passed" in stdout,
                "message": "VERIFY_MESSAGE:passed" in stdout,
                "reference": "VERIFY_REFERENCE:passed" in stdout,
                "acknowledgement": "VERIFY_ACK:passed" in stdout
            }

            all_passed = all(verifications.values())
            for check, passed in verifications.items():
                if passed:
                    log_success(f"  Verification '{check}': passed")
                else:
                    log_error(f"  Verification '{check}': failed")

            self.record_step(4, "Agent A Read Response", all_passed, str(verifications))
            return all_passed
        else:
            log_error(f"Response not found: {stderr}")
            self.record_step(4, "Agent A Read Response", False, f"Response not found: {stderr}")
            return False

    def verify_bidirectional_communication(self) -> bool:
        """Step 5: Verify complete bidirectional communication."""
        log_step(5, "Verifying complete bidirectional communication")

        script = f'''
import sys
import json
sys.path.insert(0, "{QUEUE_BASE}")
from sartor_queue import SartorQueue

queue = SartorQueue()

# Check original memory status
original = queue.get_task("{self.memory_id}")
response = queue.get_task("{self.response_id}")

results = {{}}

# Verify original was marked completed
if original:
    results["original_exists"] = True
    results["original_completed"] = original.status == "completed"
    results["original_result"] = original.result
else:
    results["original_exists"] = False

# Verify response exists and links back
if response:
    results["response_exists"] = True
    results["response_links_back"] = response.payload.get("test_payload", {{}}).get("original_memory_id") == "{self.memory_id}"
else:
    results["response_exists"] = False

# Get queue stats
stats = queue.get_stats()
results["queue_stats"] = stats

print(f"RESULTS:{{json.dumps(results)}}")
'''

        success, stdout, stderr = remote_python_b64(script)

        if success and "RESULTS:" in stdout:
            results_json = stdout.split("RESULTS:")[1].strip()
            results = json.loads(results_json)

            checks = {
                "Original memory exists": results.get("original_exists", False),
                "Original marked completed": results.get("original_completed", False),
                "Response memory exists": results.get("response_exists", False),
                "Response links back": results.get("response_links_back", False)
            }

            all_passed = all(checks.values())
            for check, passed in checks.items():
                if passed:
                    log_success(f"  {check}: passed")
                else:
                    log_error(f"  {check}: failed")

            log_info(f"Queue stats: {json.dumps(results.get('queue_stats', {}), indent=2)}")

            self.record_step(5, "Bidirectional Communication", all_passed, str(checks))
            return all_passed
        else:
            log_error(f"Verification failed: {stderr}")
            self.record_step(5, "Bidirectional Communication", False, stderr)
            return False

    def cleanup(self):
        """Clean up test artifacts."""
        log_info("Cleaning up test artifacts...")

        script = f'''
import sys
sys.path.insert(0, "{QUEUE_BASE}")
from sartor_queue import SartorQueue

queue = SartorQueue()
deleted = 0

# Delete test tasks
for task_id in ["{self.memory_id}", "{self.response_id}"]:
    if queue.delete_task(task_id):
        deleted += 1

print(f"DELETED:{{deleted}}")
'''

        success, stdout, _ = remote_python_b64(script)
        if success:
            log_info(f"Cleanup: {stdout.strip()}")

    def run(self) -> bool:
        """Run the complete test suite."""
        print()
        print(f"{Colors.BOLD}{'='*60}{Colors.RESET}")
        print(f"{Colors.BOLD}  Cross-Agent Memory Sharing Test{Colors.RESET}")
        print(f"{Colors.BOLD}  Test ID: {self.test_id}{Colors.RESET}")
        print(f"{Colors.BOLD}{'='*60}{Colors.RESET}")
        print()

        # Run all test steps
        steps = [
            ("SSH Connectivity", self.test_ssh_connectivity),
            ("Agent A Write Memory", self.agent_a_write_memory),
            ("Agent B Read & Verify", self.agent_b_read_and_verify),
            ("Agent B Write Response", self.agent_b_write_response),
            ("Agent A Read Response", self.agent_a_read_response),
            ("Bidirectional Verification", self.verify_bidirectional_communication)
        ]

        all_passed = True
        for name, step_func in steps:
            try:
                if not step_func():
                    all_passed = False
                    log_error(f"Step '{name}' failed - continuing with remaining steps")
            except Exception as e:
                all_passed = False
                log_error(f"Step '{name}' raised exception: {e}")
                self.record_step(-1, name, False, str(e))
            print()

        # Cleanup
        self.cleanup()

        # Final results
        self.results["completed_at"] = now_iso()
        self.results["passed"] = all_passed

        print()
        print(f"{Colors.BOLD}{'='*60}{Colors.RESET}")
        if all_passed:
            print(f"{Colors.GREEN}{Colors.BOLD}  TEST PASSED: Cross-agent memory sharing works!{Colors.RESET}")
        else:
            print(f"{Colors.RED}{Colors.BOLD}  TEST FAILED: Some steps did not pass{Colors.RESET}")
        print(f"{Colors.BOLD}{'='*60}{Colors.RESET}")
        print()

        # Print summary
        print(f"{Colors.BOLD}Test Summary:{Colors.RESET}")
        for step in self.results["steps"]:
            status = f"{Colors.GREEN}PASS{Colors.RESET}" if step["success"] else f"{Colors.RED}FAIL{Colors.RESET}"
            print(f"  Step {step['step']}: {step['name']} - {status}")

        return all_passed


def main():
    """Main entry point."""
    test = CrossAgentMemoryTest()

    try:
        success = test.run()

        # Save results
        results_file = Path(__file__).parent / f"cross_agent_test_results_{test.test_id}.json"
        with open(results_file, 'w') as f:
            json.dump(test.results, f, indent=2)
        log_info(f"Results saved to: {results_file}")

        return 0 if success else 1

    except KeyboardInterrupt:
        log_error("Test interrupted by user")
        return 130
    except Exception as e:
        log_error(f"Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
