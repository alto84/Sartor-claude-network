#!/usr/bin/env python3
"""
Mock Firebase Client for Testing
=================================
Provides a mock Firebase Realtime Database for testing purposes.
"""

import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime
import copy


class MockFirebaseClient:
    """Mock Firebase client for testing."""

    def __init__(self):
        """Initialize mock Firebase with empty database."""
        self.data = {}
        self.read_count = 0
        self.write_count = 0
        self.delete_count = 0
        self.query_count = 0

    def reset(self):
        """Reset mock database and counters."""
        self.data = {}
        self.read_count = 0
        self.write_count = 0
        self.delete_count = 0
        self.query_count = 0

    def set_data(self, path: str, data: Any):
        """Set data at a specific path."""
        self._set_path(path, data)

    def get_data(self, path: str) -> Any:
        """Get data from a specific path."""
        return self._get_path(path)

    def _get_path(self, path: str) -> Any:
        """Navigate to a path in the mock database."""
        if not path or path == '/':
            return self.data

        parts = path.strip('/').split('/')
        current = self.data

        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                return None

        return current

    def _set_path(self, path: str, value: Any):
        """Set value at a path in the mock database."""
        if not path or path == '/':
            self.data = value
            return

        parts = path.strip('/').split('/')
        current = self.data

        for i, part in enumerate(parts[:-1]):
            if part not in current:
                current[part] = {}
            current = current[part]

        current[parts[-1]] = value

    def _delete_path(self, path: str):
        """Delete value at a path in the mock database."""
        if not path or path == '/':
            self.data = {}
            return

        parts = path.strip('/').split('/')
        current = self.data

        for part in parts[:-1]:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                return

        if isinstance(current, dict) and parts[-1] in current:
            del current[parts[-1]]

    async def read(self, path: str, query: Optional[Dict] = None) -> Dict[str, Any]:
        """Mock read operation."""
        self.read_count += 1

        # Simulate network delay
        await asyncio.sleep(0.01)

        data = self._get_path(path)

        # Apply query filters if provided
        if query and data:
            if query.get('limitToFirst'):
                if isinstance(data, dict):
                    items = list(data.items())[:query['limitToFirst']]
                    data = dict(items)
                elif isinstance(data, list):
                    data = data[:query['limitToFirst']]

            if query.get('limitToLast'):
                if isinstance(data, dict):
                    items = list(data.items())[-query['limitToLast']:]
                    data = dict(items)
                elif isinstance(data, list):
                    data = data[-query['limitToLast']:]

        return {
            'success': True,
            'data': copy.deepcopy(data),
            'path': path,
            'timestamp': datetime.now().isoformat()
        }

    async def write(self, path: str, data: Any, merge: bool = False) -> Dict[str, Any]:
        """Mock write operation."""
        self.write_count += 1

        # Simulate network delay
        await asyncio.sleep(0.01)

        if merge and path:
            existing = self._get_path(path)
            if isinstance(existing, dict) and isinstance(data, dict):
                existing.update(data)
                self._set_path(path, existing)
            else:
                self._set_path(path, data)
        else:
            self._set_path(path, data)

        return {
            'success': True,
            'path': path,
            'operation': 'merge' if merge else 'write',
            'timestamp': datetime.now().isoformat()
        }

    async def delete(self, path: str) -> Dict[str, Any]:
        """Mock delete operation."""
        self.delete_count += 1

        # Simulate network delay
        await asyncio.sleep(0.01)

        self._delete_path(path)

        return {
            'success': True,
            'path': path,
            'operation': 'delete',
            'timestamp': datetime.now().isoformat()
        }

    async def query(self, path: str, filters: List[Dict], **kwargs) -> Dict[str, Any]:
        """Mock query operation."""
        self.query_count += 1

        # Simulate network delay
        await asyncio.sleep(0.01)

        data = self._get_path(path)

        if not data:
            return {
                'success': True,
                'results': [],
                'count': 0,
                'timestamp': datetime.now().isoformat()
            }

        # Apply filters
        results = []
        if isinstance(data, dict):
            for key, value in data.items():
                if self._apply_filters(value, filters):
                    results.append({'key': key, 'value': value})

        # Apply limit if specified
        limit = kwargs.get('limit')
        if limit and len(results) > limit:
            results = results[:limit]

        return {
            'success': True,
            'results': results,
            'count': len(results),
            'timestamp': datetime.now().isoformat()
        }

    def _apply_filters(self, data: Any, filters: List[Dict]) -> bool:
        """Apply filter conditions to data."""
        if not filters:
            return True

        for filter_def in filters:
            field = filter_def.get('field')
            operator = filter_def.get('operator')
            value = filter_def.get('value')

            # Get field value
            field_value = data
            if isinstance(data, dict) and field in data:
                field_value = data[field]
            else:
                return False

            # Check condition
            if not self._check_condition(field_value, operator, value):
                return False

        return True

    def _check_condition(self, field_value: Any, operator: str, value: Any) -> bool:
        """Check a single filter condition."""
        try:
            if operator == '==':
                return field_value == value
            elif operator == '!=':
                return field_value != value
            elif operator == '<':
                return field_value < value
            elif operator == '<=':
                return field_value <= value
            elif operator == '>':
                return field_value > value
            elif operator == '>=':
                return field_value >= value
            elif operator == 'in':
                return field_value in value
            elif operator == 'contains':
                return value in field_value
            else:
                return False
        except (TypeError, ValueError):
            return False


class MockFirebaseTools:
    """Mock Firebase tools that use the mock client."""

    def __init__(self, config: Dict[str, Any] = None):
        """Initialize with mock client."""
        self.config = config or {}
        self.client = MockFirebaseClient()

    def reset(self):
        """Reset mock client."""
        self.client.reset()

    async def read(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Read from mock Firebase."""
        path = params.get('path', '')
        query = params.get('query')
        return await self.client.read(path, query)

    async def write(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Write to mock Firebase."""
        path = params.get('path', '')
        data = params.get('data')
        merge = params.get('merge', False)
        return await self.client.write(path, data, merge)

    async def delete(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Delete from mock Firebase."""
        path = params.get('path', '')
        return await self.client.delete(path)

    async def query(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Query mock Firebase."""
        path = params.get('path', '')
        filters = params.get('filters', [])
        order_by = params.get('order_by')
        limit = params.get('limit')
        return await self.client.query(path, filters, order_by=order_by, limit=limit)

    async def cleanup(self):
        """Cleanup mock resources."""
        pass
