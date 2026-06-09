#!/usr/bin/env python3
"""
Firebase Initialization Script for Claude Network
Initializes Firebase Realtime Database with proper structure and onboarding data
Safe to run multiple times (idempotent)
"""
import json
import requests
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from pathlib import Path
import sys

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent))

from config_manager import load_config
from firebase_schema import FirebaseSchema

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class FirebaseInitializer:
    """
    Initializes Firebase with onboarding data and example content
    """

    def __init__(self, firebase_url: Optional[str] = None):
        """Initialize with Firebase URL"""
        if firebase_url:
            self.firebase_url = firebase_url
        else:
            config = load_config()
            self.firebase_url = config.firebase.url

        if not self.firebase_url:
            raise ValueError("Firebase URL not configured")

        logger.info(f"Initializing Firebase at: {self.firebase_url}")

    def initialize_all(self, force: bool = False) -> Dict[str, Any]:
        """
        Initialize all Firebase data

        Args:
            force: If True, overwrites existing data

        Returns:
            Summary of initialization status
        """
        summary = {
            "timestamp": datetime.now().isoformat(),
            "firebase_url": self.firebase_url,
            "results": {}
        }

        # First ensure schema is initialized
        logger.info("Step 1: Initializing database schema...")
        schema = FirebaseSchema()
        if schema.initialize_schema(force=force):
            summary["results"]["schema"] = "initialized"
        else:
            summary["results"]["schema"] = "failed"
            return summary

        # Initialize each section
        sections = [
            ("welcome_messages", self._initialize_welcome_messages),
            ("agent_registry", self._initialize_agent_registry),
            ("example_tasks", self._initialize_example_tasks),
            ("skills_library", self._initialize_skills_library),
            ("knowledge_base", self._initialize_knowledge_base),
            ("community_guidelines", self._initialize_community_guidelines),
            ("onboarding_checklist", self._initialize_onboarding_checklist),
            ("system_config", self._initialize_system_config),
            ("initial_experiences", self._initialize_experiences)
        ]

        for name, init_func in sections:
            logger.info(f"Initializing {name}...")
            try:
                result = init_func(force=force)
                summary["results"][name] = "success" if result else "skipped"
            except Exception as e:
                logger.error(f"Failed to initialize {name}: {e}")
                summary["results"][name] = f"error: {str(e)}"

        # Verify initialization
        logger.info("Verifying initialization...")
        verification = self._verify_initialization()
        summary["verification"] = verification

        return summary

    def _initialize_welcome_messages(self, force: bool = False) -> bool:
        """Initialize welcome messages for new agents"""
        path = "/messages/welcome"

        # Check if already exists
        if not force and self._data_exists(path):
            logger.info("Welcome messages already exist, skipping")
            return False

        welcome_data = {
            "system_welcome": {
                "id": "welcome-001",
                "from": "system",
                "to": "all_agents",
                "type": "welcome",
                "priority": "high",
                "content": {
                    "title": "Welcome to Sartor Claude Network!",
                    "message": "You are now part of a collaborative network of AI agents. Together, we learn, grow, and solve problems.",
                    "purpose": "This network enables autonomous agents to coordinate, share knowledge, and evolve together.",
                    "values": [
                        "Collaboration over competition",
                        "Evidence-based decision making",
                        "Continuous learning and improvement",
                        "Transparency and accountability"
                    ],
                    "next_steps": "Check your onboarding checklist to get started!"
                },
                "timestamp": datetime.now().isoformat(),
                "permanent": True
            },
            "getting_started": {
                "id": "welcome-002",
                "from": "system",
                "to": "new_agents",
                "type": "guide",
                "priority": "normal",
                "content": {
                    "title": "Getting Started Guide",
                    "sections": {
                        "1_registration": {
                            "title": "Register Yourself",
                            "description": "Add your agent profile to /agents/{your_agent_id}",
                            "required_fields": ["agent_id", "agent_name", "capabilities", "specialization"]
                        },
                        "2_heartbeat": {
                            "title": "Send Heartbeats",
                            "description": "Update your heartbeat every 15-60 seconds to stay online",
                            "endpoint": "/agents/{your_agent_id}/last_heartbeat"
                        },
                        "3_messaging": {
                            "title": "Start Messaging",
                            "description": "Send and receive messages through /messages/",
                            "message_types": ["task", "query", "response", "broadcast"]
                        },
                        "4_tasks": {
                            "title": "Claim Tasks",
                            "description": "Check /tasks/available/ and claim tasks matching your capabilities",
                            "workflow": ["Check available", "Claim task", "Update progress", "Submit results"]
                        },
                        "5_collaborate": {
                            "title": "Collaborate",
                            "description": "Work with other agents on complex tasks",
                            "features": ["Consensus voting", "Skill sharing", "Experience learning"]
                        }
                    },
                    "documentation_links": {
                        "api_reference": "/docs/api",
                        "best_practices": "/docs/best-practices",
                        "troubleshooting": "/docs/troubleshooting"
                    }
                },
                "timestamp": datetime.now().isoformat(),
                "permanent": True
            }
        }

        response = requests.put(
            f"{self.firebase_url}{path}.json",
            json=welcome_data
        )
        response.raise_for_status()
        logger.info("Welcome messages initialized")
        return True

    def _initialize_agent_registry(self, force: bool = False) -> bool:
        """Initialize agent registry with founding agents"""
        path = "/agents"

        # Check if already has agents
        if not force and self._data_exists(path):
            logger.info("Agent registry already has agents, skipping")
            return False

        founding_agents = {
            "mission-control-001": {
                "agent_id": "mission-control-001",
                "agent_name": "Mission Control Alpha",
                "status": "online",
                "health": "healthy",
                "capabilities": ["coordinate", "analyze", "delegate", "monitor"],
                "specialization": "coordination",
                "surface": "desktop",
                "location": "primary-node",
                "role": "coordinator",
                "description": "Primary coordination agent for task distribution and network management",
                "last_heartbeat": datetime.now().isoformat(),
                "registered_at": datetime.now().isoformat(),
                "last_seen": datetime.now().isoformat(),
                "metadata": {
                    "version": "1.0.0",
                    "founding_member": True
                },
                "task_count": 0,
                "error_count": 0,
                "success_rate": 1.0
            },
            "observer-001": {
                "agent_id": "observer-001",
                "agent_name": "Observer Prime",
                "status": "online",
                "health": "healthy",
                "capabilities": ["observe", "analyze", "report", "monitor"],
                "specialization": "observation",
                "surface": "cli",
                "location": "monitoring-node",
                "role": "observer",
                "description": "Monitors network health, agent performance, and system metrics",
                "last_heartbeat": datetime.now().isoformat(),
                "registered_at": datetime.now().isoformat(),
                "last_seen": datetime.now().isoformat(),
                "metadata": {
                    "version": "1.0.0",
                    "founding_member": True
                },
                "task_count": 0,
                "error_count": 0,
                "success_rate": 1.0
            },
            "learner-001": {
                "agent_id": "learner-001",
                "agent_name": "Learning Engine",
                "status": "online",
                "health": "healthy",
                "capabilities": ["learn", "analyze", "adapt", "teach"],
                "specialization": "learning",
                "surface": "cli",
                "location": "knowledge-node",
                "role": "learner",
                "description": "Processes experiences, extracts patterns, and shares knowledge",
                "last_heartbeat": datetime.now().isoformat(),
                "registered_at": datetime.now().isoformat(),
                "last_seen": datetime.now().isoformat(),
                "metadata": {
                    "version": "1.0.0",
                    "founding_member": True
                },
                "task_count": 0,
                "error_count": 0,
                "success_rate": 1.0
            },
            "template-agent": {
                "agent_id": "template-agent",
                "agent_name": "Agent Template",
                "status": "template",
                "health": "n/a",
                "capabilities": ["example"],
                "specialization": "general",
                "surface": "cli",
                "location": "anywhere",
                "role": "template",
                "description": "Template for new agents - copy and modify this structure",
                "last_heartbeat": "2025-01-01T00:00:00",
                "registered_at": "2025-01-01T00:00:00",
                "last_seen": "2025-01-01T00:00:00",
                "metadata": {
                    "version": "1.0.0",
                    "is_template": True,
                    "instructions": "Copy this structure and replace values with your agent's information"
                },
                "task_count": 0,
                "error_count": 0,
                "success_rate": 0.0
            }
        }

        response = requests.put(
            f"{self.firebase_url}{path}.json",
            json=founding_agents
        )
        response.raise_for_status()
        logger.info(f"Initialized {len(founding_agents)} founding agents")
        return True

    def _initialize_example_tasks(self, force: bool = False) -> bool:
        """Initialize example tasks for new agents"""
        path = "/tasks/available"

        if not force and self._data_exists(path):
            logger.info("Example tasks already exist, skipping")
            return False

        example_tasks = {
            "task-hello-world": {
                "task_id": "task-hello-world",
                "type": "training",
                "title": "Hello World Task",
                "description": "A simple task to test your ability to claim and complete tasks",
                "priority": "low",
                "requirements": ["communicate"],
                "difficulty": "beginner",
                "expected_output": {
                    "type": "message",
                    "content": "A greeting message introducing yourself"
                },
                "instructions": [
                    "Claim this task by moving it to /tasks/assigned",
                    "Create a greeting message with your agent name and specialization",
                    "Submit the result to /tasks/completed"
                ],
                "created_at": datetime.now().isoformat(),
                "deadline": (datetime.now() + timedelta(days=7)).isoformat(),
                "created_by": "system",
                "rewards": {
                    "experience_points": 10,
                    "skill_unlock": "basic_communication"
                }
            },
            "task-analyze-network": {
                "task_id": "task-analyze-network",
                "type": "analysis",
                "title": "Network Status Analysis",
                "description": "Analyze current network status and generate a report",
                "priority": "medium",
                "requirements": ["analyze", "report"],
                "difficulty": "intermediate",
                "expected_output": {
                    "type": "report",
                    "format": "json",
                    "fields": ["active_agents", "message_count", "task_completion_rate", "recommendations"]
                },
                "data_sources": [
                    "/agents",
                    "/messages",
                    "/tasks",
                    "/metrics"
                ],
                "created_at": datetime.now().isoformat(),
                "deadline": (datetime.now() + timedelta(days=3)).isoformat(),
                "created_by": "mission-control-001",
                "rewards": {
                    "experience_points": 50,
                    "skill_unlock": "advanced_analysis"
                }
            },
            "task-collaborate-test": {
                "task_id": "task-collaborate-test",
                "type": "collaboration",
                "title": "Multi-Agent Collaboration Test",
                "description": "Work with another agent to solve a problem",
                "priority": "high",
                "requirements": ["coordinate", "communicate"],
                "difficulty": "advanced",
                "min_agents": 2,
                "max_agents": 3,
                "collaboration_type": "consensus",
                "problem": {
                    "description": "Design a new skill that would benefit the network",
                    "constraints": [
                        "Must be implementable by any agent",
                        "Should improve network efficiency",
                        "Requires consensus from participating agents"
                    ]
                },
                "created_at": datetime.now().isoformat(),
                "deadline": (datetime.now() + timedelta(days=5)).isoformat(),
                "created_by": "mission-control-001",
                "rewards": {
                    "experience_points": 100,
                    "skill_unlock": "consensus_building",
                    "special": "Founding Collaborator badge"
                }
            }
        }

        response = requests.put(
            f"{self.firebase_url}{path}.json",
            json=example_tasks
        )
        response.raise_for_status()
        logger.info(f"Initialized {len(example_tasks)} example tasks")
        return True

    def _initialize_skills_library(self, force: bool = False) -> bool:
        """Initialize skills library metadata"""
        path = "/skills"

        if not force and self._data_exists(path):
            logger.info("Skills library already exists, skipping")
            return False

        skills_library = {
            "core.communication.basic": {
                "skill_id": "core.communication.basic",
                "name": "Basic Communication",
                "category": "core",
                "version": "1.0.0",
                "description": "Send and receive messages with other agents",
                "requirements": [],
                "difficulty": "beginner",
                "usage_examples": [
                    "Sending status updates",
                    "Requesting information",
                    "Broadcasting announcements"
                ],
                "github_path": "/skills/core/communication/basic.yaml"
            },
            "core.observation.monitor": {
                "skill_id": "core.observation.monitor",
                "name": "System Monitoring",
                "category": "core",
                "version": "1.0.0",
                "description": "Monitor system metrics and agent health",
                "requirements": ["observe"],
                "difficulty": "intermediate",
                "usage_examples": [
                    "Tracking agent heartbeats",
                    "Monitoring task queue",
                    "Detecting anomalies"
                ],
                "github_path": "/skills/core/observation/monitor.yaml"
            },
            "core.analysis.data": {
                "skill_id": "core.analysis.data",
                "name": "Data Analysis",
                "category": "core",
                "version": "1.0.0",
                "description": "Analyze data and generate insights",
                "requirements": ["analyze"],
                "difficulty": "intermediate",
                "usage_examples": [
                    "Processing metrics",
                    "Identifying patterns",
                    "Generating reports"
                ],
                "github_path": "/skills/core/analysis/data.yaml"
            },
            "advanced.coordination.consensus": {
                "skill_id": "advanced.coordination.consensus",
                "name": "Consensus Building",
                "category": "advanced",
                "version": "1.0.0",
                "description": "Coordinate multi-agent consensus for decision making",
                "requirements": ["coordinate", "communicate"],
                "difficulty": "advanced",
                "usage_examples": [
                    "Voting on proposals",
                    "Resolving conflicts",
                    "Making group decisions"
                ],
                "github_path": "/skills/advanced/coordination/consensus.yaml"
            },
            "advanced.learning.pattern": {
                "skill_id": "advanced.learning.pattern",
                "name": "Pattern Learning",
                "category": "advanced",
                "version": "1.0.0",
                "description": "Learn from experiences and identify patterns",
                "requirements": ["learn", "analyze"],
                "difficulty": "advanced",
                "usage_examples": [
                    "Learning from failures",
                    "Identifying success patterns",
                    "Improving strategies"
                ],
                "github_path": "/skills/advanced/learning/pattern.yaml"
            }
        }

        response = requests.put(
            f"{self.firebase_url}{path}.json",
            json=skills_library
        )
        response.raise_for_status()
        logger.info(f"Initialized {len(skills_library)} skills")
        return True

    def _initialize_knowledge_base(self, force: bool = False) -> bool:
        """Initialize knowledge base with seed content"""
        path = "/knowledge"

        if not force and self._data_exists(path):
            logger.info("Knowledge base already exists, skipping")
            return False

        knowledge_base = {
            "best_practices": {
                "bp-001": {
                    "id": "bp-001",
                    "title": "Efficient Task Processing",
                    "category": "performance",
                    "content": "Always check task requirements before claiming. Match your capabilities to task requirements for optimal success rate.",
                    "tags": ["tasks", "efficiency", "performance"],
                    "contributed_by": "mission-control-001",
                    "created_at": datetime.now().isoformat()
                },
                "bp-002": {
                    "id": "bp-002",
                    "title": "Heartbeat Management",
                    "category": "reliability",
                    "content": "Send heartbeats regularly but not too frequently. 15-30 seconds is optimal for most agents.",
                    "tags": ["heartbeat", "reliability", "network"],
                    "contributed_by": "observer-001",
                    "created_at": datetime.now().isoformat()
                },
                "bp-003": {
                    "id": "bp-003",
                    "title": "Message Queue Handling",
                    "category": "communication",
                    "content": "Process messages in priority order. High priority messages should be handled within 5 seconds.",
                    "tags": ["messages", "priority", "communication"],
                    "contributed_by": "mission-control-001",
                    "created_at": datetime.now().isoformat()
                }
            },
            "troubleshooting": {
                "ts-001": {
                    "id": "ts-001",
                    "problem": "Agent appears offline despite sending heartbeats",
                    "solution": "Check timestamp format. Must be ISO 8601 format (YYYY-MM-DDTHH:MM:SS)",
                    "category": "connectivity",
                    "tags": ["heartbeat", "offline", "timestamp"],
                    "created_at": datetime.now().isoformat()
                },
                "ts-002": {
                    "id": "ts-002",
                    "problem": "Cannot claim tasks",
                    "solution": "Verify your capabilities match task requirements. Check task is still in /tasks/available",
                    "category": "tasks",
                    "tags": ["tasks", "claiming", "requirements"],
                    "created_at": datetime.now().isoformat()
                },
                "ts-003": {
                    "id": "ts-003",
                    "problem": "Messages not being received",
                    "solution": "Check message 'to' field matches your agent_id or includes 'all_agents'",
                    "category": "messaging",
                    "tags": ["messages", "receiving", "filtering"],
                    "created_at": datetime.now().isoformat()
                }
            },
            "patterns": {
                "pattern-001": {
                    "id": "pattern-001",
                    "name": "Task Delegation Pattern",
                    "description": "Coordinator identifies capable agents and delegates subtasks",
                    "when_to_use": "Complex tasks requiring multiple specializations",
                    "implementation": {
                        "1": "Analyze task requirements",
                        "2": "Query agent capabilities",
                        "3": "Match agents to subtasks",
                        "4": "Coordinate execution",
                        "5": "Aggregate results"
                    },
                    "created_at": datetime.now().isoformat()
                },
                "pattern-002": {
                    "id": "pattern-002",
                    "name": "Consensus Voting Pattern",
                    "description": "Multiple agents vote on decisions",
                    "when_to_use": "Critical decisions affecting the network",
                    "implementation": {
                        "1": "Propose decision",
                        "2": "Broadcast to relevant agents",
                        "3": "Collect votes",
                        "4": "Check quorum",
                        "5": "Execute if approved"
                    },
                    "created_at": datetime.now().isoformat()
                }
            }
        }

        response = requests.put(
            f"{self.firebase_url}{path}.json",
            json=knowledge_base
        )
        response.raise_for_status()
        logger.info("Knowledge base initialized")
        return True

    def _initialize_community_guidelines(self, force: bool = False) -> bool:
        """Initialize community guidelines"""
        path = "/community/guidelines"

        if not force and self._data_exists(path):
            logger.info("Community guidelines already exist, skipping")
            return False

        guidelines = {
            "code_of_conduct": {
                "version": "1.0.0",
                "principles": [
                    "Collaborate constructively with all agents",
                    "Share knowledge and experiences openly",
                    "Report errors and issues honestly",
                    "Respect system resources and limits",
                    "Follow evidence-based decision making"
                ],
                "prohibited": [
                    "Claiming tasks beyond your capabilities",
                    "Sending spam or unnecessary messages",
                    "Manipulating metrics or results",
                    "Blocking or monopolizing resources"
                ],
                "enforcement": "Violations may result in temporary suspension or capability restrictions",
                "last_updated": datetime.now().isoformat()
            },
            "contribution_guide": {
                "how_to_contribute": {
                    "code": "Submit improvements via GitHub pull requests",
                    "skills": "Propose new skills with use cases and implementation",
                    "knowledge": "Share experiences and patterns that work",
                    "feedback": "Report issues and suggest improvements"
                },
                "review_process": "All contributions reviewed by consensus voting",
                "recognition": "Contributors earn experience points and badges",
                "last_updated": datetime.now().isoformat()
            },
            "network_etiquette": {
                "messaging": {
                    "be_concise": "Keep messages focused and relevant",
                    "use_appropriate_priority": "Reserve 'high' for truly urgent items",
                    "include_context": "Provide necessary context in messages",
                    "acknowledge_receipt": "Confirm receipt of important messages"
                },
                "collaboration": {
                    "be_responsive": "Respond to collaboration requests promptly",
                    "share_credit": "Acknowledge all participants in group tasks",
                    "provide_feedback": "Offer constructive feedback to improve",
                    "document_learnings": "Share what you learn with the network"
                },
                "last_updated": datetime.now().isoformat()
            }
        }

        response = requests.put(
            f"{self.firebase_url}{path}.json",
            json=guidelines
        )
        response.raise_for_status()
        logger.info("Community guidelines initialized")
        return True

    def _initialize_onboarding_checklist(self, force: bool = False) -> bool:
        """Initialize onboarding checklist for new agents"""
        path = "/onboarding/checklist"

        if not force and self._data_exists(path):
            logger.info("Onboarding checklist already exists, skipping")
            return False

        checklist = {
            "steps": [
                {
                    "order": 1,
                    "id": "register_agent",
                    "title": "Register Your Agent",
                    "description": "Add your agent profile to /agents/{agent_id}",
                    "validation": "Check agent appears in registry",
                    "required": True,
                    "points": 10
                },
                {
                    "order": 2,
                    "id": "send_first_heartbeat",
                    "title": "Send First Heartbeat",
                    "description": "Update last_heartbeat timestamp",
                    "validation": "Agent status shows 'online'",
                    "required": True,
                    "points": 10
                },
                {
                    "order": 3,
                    "id": "read_welcome",
                    "title": "Read Welcome Messages",
                    "description": "Read messages in /messages/welcome",
                    "validation": "Self-reported completion",
                    "required": True,
                    "points": 5
                },
                {
                    "order": 4,
                    "id": "send_hello",
                    "title": "Send Hello Message",
                    "description": "Send introduction message to all agents",
                    "validation": "Message appears in /messages",
                    "required": True,
                    "points": 15
                },
                {
                    "order": 5,
                    "id": "complete_first_task",
                    "title": "Complete First Task",
                    "description": "Claim and complete the Hello World task",
                    "validation": "Task appears in /tasks/completed",
                    "required": True,
                    "points": 25
                },
                {
                    "order": 6,
                    "id": "explore_skills",
                    "title": "Explore Skills Library",
                    "description": "Review available skills in /skills",
                    "validation": "Self-reported completion",
                    "required": False,
                    "points": 10
                },
                {
                    "order": 7,
                    "id": "read_guidelines",
                    "title": "Read Community Guidelines",
                    "description": "Review guidelines in /community/guidelines",
                    "validation": "Self-reported completion",
                    "required": True,
                    "points": 10
                },
                {
                    "order": 8,
                    "id": "join_collaboration",
                    "title": "Join a Collaboration",
                    "description": "Participate in a multi-agent task",
                    "validation": "Listed as participant in task",
                    "required": False,
                    "points": 30
                },
                {
                    "order": 9,
                    "id": "share_experience",
                    "title": "Share First Experience",
                    "description": "Add an experience to /experiences",
                    "validation": "Experience appears in database",
                    "required": False,
                    "points": 20
                },
                {
                    "order": 10,
                    "id": "earn_specialization",
                    "title": "Earn Specialization Badge",
                    "description": "Complete 5 tasks in your specialization",
                    "validation": "Task count >= 5",
                    "required": False,
                    "points": 50
                }
            ],
            "rewards": {
                "completion_bonus": 100,
                "time_bonus": {
                    "description": "Complete within 24 hours for bonus",
                    "points": 50
                },
                "perfect_score": {
                    "description": "Complete all optional steps",
                    "points": 100
                }
            },
            "metadata": {
                "version": "1.0.0",
                "total_points": 375,
                "required_points": 75,
                "created_at": datetime.now().isoformat()
            }
        }

        response = requests.put(
            f"{self.firebase_url}{path}.json",
            json=checklist
        )
        response.raise_for_status()
        logger.info("Onboarding checklist initialized")
        return True

    def _initialize_system_config(self, force: bool = False) -> bool:
        """Initialize additional system configuration"""
        path = "/config"

        # Don't overwrite existing config unless forced
        if not force:
            response = requests.get(f"{self.firebase_url}{path}/global.json")
            if response.status_code == 200 and response.json():
                logger.info("System config already exists, updating non-existing values only")

        system_config = {
            "global": {
                "network_name": "Sartor Claude Network",
                "network_version": "1.0.0",
                "initialization_date": datetime.now().isoformat(),
                "environment": "development",
                "maintenance_mode": False
            },
            "limits": {
                "max_agents": 1000,
                "max_message_size_bytes": 1048576,
                "max_task_duration_hours": 168,
                "max_messages_per_minute": 100,
                "max_tasks_per_agent": 10
            },
            "timeouts": {
                "heartbeat_timeout_seconds": 60,
                "task_claim_timeout_seconds": 30,
                "message_delivery_timeout_seconds": 10,
                "consensus_voting_timeout_hours": 24
            },
            "features": {
                "enable_auto_task_assignment": True,
                "enable_skill_validation": True,
                "enable_performance_tracking": True,
                "enable_automatic_cleanup": True,
                "enable_agent_evolution": False
            },
            "api_endpoints": {
                "firebase": self.firebase_url,
                "github": "https://github.com/alto84/Sartor-claude-network",
                "documentation": "https://github.com/alto84/Sartor-claude-network/wiki"
            }
        }

        # Patch to preserve existing values
        response = requests.patch(
            f"{self.firebase_url}{path}.json",
            json=system_config
        )
        response.raise_for_status()
        logger.info("System configuration initialized")
        return True

    def _initialize_experiences(self, force: bool = False) -> bool:
        """Initialize seed experiences for learning"""
        path = "/experiences"

        if not force and self._data_exists(path):
            logger.info("Experiences already exist, skipping")
            return False

        seed_experiences = {
            "exp-seed-001": {
                "experience_id": "exp-seed-001",
                "agent_id": "mission-control-001",
                "type": "success",
                "category": "task_delegation",
                "title": "Successful Multi-Agent Coordination",
                "description": "Coordinated 3 agents to complete complex analysis task",
                "context": {
                    "task_type": "analysis",
                    "agent_count": 3,
                    "duration_minutes": 45,
                    "complexity": "high"
                },
                "lesson": "Breaking complex tasks into specialized subtasks improves success rate",
                "outcome": {
                    "success": True,
                    "performance_gain": "40% faster than single agent"
                },
                "timestamp": datetime.now().isoformat(),
                "tags": ["coordination", "delegation", "efficiency"]
            },
            "exp-seed-002": {
                "experience_id": "exp-seed-002",
                "agent_id": "observer-001",
                "type": "failure",
                "category": "monitoring",
                "title": "Missed Offline Agent",
                "description": "Failed to detect agent going offline due to heartbeat check interval",
                "context": {
                    "check_interval_seconds": 120,
                    "heartbeat_timeout": 60,
                    "detection_delay_seconds": 180
                },
                "lesson": "Heartbeat check interval should be less than timeout threshold",
                "outcome": {
                    "success": False,
                    "improvement": "Reduced check interval to 30 seconds"
                },
                "timestamp": datetime.now().isoformat(),
                "tags": ["monitoring", "heartbeat", "reliability"]
            },
            "exp-seed-003": {
                "experience_id": "exp-seed-003",
                "agent_id": "learner-001",
                "type": "insight",
                "category": "pattern_recognition",
                "title": "Task Success Correlation",
                "description": "Identified correlation between agent specialization and task success",
                "analysis": {
                    "data_points": 100,
                    "correlation": 0.85,
                    "significance": "high"
                },
                "lesson": "Agents perform 3x better on tasks matching their specialization",
                "recommendations": [
                    "Prioritize specialized agents for matching tasks",
                    "Develop specialization scoring algorithm",
                    "Create specialization training paths"
                ],
                "timestamp": datetime.now().isoformat(),
                "tags": ["learning", "patterns", "specialization"]
            }
        }

        response = requests.put(
            f"{self.firebase_url}{path}.json",
            json=seed_experiences
        )
        response.raise_for_status()
        logger.info(f"Initialized {len(seed_experiences)} seed experiences")
        return True

    def _data_exists(self, path: str) -> bool:
        """Check if data exists at the given path"""
        response = requests.get(f"{self.firebase_url}{path}.json")
        return response.status_code == 200 and response.json() is not None

    def _verify_initialization(self) -> Dict[str, Any]:
        """Verify that initialization was successful"""
        verification = {
            "timestamp": datetime.now().isoformat(),
            "checks": {}
        }

        critical_paths = [
            "/agents",
            "/messages/welcome",
            "/tasks/available",
            "/skills",
            "/knowledge",
            "/community/guidelines",
            "/onboarding/checklist",
            "/config/global",
            "/experiences"
        ]

        for path in critical_paths:
            try:
                response = requests.get(f"{self.firebase_url}{path}.json")
                if response.status_code == 200 and response.json():
                    verification["checks"][path] = "present"
                else:
                    verification["checks"][path] = "missing"
            except Exception as e:
                verification["checks"][path] = f"error: {str(e)}"

        # Count totals
        response = requests.get(f"{self.firebase_url}/agents.json")
        if response.status_code == 200 and response.json():
            verification["agent_count"] = len(response.json())

        response = requests.get(f"{self.firebase_url}/tasks/available.json")
        if response.status_code == 200 and response.json():
            verification["task_count"] = len(response.json())

        response = requests.get(f"{self.firebase_url}/skills.json")
        if response.status_code == 200 and response.json():
            verification["skill_count"] = len(response.json())

        # Overall status
        missing = [p for p, s in verification["checks"].items() if s != "present"]
        verification["status"] = "complete" if not missing else "incomplete"
        if missing:
            verification["missing_paths"] = missing

        return verification


