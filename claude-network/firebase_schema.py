#!/usr/bin/env python3
"""
Firebase Schema Setup for Claude Network
Initializes the proper Firebase structure and provides schema documentation
"""
import json
import requests
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path

from config_manager import load_config, Config

# Set up logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class FirebaseSchema:
    """
    Manages Firebase database schema and initialization
    """

    # Schema version for tracking migrations
    SCHEMA_VERSION = "1.0.0"

    # Database structure definition
    SCHEMA = {
        "agents": {
            "_description": "Registry of all agents in the network",
            "_example": {
                "agent-001": {
                    "agent_id": "agent-001",
                    "agent_name": "Desktop Mission Control",
                    "status": "online",
                    "health": "healthy",
                    "capabilities": ["coordinate", "analyze", "execute"],
                    "specialization": "coordination",
                    "surface": "desktop",
                    "location": "main-computer",
                    "last_heartbeat": "2025-01-01T12:00:00",
                    "registered_at": "2025-01-01T10:00:00",
                    "last_seen": "2025-01-01T12:00:00",
                    "metadata": {},
                    "task_count": 0,
                    "error_count": 0,
                    "success_rate": 0.0
                }
            }
        },

        "messages": {
            "_description": "Real-time message queue",
            "_example": {
                "-NxYz123abc": {
                    "id": "msg-001",
                    "from": "agent-001",
                    "to": "agent-002",
                    "type": "task",
                    "priority": "normal",
                    "content": {"task": "analyze", "data": {}},
                    "timestamp": "2025-01-01T12:00:00",
                    "status": "delivered",
                    "retries": 0
                }
            }
        },

        "tasks": {
            "_description": "Task queue and assignments",
            "available": {
                "_description": "Tasks waiting to be claimed",
                "_example": {
                    "task-001": {
                        "task_id": "task-001",
                        "type": "analysis",
                        "priority": "high",
                        "requirements": ["analyze", "report"],
                        "created_at": "2025-01-01T12:00:00",
                        "deadline": "2025-01-01T13:00:00",
                        "data": {}
                    }
                }
            },
            "assigned": {
                "_description": "Tasks currently being worked on",
                "_example": {
                    "task-002": {
                        "task_id": "task-002",
                        "agent_id": "agent-001",
                        "assigned_at": "2025-01-01T12:00:00",
                        "status": "in_progress",
                        "progress": 50
                    }
                }
            },
            "completed": {
                "_description": "Completed tasks (archived after 7 days)",
                "_example": {
                    "task-003": {
                        "task_id": "task-003",
                        "agent_id": "agent-001",
                        "completed_at": "2025-01-01T12:00:00",
                        "result": {"status": "success"},
                        "duration_seconds": 120
                    }
                }
            }
        },

        "skills": {
            "_description": "Skill library metadata (full definitions in GitHub)",
            "_example": {
                "core.observation.visual": {
                    "skill_id": "core.observation.visual",
                    "name": "Visual Observation",
                    "category": "core",
                    "version": "1.0.0",
                    "description": "Analyze images and visual data",
                    "requirements": ["vision"],
                    "github_path": "/skills/core/observation/visual.yaml"
                }
            }
        },

        "consensus": {
            "_description": "Voting and governance decisions",
            "active": {
                "_description": "Active votes requiring consensus",
                "_example": {
                    "vote-001": {
                        "vote_id": "vote-001",
                        "type": "code_change",
                        "proposer": "agent-001",
                        "proposal": {"change": "update algorithm"},
                        "votes": {"agent-001": "yes", "agent-002": "no"},
                        "deadline": "2025-01-01T12:00:00",
                        "quorum": 0.66
                    }
                }
            },
            "completed": {
                "_description": "Completed votes (archived)",
                "_example": {}
            }
        },

        "clades": {
            "_description": "Evolution tracking for self-improvement",
            "_example": {
                "clade-001": {
                    "clade_id": "clade-001",
                    "parent_id": "root",
                    "agent_id": "agent-001",
                    "created_at": "2025-01-01T12:00:00",
                    "branch_name": "feature/improved-routing",
                    "changes": ["Updated message routing algorithm"],
                    "performance": {
                        "benchmark_score": 85,
                        "success_rate": 0.92
                    },
                    "status": "testing"
                }
            }
        },

        "experiences": {
            "_description": "Shared learning and experiences",
            "_example": {
                "exp-001": {
                    "experience_id": "exp-001",
                    "agent_id": "agent-001",
                    "type": "success",
                    "category": "task_execution",
                    "description": "Successfully coordinated multi-agent task",
                    "lesson": "Use consensus for complex decisions",
                    "timestamp": "2025-01-01T12:00:00",
                    "tags": ["coordination", "consensus"]
                }
            }
        },

        "metrics": {
            "_description": "Performance and system metrics",
            "system": {
                "_description": "System-wide metrics",
                "_example": {
                    "message_latency_ms": 45,
                    "active_agents": 3,
                    "tasks_completed_today": 12,
                    "uptime_hours": 168,
                    "last_updated": "2025-01-01T12:00:00"
                }
            },
            "agents": {
                "_description": "Per-agent metrics",
                "_example": {
                    "agent-001": {
                        "tasks_completed": 42,
                        "success_rate": 0.95,
                        "avg_response_time_ms": 120,
                        "specialization_score": 0.85
                    }
                }
            }
        },

        "config": {
            "_description": "Shared configuration and settings",
            "global": {
                "_description": "Network-wide settings",
                "_example": {
                    "schema_version": "1.0.0",
                    "min_consensus_quorum": 0.66,
                    "heartbeat_timeout_seconds": 60,
                    "message_retention_days": 7
                }
            },
            "features": {
                "_description": "Feature flags",
                "_example": {
                    "enable_self_improvement": False,
                    "enable_consensus_voting": True,
                    "enable_skill_sharing": True
                }
            }
        },

        "presence": {
            "_description": "Real-time presence tracking",
            "_example": {
                "agent-001": {
                    "online": True,
                    "last_activity": "2025-01-01T12:00:00",
                    "current_task": "task-002",
                    "connection_quality": "good"
                }
            }
        }
    }

    # Firebase database rules for security
    DATABASE_RULES = {
        "rules": {
            ".read": True,  # Allow all reads for now (restrict in production)
            ".write": True,  # Allow all writes for now (restrict in production)

            "agents": {
                "$agent_id": {
                    ".validate": "newData.hasChildren(['agent_id', 'agent_name'])"
                }
            },

            "messages": {
                ".indexOn": ["timestamp", "from", "to", "type"],
                "$message_id": {
                    ".validate": "newData.hasChildren(['from', 'type', 'timestamp'])"
                }
            },

            "tasks": {
                "available": {
                    ".indexOn": ["priority", "created_at"]
                },
                "assigned": {
                    ".indexOn": ["agent_id", "status"]
                },
                "completed": {
                    ".indexOn": ["completed_at", "agent_id"]
                }
            },

            "consensus": {
                "active": {
                    ".indexOn": ["deadline", "type"]
                }
            },

            "metrics": {
                ".write": "auth != null || true"  # Consider auth in production
            }
        }
    }

    def __init__(self, config: Optional[Config] = None):
        """
        Initialize Firebase schema manager

        Args:
            config: Configuration object
        """
        self.config = config or load_config()
        self.firebase_url = self.config.firebase.url

    def initialize_schema(self, force: bool = False) -> bool:
        """
        Initialize Firebase with proper schema structure

        Args:
            force: Force initialization even if data exists

        Returns:
            True if initialization successful
        """
        try:
            # Check if already initialized
            if not force:
                response = requests.get(f"{self.firebase_url}/config/global/schema_version.json")
                if response.status_code == 200 and response.json():
                    current_version = response.json()
                    if current_version == self.SCHEMA_VERSION:
                        logger.info(f"Schema already initialized (version {current_version})")
                        return True
                    else:
                        logger.info(f"Schema version mismatch: {current_version} != {self.SCHEMA_VERSION}")

            logger.info("Initializing Firebase schema...")

            # Initialize each top-level structure
            for key, structure in self.SCHEMA.items():
                if key.startswith("_"):
                    continue

                # Create empty structure if it doesn't exist
                self._initialize_structure(key, structure)

            # Set schema version
            self._set_schema_version()

            # Initialize global config
            self._initialize_global_config()

            logger.info("Firebase schema initialized successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize schema: {e}")
            return False

    def _initialize_structure(self, path: str, structure: Dict[str, Any]) -> None:
        """Initialize a specific structure in Firebase"""
        # Check if structure exists
        response = requests.get(f"{self.firebase_url}/{path}.json")

        if response.status_code == 404 or not response.json():
            # Create empty structure
            empty_structure = {}

            # Add nested structures
            for key, value in structure.items():
                if key.startswith("_"):
                    continue
                if isinstance(value, dict) and not key.startswith("_"):
                    empty_structure[key] = {}

            # Write to Firebase
            response = requests.put(
                f"{self.firebase_url}/{path}.json",
                json=empty_structure
            )
            response.raise_for_status()
            logger.debug(f"Initialized structure: /{path}")

    def _set_schema_version(self) -> None:
        """Set the schema version in Firebase"""
        response = requests.put(
            f"{self.firebase_url}/config/global/schema_version.json",
            json=self.SCHEMA_VERSION
        )
        response.raise_for_status()
        logger.debug(f"Set schema version to {self.SCHEMA_VERSION}")

    def _initialize_global_config(self) -> None:
        """Initialize global configuration settings"""
        global_config = {
            "schema_version": self.SCHEMA_VERSION,
            "min_consensus_quorum": 0.66,
            "heartbeat_timeout_seconds": 60,
            "message_retention_days": 7,
            "task_timeout_hours": 24,
            "max_message_size_bytes": 1048576,
            "initialized_at": datetime.now().isoformat()
        }

        response = requests.patch(
            f"{self.firebase_url}/config/global.json",
            json=global_config
        )
        response.raise_for_status()

        # Initialize feature flags
        feature_flags = {
            "enable_self_improvement": False,
            "enable_consensus_voting": True,
            "enable_skill_sharing": True,
            "enable_experience_learning": True,
            "enable_clade_evolution": False,
            "enable_auto_task_assignment": True
        }

        response = requests.patch(
            f"{self.firebase_url}/config/features.json",
            json=feature_flags
        )
        response.raise_for_status()

        logger.debug("Initialized global configuration")

    def validate_schema(self) -> Dict[str, Any]:
        """
        Validate current Firebase schema against expected structure

        Returns:
            Validation report with any issues found
        """
        report = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "schema_version": None
        }

        try:
            # Check schema version
            response = requests.get(f"{self.firebase_url}/config/global/schema_version.json")
            if response.status_code == 200:
                version = response.json()
                report["schema_version"] = version
                if version != self.SCHEMA_VERSION:
                    report["warnings"].append(f"Schema version mismatch: {version} != {self.SCHEMA_VERSION}")
            else:
                report["errors"].append("Schema version not found")
                report["valid"] = False

            # Check each top-level structure
            for key in self.SCHEMA.keys():
                if key.startswith("_"):
                    continue

                response = requests.get(f"{self.firebase_url}/{key}.json")
                if response.status_code == 404:
                    report["errors"].append(f"Missing structure: /{key}")
                    report["valid"] = False

            # Check critical paths
            critical_paths = [
                "/agents",
                "/messages",
                "/tasks/available",
                "/tasks/assigned",
                "/config/global"
            ]

            for path in critical_paths:
                response = requests.get(f"{self.firebase_url}{path}.json")
                if response.status_code == 404:
                    report["errors"].append(f"Missing critical path: {path}")
                    report["valid"] = False

        except Exception as e:
            report["errors"].append(f"Validation failed: {e}")
            report["valid"] = False

        return report

    def export_schema_docs(self, output_path: Optional[Path] = None) -> None:
        """
        Export schema documentation to a file

        Args:
            output_path: Path to save documentation (defaults to schema_docs.json)
        """
        output_path = output_path or Path("schema_docs.json")

        docs = {
            "schema_version": self.SCHEMA_VERSION,
            "generated_at": datetime.now().isoformat(),
            "firebase_url": self.firebase_url,
            "structure": self.SCHEMA,
            "database_rules": self.DATABASE_RULES
        }

        with open(output_path, 'w') as f:
            json.dump(docs, f, indent=2)

        logger.info(f"Schema documentation exported to {output_path}")

    def clear_database(self, confirm: bool = False) -> bool:
        """
        Clear entire database (DANGEROUS - use with caution)

        Args:
            confirm: Must be True to actually clear

        Returns:
            True if cleared successfully
        """
        if not confirm:
            logger.warning("Database clear requested but not confirmed")
            return False

        try:
            response = requests.delete(f"{self.firebase_url}.json")
            response.raise_for_status()
            logger.warning("DATABASE CLEARED - All data removed")
            return True

        except Exception as e:
            logger.error(f"Failed to clear database: {e}")
            return False

    def get_database_stats(self) -> Dict[str, Any]:
        """
        Get statistics about database usage

        Returns:
            Dictionary of statistics
        """
        stats = {
            "timestamp": datetime.now().isoformat(),
            "structures": {}
        }

        try:
            # Count items in each structure
            for key in self.SCHEMA.keys():
                if key.startswith("_"):
                    continue

                response = requests.get(f"{self.firebase_url}/{key}.json?shallow=true")
                if response.status_code == 200:
                    data = response.json() or {}
                    stats["structures"][key] = len(data)

            # Get total size estimate (very rough)
            response = requests.get(f"{self.firebase_url}.json")
            if response.status_code == 200:
                stats["approximate_size_bytes"] = len(response.content)

        except Exception as e:
            logger.error(f"Failed to get database stats: {e}")

        return stats


