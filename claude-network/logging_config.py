#!/usr/bin/env python3
"""
Centralized Logging Configuration for Sartor Claude Network
Provides consistent logging setup across all modules with file rotation,
console output, and level-based filtering.

Author: Logging Migration Specialist
Date: 2025-11-07
Version: 1.0.0
"""

import logging
import logging.handlers
import sys
from pathlib import Path
from typing import Optional
from datetime import datetime


# Default configuration
DEFAULT_LOG_LEVEL = logging.INFO
DEFAULT_LOG_DIR = Path.home() / ".claude-network" / "logs"
DEFAULT_LOG_FILE = "claude-network.log"
DEFAULT_MAX_BYTES = 10 * 1024 * 1024  # 10MB
DEFAULT_BACKUP_COUNT = 5
DEFAULT_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
DEFAULT_DATE_FORMAT = '%Y-%m-%d %H:%M:%S'


class ColoredFormatter(logging.Formatter):
    """
    Custom formatter that adds colors to console output for better readability.
    """

    # ANSI color codes
    COLORS = {
        'DEBUG': '\033[36m',     # Cyan
        'INFO': '\033[32m',      # Green
        'WARNING': '\033[33m',   # Yellow
        'ERROR': '\033[31m',     # Red
        'CRITICAL': '\033[35m',  # Magenta
    }
    RESET = '\033[0m'

    def format(self, record):
        """Format log record with color if on TTY"""
        log_message = super().format(record)

        # Only add colors if output is a terminal
        if hasattr(sys.stderr, 'isatty') and sys.stderr.isatty():
            color = self.COLORS.get(record.levelname, '')
            return f"{color}{log_message}{self.RESET}"

        return log_message


def setup_logging(
    name: Optional[str] = None,
    level: int = DEFAULT_LOG_LEVEL,
    log_dir: Optional[Path] = None,
    log_file: Optional[str] = None,
    console: bool = True,
    file_logging: bool = True,
    format_string: Optional[str] = None,
    date_format: Optional[str] = None,
    max_bytes: int = DEFAULT_MAX_BYTES,
    backup_count: int = DEFAULT_BACKUP_COUNT,
    propagate: bool = False
) -> logging.Logger:
    """
    Set up logging with both console and file handlers.

    Args:
        name: Logger name (uses root logger if None)
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_dir: Directory for log files (creates if doesn't exist)
        log_file: Log file name
        console: Enable console output
        file_logging: Enable file output
        format_string: Custom format string
        date_format: Custom date format
        max_bytes: Maximum size per log file before rotation
        backup_count: Number of backup files to keep
        propagate: Whether to propagate to parent logger

    Returns:
        Configured logger instance
    """
    # Get or create logger
    logger = logging.getLogger(name)
    logger.setLevel(level)
    logger.propagate = propagate

    # Clear existing handlers to avoid duplicates
    logger.handlers.clear()

    # Set up formatters
    format_string = format_string or DEFAULT_FORMAT
    date_format = date_format or DEFAULT_DATE_FORMAT

    # File handler with rotation
    if file_logging:
        log_dir = log_dir or DEFAULT_LOG_DIR
        log_file = log_file or DEFAULT_LOG_FILE

        # Create log directory if it doesn't exist
        log_dir.mkdir(parents=True, exist_ok=True)

        log_path = log_dir / log_file

        # Rotating file handler
        file_handler = logging.handlers.RotatingFileHandler(
            filename=log_path,
            maxBytes=max_bytes,
            backupCount=backup_count,
            encoding='utf-8'
        )
        file_handler.setLevel(level)
        file_formatter = logging.Formatter(format_string, date_format)
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)

    # Console handler with colors
    if console:
        console_handler = logging.StreamHandler(sys.stderr)
        console_handler.setLevel(level)
        console_formatter = ColoredFormatter(format_string, date_format)
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)

    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger with standard configuration.
    Convenient shortcut for modules to get their logger.

    Args:
        name: Logger name (typically __name__)

    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)


