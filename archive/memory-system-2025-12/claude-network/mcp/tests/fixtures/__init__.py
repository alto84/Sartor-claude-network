"""Test fixtures for MCP server testing."""

from .mock_firebase import MockFirebaseClient, MockFirebaseTools
from .mock_github import MockGitHubClient, MockGitHubTools
from .test_data import (
    create_test_agent,
    create_test_task,
    create_test_skill,
    create_test_message,
    create_firebase_test_data,
    create_github_test_files,
    create_mcp_request,
    create_mcp_response,
    generate_bulk_agents,
    generate_bulk_tasks,
    generate_bulk_messages,
    TEST_SCENARIOS,
    ERROR_SCENARIOS,
    PERFORMANCE_TEST_SIZES
)

__all__ = [
    'MockFirebaseClient',
    'MockFirebaseTools',
    'MockGitHubClient',
    'MockGitHubTools',
    'create_test_agent',
    'create_test_task',
    'create_test_skill',
    'create_test_message',
    'create_firebase_test_data',
    'create_github_test_files',
    'create_mcp_request',
    'create_mcp_response',
    'generate_bulk_agents',
    'generate_bulk_tasks',
    'generate_bulk_messages',
    'TEST_SCENARIOS',
    'ERROR_SCENARIOS',
    'PERFORMANCE_TEST_SIZES'
]
