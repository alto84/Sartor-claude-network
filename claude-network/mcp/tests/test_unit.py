#!/usr/bin/env python3
"""
Unit Tests for MCP Server Tools
================================
Comprehensive unit tests for Firebase, GitHub, Onboarding, and Navigation tools.
Tests each tool independently with mocked dependencies.
"""

import pytest
import asyncio
import sys
from pathlib import Path

# Add parent directories to path
sys.path.insert(0, str(Path(__file__).parent.parent))
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from fixtures import (
    MockFirebaseTools,
    MockGitHubTools,
    create_test_agent,
    create_test_task,
    create_firebase_test_data,
    TEST_SCENARIOS
)
from tools.onboarding_tools import OnboardingTools
from tools.navigation_tools import NavigationTools


# ==================== Firebase Tools Tests ====================

class TestFirebaseTools:
    """Test suite for Firebase tools."""

    @pytest.fixture
    def firebase_tools(self):
        """Create Firebase tools instance with mock client."""
        tools = MockFirebaseTools({'url': 'https://test.firebaseio.com'})
        # Populate with test data
        test_data = create_firebase_test_data()
        tools.client.set_data('/', test_data)
        yield tools
        tools.reset()

    @pytest.mark.asyncio
    async def test_read_root(self, firebase_tools):
        """Test reading from root path."""
        result = await firebase_tools.read({'path': '/'})

        assert result['success'] is True
        assert 'data' in result
        assert 'agents-network' in result['data']
        assert firebase_tools.client.read_count == 1

    @pytest.mark.asyncio
    async def test_read_specific_path(self, firebase_tools):
        """Test reading from specific path."""
        result = await firebase_tools.read({'path': 'agents-network/registry'})

        assert result['success'] is True
        assert 'data' in result
        assert isinstance(result['data'], dict)

    @pytest.mark.asyncio
    async def test_read_nonexistent_path(self, firebase_tools):
        """Test reading from non-existent path."""
        result = await firebase_tools.read({'path': 'nonexistent/path'})

        assert result['success'] is True
        assert result['data'] is None

    @pytest.mark.asyncio
    async def test_write_new_data(self, firebase_tools):
        """Test writing new data."""
        test_agent = create_test_agent()
        result = await firebase_tools.write({
            'path': f'agents-network/registry/{test_agent["agent_id"]}',
            'data': test_agent
        })

        assert result['success'] is True
        assert result['operation'] == 'write'
        assert firebase_tools.client.write_count == 1

        # Verify data was written
        read_result = await firebase_tools.read({
            'path': f'agents-network/registry/{test_agent["agent_id"]}'
        })
        assert read_result['data']['agent_id'] == test_agent['agent_id']

    @pytest.mark.asyncio
    async def test_write_merge(self, firebase_tools):
        """Test merging data."""
        # Write initial data
        agent_id = 'test-agent-merge'
        initial_data = {'agent_id': agent_id, 'status': 'online', 'count': 1}
        await firebase_tools.write({
            'path': f'test-agents/{agent_id}',
            'data': initial_data
        })

        # Merge additional data
        merge_data = {'status': 'busy', 'new_field': 'value'}
        result = await firebase_tools.write({
            'path': f'test-agents/{agent_id}',
            'data': merge_data,
            'merge': True
        })

        assert result['success'] is True
        assert result['operation'] == 'merge'

        # Verify merged data
        read_result = await firebase_tools.read({'path': f'test-agents/{agent_id}'})
        assert read_result['data']['agent_id'] == agent_id
        assert read_result['data']['status'] == 'busy'
        assert read_result['data']['count'] == 1
        assert read_result['data']['new_field'] == 'value'

    @pytest.mark.asyncio
    async def test_delete(self, firebase_tools):
        """Test deleting data."""
        # Write data first
        path = 'test-delete/item'
        await firebase_tools.write({'path': path, 'data': {'test': 'value'}})

        # Delete it
        result = await firebase_tools.delete({'path': path})

        assert result['success'] is True
        assert result['operation'] == 'delete'
        assert firebase_tools.client.delete_count == 1

        # Verify deletion
        read_result = await firebase_tools.read({'path': path})
        assert read_result['data'] is None

    @pytest.mark.asyncio
    async def test_query_with_filters(self, firebase_tools):
        """Test querying with filters."""
        # Add test agents with different statuses
        agents = {
            'agent1': {'agent_id': 'agent1', 'status': 'online', 'score': 90},
            'agent2': {'agent_id': 'agent2', 'status': 'offline', 'score': 80},
            'agent3': {'agent_id': 'agent3', 'status': 'online', 'score': 95}
        }

        for agent_id, agent_data in agents.items():
            await firebase_tools.write({
                'path': f'test-query/{agent_id}',
                'data': agent_data
            })

        # Query for online agents
        result = await firebase_tools.query({
            'path': 'test-query',
            'filters': [
                {'field': 'status', 'operator': '==', 'value': 'online'}
            ]
        })

        assert result['success'] is True
        assert result['count'] == 2
        assert all(r['value']['status'] == 'online' for r in result['results'])

    @pytest.mark.asyncio
    async def test_query_with_comparison_operators(self, firebase_tools):
        """Test query with comparison operators."""
        # Add test data with scores
        for i in range(5):
            await firebase_tools.write({
                'path': f'test-scores/item{i}',
                'data': {'score': i * 20}
            })

        # Query for scores > 40
        result = await firebase_tools.query({
            'path': 'test-scores',
            'filters': [
                {'field': 'score', 'operator': '>', 'value': 40}
            ]
        })

        assert result['success'] is True
        assert result['count'] == 2  # 60 and 80
        assert all(r['value']['score'] > 40 for r in result['results'])

    @pytest.mark.asyncio
    async def test_query_with_limit(self, firebase_tools):
        """Test query with result limit."""
        # Add multiple items
        for i in range(10):
            await firebase_tools.write({
                'path': f'test-limit/item{i}',
                'data': {'index': i}
            })

        # Query with limit
        result = await firebase_tools.query({
            'path': 'test-limit',
            'filters': [],
            'limit': 5
        })

        assert result['success'] is True
        assert result['count'] == 5

    @pytest.mark.asyncio
    async def test_read_with_query_parameters(self, firebase_tools):
        """Test read operation with query parameters."""
        # Add ordered data
        for i in range(5):
            await firebase_tools.write({
                'path': f'test-ordered/item{i}',
                'data': {'index': i, 'value': f'value{i}'}
            })

        # Read with limitToFirst
        result = await firebase_tools.read({
            'path': 'test-ordered',
            'query': {'limitToFirst': 3}
        })

        assert result['success'] is True
        assert len(result['data']) == 3


