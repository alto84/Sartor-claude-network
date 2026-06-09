#!/usr/bin/env python3
"""
GitHub Tools for MCP Server
============================
Provides GitHub repository operations for the Sartor Claude Network MCP server.

Author: MCP Server Implementation Specialist
Date: 2025-11-03
Version: 1.0.0
"""

import json
import asyncio
import logging
import requests
import base64
from typing import Dict, Any, Optional, List
from datetime import datetime
from pathlib import Path
import os

logger = logging.getLogger(__name__)


class GitHubTools:
    """
    GitHub tools implementation for MCP server.
    Provides repository read, search, history, and file listing operations.
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize GitHub tools with configuration.

        Args:
            config: GitHub configuration dictionary
        """
        self.config = config
        self.repo = config.get('repo', 'alto84/Sartor-claude-network')
        self.default_branch = config.get('default_branch', 'main')
        self.api_timeout = config.get('api_timeout', 30)
        self.api_base = 'https://api.github.com'

        # GitHub token from environment (optional for public repos)
        self.token = os.environ.get('GITHUB_TOKEN')

        # Session for connection pooling
        self.session = requests.Session()
        self.session.headers.update({
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Sartor-Claude-Network-MCP'
        })

        if self.token:
            self.session.headers['Authorization'] = f'token {self.token}'
            logger.info("GitHub tools initialized with authentication")
        else:
            logger.info("GitHub tools initialized without authentication (rate limits apply)")

    async def read_file(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Read a file from GitHub repository.

        Args:
            params: Parameters including path and branch

        Returns:
            File content and metadata
        """
        file_path = params.get('path', '').strip('/')
        branch = params.get('branch', self.default_branch)

        if not file_path:
            return {
                'success': False,
                'error': 'File path is required',
                'timestamp': datetime.now().isoformat()
            }

        try:
            # Get file content from GitHub API
            url = f"{self.api_base}/repos/{self.repo}/contents/{file_path}"
            params_dict = {'ref': branch}

            response = await self._make_request('GET', url, params=params_dict)

            if response.get('type') != 'file':
                return {
                    'success': False,
                    'error': f"Path '{file_path}' is not a file",
                    'path': file_path,
                    'timestamp': datetime.now().isoformat()
                }

            # Decode base64 content
            content_base64 = response.get('content', '')
            content = base64.b64decode(content_base64).decode('utf-8')

            return {
                'success': True,
                'path': file_path,
                'branch': branch,
                'content': content,
                'size': response.get('size', 0),
                'sha': response.get('sha', ''),
                'url': response.get('html_url', ''),
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error reading file from GitHub: {e}")
            return {
                'success': False,
                'error': str(e),
                'path': file_path,
                'timestamp': datetime.now().isoformat()
            }

    async def search(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Search for content in GitHub repository.

        Args:
            params: Search parameters including query, type, and path

        Returns:
            Search results
        """
        query = params.get('query', '')
        search_type = params.get('type', 'code')
        path_filter = params.get('path', '')

        if not query:
            return {
                'success': False,
                'error': 'Search query is required',
                'timestamp': datetime.now().isoformat()
            }

        try:
            # Build search query
            search_query = f"{query} repo:{self.repo}"
            if path_filter:
                search_query += f" path:{path_filter}"

            # Use appropriate search endpoint
            if search_type == 'code':
                url = f"{self.api_base}/search/code"
            elif search_type == 'issues':
                url = f"{self.api_base}/search/issues"
            elif search_type == 'commits':
                url = f"{self.api_base}/search/commits"
                # Commits search requires special accept header
                headers = {'Accept': 'application/vnd.github.cloak-preview+json'}
            else:
                # For 'files', we'll list and filter
                return await self._search_files(query, path_filter)

            params_dict = {
                'q': search_query,
                'per_page': 30
            }

            headers = getattr(locals(), 'headers', None)
            response = await self._make_request('GET', url, params=params_dict, headers=headers)

            results = []
            for item in response.get('items', []):
                if search_type == 'code':
                    results.append({
                        'path': item.get('path'),
                        'repository': item.get('repository', {}).get('name'),
                        'url': item.get('html_url'),
                        'score': item.get('score')
                    })
                elif search_type == 'issues':
                    results.append({
                        'title': item.get('title'),
                        'number': item.get('number'),
                        'state': item.get('state'),
                        'url': item.get('html_url'),
                        'created_at': item.get('created_at')
                    })
                elif search_type == 'commits':
                    commit = item.get('commit', {})
                    results.append({
                        'sha': item.get('sha'),
                        'message': commit.get('message'),
                        'author': commit.get('author', {}).get('name'),
                        'date': commit.get('author', {}).get('date'),
                        'url': item.get('html_url')
                    })

            return {
                'success': True,
                'query': query,
                'type': search_type,
                'total_count': response.get('total_count', 0),
                'results': results,
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error searching GitHub: {e}")
            return {
                'success': False,
                'error': str(e),
                'query': query,
                'timestamp': datetime.now().isoformat()
            }

    async def get_history(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get commit history for a file or path.

        Args:
            params: Parameters including path and limit

        Returns:
            Commit history
        """
        path = params.get('path', '').strip('/')
        limit = params.get('limit', 10)

        try:
            # Get commits for the path
            url = f"{self.api_base}/repos/{self.repo}/commits"
            params_dict = {
                'path': path if path else None,
                'per_page': min(limit, 100)
            }

            response = await self._make_request('GET', url, params=params_dict)

            commits = []
            for commit_data in response[:limit]:
                commit = commit_data.get('commit', {})
                commits.append({
                    'sha': commit_data.get('sha'),
                    'message': commit.get('message'),
                    'author': {
                        'name': commit.get('author', {}).get('name'),
                        'email': commit.get('author', {}).get('email'),
                        'date': commit.get('author', {}).get('date')
                    },
                    'url': commit_data.get('html_url'),
                    'stats': {
                        'additions': commit_data.get('stats', {}).get('additions', 0),
                        'deletions': commit_data.get('stats', {}).get('deletions', 0),
                        'total': commit_data.get('stats', {}).get('total', 0)
                    }
                })

            return {
                'success': True,
                'path': path or 'repository',
                'commits': commits,
                'count': len(commits),
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error getting GitHub history: {e}")
            return {
                'success': False,
                'error': str(e),
                'path': path,
                'timestamp': datetime.now().isoformat()
            }

    async def list_files(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        List files in a GitHub directory.

        Args:
            params: Parameters including path, branch, and recursive option

        Returns:
            List of files and directories
        """
        path = params.get('path', '').strip('/').strip()
        branch = params.get('branch', self.default_branch)
        recursive = params.get('recursive', False)

        try:
            if recursive:
                # Use tree API for recursive listing
                url = f"{self.api_base}/repos/{self.repo}/git/trees/{branch}"
                params_dict = {'recursive': '1'}
                response = await self._make_request('GET', url, params=params_dict)

                # Filter to path if specified
                files = []
                for item in response.get('tree', []):
                    item_path = item.get('path', '')
                    if not path or item_path.startswith(f"{path}/"):
                        files.append({
                            'path': item_path,
                            'type': item.get('type'),  # 'blob' for file, 'tree' for directory
                            'size': item.get('size', 0),
                            'sha': item.get('sha')
                        })
            else:
                # Use contents API for single directory
                url = f"{self.api_base}/repos/{self.repo}/contents/{path}"
                params_dict = {'ref': branch}
                response = await self._make_request('GET', url, params=params_dict)

                # Handle single file response
                if isinstance(response, dict) and response.get('type') == 'file':
                    files = [{
                        'name': response.get('name'),
                        'path': response.get('path'),
                        'type': 'file',
                        'size': response.get('size', 0),
                        'sha': response.get('sha'),
                        'url': response.get('html_url')
                    }]
                else:
                    # Directory listing
                    files = []
                    for item in response:
                        files.append({
                            'name': item.get('name'),
                            'path': item.get('path'),
                            'type': item.get('type'),
                            'size': item.get('size', 0),
                            'sha': item.get('sha'),
                            'url': item.get('html_url')
                        })

            # Sort files: directories first, then by name
            files.sort(key=lambda x: (x.get('type') != 'tree', x.get('path', '')))

            return {
                'success': True,
                'path': path or '/',
                'branch': branch,
                'files': files,
                'count': len(files),
                'recursive': recursive,
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error listing GitHub files: {e}")
            return {
                'success': False,
                'error': str(e),
                'path': path,
                'timestamp': datetime.now().isoformat()
            }

    async def _search_files(self, query: str, path_filter: str) -> Dict[str, Any]:
        """
        Search for files by name pattern.

        Args:
            query: Search pattern
            path_filter: Path to limit search

        Returns:
            Matching files
        """
        try:
            # Get all files recursively
            list_result = await self.list_files({
                'path': path_filter,
                'recursive': True
            })

            if not list_result.get('success'):
                return list_result

            # Filter files by query
            query_lower = query.lower()
            matching_files = []

            for file in list_result.get('files', []):
                file_path = file.get('path', '').lower()
                file_name = file_path.split('/')[-1] if '/' in file_path else file_path

                # Check if query matches file name or path
                if query_lower in file_name or query_lower in file_path:
                    matching_files.append(file)

            return {
                'success': True,
                'query': query,
                'type': 'files',
                'results': matching_files,
                'count': len(matching_files),
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error searching files: {e}")
            return {
                'success': False,
                'error': str(e),
                'query': query,
                'timestamp': datetime.now().isoformat()
            }

    async def _make_request(self, method: str, url: str, **kwargs) -> Any:
        """
        Make HTTP request to GitHub API.

        Args:
            method: HTTP method
            url: Request URL
            **kwargs: Additional request parameters

        Returns:
            Response data
        """
        try:
            # Merge headers if provided
            if 'headers' in kwargs:
                headers = {**self.session.headers, **kwargs.pop('headers')}
            else:
                headers = self.session.headers

            # Run synchronous request in executor
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.session.request(
                    method,
                    url,
                    timeout=self.api_timeout,
                    headers=headers,
                    **kwargs
                )
            )

            # Check for rate limiting
            if response.status_code == 403:
                rate_limit_remaining = response.headers.get('X-RateLimit-Remaining', 'unknown')
                rate_limit_reset = response.headers.get('X-RateLimit-Reset', 'unknown')
                logger.warning(f"GitHub rate limit hit. Remaining: {rate_limit_remaining}, Reset: {rate_limit_reset}")

            response.raise_for_status()

            # Return JSON response
            return response.json()

        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                raise Exception(f"Resource not found: {url}")
            elif e.response.status_code == 403:
                raise Exception("GitHub API rate limit exceeded or access denied")
            else:
                raise Exception(f"GitHub API error: {e}")
        except Exception as e:
            raise Exception(f"Request failed: {e}")

    async def cleanup(self):
        """Clean up resources."""
        self.session.close()
        logger.info("GitHub tools cleaned up")