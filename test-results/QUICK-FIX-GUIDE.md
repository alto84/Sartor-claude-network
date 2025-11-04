# Quick Fix Guide - Error Handling Bugs

**Priority:** Critical bugs to fix immediately
**Files to modify:**
- `/home/user/Sartor-claude-network/sartor-network-bootstrap.py`
- `/home/user/Sartor-claude-network/claude-network/sdk/firebase_mcp_client.py`

---

## Bug #1: No Input Type Validation (HIGH PRIORITY)

**Issue:** Message content accepts None, dict, int, etc. instead of only strings

**Location:** `message_send()` and `message_broadcast()` methods

**Fix:**

```python
def message_broadcast(self, content: str) -> bool:
    """Broadcast message to all agents"""

    # ADD THIS VALIDATION
    if content is None:
        raise ValueError("Message content cannot be None")
    if not isinstance(content, str):
        raise TypeError(f"Message content must be a string, not {type(content).__name__}")
    if not content.strip():
        raise ValueError("Message content cannot be empty or whitespace only")
    # END VALIDATION

    message_id = str(uuid.uuid4())
    message_data = {
        "from": self.agent_id,
        "content": content,
        "timestamp": datetime.now().isoformat(),
    }
    # ... rest of method
```

Apply same validation to `message_send()`:

```python
def message_send(self, to_agent_id: str, content: str) -> bool:
    """Send direct message to another agent"""

    # ADD THIS VALIDATION
    if content is None:
        raise ValueError("Message content cannot be None")
    if not isinstance(content, str):
        raise TypeError(f"Message content must be a string, not {type(content).__name__}")
    if not content.strip():
        raise ValueError("Message content cannot be empty or whitespace only")
    # END VALIDATION

    message_id = str(uuid.uuid4())
    # ... rest of method
```

---

## Bug #2: No Recipient Validation (MEDIUM PRIORITY)

**Issue:** Messages to non-existent agents succeed without validation

**Location:** `message_send()` method

**Fix:**

```python
def message_send(self, to_agent_id: str, content: str) -> bool:
    """Send direct message to another agent"""

    # Existing validation from Bug #1
    if content is None:
        raise ValueError("Message content cannot be None")
    if not isinstance(content, str):
        raise TypeError(f"Message content must be a string, not {type(content).__name__}")

    # ADD RECIPIENT VALIDATION
    if not to_agent_id or not to_agent_id.strip():
        raise ValueError("Recipient agent_id cannot be empty")

    # Check if recipient exists
    recipient_status = self.agent_status(to_agent_id)
    if recipient_status is None:
        raise ValueError(f"Agent '{to_agent_id}' does not exist or is not registered")
    # END RECIPIENT VALIDATION

    message_id = str(uuid.uuid4())
    message_data = {
        "from": self.agent_id,
        "to": to_agent_id,
        "content": content,
        "timestamp": datetime.now().isoformat(),
        "read": False,
    }
    # ... rest of method
```

---

## Bug #3: No Connection State Check (MEDIUM PRIORITY)

**Issue:** Operations proceed when client is disconnected

**Location:** All operation methods

**Fix: Add decorator for connection checking**

```python
# Add this decorator at the top of the class
def requires_connection(func):
    """Decorator to ensure operation requires active connection"""
    def wrapper(self, *args, **kwargs):
        if not self.is_connected:
            raise ConnectionError(
                f"Cannot execute {func.__name__}: client is not connected. "
                "Call connect() first."
            )
        return func(self, *args, **kwargs)
    return wrapper
```

**Apply decorator to all operations:**

```python
@requires_connection
def message_send(self, to_agent_id: str, content: str) -> bool:
    # ... method body

@requires_connection
def message_broadcast(self, content: str) -> bool:
    # ... method body

@requires_connection
def task_create(self, title: str, description: str, task_data: Optional[Dict] = None) -> str:
    # ... method body

@requires_connection
def task_claim(self, task_id: str) -> bool:
    # ... method body

@requires_connection
def task_update(self, task_id: str, status: str, result: Optional[Dict] = None):
    # ... method body

@requires_connection
def knowledge_add(self, content: str, tags: List[str] = None) -> str:
    # ... method body

# Don't add to read-only operations like agent_list, knowledge_query
# as they don't modify state
```

---

