#!/usr/bin/env python3
"""
Interactive Agent Setup Wizard for Claude Network
Guides users through setting up a new agent on the network
"""
import os
import sys
import json
import uuid
import platform
import socket
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional, List
import logging
import requests
import yaml

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent))

from config_manager import Config, ConfigManager, FirebaseConfig, AgentConfig
from agent_registry import AgentRegistry, AgentInfo, AgentStatus
from firebase_schema import FirebaseSchema

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SetupWizard:
    """Interactive setup wizard for Claude Network agents"""

    def __init__(self):
        """Initialize the setup wizard"""
        self.config_manager = ConfigManager()
        self.config = Config()
        self.config_dir = Path.home() / ".claude-network"
        self.config_file = self.config_dir / "config.yaml"

        # Color codes for terminal output
        self.COLORS = {
            'HEADER': '\033[95m',
            'BLUE': '\033[94m',
            'GREEN': '\033[92m',
            'YELLOW': '\033[93m',
            'RED': '\033[91m',
            'END': '\033[0m',
            'BOLD': '\033[1m',
        }

    def print_header(self, text: str) -> None:
        """Print a formatted header"""
        print(f"\n{self.COLORS['HEADER']}{self.COLORS['BOLD']}"
              f"{'='*60}{self.COLORS['END']}")
        print(f"{self.COLORS['HEADER']}{self.COLORS['BOLD']}"
              f"{text.center(60)}{self.COLORS['END']}")
        print(f"{self.COLORS['HEADER']}{self.COLORS['BOLD']}"
              f"{'='*60}{self.COLORS['END']}\n")

    def print_success(self, text: str) -> None:
        """Print success message"""
        print(f"{self.COLORS['GREEN']}✓ {text}{self.COLORS['END']}")

    def print_error(self, text: str) -> None:
        """Print error message"""
        print(f"{self.COLORS['RED']}✗ {text}{self.COLORS['END']}")

    def print_warning(self, text: str) -> None:
        """Print warning message"""
        print(f"{self.COLORS['YELLOW']}⚠ {text}{self.COLORS['END']}")

    def print_info(self, text: str) -> None:
        """Print info message"""
        print(f"{self.COLORS['BLUE']}ℹ {text}{self.COLORS['END']}")

    def prompt(self, question: str, default: Optional[str] = None) -> str:
        """Prompt user for input with optional default"""
        if default:
            prompt_text = f"{question} [{default}]: "
        else:
            prompt_text = f"{question}: "

        answer = input(prompt_text).strip()
        return answer if answer else (default or "")

    def prompt_yes_no(self, question: str, default: bool = True) -> bool:
        """Prompt for yes/no answer"""
        default_str = "Y/n" if default else "y/N"
        answer = self.prompt(f"{question} ({default_str})").lower()

        if not answer:
            return default
        return answer in ['y', 'yes', 'true', '1']

    def prompt_choice(self, question: str, choices: List[str],
                     default: Optional[int] = None) -> str:
        """Prompt user to select from choices"""
        print(f"\n{question}")
        for i, choice in enumerate(choices, 1):
            if default and i == default:
                print(f"  {i}. {choice} (default)")
            else:
                print(f"  {i}. {choice}")

        while True:
            answer = self.prompt("Select option", str(default) if default else None)
            if not answer and default:
                return choices[default - 1]

            try:
                idx = int(answer)
                if 1 <= idx <= len(choices):
                    return choices[idx - 1]
            except ValueError:
                pass

            self.print_error(f"Please enter a number between 1 and {len(choices)}")

    def run(self) -> bool:
        """Run the setup wizard"""
        self.print_header("Claude Network Agent Setup Wizard")
        print("Welcome to the Claude Network setup wizard!")
        print("This will guide you through configuring your agent.\n")

        # Step 1: Check existing configuration
        if self.check_existing_config():
            if not self.prompt_yes_no("Configuration found. Do you want to reconfigure?", False):
                self.print_info("Using existing configuration")
                return self.test_connection()

        # Step 2: Firebase setup
        if not self.setup_firebase():
            return False

        # Step 3: Agent configuration
        if not self.setup_agent():
            return False

        # Step 4: Network settings
        self.setup_network()

        # Step 5: Security settings
        self.setup_security()

        # Step 6: Save configuration
        if not self.save_configuration():
            return False

        # Step 7: Initialize Firebase schema
        if not self.initialize_firebase():
            return False

        # Step 8: Register agent
        if not self.register_agent():
            return False

        # Step 9: Test connection
        if not self.test_connection():
            return False

        # Step 10: Start services
        self.start_services()

        self.print_header("Setup Complete!")
        self.print_success("Your agent is now configured and connected to the network")
        return True

    def check_existing_config(self) -> bool:
        """Check if configuration already exists"""
        if self.config_file.exists():
            try:
                self.config = self.config_manager.load()
                self.print_success(f"Found existing configuration at {self.config_file}")
                return True
            except Exception as e:
                self.print_warning(f"Failed to load existing config: {e}")
        return False

    def setup_firebase(self) -> bool:
        """Configure Firebase connection"""
        self.print_header("Firebase Configuration")

        # Check for environment variable first
        env_url = os.environ.get("CLAUDE_FIREBASE_URL")
        if env_url:
            self.print_info(f"Using Firebase URL from environment: {env_url}")
            self.config.firebase.url = env_url
        else:
            # Prompt for Firebase URL
            default_url = "https://home-claude-network-default-rtdb.firebaseio.com"
            url = self.prompt("Enter Firebase Realtime Database URL", default_url)

            if not url.startswith("https://"):
                self.print_error("Firebase URL must use HTTPS")
                return False

            self.config.firebase.url = url

        # Test Firebase connection
        self.print_info("Testing Firebase connection...")
        try:
            response = requests.get(f"{self.config.firebase.url}/.json")
            if response.status_code in [200, 204]:
                self.print_success("Firebase connection successful")
                return True
            else:
                self.print_error(f"Firebase returned status {response.status_code}")
                return False
        except Exception as e:
            self.print_error(f"Failed to connect to Firebase: {e}")
            return False

    def setup_agent(self) -> bool:
        """Configure agent settings"""
        self.print_header("Agent Configuration")

        # Generate or get agent ID
        default_id = f"{platform.node()}-{uuid.uuid4().hex[:8]}"
        self.config.agent.agent_id = self.prompt("Enter agent ID", default_id)

        # Agent name
        default_name = f"{platform.node()} Agent"
        self.config.agent.agent_name = self.prompt("Enter agent name", default_name)

        # Surface type
        surfaces = ["desktop", "cli", "web", "mobile"]
        self.config.agent.surface = self.prompt_choice(
            "Select surface type",
            surfaces,
            default=1 if "desktop" in platform.node().lower() else 2
        )

        # Specialization
        specializations = [
            "general - All-purpose agent",
            "coordination - Task coordination and management",
            "analysis - Data analysis and reporting",
            "execution - Task execution and automation",
            "research - Research and knowledge gathering",
            "monitoring - System monitoring and alerts"
        ]

        spec_choice = self.prompt_choice("Select agent specialization", specializations, default=1)
        self.config.agent.specialization = spec_choice.split(" - ")[0]

        # Capabilities
        print("\nSelect agent capabilities (comma-separated):")
        print("  Available: coordinate, analyze, execute, monitor, research, communicate")
        capabilities_str = self.prompt("Enter capabilities", "coordinate,analyze,execute")
        self.config.agent.capabilities = [cap.strip() for cap in capabilities_str.split(",")]

        # Location
        self.config.agent.location = self.prompt("Enter agent location/computer", platform.node())

        # Heartbeat interval
        heartbeat = self.prompt("Heartbeat interval in seconds", "15")
        try:
            self.config.agent.heartbeat_interval = max(5, int(heartbeat))
        except ValueError:
            self.config.agent.heartbeat_interval = 15

        self.print_success("Agent configuration complete")
        return True

    def setup_network(self) -> None:
        """Configure network settings"""
        self.print_header("Network Settings")

        if self.prompt_yes_no("Use default network settings?", True):
            self.print_info("Using default network settings")
            return

        # Message retry count
        retry = self.prompt("Message retry count", "3")
        try:
            self.config.network.message_retry_count = int(retry)
        except ValueError:
            pass

        # Message timeout
        timeout = self.prompt("Message timeout (seconds)", "30")
        try:
            self.config.network.message_timeout = int(timeout)
        except ValueError:
            pass

        # Offline queue
        self.config.network.enable_offline_queue = self.prompt_yes_no(
            "Enable offline message queuing?", True
        )

        self.print_success("Network configuration complete")

    def setup_security(self) -> None:
        """Configure security settings"""
        self.print_header("Security Settings")

        if self.prompt_yes_no("Use default security settings?", True):
            self.print_info("Using default security settings (no encryption/signing)")
            return

        # Message signing
        self.config.security.enable_message_signing = self.prompt_yes_no(
            "Enable message signing?", False
        )

        # Encryption
        self.config.security.enable_encryption = self.prompt_yes_no(
            "Enable message encryption?", False
        )

        # Agent filtering
        if self.prompt_yes_no("Configure agent filtering?", False):
            mode = self.prompt_choice(
                "Select filtering mode",
                ["Allow specific agents only", "Block specific agents"],
                default=2
            )

            if "Allow" in mode:
                agents = self.prompt("Enter allowed agent IDs (comma-separated)")
                self.config.security.allowed_agents = [a.strip() for a in agents.split(",") if a.strip()]
            else:
                agents = self.prompt("Enter blocked agent IDs (comma-separated)")
                self.config.security.blocked_agents = [a.strip() for a in agents.split(",") if a.strip()]

        self.print_success("Security configuration complete")

    def save_configuration(self) -> bool:
        """Save configuration to file"""
        self.print_header("Saving Configuration")

        try:
            # Create config directory
            self.config_dir.mkdir(parents=True, exist_ok=True)

            # Validate configuration
            errors = self.config.validate()
            if errors:
                self.print_error(f"Configuration validation failed: {errors}")
                return False

            # Convert to dictionary
            config_dict = self.config.to_dict()

            # Save to YAML file
            with open(self.config_file, 'w') as f:
                yaml.dump(config_dict, f, default_flow_style=False)

            # Set file permissions (owner only)
            self.config_file.chmod(0o600)

            self.print_success(f"Configuration saved to {self.config_file}")

            # Also save example config
            example_file = Path.cwd() / "config.example.yaml"
            self.config_manager.save_example(example_file)
            self.print_info(f"Example configuration saved to {example_file}")

            return True

        except Exception as e:
            self.print_error(f"Failed to save configuration: {e}")
            return False

    def initialize_firebase(self) -> bool:
        """Initialize Firebase schema"""
        self.print_header("Initializing Firebase Schema")

        schema = FirebaseSchema(self.config)

        # Check if already initialized
        validation = schema.validate_schema()
        if validation["valid"]:
            self.print_info("Firebase schema already initialized")
            return True

        if not self.prompt_yes_no("Initialize Firebase schema?", True):
            self.print_warning("Skipping Firebase initialization")
            return True

        try:
            if schema.initialize_schema():
                self.print_success("Firebase schema initialized")

                # Export documentation
                docs_file = Path.cwd() / "firebase_schema_docs.json"
                schema.export_schema_docs(docs_file)
                self.print_info(f"Schema documentation saved to {docs_file}")

                return True
            else:
                self.print_error("Failed to initialize Firebase schema")
                return False

        except Exception as e:
            self.print_error(f"Firebase initialization failed: {e}")
            return False

    def register_agent(self) -> bool:
        """Register agent with the network"""
        self.print_header("Registering Agent")

        try:
            registry = AgentRegistry(self.config)

            # Create agent info
            agent_info = AgentInfo(
                agent_id=self.config.agent.agent_id,
                agent_name=self.config.agent.agent_name,
                capabilities=self.config.agent.capabilities,
                specialization=self.config.agent.specialization,
                surface=self.config.agent.surface,
                location=self.config.agent.location,
                status=AgentStatus.ONLINE
            )

            # Register
            if registry.register(agent_info):
                self.print_success(f"Agent '{self.config.agent.agent_name}' registered successfully")
                self.print_info(f"Agent ID: {self.config.agent.agent_id}")
                return True
            else:
                self.print_error("Failed to register agent")
                return False

        except Exception as e:
            self.print_error(f"Registration failed: {e}")
            return False

    def test_connection(self) -> bool:
        """Test network connectivity"""
        self.print_header("Testing Connection")

        try:
            # Load config if not already loaded
            if not self.config.firebase.url:
                self.config = self.config_manager.load()

            # Test Firebase
            self.print_info("Testing Firebase connection...")
            response = requests.get(f"{self.config.firebase.url}/agents.json")
            if response.status_code == 200:
                self.print_success("Firebase connection successful")
            else:
                self.print_error(f"Firebase returned status {response.status_code}")
                return False

            # Test agent registry
            self.print_info("Testing agent registry...")
            registry = AgentRegistry(self.config)
            agents = registry.get_all_agents()
            self.print_success(f"Found {len(agents)} agents in network")

            # List agents
            if agents:
                print("\nRegistered agents:")
                for agent_id, agent in agents.items():
                    status = agent.status.value if hasattr(agent.status, 'value') else str(agent.status)
                    print(f"  - {agent.agent_name} ({agent_id}): {status}")

            # Send test heartbeat
            self.print_info("Sending test heartbeat...")
            if registry.send_heartbeat():
                self.print_success("Heartbeat sent successfully")
            else:
                self.print_warning("Failed to send heartbeat")

            return True

        except Exception as e:
            self.print_error(f"Connection test failed: {e}")
            return False

    def start_services(self) -> None:
        """Offer to start agent services"""
        self.print_header("Start Services")

        print("Your agent is configured but not running continuously.")
        print("\nTo start agent services, you can:")
        print("  1. Run the heartbeat service: python agent_registry.py")
        print("  2. Start the message monitor: python monitor.py")
        print("  3. Use the network API: python network.py")
        print("\nYou can also import these modules in your own scripts.")

        if self.prompt_yes_no("\nWould you like to see example code?", True):
            self.show_example_code()

    def show_example_code(self) -> None:
        """Show example code for using the network"""
        example = '''
# Example: Using the Claude Network in your code

from config_manager import load_config
from agent_registry import AgentRegistry
from network import Network

# Load configuration
config = load_config()

# Create registry and register
registry = AgentRegistry(config)
registry.register()  # Register self

# Start heartbeat (runs in background)
registry.start_heartbeat()

# Send messages
network = Network()
network.send("Hello, network!", msg_type="greeting")

# Discover other agents
online_agents = registry.get_online_agents()
for agent in online_agents:
    print(f"Agent: {agent.agent_name} - {agent.status.value}")

# Find agents with specific capabilities
coordinators = registry.discover_agents(capability="coordinate")
for agent in coordinators:
    print(f"Coordinator: {agent.agent_name}")
'''
        print("\n" + "="*60)
        print("EXAMPLE CODE")
        print("="*60)
        print(example)
        print("="*60)

        # Save example to file
        example_file = Path.cwd() / "example_usage.py"
        with open(example_file, 'w') as f:
            f.write(example.strip())
        self.print_info(f"Example saved to {example_file}")


def main():
    """Main entry point for setup wizard"""
    wizard = SetupWizard()

    try:
        if wizard.run():
            print("\n" + "="*60)
            print("Setup completed successfully!")
            print("Your agent is ready to join the Claude Network.")
            print("="*60 + "\n")
            return 0
        else:
            print("\n" + "="*60)
            print("Setup incomplete. Please review any errors and try again.")
            print("="*60 + "\n")
            return 1

    except KeyboardInterrupt:
        print("\n\nSetup cancelled by user.")
        return 1
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        logger.exception("Setup failed with exception")
        return 1


if __name__ == "__main__":
    sys.exit(main())