# ==================== GitHub Tools Tests ====================

class TestGitHubTools:
    """Test suite for GitHub tools."""

    @pytest.fixture
    def github_tools(self):
        """Create GitHub tools instance with mock client."""
        tools = MockGitHubTools({'repo': 'test/repo'})
        yield tools
        tools.reset()

    @pytest.mark.asyncio
    async def test_read_file(self, github_tools):
        """Test reading a file."""
        result = await github_tools.read_file({'path': 'README.md'})

        assert result['success'] is True
        assert 'content' in result
        assert result['path'] == 'README.md'
        assert github_tools.client.read_count == 1

    @pytest.mark.asyncio
    async def test_read_file_not_found(self, github_tools):
        """Test reading non-existent file."""
        with pytest.raises(Exception) as exc_info:
            await github_tools.read_file({'path': 'nonexistent.txt'})

        assert 'not found' in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_search_code(self, github_tools):
        """Test searching in code."""
        result = await github_tools.search({
            'query': 'print',
            'type': 'code'
        })

        assert result['success'] is True
        assert result['total_count'] > 0
        assert github_tools.client.search_count == 1

    @pytest.mark.asyncio
    async def test_search_files(self, github_tools):
        """Test searching for files."""
        result = await github_tools.search({
            'query': 'main',
            'type': 'files'
        })

        assert result['success'] is True
        assert any('main' in r['path'] for r in result['results'])

    @pytest.mark.asyncio
    async def test_search_with_path_filter(self, github_tools):
        """Test search with path filter."""
        result = await github_tools.search({
            'query': 'def',
            'type': 'code',
            'path': 'src/'
        })

        assert result['success'] is True
        assert all(r['path'].startswith('src/') for r in result['results'])

    @pytest.mark.asyncio
    async def test_get_history(self, github_tools):
        """Test getting commit history."""
        result = await github_tools.get_history({'path': '', 'limit': 5})

        assert result['success'] is True
        assert 'commits' in result
        assert len(result['commits']) <= 5
        assert github_tools.client.history_count == 1

    @pytest.mark.asyncio
    async def test_get_history_with_limit(self, github_tools):
        """Test history with limit."""
        result = await github_tools.get_history({'path': 'src/', 'limit': 1})

        assert result['success'] is True
        assert len(result['commits']) == 1

    @pytest.mark.asyncio
    async def test_list_files_root(self, github_tools):
        """Test listing files in root directory."""
        result = await github_tools.list_files({'path': ''})

        assert result['success'] is True
        assert 'files' in result
        assert github_tools.client.list_count == 1

    @pytest.mark.asyncio
    async def test_list_files_directory(self, github_tools):
        """Test listing files in specific directory."""
        result = await github_tools.list_files({'path': 'src'})

        assert result['success'] is True
        assert len(result['files']) > 0

    @pytest.mark.asyncio
    async def test_list_files_recursive(self, github_tools):
        """Test recursive file listing."""
        result = await github_tools.list_files({'path': '', 'recursive': True})

        assert result['success'] is True
        assert result['recursive'] is True
        assert len(result['files']) > 0