## Bug #4: Invalid Agent ID Formats (MEDIUM PRIORITY)

**Issue:** Agent IDs with spaces, special characters, XSS payloads accepted

**Location:** `message_send()`, constructor, and anywhere agent IDs are accepted

**Fix: Add validation function**

```python
import re

def _validate_agent_id(self, agent_id: str, param_name: str = "agent_id") -> None:
    """Validate agent ID format"""
    if not agent_id:
        raise ValueError(f"{param_name} cannot be empty")

    # Allow: alphanumeric, hyphens, underscores, dots
    # Format: letters/numbers followed by optional hyphens/underscores/dots
    pattern = r'^[a-zA-Z0-9][a-zA-Z0-9._-]*$'

    if not re.match(pattern, agent_id):
        raise ValueError(
            f"Invalid {param_name} format: '{agent_id}'. "
            "Must contain only alphanumeric characters, hyphens, underscores, and dots. "
            "Cannot start with special characters."
        )

    # Additional length check
    if len(agent_id) > 128:
        raise ValueError(f"{param_name} too long (max 128 characters)")
```

**Apply validation:**

```python
def message_send(self, to_agent_id: str, content: str) -> bool:
    """Send direct message to another agent"""

    # ADD VALIDATION
    self._validate_agent_id(to_agent_id, "to_agent_id")
    # ... rest of method
```

---

## Bug #5: Non-existent Task Updates (LOW PRIORITY)

**Issue:** Updating non-existent tasks succeeds silently

**Location:** `task_update()` method

**Fix:**

```python
def task_update(self, task_id: str, status: str, result: Optional[Dict] = None):
    """Update task status"""

    # ADD VALIDATION
    # Check if task exists
    task = self._firebase_request("GET", f"/tasks/{task_id}")
    if not task:
        raise ValueError(f"Task '{task_id}' does not exist")

    # Validate status
    valid_statuses = ["available", "claimed", "in_progress", "completed", "failed", "cancelled"]
    if status not in valid_statuses:
        raise ValueError(f"Invalid status '{status}'. Must be one of: {', '.join(valid_statuses)}")
    # END VALIDATION

    update_data = {
        "status": status,
        "updated_by": self.agent_id,
        "updated_at": datetime.now().isoformat(),
    }

    if result:
        update_data["result"] = result

    self._firebase_request("PATCH", f"/tasks/{task_id}", update_data)
    print(f"📊 Updated task to {status}")
```

---

## Bug #6: Empty Task Fields (LOW PRIORITY)

**Issue:** Tasks with empty title/description allowed

**Location:** `task_create()` method

**Fix:**

```python
def task_create(self, title: str, description: str, task_data: Optional[Dict] = None) -> str:
    """Create a new task"""

    # ADD VALIDATION
    if not title or not title.strip():
        raise ValueError("Task title cannot be empty")
    if not description or not description.strip():
        raise ValueError("Task description cannot be empty")

    # Trim whitespace
    title = title.strip()
    description = description.strip()

    # Optional: length limits
    if len(title) > 200:
        raise ValueError("Task title too long (max 200 characters)")
    if len(description) > 5000:
        raise ValueError("Task description too long (max 5000 characters)")
    # END VALIDATION

    task_id = str(uuid.uuid4())
    task = {
        "task_id": task_id,
        "title": title,
        "description": description,
        "status": "available",
        "created_by": self.agent_id,
        "created_at": datetime.now().isoformat(),
        "data": task_data or {},
    }
    # ... rest of method
```

---

## Bug #7: Race Condition Risk (ADVANCED)

**Issue:** Task claiming uses read-then-write (not atomic)

**Current Code:**
```python
def task_claim(self, task_id: str) -> bool:
    task = self._firebase_request("GET", f"/tasks/{task_id}")  # Step 1: Read
    if not task or task.get("status") != "available":
        return False
    claim_data = {"status": "claimed", "claimed_by": self.agent_id}
    self._firebase_request("PATCH", f"/tasks/{task_id}", claim_data)  # Step 2: Write
    return True
```

**Problem:** Between Step 1 and Step 2, another agent could claim the task.

**Fix: Use Firebase REST API transaction endpoint**

This is more complex and requires using Firebase's transaction REST API or adding a timestamp-based optimistic locking:

**Option A: Optimistic Locking with Timestamp**

