#!/usr/bin/env python3
"""
Configuration Management System for Claude Network
Handles loading configuration from multiple sources with priority:
1. Environment variables (highest)
2. Local user config (~/.claude-network/config.yaml)
3. Project config (./config.yaml)
4. Example config (./config.example.yaml)
5. Default values (lowest)
"""
import os
import yaml
import json
from pathlib import Path
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field, asdict
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class FirebaseConfig:
    """Firebase configuration settings"""
    url: str = ""
    api_key: Optional[str] = None
    auth_domain: Optional[str] = None
    project_id: Optional[str] = None
    storage_bucket: Optional[str] = None

    def validate(self) -> List[str]:
        """Validate Firebase configuration"""
        errors = []
        if not self.url:
            errors.append("Firebase URL is required")
        if self.url and not self.url.startswith("https://"):
            errors.append("Firebase URL must use HTTPS")
        return errors


@dataclass
class AgentConfig:
    """Agent-specific configuration"""
    agent_id: str = ""
    agent_name: str = ""
    capabilities: List[str] = field(default_factory=list)
    specialization: str = "general"
    surface: str = "cli"  # cli, web, mobile, desktop
    location: str = ""
    heartbeat_interval: int = 15  # seconds

    def validate(self) -> List[str]:
        """Validate agent configuration"""
        errors = []
        if not self.agent_id:
            errors.append("Agent ID is required")
        if not self.agent_name:
            errors.append("Agent name is required")
        if self.surface not in ["cli", "web", "mobile", "desktop"]:
            errors.append(f"Invalid surface type: {self.surface}")
        if self.heartbeat_interval < 5:
            errors.append("Heartbeat interval must be at least 5 seconds")
        return errors


@dataclass
class NetworkConfig:
    """Network communication settings"""
    message_retry_count: int = 3
    message_timeout: int = 30  # seconds
    max_message_size: int = 1048576  # 1MB
    enable_offline_queue: bool = True
    offline_queue_size: int = 1000

    def validate(self) -> List[str]:
        """Validate network configuration"""
        errors = []
        if self.message_retry_count < 0:
            errors.append("Message retry count must be non-negative")
        if self.message_timeout < 1:
            errors.append("Message timeout must be at least 1 second")
        if self.max_message_size < 1024:
            errors.append("Max message size must be at least 1KB")
        return errors


@dataclass
class SecurityConfig:
    """Security settings"""
    enable_message_signing: bool = False
    enable_encryption: bool = False
    allowed_agents: List[str] = field(default_factory=list)
    blocked_agents: List[str] = field(default_factory=list)

    def validate(self) -> List[str]:
        """Validate security configuration"""
        errors = []
        # Check for conflicts
        if self.allowed_agents and self.blocked_agents:
            overlap = set(self.allowed_agents) & set(self.blocked_agents)
            if overlap:
                errors.append(f"Agents in both allowed and blocked lists: {overlap}")
        return errors


