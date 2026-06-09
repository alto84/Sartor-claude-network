#!/usr/bin/env python3
"""
Firebase Tools for MCP Server
==============================
Provides comprehensive Firebase Realtime Database operations
for the Sartor Claude Network MCP server.

Author: MCP Server Implementation Specialist
Date: 2025-11-03
Version: 1.0.0
"""

import json
import asyncio
import logging
import requests
from typing import Dict, Any, Optional, List, Callable
from datetime import datetime
from pathlib import Path
import threading
import queue

logger = logging.getLogger(__name__)


class FirebaseTools:
    """
    Firebase tools implementation for MCP server.
    Provides read, write, query, delete, and subscription operations.
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize Firebase tools with configuration.

        Args:
            config: Firebase configuration dictionary
        """
        self.config = config
        self.base_url = config.get('url', 'https://home-claude-network-default-rtdb.firebaseio.com')
        self.timeout = config.get('timeout', 30)
        self.max_retries = config.get('max_retries', 3)

        # Subscription management
        self.subscriptions = {}
        self.subscription_threads = {}
        self.subscription_queues = {}

        # Session for connection pooling
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })

        logger.info(f"Firebase tools initialized with base URL: {self.base_url}")

    async def read(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Read data from Firebase Realtime Database.

        Args:
            params: Parameters including path and optional query

        Returns:
            Data from Firebase
        """
        path = params.get('path', '').strip('/')
        query = params.get('query', {})

        # Build URL with query parameters
        url = f"{self.base_url}/{path}.json"

        # Add query parameters if provided
        query_params = {}
        if query.get('orderBy'):
            query_params['orderBy'] = f'"{query["orderBy"]}"'
        if query.get('limitToFirst'):
            query_params['limitToFirst'] = query['limitToFirst']
        if query.get('limitToLast'):
            query_params['limitToLast'] = query['limitToLast']
        if query.get('startAt'):
            query_params['startAt'] = f'"{query["startAt"]}"'
        if query.get('endAt'):
            query_params['endAt'] = f'"{query["endAt"]}"'

        try:
            response = await self._make_request('GET', url, params=query_params)

            return {
                'success': True,
                'path': path,
                'data': response,
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error reading from Firebase: {e}")
            return {
                'success': False,
                'error': str(e),
                'path': path,
                'timestamp': datetime.now().isoformat()
            }

    async def write(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Write data to Firebase Realtime Database.

        Args:
            params: Parameters including path, data, and merge option

        Returns:
            Write operation result
        """
        path = params.get('path', '').strip('/')
        data = params.get('data')
        merge = params.get('merge', False)

        url = f"{self.base_url}/{path}.json"

        try:
            if merge and path:
                # For merge, use PATCH
                response = await self._make_request('PATCH', url, json=data)
            else:
                # For replace, use PUT
                response = await self._make_request('PUT', url, json=data)

            return {
                'success': True,
                'path': path,
                'operation': 'merge' if merge else 'write',
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error writing to Firebase: {e}")
            return {
                'success': False,
                'error': str(e),
                'path': path,
                'timestamp': datetime.now().isoformat()
            }

    async def delete(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Delete data from Firebase Realtime Database.

        Args:
            params: Parameters including path

        Returns:
            Delete operation result
        """
        path = params.get('path', '').strip('/')
        url = f"{self.base_url}/{path}.json"

        try:
            response = await self._make_request('DELETE', url)

            return {
                'success': True,
                'path': path,
                'operation': 'delete',
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error deleting from Firebase: {e}")
            return {
                'success': False,
                'error': str(e),
                'path': path,
                'timestamp': datetime.now().isoformat()
            }

    async def query(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Query Firebase with complex filters.

        Args:
            params: Query parameters including path, filters, order_by, limit

        Returns:
            Query results
        """
        path = params.get('path', '').strip('/')
        filters = params.get('filters', [])
        order_by = params.get('order_by')
        limit = params.get('limit')

        # First, get all data (Firebase REST API has limited filtering)
        url = f"{self.base_url}/{path}.json"

        query_params = {}
        if order_by:
            query_params['orderBy'] = f'"{order_by}"'
        if limit:
            query_params['limitToFirst'] = limit

        try:
            data = await self._make_request('GET', url, params=query_params)

            if not data:
                return {
                    'success': True,
                    'path': path,
                    'results': [],
                    'count': 0,
                    'timestamp': datetime.now().isoformat()
                }

            # Apply client-side filtering
            results = []
            if isinstance(data, dict):
                for key, value in data.items():
                    if self._apply_filters(value, filters):
                        results.append({'key': key, 'value': value})
            elif isinstance(data, list):
                for idx, value in enumerate(data):
                    if value and self._apply_filters(value, filters):
                        results.append({'key': str(idx), 'value': value})

            # Apply limit if specified
            if limit and len(results) > limit:
                results = results[:limit]

            return {
                'success': True,
                'path': path,
                'results': results,
                'count': len(results),
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error querying Firebase: {e}")
            return {
                'success': False,
                'error': str(e),
                'path': path,
                'timestamp': datetime.now().isoformat()
            }

    async def subscribe(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Subscribe to real-time updates from Firebase.

        Args:
            params: Subscription parameters including path and event_type

        Returns:
            Subscription result
        """
        path = params.get('path', '').strip('/')
        event_type = params.get('event_type', 'value')

        subscription_id = f"{path}_{event_type}_{datetime.now().timestamp()}"

        # Check if already subscribed
        if subscription_id in self.subscriptions:
            return {
                'success': False,
                'error': 'Already subscribed to this path',
                'subscription_id': subscription_id,
                'timestamp': datetime.now().isoformat()
            }

        # Create subscription
        try:
            # For demonstration, we'll use polling
            # In production, you'd use Firebase's server-sent events
            subscription_queue = queue.Queue()
            self.subscription_queues[subscription_id] = subscription_queue

            # Start polling thread
            thread = threading.Thread(
                target=self._poll_firebase,
                args=(subscription_id, path, event_type, subscription_queue),
                daemon=True
            )
            thread.start()
            self.subscription_threads[subscription_id] = thread

            self.subscriptions[subscription_id] = {
                'path': path,
                'event_type': event_type,
                'created': datetime.now().isoformat(),
                'active': True
            }

            return {
                'success': True,
                'subscription_id': subscription_id,
                'path': path,
                'event_type': event_type,
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error subscribing to Firebase: {e}")
            return {
                'success': False,
                'error': str(e),
                'path': path,
                'timestamp': datetime.now().isoformat()
            }

    def _apply_filters(self, data: Any, filters: List[Dict[str, Any]]) -> bool:
        """
        Apply filters to data.

        Args:
            data: Data to filter
            filters: List of filter conditions

        Returns:
            True if all filters match
        """
        if not filters:
            return True

        for filter_def in filters:
            field = filter_def.get('field')
            operator = filter_def.get('operator')
            value = filter_def.get('value')

            # Navigate to field value
            field_value = data
            if '.' in field:
                for part in field.split('.'):
                    if isinstance(field_value, dict):
                        field_value = field_value.get(part)
                    else:
                        field_value = None
                        break
            elif isinstance(field_value, dict):
                field_value = field_value.get(field)

            # Apply operator
            if not self._check_condition(field_value, operator, value):
                return False

        return True

    def _check_condition(self, field_value: Any, operator: str, value: Any) -> bool:
        """
        Check if a condition is met.

        Args:
            field_value: Value from data
            operator: Comparison operator
            value: Value to compare against

        Returns:
            True if condition is met
        """
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
                return field_value in value if isinstance(value, (list, tuple)) else False
            elif operator == 'contains':
                return value in field_value if isinstance(field_value, (list, tuple, str)) else False
            else:
                return False
        except (TypeError, ValueError):
            return False

    def _poll_firebase(self, subscription_id: str, path: str, event_type: str, event_queue: queue.Queue):
        """
        Poll Firebase for changes (simplified implementation).

        Args:
            subscription_id: Unique subscription identifier
            path: Firebase path to monitor
            event_type: Type of events to monitor
            event_queue: Queue to put events into
        """
        url = f"{self.base_url}/{path}.json"
        last_data = None
        poll_interval = 5  # seconds

        while subscription_id in self.subscriptions and self.subscriptions[subscription_id]['active']:
            try:
                response = self.session.get(url, timeout=self.timeout)
                if response.status_code == 200:
                    current_data = response.json()

                    # Detect changes
                    if current_data != last_data:
                        event = {
                            'subscription_id': subscription_id,
                            'event_type': 'value_changed' if last_data else 'initial_value',
                            'path': path,
                            'data': current_data,
                            'timestamp': datetime.now().isoformat()
                        }
                        event_queue.put(event)
                        last_data = current_data

                threading.Event().wait(poll_interval)

            except Exception as e:
                logger.error(f"Error polling Firebase: {e}")
                threading.Event().wait(poll_interval)

    async def _make_request(self, method: str, url: str, **kwargs) -> Any:
        """
        Make HTTP request with retries.

        Args:
            method: HTTP method
            url: Request URL
            **kwargs: Additional request parameters

        Returns:
            Response data
        """
        retries = 0
        last_error = None

        while retries < self.max_retries:
            try:
                # Run synchronous request in executor
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(
                    None,
                    lambda: self.session.request(method, url, timeout=self.timeout, **kwargs)
                )

                response.raise_for_status()

                # Return JSON response or None
                if response.text:
                    return response.json()
                return None

            except requests.exceptions.RequestException as e:
                last_error = e
                retries += 1
                if retries < self.max_retries:
                    await asyncio.sleep(2 ** retries)  # Exponential backoff

        raise Exception(f"Failed after {self.max_retries} retries: {last_error}")

    async def cleanup(self):
        """Clean up resources."""
        # Stop all subscriptions
        for subscription_id in list(self.subscriptions.keys()):
            self.subscriptions[subscription_id]['active'] = False

        # Close session
        self.session.close()

        logger.info("Firebase tools cleaned up")