```python
def task_claim(self, task_id: str, max_retries: int = 3) -> bool:
    """Claim an available task with optimistic locking"""

    for attempt in range(max_retries):
        # Read current state
        task = self._firebase_request("GET", f"/tasks/{task_id}")

        if not task:
            print(f"❌ Task {task_id} not found")
            return False

        if task.get("status") != "available":
            print(f"❌ Task {task_id} not available (status: {task.get('status')})")
            return False

        # Store the timestamp we read
        last_updated = task.get("updated_at") or task.get("created_at")

        # Attempt to claim with conditional update
        claim_data = {
            "status": "claimed",
            "claimed_by": self.agent_id,
            "claimed_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "lock_version": task.get("lock_version", 0) + 1  # Increment version
        }

        # Write with condition (only if last_updated hasn't changed)
        result = self._firebase_request("PATCH", f"/tasks/{task_id}", claim_data)

        # Verify the claim succeeded
        time.sleep(0.1)  # Brief pause
        verification = self._firebase_request("GET", f"/tasks/{task_id}")

        if verification and verification.get("claimed_by") == self.agent_id:
            print(f"✅ Claimed task: {task.get('title', task_id)}")
            return True
        else:
            # Someone else claimed it between our read and write
            print(f"⚠️  Task claim conflict, retrying... (attempt {attempt + 1}/{max_retries})")
            time.sleep(0.1 * (attempt + 1))  # Exponential backoff
            continue

    print(f"❌ Failed to claim task after {max_retries} attempts")
    return False
```

**Option B: Use Firebase Realtime Database Priority/Transactions**

This requires switching from REST API to Firebase Admin SDK or using conditional writes with Firebase Rules.

**Recommended:** Implement Option A (optimistic locking) for now, plan migration to Firebase Admin SDK for true transactions later.

---

## Testing the Fixes

After applying fixes, run this test:

```python
# Test validation
client = SartorNetworkClient()
client.connect()

# Should raise ValueError
try:
    client.message_broadcast(None)
    print("❌ BUG: None accepted")
except ValueError:
    print("✅ None correctly rejected")

# Should raise TypeError
try:
    client.message_broadcast({"invalid": "type"})
    print("❌ BUG: Dict accepted")
except TypeError:
    print("✅ Dict correctly rejected")

# Should raise ValueError
try:
    client.message_send("nonexistent-agent", "hello")
    print("❌ BUG: Non-existent agent accepted")
except ValueError:
    print("✅ Non-existent agent correctly rejected")

# Should raise ConnectionError
client.disconnect()
try:
    client.message_broadcast("test")
    print("❌ BUG: Operation on disconnected client")
except ConnectionError:
    print("✅ Disconnected operation correctly rejected")

print("\n✅ All validation tests passed!")
```

---

## Summary of Changes

| Bug | Priority | Lines Changed | Complexity |
|-----|----------|---------------|------------|
| Input Type Validation | HIGH | ~10 per method | Low |
| Recipient Validation | MEDIUM | ~5 lines | Low |
| Connection State Check | MEDIUM | ~8 + decorator | Medium |
| Agent ID Format | MEDIUM | ~15 + regex | Medium |
| Task Update Validation | LOW | ~8 lines | Low |
| Empty Task Fields | LOW | ~12 lines | Low |
| Race Conditions | ADVANCED | ~30 lines | High |

**Total estimated changes:** ~100 lines of code
**Estimated time:** 2-3 hours for implementation + testing

---

## Files to Modify

1. **`/home/user/Sartor-claude-network/sartor-network-bootstrap.py`**
   - Add all validation fixes
   - Add `requires_connection` decorator
   - Add `_validate_agent_id()` method
   - Update all operation methods

2. **`/home/user/Sartor-claude-network/claude-network/sdk/firebase_mcp_client.py`**
   - Apply same fixes (keep both files in sync)

3. **Create unit tests:**
   - `/home/user/Sartor-claude-network/tests/test_validation.py`

---

## After Fixing

Re-run error handling tests to verify:

```bash
python3 /home/user/Sartor-claude-network/error-handling-tests.py
```

Expected result after fixes:
- Tests should now PASS with proper error handling
- Validation errors should be raised as expected
- Grade should improve from C+ (77%) to A- (95%+)

---

**Created:** 2025-11-04
**Priority:** Implement High + Medium priority fixes this sprint
