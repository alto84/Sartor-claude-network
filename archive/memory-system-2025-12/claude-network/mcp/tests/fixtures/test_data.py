#!/usr/bin/env python3
"""
Test Data Generators
====================
Provides test data generators for MCP server testing.
"""

import random
import string
from datetime import datetime, timedelta
from typing import Dict, List, Any


def generate_agent_id() -> str:
    """Generate a random agent ID."""
    return f"agent-{''.join(random.choices(string.ascii_lowercase + string.digits, k=8))}"


def generate_task_id() -> str:
    """Generate a random task ID."""
    return f"task-{datetime.now().strftime('%Y%m%d')}-{''.join(random.choices(string.digits, k=4))}"


def generate_message_id() -> str:
    """Generate a random message ID."""
    return f"msg-{''.join(random.choices(string.ascii_lowercase + string.digits, k=12))}"


def create_test_agent(
    agent_id: str = None,
    status: str = 'online',
    role: str = 'worker',
    capabilities: List[str] = None
) -> Dict[str, Any]:
    """Create a test agent."""
    return {
        'agent_id': agent_id or generate_agent_id(),
        'name': f"Test Agent {random.randint(1, 100)}",
        'status': status,
        'role': role,
        'surface': random.choice(['cli', 'web', 'mobile', 'desktop']),
        'capabilities': capabilities or ['basic', 'execution'],
        'specialization': 'Test specialization',
        'last_heartbeat': datetime.now().isoformat(),
        'task_count': random.randint(0, 100),
        'success_rate': round(random.uniform(0.7, 0.99), 2),
        'location': 'Test Location'
    }


def create_test_task(
    task_id: str = None,
    status: str = 'available',
    priority: str = 'medium',
    assigned_to: str = None
) -> Dict[str, Any]:
    """Create a test task."""
    return {
        'task_id': task_id or generate_task_id(),
        'title': f"Test Task {random.randint(1, 1000)}",
        'status': status,
        'priority': priority,
        'type': random.choice(['house.kitchen', 'system.analysis', 'development.review']),
        'requirements': ['execution', 'reporting'],
        'created_at': (datetime.now() - timedelta(hours=random.randint(1, 24))).isoformat(),
        'deadline': (datetime.now() + timedelta(hours=random.randint(1, 48))).isoformat(),
        'assigned_to': assigned_to,
        'progress': random.randint(0, 100) if status in ['in_progress', 'completed'] else 0
    }


def create_test_skill(
    skill_id: str = None,
    category: str = 'core',
    version: str = '1.0.0'
) -> Dict[str, Any]:
    """Create a test skill."""
    return {
        'skill_id': skill_id or f"{category}.test.skill{random.randint(1, 100)}",
        'name': f"Test Skill {random.randint(1, 100)}",
        'category': category,
        'description': 'Test skill description',
        'version': version,
        'dependencies': [],
        'usage_count': random.randint(0, 500),
        'success_rate': round(random.uniform(0.8, 0.98), 2),
        'tags': ['test', 'automated']
    }


def create_test_message(
    from_agent: str = None,
    to_agent: str = None,
    message_type: str = 'task_assignment'
) -> Dict[str, Any]:
    """Create a test message."""
    return {
        'header': {
            'id': generate_message_id(),
            'timestamp': datetime.now().isoformat(),
            'type': message_type,
            'priority': random.choice(['low', 'medium', 'high'])
        },
        'routing': {
            'from': from_agent or generate_agent_id(),
            'to': [to_agent] if to_agent else 'broadcast',
            'reply_to': None
        },
        'payload': {
            'content': 'Test message content',
            'data': {'test': True}
        },
        'security': {
            'signature': 'test-signature',
            'agent_key': 'test-key'
        }
    }


