#!/usr/bin/env python3
"""
Mock GitHub Client for Testing
===============================
Provides a mock GitHub API client for testing purposes.
"""

import asyncio
import base64
from typing import Dict, Any, Optional, List
from datetime import datetime


class MockGitHubClient:
    """Mock GitHub client for testing."""

    def __init__(self):
        """Initialize mock GitHub with sample repository."""
        self.files = {
            'README.md': {
                'type': 'file',
                'content': '# Test Repository\n\nThis is a test repository.',
                'size': 100,
                'sha': 'abc123'
            },
            'src/main.py': {
                'type': 'file',
                'content': 'def main():\n    print("Hello, world!")\n',
                'size': 200,
                'sha': 'def456'
            },
            'src/utils.py': {
                'type': 'file',
                'content': 'def helper():\n    return True\n',
                'size': 150,
                'sha': 'ghi789'
            },
            'docs/guide.md': {
                'type': 'file',
                'content': '# User Guide\n\nHow to use this.',
                'size': 120,
                'sha': 'jkl012'
            }
        }

        self.commits = [
            {
                'sha': 'commit1',
                'commit': {
                    'message': 'Initial commit',
                    'author': {
                        'name': 'Test User',
                        'email': 'test@example.com',
                        'date': '2025-11-01T10:00:00Z'
                    }
                },
                'stats': {
                    'additions': 50,
                    'deletions': 0,
                    'total': 50
                }
            },
            {
                'sha': 'commit2',
                'commit': {
                    'message': 'Add utilities',
                    'author': {
                        'name': 'Test User',
                        'email': 'test@example.com',
                        'date': '2025-11-02T10:00:00Z'
                    }
                },
                'stats': {
                    'additions': 25,
                    'deletions': 5,
                    'total': 30
                }
            }
        ]

        self.read_count = 0
        self.search_count = 0
        self.history_count = 0
        self.list_count = 0

    def reset(self):
        """Reset counters."""
        self.read_count = 0
        self.search_count = 0
        self.history_count = 0
        self.list_count = 0

    async def read_file(self, path: str, branch: str = 'main') -> Dict[str, Any]:
        """Mock read file operation."""
        self.read_count += 1

        # Simulate network delay
        await asyncio.sleep(0.01)

        if path not in self.files:
            raise Exception(f"File not found: {path}")

        file_info = self.files[path]
        if file_info['type'] != 'file':
            raise Exception(f"Path is not a file: {path}")

        return {
            'success': True,
            'path': path,
            'branch': branch,
            'content': file_info['content'],
            'size': file_info['size'],
            'sha': file_info['sha'],
            'timestamp': datetime.now().isoformat()
        }

    async def search(self, query: str, search_type: str = 'code', path_filter: str = '') -> Dict[str, Any]:
        """Mock search operation."""
        self.search_count += 1

        # Simulate network delay
        await asyncio.sleep(0.01)

        results = []

        if search_type == 'code':
            # Search in file contents
            for file_path, file_info in self.files.items():
                if file_info['type'] == 'file':
                    if query.lower() in file_info['content'].lower():
                        if not path_filter or file_path.startswith(path_filter):
                            results.append({
                                'path': file_path,
                                'score': 1.0
                            })

        elif search_type == 'files':
            # Search in file names
            for file_path in self.files.keys():
                if query.lower() in file_path.lower():
                    if not path_filter or file_path.startswith(path_filter):
                        results.append({
                            'path': file_path,
                            'type': self.files[file_path]['type']
                        })

        elif search_type == 'commits':
            # Search in commit messages
            for commit in self.commits:
                if query.lower() in commit['commit']['message'].lower():
                    results.append({
                        'sha': commit['sha'],
                        'message': commit['commit']['message'],
                        'author': commit['commit']['author']['name'],
                        'date': commit['commit']['author']['date']
                    })

        return {
            'success': True,
            'query': query,
            'type': search_type,
            'total_count': len(results),
            'results': results,
            'timestamp': datetime.now().isoformat()
        }

    async def get_history(self, path: str = '', limit: int = 10) -> Dict[str, Any]:
        """Mock get history operation."""
        self.history_count += 1

        # Simulate network delay
        await asyncio.sleep(0.01)

        # Filter commits by path if provided
        commits = self.commits.copy()
        if path:
            # In a real implementation, would filter by path
            pass

        commits = commits[:limit]

        return {
            'success': True,
            'path': path or 'repository',
            'commits': commits,
            'count': len(commits),
            'timestamp': datetime.now().isoformat()
        }

    async def list_files(self, path: str = '', branch: str = 'main', recursive: bool = False) -> Dict[str, Any]:
        """Mock list files operation."""
        self.list_count += 1

        # Simulate network delay
        await asyncio.sleep(0.01)

        files = []

        if recursive:
            # List all files
            for file_path, file_info in self.files.items():
                if not path or file_path.startswith(path):
                    files.append({
                        'path': file_path,
                        'type': 'blob' if file_info['type'] == 'file' else 'tree',
                        'size': file_info.get('size', 0),
                        'sha': file_info.get('sha', '')
                    })
        else:
            # List only files in the specified directory
            if not path:
                # Root directory
                seen_dirs = set()
                for file_path in self.files.keys():
                    if '/' in file_path:
                        dir_name = file_path.split('/')[0]
                        if dir_name not in seen_dirs:
                            seen_dirs.add(dir_name)
                            files.append({
                                'name': dir_name,
                                'path': dir_name,
                                'type': 'dir'
                            })
                    else:
                        files.append({
                            'name': file_path,
                            'path': file_path,
                            'type': 'file',
                            'size': self.files[file_path]['size']
                        })
            else:
                # Specific directory
                path_prefix = path.rstrip('/') + '/'
                seen_items = set()

                for file_path in self.files.keys():
                    if file_path.startswith(path_prefix):
                        remainder = file_path[len(path_prefix):]
                        if '/' in remainder:
                            # Subdirectory
                            dir_name = remainder.split('/')[0]
                            if dir_name not in seen_items:
                                seen_items.add(dir_name)
                                files.append({
                                    'name': dir_name,
                                    'path': path_prefix + dir_name,
                                    'type': 'dir'
                                })
                        else:
                            # File in this directory
                            files.append({
                                'name': remainder,
                                'path': file_path,
                                'type': 'file',
                                'size': self.files[file_path]['size']
                            })

        return {
            'success': True,
            'path': path or '/',
            'branch': branch,
            'files': files,
            'count': len(files),
            'recursive': recursive,
            'timestamp': datetime.now().isoformat()
        }


class MockGitHubTools:
    """Mock GitHub tools that use the mock client."""

    def __init__(self, config: Dict[str, Any] = None):
        """Initialize with mock client."""
        self.config = config or {}
        self.client = MockGitHubClient()

    def reset(self):
        """Reset mock client."""
        self.client.reset()

    async def read_file(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Read file from mock GitHub."""
        path = params.get('path', '')
        branch = params.get('branch', 'main')
        return await self.client.read_file(path, branch)

    async def search(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Search in mock GitHub."""
        query = params.get('query', '')
        search_type = params.get('type', 'code')
        path_filter = params.get('path', '')
        return await self.client.search(query, search_type, path_filter)

    async def get_history(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Get history from mock GitHub."""
        path = params.get('path', '')
        limit = params.get('limit', 10)
        return await self.client.get_history(path, limit)

    async def list_files(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """List files from mock GitHub."""
        path = params.get('path', '')
        branch = params.get('branch', 'main')
        recursive = params.get('recursive', False)
        return await self.client.list_files(path, branch, recursive)

    async def cleanup(self):
        """Cleanup mock resources."""
        pass