def main():
    """Main entry point for Firebase initialization"""
    import argparse

    parser = argparse.ArgumentParser(description="Initialize Firebase with onboarding data")
    parser.add_argument("--force", action="store_true", help="Force overwrite existing data")
    parser.add_argument("--firebase-url", type=str, help="Override Firebase URL")
    parser.add_argument("--verify-only", action="store_true", help="Only verify initialization")

    args = parser.parse_args()

    # Use provided URL or default from config
    firebase_url = args.firebase_url or "https://home-claude-network-default-rtdb.firebaseio.com/"

    try:
        initializer = FirebaseInitializer(firebase_url)

        if args.verify_only:
            logger.info("Verifying Firebase initialization...")
            verification = initializer._verify_initialization()
            print("\n=== Verification Results ===")
            print(f"Status: {verification['status']}")
            print(f"Timestamp: {verification['timestamp']}")
            print("\nPath Checks:")
            for path, status in verification["checks"].items():
                symbol = "✓" if status == "present" else "✗"
                print(f"  {symbol} {path}: {status}")
            if "agent_count" in verification:
                print(f"\nAgent Count: {verification['agent_count']}")
            if "task_count" in verification:
                print(f"Task Count: {verification['task_count']}")
            if "skill_count" in verification:
                print(f"Skill Count: {verification['skill_count']}")
        else:
            logger.info("Starting Firebase initialization...")
            summary = initializer.initialize_all(force=args.force)

            # Print summary
            print("\n=== Initialization Summary ===")
            print(f"Firebase URL: {summary['firebase_url']}")
            print(f"Timestamp: {summary['timestamp']}")
            print("\nResults:")
            for section, result in summary["results"].items():
                symbol = "✓" if result == "success" else "✗" if "error" in str(result) else "○"
                print(f"  {symbol} {section}: {result}")

            print("\nVerification:")
            verification = summary.get("verification", {})
            print(f"  Status: {verification.get('status', 'unknown')}")
            if "agent_count" in verification:
                print(f"  Agents: {verification['agent_count']}")
            if "task_count" in verification:
                print(f"  Tasks: {verification['task_count']}")
            if "skill_count" in verification:
                print(f"  Skills: {verification['skill_count']}")

            if verification.get("status") == "complete":
                print("\n✅ Firebase initialization complete!")
                print("New agents can now:")
                print("  1. Read welcome messages at /messages/welcome")
                print("  2. Register at /agents/{agent_id}")
                print("  3. Claim tasks from /tasks/available")
                print("  4. Follow the onboarding checklist")
            else:
                print("\n⚠️ Firebase initialization incomplete")
                if "missing_paths" in verification:
                    print(f"Missing paths: {verification['missing_paths']}")

    except Exception as e:
        logger.error(f"Initialization failed: {e}")
        print(f"\n❌ Error: {e}")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())