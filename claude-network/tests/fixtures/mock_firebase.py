"""
Mock Firebase implementation for testing

Provides in-memory Firebase simulation for testing without external dependencies.
"""

import json
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
from unittest.mock import Mock


class MockFirebaseDatabase:
    """Mock Firebase Realtime Database for testing"""

    def __init__(self):
        """Initialize mock database"""
        self.data = {
            "messages": {},
            "agents": {},
            "tasks": {},
            "observations": {},
            "mission": {},
            "skills": {},
            "consensus": {},
            "config": {}
        }
        self.listeners = {}
        self.connection_status = True

    def reference(self, path: str):
        """Get reference to database path"""
        return MockDatabaseReference(self, path)

    def get_data(self, path: str) -> Any:
        """Get data at path"""
        if not self.connection_status:
            raise ConnectionError("Firebase connection lost")

        parts = path.strip("/").split("/")
        data = self.data

        for part in parts:
            if part and isinstance(data, dict):
                data = data.get(part, {})
            else:
                return None

        return data

    def set_data(self, path: str, value: Any) -> None:
        """Set data at path"""
        if not self.connection_status:
            raise ConnectionError("Firebase connection lost")

        parts = path.strip("/").split("/")
        if not parts[0]:
            parts = parts[1:]

        # Navigate to parent
        parent = self.data
        for part in parts[:-1]:
            if part not in parent:
                parent[part] = {}
            parent = parent[part]

        # Set value
        if parts:
            parent[parts[-1]] = value

        # Trigger listeners
        self._trigger_listeners(path, value)

    def push_data(self, path: str, value: Any) -> str:
        """Push data to path (generates unique ID)"""
        if not self.connection_status:
            raise ConnectionError("Firebase connection lost")

        push_id = f"-N{uuid.uuid4().hex[:10]}"
        full_path = f"{path}/{push_id}"
        self.set_data(full_path, value)
        return push_id

    def update_data(self, path: str, updates: Dict[str, Any]) -> None:
        """Update multiple values"""
        if not self.connection_status:
            raise ConnectionError("Firebase connection lost")

        current = self.get_data(path) or {}
        if isinstance(current, dict):
            current.update(updates)
            self.set_data(path, current)

    def delete_data(self, path: str) -> None:
        """Delete data at path"""
        parts = path.strip("/").split("/")
        if not parts[0]:
            parts = parts[1:]

        # Navigate to parent
        parent = self.data
        for part in parts[:-1]:
            if part not in parent:
                return
            parent = parent[part]

        # Delete value
        if parts and parts[-1] in parent:
            del parent[parts[-1]]

    def simulate_disconnect(self):
        """Simulate connection loss"""
        self.connection_status = False

    def simulate_reconnect(self):
        """Simulate connection restoration"""
        self.connection_status = True

    def add_listener(self, path: str, callback):
        """Add listener for path changes"""
        if path not in self.listeners:
            self.listeners[path] = []
        self.listeners[path].append(callback)

    def _trigger_listeners(self, path: str, value: Any):
        """Trigger listeners for path"""
        for listener_path, callbacks in self.listeners.items():
            if path.startswith(listener_path):
                for callback in callbacks:
                    callback(value)

    def clear(self):
        """Clear all data (for testing)"""
        self.data = {
            "messages": {},
            "agents": {},
            "tasks": {},
            "observations": {},
            "mission": {},
            "skills": {},
            "consensus": {},
            "config": {}
        }


class MockDatabaseReference:
    """Mock Firebase database reference"""

    def __init__(self, database: MockFirebaseDatabase, path: str):
        self.database = database
        self.path = path

    def get(self) -> Any:
        """Get value at reference"""
        return self.database.get_data(self.path)

    def set(self, value: Any) -> None:
        """Set value at reference"""
        self.database.set_data(self.path, value)

    def push(self, value: Any) -> 'MockDatabaseReference':
        """Push value to reference"""
        push_id = self.database.push_data(self.path, value)
        return MockDatabaseReference(self.database, f"{self.path}/{push_id}")

    def update(self, updates: Dict[str, Any]) -> None:
        """Update values at reference"""
        self.database.update_data(self.path, updates)

    def delete(self) -> None:
        """Delete value at reference"""
        self.database.delete_data(self.path)

    def child(self, path: str) -> 'MockDatabaseReference':
        """Get child reference"""
        return MockDatabaseReference(self.database, f"{self.path}/{path}")

    def on(self, event_type: str, callback):
        """Add listener for changes"""
        if event_type in ["value", "child_added", "child_changed"]:
            self.database.add_listener(self.path, callback)

    def order_by_child(self, child_path: str) -> 'MockQuery':
        """Order by child value"""
        return MockQuery(self, child_path)

    def limit_to_last(self, limit: int) -> 'MockQuery':
        """Limit query results"""
        return MockQuery(self, limit=limit)


class MockQuery:
    """Mock Firebase query"""

    def __init__(self, reference: MockDatabaseReference,
                 order_by: Optional[str] = None,
                 limit: Optional[int] = None):
        self.reference = reference
        self.order_by = order_by
        self.limit = limit

    def get(self) -> Any:
        """Execute query and get results"""
        data = self.reference.get()

        if not isinstance(data, dict):
            return data

        # Convert to list for sorting/limiting
        items = list(data.items())

        # Apply ordering
        if self.order_by:
            items.sort(key=lambda x: x[1].get(self.order_by, "") if isinstance(x[1], dict) else "")

        # Apply limit
        if self.limit:
            items = items[-self.limit:]

        # Convert back to dict
        return dict(items)