def set_level(level: int):
    """
    Set logging level for all handlers.

    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    for handler in root_logger.handlers:
        handler.setLevel(level)


def disable_logging():
    """Disable all logging"""
    logging.disable(logging.CRITICAL)


def enable_logging():
    """Re-enable logging after being disabled"""
    logging.disable(logging.NOTSET)


# Module-specific logger helpers
def setup_module_logger(
    module_name: str,
    level: Optional[int] = None,
    log_file: Optional[str] = None
) -> logging.Logger:
    """
    Set up a logger for a specific module with its own log file.

    Args:
        module_name: Name of the module (e.g., 'macs', 'agent_registry')
        level: Logging level (defaults to DEFAULT_LOG_LEVEL)
        log_file: Custom log file name (defaults to {module_name}.log)

    Returns:
        Configured logger instance
    """
    level = level or DEFAULT_LOG_LEVEL
    log_file = log_file or f"{module_name}.log"

    return setup_logging(
        name=module_name,
        level=level,
        log_file=log_file,
        console=True,
        file_logging=True
    )


# Initialization
def init_logging(level: int = DEFAULT_LOG_LEVEL):
    """
    Initialize the root logger with default configuration.
    Call this once at application startup.

    Args:
        level: Logging level for root logger
    """
    setup_logging(
        name=None,  # Root logger
        level=level,
        console=True,
        file_logging=True
    )


# Context manager for temporary log level changes
class LogLevel:
    """
    Context manager for temporarily changing log level.

    Example:
        with LogLevel(logging.DEBUG):
            # Debug logging enabled here
            logger.debug("This will be logged")
        # Back to original level
    """

    def __init__(self, level: int):
        self.level = level
        self.original_level = None

    def __enter__(self):
        root_logger = logging.getLogger()
        self.original_level = root_logger.level
        set_level(self.level)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        set_level(self.original_level)


# Utility functions for common logging patterns
def log_function_call(logger: logging.Logger):
    """
    Decorator to log function entry and exit.

    Usage:
        @log_function_call(logger)
        def my_function(arg1, arg2):
            pass
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            logger.debug(f"Entering {func.__name__}(args={args}, kwargs={kwargs})")
            try:
                result = func(*args, **kwargs)
                logger.debug(f"Exiting {func.__name__} with result={result}")
                return result
            except Exception as e:
                logger.error(f"Exception in {func.__name__}: {e}", exc_info=True)
                raise
        return wrapper
    return decorator


def log_exception(logger: logging.Logger, message: str = "Exception occurred"):
    """
    Context manager to log exceptions.

    Usage:
        with log_exception(logger, "Processing failed"):
            # Code that might raise exception
            pass
    """
    class ExceptionLogger:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_val, exc_tb):
            if exc_type is not None:
                logger.error(f"{message}: {exc_val}", exc_info=True)
            return False  # Don't suppress exception

    return ExceptionLogger()


# Export commonly used items
__all__ = [
    'setup_logging',
    'get_logger',
    'set_level',
    'disable_logging',
    'enable_logging',
    'setup_module_logger',
    'init_logging',
    'LogLevel',
    'log_function_call',
    'log_exception',
    'DEFAULT_LOG_LEVEL',
    'DEFAULT_LOG_DIR',
    'DEFAULT_LOG_FILE',
]


# Example usage
if __name__ == "__main__":
    # Initialize logging
    init_logging(level=logging.DEBUG)

    # Get logger
    logger = get_logger(__name__)

    # Test different log levels
    logger.debug("This is a debug message")
    logger.info("This is an info message")
    logger.warning("This is a warning message")
    logger.error("This is an error message")
    logger.critical("This is a critical message")

    # Test with context manager
    with LogLevel(logging.WARNING):
        logger.info("This won't be logged")
        logger.warning("This will be logged")

    # Test decorator
    @log_function_call(logger)
    def example_function(x, y):
        return x + y

    result = example_function(1, 2)

    # Test exception logging
    with log_exception(logger, "Division by zero"):
        try:
            1 / 0
        except ZeroDivisionError:
            pass

    print(f"\nLog files are stored in: {DEFAULT_LOG_DIR}")