@dataclass
class Config:
    """Main configuration container"""
    firebase: FirebaseConfig = field(default_factory=FirebaseConfig)
    agent: AgentConfig = field(default_factory=AgentConfig)
    network: NetworkConfig = field(default_factory=NetworkConfig)
    security: SecurityConfig = field(default_factory=SecurityConfig)
    github_repo: str = "https://github.com/alto84/Sartor-claude-network"
    github_token: Optional[str] = None
    log_level: str = "INFO"
    debug_mode: bool = False

    def validate(self) -> Dict[str, List[str]]:
        """Validate entire configuration"""
        all_errors = {}

        # Validate each section
        firebase_errors = self.firebase.validate()
        if firebase_errors:
            all_errors["firebase"] = firebase_errors

        agent_errors = self.agent.validate()
        if agent_errors:
            all_errors["agent"] = agent_errors

        network_errors = self.network.validate()
        if network_errors:
            all_errors["network"] = network_errors

        security_errors = self.security.validate()
        if security_errors:
            all_errors["security"] = security_errors

        # Validate top-level settings
        top_errors = []
        if self.log_level not in ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]:
            top_errors.append(f"Invalid log level: {self.log_level}")
        if top_errors:
            all_errors["general"] = top_errors

        return all_errors

    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary"""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Config':
        """Create configuration from dictionary"""
        config = cls()

        # Firebase section
        if "firebase" in data:
            config.firebase = FirebaseConfig(**data["firebase"])

        # Agent section
        if "agent" in data:
            config.agent = AgentConfig(**data["agent"])

        # Network section
        if "network" in data:
            config.network = NetworkConfig(**data["network"])

        # Security section
        if "security" in data:
            config.security = SecurityConfig(**data["security"])

        # Top-level settings
        for key in ["github_repo", "github_token", "log_level", "debug_mode"]:
            if key in data:
                setattr(config, key, data[key])

        return config


class ConfigManager:
    """Manages configuration loading and merging from multiple sources"""

    def __init__(self, config_dir: Optional[Path] = None):
        """
        Initialize configuration manager

        Args:
            config_dir: Directory to look for config files (defaults to current directory)
        """
        self.config_dir = config_dir or Path.cwd()
        self.user_config_dir = Path.home() / ".claude-network"
        self.config = Config()
        self._loaded_sources = []

    def load(self) -> Config:
        """
        Load configuration from all sources in priority order

        Returns:
            Merged configuration object
        """
        # Start with defaults
        self.config = Config()

        # Load from files (lowest to highest priority)
        self._load_file(self.config_dir / "config.example.yaml", "example")
        self._load_file(self.config_dir / "config.yaml", "project")
        self._load_file(self.user_config_dir / "config.yaml", "user")

        # Override with environment variables (highest priority)
        self._load_environment()

        # Set up logging based on config
        log_level = getattr(logging, self.config.log_level.upper(), logging.INFO)
        logging.getLogger().setLevel(log_level)

        # Log loaded sources
        if self._loaded_sources:
            logger.info(f"Configuration loaded from: {', '.join(self._loaded_sources)}")
        else:
            logger.warning("No configuration sources found, using defaults")

        # Validate configuration
        errors = self.config.validate()
        if errors:
            logger.error(f"Configuration validation errors: {errors}")
            raise ValueError(f"Invalid configuration: {errors}")

        return self.config

    def _load_file(self, path: Path, source_name: str) -> None:
        """Load configuration from a YAML file"""
        if not path.exists():
            logger.debug(f"Config file not found: {path}")
            return

        try:
            with open(path, 'r') as f:
                data = yaml.safe_load(f) or {}

            # Merge with existing config
            self._merge_config(data)
            self._loaded_sources.append(f"{source_name} ({path})")
            logger.debug(f"Loaded config from {path}")

        except yaml.YAMLError as e:
            logger.warning(f"Failed to parse YAML from {path}: {e}")
        except Exception as e:
            logger.warning(f"Failed to load config from {path}: {e}")

    def _load_environment(self) -> None:
        """Load configuration from environment variables"""
        env_mappings = {
            # Firebase settings
            "CLAUDE_FIREBASE_URL": ("firebase", "url"),
            "CLAUDE_FIREBASE_API_KEY": ("firebase", "api_key"),
            "CLAUDE_FIREBASE_AUTH_DOMAIN": ("firebase", "auth_domain"),
            "CLAUDE_FIREBASE_PROJECT_ID": ("firebase", "project_id"),

            # Agent settings
            "CLAUDE_AGENT_ID": ("agent", "agent_id"),
            "CLAUDE_AGENT_NAME": ("agent", "agent_name"),
            "CLAUDE_AGENT_SURFACE": ("agent", "surface"),
            "CLAUDE_AGENT_SPECIALIZATION": ("agent", "specialization"),
            "CLAUDE_AGENT_LOCATION": ("agent", "location"),
            "CLAUDE_AGENT_HEARTBEAT": ("agent", "heartbeat_interval"),

            # Network settings
            "CLAUDE_MESSAGE_RETRY": ("network", "message_retry_count"),
            "CLAUDE_MESSAGE_TIMEOUT": ("network", "message_timeout"),
            "CLAUDE_OFFLINE_QUEUE": ("network", "enable_offline_queue"),

            # Security settings
            "CLAUDE_ENABLE_SIGNING": ("security", "enable_message_signing"),
            "CLAUDE_ENABLE_ENCRYPTION": ("security", "enable_encryption"),

            # General settings
            "CLAUDE_GITHUB_REPO": (None, "github_repo"),
            "CLAUDE_GITHUB_TOKEN": (None, "github_token"),
            "CLAUDE_LOG_LEVEL": (None, "log_level"),
            "CLAUDE_DEBUG": (None, "debug_mode"),
        }

        found_env = False
        for env_var, (section, key) in env_mappings.items():
            if env_var in os.environ:
                value = os.environ[env_var]

                # Convert string to appropriate type
                if env_var in ["CLAUDE_AGENT_HEARTBEAT", "CLAUDE_MESSAGE_RETRY", "CLAUDE_MESSAGE_TIMEOUT"]:
                    value = int(value)
                elif env_var in ["CLAUDE_OFFLINE_QUEUE", "CLAUDE_ENABLE_SIGNING",
                                "CLAUDE_ENABLE_ENCRYPTION", "CLAUDE_DEBUG"]:
                    value = value.lower() in ["true", "1", "yes"]
                elif env_var == "CLAUDE_AGENT_CAPABILITIES":
                    value = [cap.strip() for cap in value.split(",")]

                # Apply to config
                if section:
                    setattr(getattr(self.config, section), key, value)
                else:
                    setattr(self.config, key, value)

                found_env = True
                logger.debug(f"Loaded {env_var} from environment")

        if found_env:
            self._loaded_sources.append("environment")

    def _merge_config(self, data: Dict[str, Any]) -> None:
        """Merge configuration data into existing config"""
        temp_config = Config.from_dict(data)

        # Merge each section
        for section in ["firebase", "agent", "network", "security"]:
            if section in data:
                current_section = getattr(self.config, section)
                new_section = getattr(temp_config, section)

                # Update non-None values
                for field_name in vars(new_section):
                    new_value = getattr(new_section, field_name)
                    if new_value is not None and new_value != "" and new_value != []:
                        setattr(current_section, field_name, new_value)

        # Merge top-level settings
        for key in ["github_repo", "github_token", "log_level", "debug_mode"]:
            if key in data and data[key] is not None:
                setattr(self.config, key, data[key])

    def save_example(self, path: Optional[Path] = None) -> None:
        """
        Save an example configuration file

        Args:
            path: Path to save the example config (defaults to config.example.yaml)
        """
        path = path or self.config_dir / "config.example.yaml"

        example_config = {
            "# Claude Network Configuration": "Example configuration file",
            "# Copy to config.yaml or ~/.claude-network/config.yaml and customize": None,

            "firebase": {
                "url": "https://your-project-default-rtdb.firebaseio.com",
                "api_key": "your-api-key-here (optional)",
                "project_id": "your-project-id (optional)"
            },

            "agent": {
                "agent_id": "agent-001",
                "agent_name": "Desktop Mission Control",
                "capabilities": ["coordinate", "analyze", "execute"],
                "specialization": "coordination",
                "surface": "desktop",
                "location": "main-computer",
                "heartbeat_interval": 15
            },

            "network": {
                "message_retry_count": 3,
                "message_timeout": 30,
                "max_message_size": 1048576,
                "enable_offline_queue": True,
                "offline_queue_size": 1000
            },

            "security": {
                "enable_message_signing": False,
                "enable_encryption": False,
                "allowed_agents": [],
                "blocked_agents": []
            },

            "github_repo": "https://github.com/username/repo",
            "github_token": "ghp_your_token_here (optional)",
            "log_level": "INFO",
            "debug_mode": False
        }

        with open(path, 'w') as f:
            yaml.dump(example_config, f, default_flow_style=False, sort_keys=False)

        logger.info(f"Example configuration saved to {path}")

    def get_credentials_path(self) -> Path:
        """Get the path to store sensitive credentials"""
        creds_dir = self.user_config_dir / "credentials"
        creds_dir.mkdir(parents=True, exist_ok=True)
        return creds_dir

    def load_credentials(self, name: str) -> Optional[Dict[str, Any]]:
        """
        Load credentials from secure storage

        Args:
            name: Name of the credential set (e.g., 'firebase', 'github')

        Returns:
            Credentials dictionary or None if not found
        """
        creds_file = self.get_credentials_path() / f"{name}.json"

        if not creds_file.exists():
            return None

        try:
            with open(creds_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Failed to load credentials for {name}: {e}")
            return None

    def save_credentials(self, name: str, credentials: Dict[str, Any]) -> None:
        """
        Save credentials to secure storage

        Args:
            name: Name of the credential set
            credentials: Credentials to save
        """
        creds_file = self.get_credentials_path() / f"{name}.json"

        # Set restrictive permissions (owner read/write only)
        with open(creds_file, 'w') as f:
            json.dump(credentials, f, indent=2)

        creds_file.chmod(0o600)
        logger.info(f"Credentials saved for {name}")


# Convenience function for quick config loading
def load_config(config_dir: Optional[Path] = None) -> Config:
    """
    Load configuration from all sources

    Args:
        config_dir: Directory to look for config files

    Returns:
        Loaded and validated configuration
    """
    manager = ConfigManager(config_dir)
    return manager.load()


if __name__ == "__main__":
    # Example usage and testing
    manager = ConfigManager()

    # Save example config
    manager.save_example()

    # Load configuration
    try:
        config = manager.load()
        print("Configuration loaded successfully!")
        print(f"Agent ID: {config.agent.agent_id}")
        print(f"Firebase URL: {config.firebase.url}")
        print(f"Log Level: {config.log_level}")
    except ValueError as e:
        print(f"Configuration error: {e}")