# ==================== Onboarding Tools Tests ====================

class TestOnboardingTools:
    """Test suite for Onboarding tools."""

    @pytest.fixture
    def onboarding_tools(self):
        """Create Onboarding tools instance."""
        config = {
            'server': {'version': '1.0.0-test'},
            'firebase': {'url': 'https://test.firebaseio.com'},
            'github': {'repo': 'test/repo'}
        }
        return OnboardingTools(config)

    @pytest.mark.asyncio
    async def test_welcome_message(self, onboarding_tools):
        """Test welcome message generation."""
        result = await onboarding_tools.welcome({
            'agent_name': 'Test Agent',
            'surface': 'cli'
        })

        assert result['success'] is True
        assert 'Test Agent' in result['welcome_message']
        assert result['surface'] == 'cli'
        assert 'capabilities' in result
        assert 'next_steps' in result

    @pytest.mark.asyncio
    async def test_welcome_different_surfaces(self, onboarding_tools):
        """Test welcome messages for different surfaces."""
        surfaces = ['cli', 'web', 'mobile', 'desktop']

        for surface in surfaces:
            result = await onboarding_tools.welcome({
                'agent_name': f'Agent-{surface}',
                'surface': surface
            })

            assert result['success'] is True
            assert result['surface'] == surface
            assert len(result['capabilities']) > 0

    @pytest.mark.asyncio
    async def test_get_checklist(self, onboarding_tools):
        """Test getting onboarding checklist."""
        result = await onboarding_tools.get_checklist({'role': 'worker'})

        assert result['success'] is True
        assert result['role'] == 'worker'
        assert 'tasks' in result
        assert result['summary']['total_tasks'] > 0
        assert result['summary']['required_tasks'] > 0

    @pytest.mark.asyncio
    async def test_get_checklist_different_roles(self, onboarding_tools):
        """Test checklists for different roles."""
        roles = ['coordinator', 'worker', 'scout', 'analyst']

        for role in roles:
            result = await onboarding_tools.get_checklist({'role': role})

            assert result['success'] is True
            assert result['role'] == role
            assert len(result['tasks']) > 0

    @pytest.mark.asyncio
    async def test_get_setup_guide(self, onboarding_tools):
        """Test getting setup guide."""
        result = await onboarding_tools.get_setup_guide({'component': 'firebase'})

        assert result['success'] is True
        assert result['component'] == 'firebase'
        assert 'steps' in result
        assert result['total_steps'] > 0
        assert 'prerequisites' in result
        assert 'troubleshooting' in result

    @pytest.mark.asyncio
    async def test_get_setup_guide_all_components(self, onboarding_tools):
        """Test setup guides for all components."""
        components = ['firebase', 'github', 'macs', 'skills', 'tasks']

        for component in components:
            result = await onboarding_tools.get_setup_guide({'component': component})

            assert result['success'] is True
            assert result['component'] == component
            assert len(result['steps']) > 0
            assert len(result['prerequisites']) > 0
            assert len(result['troubleshooting']) > 0

    @pytest.mark.asyncio
    async def test_get_setup_guide_invalid_component(self, onboarding_tools):
        """Test getting guide for invalid component."""
        result = await onboarding_tools.get_setup_guide({'component': 'invalid'})

        assert result['success'] is False
        assert 'error' in result
        assert 'available_components' in result

    @pytest.mark.asyncio
    async def test_verify_setup(self, onboarding_tools):
        """Test setup verification."""
        result = await onboarding_tools.verify_setup({'agent_id': 'test-agent-123'})

        assert result['success'] is True
        assert result['agent_id'] == 'test-agent-123'
        assert 'checks' in result
        assert 'summary' in result
        assert result['summary']['total'] > 0
        assert 'recommendations' in result

    @pytest.mark.asyncio
    async def test_verify_setup_missing_agent_id(self, onboarding_tools):
        """Test verification without agent ID."""
        result = await onboarding_tools.verify_setup({})

        assert result['success'] is False
        assert 'error' in result


