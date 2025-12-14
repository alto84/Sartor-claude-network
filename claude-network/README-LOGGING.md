# Logging Configuration Guide

## Quick Start

The Sartor Claude Network uses Python's standard logging module with a centralized configuration system.

### Basic Usage

```python
from logging_config import get_logger

# Get logger for your module
logger = get_logger(__name__)

# Use it
logger.info("Application started")
logger.debug("Processing item: %s", item)
logger.warning("Resource running low: %d%%", percent)
logger.error("Operation failed: %s", error)
```

### Setup at Application Startup

```python
from logging_config import init_logging
import logging

# Initialize with INFO level (default)
init_logging()

# Or with custom level
init_logging(level=logging.DEBUG)
```

## Features

### 1. Automatic File Rotation

- Log files automatically rotate at 10MB
- Keeps 5 backup files
- Stored in `~/.claude-network/logs/`

### 2. Color-Coded Console Output

- **DEBUG**: Cyan
- **INFO**: Green
- **WARNING**: Yellow
- **ERROR**: Red
- **CRITICAL**: Magenta

### 3. Module-Specific Logging

```python
from logging_config import setup_module_logger

# Create a dedicated logger with its own log file
logger = setup_module_logger('my_module', level=logging.DEBUG)
```

### 4. Temporary Log Level Changes

```python
from logging_config import LogLevel
import logging

with LogLevel(logging.DEBUG):
    # Debug logging only in this block
    complex_operation()
```

### 5. Function Call Tracing

```python
from logging_config import log_function_call

@log_function_call(logger)
def process_data(data):
    # Automatically logs entry/exit with parameters
    return transformed_data
```

### 6. Exception Logging

```python
from logging_config import log_exception

with log_exception(logger, "Processing failed"):
    risky_operation()
```

## Log Levels

Use appropriate log levels:

- **DEBUG**: Detailed diagnostic information

  ```python
  logger.debug("Variable state: x=%s, y=%s", x, y)
  ```

- **INFO**: Confirmation of normal operation

  ```python
  logger.info("Connected to server at %s", url)
  ```

- **WARNING**: Unexpected but recoverable situation

  ```python
  logger.warning("Retry attempt %d of %d", attempt, max_attempts)
  ```

- **ERROR**: Error preventing a specific operation

  ```python
  logger.error("Failed to save file %s: %s", filename, error)
  ```

- **CRITICAL**: Error preventing system operation
  ```python
  logger.critical("Database connection lost, shutting down")
  ```

## When to Use print() vs logging

### Use logging for:

- Operational events
- Debugging information
- Error tracking
- System monitoring
- Application state changes

### Use print() for:

- CLI tool output
- Interactive prompts
- User-facing messages
- Demo/example code
- Installation scripts

## File Locations

### Log Directory

```
~/.claude-network/logs/
├── claude-network.log      # Main log file
├── claude-network.log.1    # Rotated backup
├── claude-network.log.2    # Rotated backup
├── macs.log               # Module-specific log
└── agent_registry.log     # Module-specific log
```

### Configuration

- **Module**: `logging_config.py`
- **Report**: `LOGGING-MIGRATION.md`

## Advanced Usage

### Custom Formatter

```python
from logging_config import setup_logging

logger = setup_logging(
    name='my_app',
    format_string='%(asctime)s [%(levelname)s] %(message)s',
    date_format='%H:%M:%S'
)
```

### Disable Logging Temporarily

```python
from logging_config import disable_logging, enable_logging

disable_logging()
# No logs will be output
sensitive_operation()
enable_logging()
```

### Change Global Log Level

```python
from logging_config import set_level
import logging

set_level(logging.DEBUG)  # Enable debug logging everywhere
```

## Best Practices

1. **Include Context**: Add relevant information to log messages

   ```python
   # Good
   logger.error("Failed to process order %s for customer %s: %s",
                order_id, customer_id, error)

   # Avoid
   logger.error("Processing failed")
   ```

2. **Use String Formatting**: Let logging handle string interpolation

   ```python
   # Good
   logger.info("User %s logged in", username)

   # Avoid
   logger.info(f"User {username} logged in")
   ```

3. **Log Exceptions Properly**: Include traceback

   ```python
   try:
       risky_operation()
   except Exception as e:
       logger.error("Operation failed: %s", e, exc_info=True)
   ```

4. **One Logger Per Module**: Use `__name__`
   ```python
   logger = get_logger(__name__)
   ```

## Troubleshooting

### Logs Not Appearing

- Check log level: `logger.setLevel(logging.DEBUG)`
- Verify handlers: `logger.handlers`
- Check if logging is disabled: `logging.root.disabled`

### Too Much Output

```python
# Reduce verbosity
set_level(logging.WARNING)
```

### Log Files Too Large

- Rotation happens automatically at 10MB
- Adjust in `logging_config.py`: `max_bytes` parameter

## Examples

See the test section in `logging_config.py` for complete examples:

```bash
python3 logging_config.py
```

## More Information

- **Full Documentation**: `LOGGING-MIGRATION.md`
- **Python Logging**: https://docs.python.org/3/library/logging.html
- **Best Practices**: https://docs.python.org/3/howto/logging.html

---

**Version**: 1.0.0
**Date**: 2025-11-07
**Status**: Production Ready ✅