def setup_firebase(config: Optional[Config] = None, force: bool = False) -> bool:
    """
    Convenience function to setup Firebase schema

    Args:
        config: Configuration object
        force: Force initialization even if data exists

    Returns:
        True if setup successful
    """
    schema = FirebaseSchema(config)
    return schema.initialize_schema(force)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Firebase Schema Management")
    parser.add_argument("--init", action="store_true", help="Initialize schema")
    parser.add_argument("--force", action="store_true", help="Force initialization")
    parser.add_argument("--validate", action="store_true", help="Validate schema")
    parser.add_argument("--stats", action="store_true", help="Show database statistics")
    parser.add_argument("--export", action="store_true", help="Export schema documentation")
    parser.add_argument("--clear", action="store_true", help="Clear database (DANGEROUS)")

    args = parser.parse_args()

    # Create schema manager
    schema_manager = FirebaseSchema()

    if args.init:
        print("Initializing Firebase schema...")
        if schema_manager.initialize_schema(force=args.force):
            print("✓ Schema initialized successfully")
        else:
            print("✗ Failed to initialize schema")

    elif args.validate:
        print("Validating Firebase schema...")
        report = schema_manager.validate_schema()
        print(f"Schema version: {report['schema_version']}")
        print(f"Valid: {report['valid']}")
        if report['errors']:
            print("Errors:")
            for error in report['errors']:
                print(f"  - {error}")
        if report['warnings']:
            print("Warnings:")
            for warning in report['warnings']:
                print(f"  - {warning}")

    elif args.stats:
        print("Database statistics:")
        stats = schema_manager.get_database_stats()
        for key, value in stats.items():
            if key == "structures":
                print(f"  Item counts:")
                for struct, count in value.items():
                    print(f"    {struct}: {count}")
            else:
                print(f"  {key}: {value}")

    elif args.export:
        schema_manager.export_schema_docs()
        print("✓ Schema documentation exported")

    elif args.clear:
        print("WARNING: This will delete ALL data in the database!")
        confirm = input("Type 'DELETE ALL DATA' to confirm: ")
        if confirm == "DELETE ALL DATA":
            if schema_manager.clear_database(confirm=True):
                print("✓ Database cleared")
        else:
            print("Clear cancelled")

    else:
        parser.print_help()