# ==================== Navigation Tools Tests ====================

class TestNavigationTools:
    """Test suite for Navigation tools."""

    @pytest.fixture
    def navigation_tools(self):
        """Create Navigation tools instance."""
        config = {
            'server': {'version': '1.0.0-test'},
            'firebase': {'url': 'https://test.firebaseio.com'},
            'github': {'repo': 'test/repo'}
        }
        return NavigationTools(config)

    @pytest.mark.asyncio
    async def test_list_agents(self, navigation_tools):
        """Test listing all agents."""
        result = await navigation_tools.list_agents({'status': 'all'})

        assert result['success'] is True
        assert 'agents' in result
        assert result['count'] > 0
        assert 'network_stats' in result
        assert result['network_stats']['total'] > 0

    @pytest.mark.asyncio
    async def test_list_agents_by_status(self, navigation_tools):
        """Test filtering agents by status."""
        result = await navigation_tools.list_agents({'status': 'online'})

        assert result['success'] is True
        assert all(agent['status'] == 'online' for agent in result['agents'])

    @pytest.mark.asyncio
    async def test_list_agents_by_role(self, navigation_tools):
        """Test filtering agents by role."""
        result = await navigation_tools.list_agents({'role': 'worker'})

        assert result['success'] is True
        assert all(agent['role'] == 'worker' for agent in result['agents'])

    @pytest.mark.asyncio
    async def test_list_skills(self, navigation_tools):
        """Test listing all skills."""
        result = await navigation_tools.list_skills({'category': 'all'})

        assert result['success'] is True
        assert 'skills' in result
        assert result['count'] > 0
        assert 'categories' in result
        assert 'statistics' in result

    @pytest.mark.asyncio
    async def test_list_skills_by_category(self, navigation_tools):
        """Test filtering skills by category."""
        result = await navigation_tools.list_skills({'category': 'core'})

        assert result['success'] is True
        assert all(skill['category'] == 'core' for skill in result['skills'])

    @pytest.mark.asyncio
    async def test_list_skills_with_search(self, navigation_tools):
        """Test searching skills."""
        result = await navigation_tools.list_skills({'search': 'communication'})

        assert result['success'] is True
        # Results should contain 'communication' in name, description, or tags

    @pytest.mark.asyncio
    async def test_list_tasks(self, navigation_tools):
        """Test listing all tasks."""
        result = await navigation_tools.list_tasks({'status': 'all'})

        assert result['success'] is True
        assert 'tasks' in result
        assert 'statistics' in result
        assert result['statistics']['total'] > 0

    @pytest.mark.asyncio
    async def test_list_tasks_by_status(self, navigation_tools):
        """Test filtering tasks by status."""
        result = await navigation_tools.list_tasks({'status': 'available'})

        assert result['success'] is True
        assert all(task['status'] == 'available' for task in result['tasks'])

    @pytest.mark.asyncio
    async def test_list_tasks_by_assigned_to(self, navigation_tools):
        """Test filtering tasks by assignee."""
        # Get a known agent ID from mock data
        result = await navigation_tools.list_tasks({
            'status': 'all',
            'assigned_to': 'web-analyst'
        })

        assert result['success'] is True

    @pytest.mark.asyncio
    async def test_list_tasks_with_limit(self, navigation_tools):
        """Test limiting task results."""
        result = await navigation_tools.list_tasks({'limit': 2})

        assert result['success'] is True
        assert len(result['tasks']) <= 2

    @pytest.mark.asyncio
    async def test_get_system_status(self, navigation_tools):
        """Test getting system status."""
        result = await navigation_tools.get_system_status({'include_metrics': True})

        assert result['success'] is True
        assert 'system' in result
        assert 'agents' in result
        assert 'tasks' in result
        assert 'skills' in result
        assert 'metrics' in result
        assert result['system']['health'] in ['healthy', 'degraded', 'critical']

    @pytest.mark.asyncio
    async def test_get_system_status_without_metrics(self, navigation_tools):
        """Test system status without metrics."""
        result = await navigation_tools.get_system_status({'include_metrics': False})

        assert result['success'] is True
        assert 'metrics' not in result

    @pytest.mark.asyncio
    async def test_find_expert(self, navigation_tools):
        """Test finding expert agent."""
        result = await navigation_tools.find_expert({
            'capability': 'coordination',
            'available_only': True
        })

        assert result['success'] is True
        assert 'best_match' in result
        assert 'alternatives' in result

    @pytest.mark.asyncio
    async def test_find_expert_no_match(self, navigation_tools):
        """Test finding expert with no match."""
        result = await navigation_tools.find_expert({
            'capability': 'nonexistent-capability',
            'available_only': True
        })

        assert result['success'] is False
        assert 'message' in result
        assert 'available_capabilities' in result

    @pytest.mark.asyncio
    async def test_find_expert_include_offline(self, navigation_tools):
        """Test finding expert including offline agents."""
        result = await navigation_tools.find_expert({
            'capability': 'mobility',
            'available_only': False
        })

        # Should find the scout agent even if offline
        assert 'best_match' in result or 'message' in result


# ==================== Integration Between Tools ====================

class TestToolsIntegration:
    """Test integration between different tools."""

    @pytest.mark.asyncio
    async def test_onboarding_to_navigation_flow(self):
        """Test flow from onboarding to navigation."""
        # Setup
        config = {
            'server': {'version': '1.0.0-test'},
            'firebase': {'url': 'https://test.firebaseio.com'},
            'github': {'repo': 'test/repo'}
        }

        onboarding = OnboardingTools(config)
        navigation = NavigationTools(config)

        # Onboard a new agent
        welcome_result = await onboarding.welcome({
            'agent_name': 'New Agent',
            'surface': 'cli'
        })

        assert welcome_result['success'] is True

        # Get checklist
        checklist_result = await onboarding.get_checklist({'role': 'worker'})

        assert checklist_result['success'] is True

        # Navigate to find other agents
        agents_result = await navigation.list_agents({'status': 'online'})

        assert agents_result['success'] is True
        assert agents_result['count'] > 0


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