def create_firebase_test_data() -> Dict[str, Any]:
    """Create comprehensive Firebase test data."""
    return {
        'agents-network': {
            'registry': {
                create_test_agent()['agent_id']: create_test_agent()
                for _ in range(5)
            },
            'tasks': {
                'available': {
                    create_test_task(status='available')['task_id']: create_test_task(status='available')
                    for _ in range(3)
                },
                'in_progress': {
                    create_test_task(status='in_progress')['task_id']: create_test_task(status='in_progress')
                    for _ in range(2)
                }
            },
            'messages': {
                'queue': {
                    generate_message_id(): create_test_message()
                    for _ in range(10)
                }
            }
        }
    }


def create_github_test_files() -> Dict[str, Dict[str, Any]]:
    """Create GitHub test file structure."""
    return {
        'README.md': {
            'type': 'file',
            'content': '# Test Repository\n\nTest content for testing.',
            'size': 100,
            'sha': 'readme123'
        },
        'claude-network/mcp/server.py': {
            'type': 'file',
            'content': '# MCP Server\n\nTest server code.',
            'size': 500,
            'sha': 'server456'
        },
        'claude-network/mcp/tools/firebase_tools.py': {
            'type': 'file',
            'content': '# Firebase Tools\n\nTest tools code.',
            'size': 400,
            'sha': 'firebase789'
        },
        'docs/guide.md': {
            'type': 'file',
            'content': '# User Guide\n\nTest documentation.',
            'size': 300,
            'sha': 'guide012'
        }
    }


def create_mcp_request(method: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
    """Create an MCP protocol request."""
    return {
        'jsonrpc': '2.0',
        'id': random.randint(1, 10000),
        'method': method,
        'params': params or {}
    }


def create_mcp_response(result: Any = None, error: Dict = None, request_id: int = 1) -> Dict[str, Any]:
    """Create an MCP protocol response."""
    response = {
        'jsonrpc': '2.0',
        'id': request_id
    }

    if error:
        response['error'] = error
    else:
        response['result'] = result or {'success': True}

    return response


# Predefined test scenarios
TEST_SCENARIOS = {
    'basic_agents': {
        'coordinator': create_test_agent(role='coordinator', status='online'),
        'worker1': create_test_agent(role='worker', status='online'),
        'worker2': create_test_agent(role='worker', status='busy'),
        'scout': create_test_agent(role='scout', status='offline')
    },
    'basic_tasks': {
        'task1': create_test_task(status='available', priority='high'),
        'task2': create_test_task(status='in_progress', priority='medium'),
        'task3': create_test_task(status='completed', priority='low')
    },
    'basic_skills': {
        'core_comm': create_test_skill(category='core', skill_id='core.communication'),
        'core_data': create_test_skill(category='core', skill_id='core.data'),
        'house_inventory': create_test_skill(category='house', skill_id='house.inventory')
    }
}


# Error scenarios
ERROR_SCENARIOS = {
    'firebase_timeout': {
        'error': 'Connection timeout',
        'code': 'TIMEOUT',
        'recoverable': True
    },
    'firebase_permission_denied': {
        'error': 'Permission denied',
        'code': 'PERMISSION_DENIED',
        'recoverable': False
    },
    'github_rate_limit': {
        'error': 'Rate limit exceeded',
        'code': 'RATE_LIMIT',
        'recoverable': True
    },
    'github_not_found': {
        'error': 'Resource not found',
        'code': 'NOT_FOUND',
        'recoverable': False
    },
    'invalid_tool_params': {
        'error': 'Invalid parameters',
        'code': 'INVALID_PARAMS',
        'recoverable': False
    }
}


# Performance test data
PERFORMANCE_TEST_SIZES = {
    'small': 10,
    'medium': 100,
    'large': 1000,
    'xlarge': 10000
}


def generate_bulk_agents(count: int) -> List[Dict[str, Any]]:
    """Generate bulk test agents."""
    return [create_test_agent() for _ in range(count)]


def generate_bulk_tasks(count: int) -> List[Dict[str, Any]]:
    """Generate bulk test tasks."""
    return [create_test_task() for _ in range(count)]


def generate_bulk_messages(count: int) -> List[Dict[str, Any]]:
    """Generate bulk test messages."""
    return [create_test_message() for _ in range(count)]