class MockFirebaseAuth:
    """Mock Firebase Authentication"""

    def __init__(self):
        self.users = {}
        self.current_user = None

    def create_user(self, email: str, password: str) -> Dict[str, Any]:
        """Create new user"""
        if email in self.users:
            raise ValueError("User already exists")

        user = {
            "uid": f"user_{uuid.uuid4().hex[:10]}",
            "email": email,
            "created_at": datetime.now().isoformat()
        }
        self.users[email] = {"user": user, "password": password}
        return user

    def sign_in(self, email: str, password: str) -> Dict[str, Any]:
        """Sign in user"""
        if email not in self.users:
            raise ValueError("User not found")

        if self.users[email]["password"] != password:
            raise ValueError("Invalid password")

        self.current_user = self.users[email]["user"]
        return self.current_user

    def sign_out(self):
        """Sign out current user"""
        self.current_user = None

    def get_current_user(self) -> Optional[Dict[str, Any]]:
        """Get current user"""
        return self.current_user


class MockFirebaseStorage:
    """Mock Firebase Storage"""

    def __init__(self):
        self.files = {}

    def upload(self, path: str, data: bytes, metadata: Optional[Dict] = None) -> str:
        """Upload file to storage"""
        self.files[path] = {
            "data": data,
            "metadata": metadata or {},
            "uploaded_at": datetime.now().isoformat(),
            "size": len(data)
        }
        return f"gs://mock-bucket/{path}"

    def download(self, path: str) -> bytes:
        """Download file from storage"""
        if path not in self.files:
            raise FileNotFoundError(f"File not found: {path}")
        return self.files[path]["data"]

    def delete(self, path: str):
        """Delete file from storage"""
        if path in self.files:
            del self.files[path]

    def list_files(self, prefix: str = "") -> List[str]:
        """List files with prefix"""
        return [path for path in self.files.keys() if path.startswith(prefix)]

    def get_metadata(self, path: str) -> Dict[str, Any]:
        """Get file metadata"""
        if path not in self.files:
            raise FileNotFoundError(f"File not found: {path}")
        return self.files[path]["metadata"]


class MockFirebaseApp:
    """Mock Firebase Application"""

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {
            "apiKey": "mock-api-key",
            "authDomain": "mock-auth-domain",
            "databaseURL": "https://mock-database.firebaseio.com",
            "storageBucket": "mock-storage-bucket"
        }
        self.database = MockFirebaseDatabase()
        self.auth = MockFirebaseAuth()
        self.storage = MockFirebaseStorage()

    def reset(self):
        """Reset all mock data"""
        self.database.clear()
        self.auth = MockFirebaseAuth()
        self.storage = MockFirebaseStorage()


def create_mock_firebase_app(config: Optional[Dict] = None) -> MockFirebaseApp:
    """Create mock Firebase app for testing"""
    return MockFirebaseApp(config)


# Helper functions for common test scenarios

def populate_test_agents(database: MockFirebaseDatabase):
    """Populate database with test agents"""
    agents = {
        "agent-001": {
            "name": "Desktop Agent",
            "status": "online",
            "capabilities": ["data_processing", "task_execution"],
            "last_heartbeat": datetime.now().isoformat()
        },
        "agent-002": {
            "name": "Mobile Agent",
            "status": "online",
            "capabilities": ["observation", "communication"],
            "last_heartbeat": datetime.now().isoformat()
        },
        "agent-003": {
            "name": "Worker Agent",
            "status": "offline",
            "capabilities": ["task_execution", "analysis"],
            "last_heartbeat": datetime.now().isoformat()
        }
    }

    for agent_id, agent_data in agents.items():
        database.set_data(f"agents/{agent_id}", agent_data)


def populate_test_messages(database: MockFirebaseDatabase):
    """Populate database with test messages"""
    messages = [
        {
            "from": "agent-001",
            "to": "broadcast",
            "type": "status",
            "content": "System initialized",
            "timestamp": datetime.now().isoformat()
        },
        {
            "from": "agent-002",
            "to": "agent-001",
            "type": "task",
            "content": "Process sensor data",
            "timestamp": datetime.now().isoformat()
        },
        {
            "from": "agent-003",
            "to": "broadcast",
            "type": "observation",
            "content": "Temperature: 22°C",
            "timestamp": datetime.now().isoformat()
        }
    ]

    for message in messages:
        database.push_data("messages", message)


def populate_test_tasks(database: MockFirebaseDatabase):
    """Populate database with test tasks"""
    tasks = [
        {
            "title": "Analyze sensor data",
            "status": "pending",
            "priority": 2,
            "assigned_to": None,
            "created_at": datetime.now().isoformat()
        },
        {
            "title": "Generate report",
            "status": "in_progress",
            "priority": 1,
            "assigned_to": "agent-001",
            "created_at": datetime.now().isoformat()
        },
        {
            "title": "Update configuration",
            "status": "completed",
            "priority": 3,
            "assigned_to": "agent-002",
            "created_at": datetime.now().isoformat()
        }
    ]

    for task in tasks:
        database.push_data("tasks", task)


if __name__ == "__main__":
    # Example usage
    app = create_mock_firebase_app()
    db = app.database

    # Populate test data
    populate_test_agents(db)
    populate_test_messages(db)
    populate_test_tasks(db)

    # Test operations
    print("Agents:", db.get_data("agents"))
    print("\nMessages:", db.get_data("messages"))
    print("\nTasks:", db.get_data("tasks"))

    # Test push operation
    new_msg_id = db.push_data("messages", {"content": "New test message"})
    print(f"\nPushed message with ID: {new_msg_id}")

    # Test update operation
    db.update_data("agents/agent-001", {"status": "busy"})
    print("\nUpdated agent-001 status:", db.get_data("agents/agent-001/status"))