"""
Test suite for Configuration Management System

Tests configuration handling including:
- Config loading and validation
- Environment-specific configs
- Dynamic config updates
- Config persistence
- Secret management
"""

import pytest
import json
import os
import tempfile
from datetime import datetime
from unittest.mock import Mock, patch, mock_open
from typing import Dict, Any


class TestConfigManager:
    """Test configuration management functionality"""

    def setup_method(self):
        """Set up test fixtures"""
        self.test_config = {
            "version": "1.0.0",
            "environment": "development",
            "network": {
                "firebase_url": "https://test-firebase.firebaseio.com",
                "github_repo": "test/repo",
                "proxy_port": 8080
            },
            "agents": {
                "max_agents": 10,
                "heartbeat_interval": 30,
                "timeout": 300
            },
            "features": {
                "self_improvement": True,
                "consensus": True,
                "learning": False
            },
            "security": {
                "encryption_enabled": False,
                "api_key": "${API_KEY}"  # Environment variable
            }
        }

    def test_config_loading(self):
        """Test loading configuration from file"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(self.test_config, f)
            config_path = f.name

        try:
            config = self.load_config(config_path)
            assert config["version"] == "1.0.0"
            assert config["network"]["firebase_url"] == "https://test-firebase.firebaseio.com"
            assert config["features"]["self_improvement"] is True
        finally:
            os.unlink(config_path)

    def load_config(self, config_path):
        """Load configuration from file"""
        with open(config_path, 'r') as f:
            return json.load(f)

    def test_config_validation(self):
        """Test configuration validation"""
        # Valid config should pass
        assert self.validate_config(self.test_config)

        # Missing required field
        invalid_config = self.test_config.copy()
        del invalid_config["version"]
        assert not self.validate_config(invalid_config)

        # Invalid type
        invalid_config = self.test_config.copy()
        invalid_config["agents"]["max_agents"] = "ten"  # Should be int
        assert not self.validate_config(invalid_config)

    def validate_config(self, config):
        """Validate configuration structure"""
        # Check required fields
        required_fields = ["version", "environment", "network", "agents"]
        if not all(field in config for field in required_fields):
            return False

        # Type validation
        if not isinstance(config.get("agents", {}).get("max_agents"), int):
            return False

        # Range validation
        max_agents = config.get("agents", {}).get("max_agents", 0)
        if max_agents < 1 or max_agents > 1000:
            return False

        return True

    def test_environment_configs(self):
        """Test environment-specific configurations"""
        configs = {
            "development": {
                "environment": "development",
                "debug": True,
                "log_level": "DEBUG",
                "network": {"firebase_url": "https://dev-firebase.firebaseio.com"}
            },
            "production": {
                "environment": "production",
                "debug": False,
                "log_level": "INFO",
                "network": {"firebase_url": "https://prod-firebase.firebaseio.com"}
            },
            "testing": {
                "environment": "testing",
                "debug": True,
                "log_level": "DEBUG",
                "network": {"firebase_url": "https://test-firebase.firebaseio.com"}
            }
        }

        # Select config based on environment
        env = os.environ.get("CLAUDE_ENV", "development")
        selected_config = self.select_environment_config(configs, env)

        assert selected_config["environment"] == env
        if env == "production":
            assert selected_config["debug"] is False

    def select_environment_config(self, configs, environment):
        """Select configuration for specified environment"""
        return configs.get(environment, configs.get("development"))

    def test_config_merging(self):
        """Test merging configurations"""
        base_config = {
            "version": "1.0.0",
            "network": {
                "firebase_url": "https://base.firebaseio.com",
                "timeout": 30
            },
            "features": {
                "feature_a": True,
                "feature_b": False
            }
        }

        override_config = {
            "network": {
                "firebase_url": "https://override.firebaseio.com",
                "proxy_port": 8080
            },
            "features": {
                "feature_b": True,
                "feature_c": True
            }
        }

        merged = self.merge_configs(base_config, override_config)

        # Check overrides
        assert merged["network"]["firebase_url"] == "https://override.firebaseio.com"
        assert merged["features"]["feature_b"] is True

        # Check additions
        assert merged["network"]["proxy_port"] == 8080
        assert merged["features"]["feature_c"] is True

        # Check preserved values
        assert merged["version"] == "1.0.0"
        assert merged["network"]["timeout"] == 30
        assert merged["features"]["feature_a"] is True

    def merge_configs(self, base, override):
        """Deep merge configurations"""
        result = base.copy()

        for key, value in override.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self.merge_configs(result[key], value)
            else:
                result[key] = value

        return result

    def test_environment_variable_substitution(self):
        """Test environment variable substitution in config"""
        config = {
            "api_key": "${API_KEY}",
            "database_url": "${DATABASE_URL:https://default.db.com}",
            "timeout": "${TIMEOUT:30}",
            "enabled": "${FEATURE_ENABLED:true}"
        }

        # Set environment variables
        with patch.dict(os.environ, {"API_KEY": "secret123", "TIMEOUT": "60"}):
            resolved = self.resolve_env_variables(config)

            assert resolved["api_key"] == "secret123"
            assert resolved["database_url"] == "https://default.db.com"  # Default used
            assert resolved["timeout"] == 60  # Converted to int
            assert resolved["enabled"] is True  # Converted to bool

    def resolve_env_variables(self, config):
        """Resolve environment variables in configuration"""
        import re

        def resolve_value(value):
            if isinstance(value, str):
                # Pattern: ${VAR_NAME:default_value}
                pattern = r'\$\{([^:}]+)(?::([^}]+))?\}'
                match = re.match(pattern, value)

                if match:
                    var_name = match.group(1)
                    default_value = match.group(2)

                    env_value = os.environ.get(var_name, default_value)

                    # Type conversion
                    if env_value and env_value.lower() in ['true', 'false']:
                        return env_value.lower() == 'true'
                    try:
                        return int(env_value)
                    except (ValueError, TypeError):
                        return env_value

            elif isinstance(value, dict):
                return {k: resolve_value(v) for k, v in value.items()}
            elif isinstance(value, list):
                return [resolve_value(item) for item in value]

            return value

        return resolve_value(config)

    def test_config_persistence(self):
        """Test saving configuration changes"""
        config = self.test_config.copy()

        # Modify config
        config["agents"]["max_agents"] = 20
        config["features"]["new_feature"] = True

        # Save to file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            config_path = f.name

        try:
            self.save_config(config, config_path)

            # Load and verify
            loaded_config = self.load_config(config_path)
            assert loaded_config["agents"]["max_agents"] == 20
            assert loaded_config["features"]["new_feature"] is True
        finally:
            os.unlink(config_path)

    def save_config(self, config, config_path):
        """Save configuration to file"""
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)

    def test_dynamic_config_updates(self):
        """Test runtime configuration updates"""
        config_manager = ConfigManager(self.test_config)

        # Update single value
        config_manager.update("agents.max_agents", 15)
        assert config_manager.get("agents.max_agents") == 15

        # Update nested value
        config_manager.update("network.proxy_port", 9090)
        assert config_manager.get("network.proxy_port") == 9090

        # Add new value
        config_manager.update("features.new_feature", True)
        assert config_manager.get("features.new_feature") is True

    def test_config_watchers(self):
        """Test configuration change watchers"""
        config_manager = ConfigManager(self.test_config)
        callback_called = False
        changed_path = None
        new_value = None

        def on_config_change(path, value):
            nonlocal callback_called, changed_path, new_value
            callback_called = True
            changed_path = path
            new_value = value

        # Register watcher
        config_manager.watch("agents.max_agents", on_config_change)

        # Update config
        config_manager.update("agents.max_agents", 25)

        assert callback_called
        assert changed_path == "agents.max_agents"
        assert new_value == 25

    def test_config_schema_validation(self):
        """Test configuration schema validation"""
        schema = {
            "type": "object",
            "properties": {
                "version": {"type": "string", "pattern": r"^\d+\.\d+\.\d+$"},
                "environment": {"type": "string", "enum": ["development", "testing", "production"]},
                "agents": {
                    "type": "object",
                    "properties": {
                        "max_agents": {"type": "integer", "minimum": 1, "maximum": 100},
                        "heartbeat_interval": {"type": "integer", "minimum": 10}
                    },
                    "required": ["max_agents"]
                }
            },
            "required": ["version", "environment"]
        }

        # Valid config
        assert self.validate_against_schema(self.test_config, schema)

        # Invalid version format
        invalid_config = self.test_config.copy()
        invalid_config["version"] = "1.0"
        assert not self.validate_against_schema(invalid_config, schema)

        # Invalid environment value
        invalid_config = self.test_config.copy()
        invalid_config["environment"] = "staging"
        assert not self.validate_against_schema(invalid_config, schema)

    def validate_against_schema(self, config, schema):
        """Validate configuration against schema"""
        # Simplified schema validation (in production, use jsonschema library)
        if schema.get("type") == "object":
            if not isinstance(config, dict):
                return False

            # Check required fields
            for required in schema.get("required", []):
                if required not in config:
                    return False

            # Validate properties
            for prop, prop_schema in schema.get("properties", {}).items():
                if prop in config:
                    if not self.validate_property(config[prop], prop_schema):
                        return False

        return True

    def validate_property(self, value, schema):
        """Validate a single property against schema"""
        # Type check
        if "type" in schema:
            if schema["type"] == "string" and not isinstance(value, str):
                return False
            elif schema["type"] == "integer" and not isinstance(value, int):
                return False
            elif schema["type"] == "object" and not isinstance(value, dict):
                return False

        # Enum check
        if "enum" in schema and value not in schema["enum"]:
            return False

        # Range check for integers
        if schema.get("type") == "integer":
            if "minimum" in schema and value < schema["minimum"]:
                return False
            if "maximum" in schema and value > schema["maximum"]:
                return False

        # Pattern check for strings
        if schema.get("type") == "string" and "pattern" in schema:
            import re
            if not re.match(schema["pattern"], value):
                return False

        return True

    def test_secret_management(self):
        """Test secure secret handling"""
        config = {
            "api_key": "secret123",
            "database": {
                "password": "dbpass456",
                "host": "localhost"
            },
            "tokens": ["token1", "token2"]
        }

        # Mark sensitive fields
        sensitive_fields = ["api_key", "database.password", "tokens"]

        # Sanitize for logging
        sanitized = self.sanitize_config(config, sensitive_fields)

        assert sanitized["api_key"] == "***"
        assert sanitized["database"]["password"] == "***"
        assert sanitized["database"]["host"] == "localhost"
        assert sanitized["tokens"] == "***"

    def sanitize_config(self, config, sensitive_fields):
        """Sanitize sensitive fields in configuration"""
        result = config.copy()

        for field_path in sensitive_fields:
            parts = field_path.split(".")
            target = result

            for i, part in enumerate(parts[:-1]):
                if part in target:
                    target = target[part]
                else:
                    break
            else:
                if parts[-1] in target:
                    target[parts[-1]] = "***"

        return result


class ConfigManager:
    """Simple configuration manager for testing"""

    def __init__(self, config):
        self.config = config
        self.watchers = {}

    def get(self, path):
        """Get configuration value by path"""
        parts = path.split(".")
        value = self.config

        for part in parts:
            if isinstance(value, dict) and part in value:
                value = value[part]
            else:
                return None

        return value

    def update(self, path, value):
        """Update configuration value"""
        parts = path.split(".")
        target = self.config

        for part in parts[:-1]:
            if part not in target:
                target[part] = {}
            target = target[part]

        target[parts[-1]] = value

        # Notify watchers
        if path in self.watchers:
            for callback in self.watchers[path]:
                callback(path, value)

    def watch(self, path, callback):
        """Register watcher for configuration changes"""
        if path not in self.watchers:
            self.watchers[path] = []
        self.watchers[path].append(callback)


class TestConfigDefaults:
    """Test default configuration handling"""

    def test_default_values(self):
        """Test applying default values"""
        defaults = {
            "version": "0.0.0",
            "environment": "development",
            "network": {
                "timeout": 30,
                "retry_count": 3
            },
            "logging": {
                "level": "INFO",
                "format": "json"
            }
        }

        user_config = {
            "version": "1.0.0",
            "network": {
                "timeout": 60
            }
        }

        final_config = self.apply_defaults(user_config, defaults)

        # User values preserved
        assert final_config["version"] == "1.0.0"
        assert final_config["network"]["timeout"] == 60

        # Defaults applied
        assert final_config["environment"] == "development"
        assert final_config["network"]["retry_count"] == 3
        assert final_config["logging"]["level"] == "INFO"

    def apply_defaults(self, config, defaults):
        """Apply default values to configuration"""
        def merge(target, source):
            for key, value in source.items():
                if key not in target:
                    target[key] = value
                elif isinstance(value, dict) and isinstance(target[key], dict):
                    merge(target[key], value)

        result = config.copy()
        merge(result, defaults)
        return result


if __name__ == "__main__":
    pytest.main([__file__, "-v"])