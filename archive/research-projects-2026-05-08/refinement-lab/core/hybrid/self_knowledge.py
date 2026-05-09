"""
Self-Knowledge System.

Tracks what the agent is good/bad at, common failure patterns,
optimal strategies, and resource costs per task type.

This is the agent's model of itself - continuously updated.
"""

import json
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path
from enum import Enum


class TaskType(Enum):
    CODE_GENERATION = "code_generation"
    BUG_FIXING = "bug_fixing"
    REFACTORING = "refactoring"
    EXPLANATION = "explanation"
    RESEARCH = "research"
    PLANNING = "planning"
    OTHER = "other"


class Difficulty(Enum):
    TRIVIAL = "trivial"      # Solved first try, no thinking needed
    EASY = "easy"            # Solved in 1-2 iterations
    MEDIUM = "medium"        # Required 3-5 iterations or escalation
    HARD = "hard"            # Required Opus or many iterations
    FAILED = "failed"        # Couldn't solve


@dataclass
class TaskOutcome:
    """Record of a single task attempt."""
    task_id: str
    task_type: TaskType
    difficulty: Difficulty
    success: bool

    # Performance metrics
    iterations: int
    tokens_used: int
    cost_usd: float
    time_seconds: float

    # Strategy used
    model_used: str  # "local", "opus", "hybrid"
    strategy: str    # "single_shot", "refinement", "parallel", etc.

    # Learning signals
    failure_reason: Optional[str] = None
    what_worked: Optional[str] = None

    # Metadata
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    tags: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        d = asdict(self)
        d["task_type"] = self.task_type.value
        d["difficulty"] = self.difficulty.value
        return d


@dataclass
class CapabilityProfile:
    """Summary of capabilities for a task type."""
    task_type: TaskType
    total_attempts: int = 0
    successes: int = 0

    # Difficulty distribution
    trivial_count: int = 0
    easy_count: int = 0
    medium_count: int = 0
    hard_count: int = 0
    failed_count: int = 0

    # Resource averages
    avg_iterations: float = 0.0
    avg_tokens: float = 0.0
    avg_cost: float = 0.0
    avg_time: float = 0.0

    # Strategy success rates
    strategy_success: Dict[str, float] = field(default_factory=dict)

    # Common failure patterns
    failure_patterns: Dict[str, int] = field(default_factory=dict)

    @property
    def success_rate(self) -> float:
        if self.total_attempts == 0:
            return 0.0
        return self.successes / self.total_attempts

    def to_dict(self) -> dict:
        d = asdict(self)
        d["task_type"] = self.task_type.value
        d["success_rate"] = self.success_rate
        return d


class SelfKnowledge:
    """
    The agent's model of itself.

    Tracks:
    - Capability boundaries: What it's good/bad at
    - Failure patterns: Common mistakes
    - Optimal strategies: What works for what
    - Resource costs: Tokens/time per task type
    """

    def __init__(self, storage_path: Path):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

        self.outcomes_file = self.storage_path / "outcomes.jsonl"
        self.profile_file = self.storage_path / "capability_profile.json"
        self.insights_file = self.storage_path / "insights.md"

        # In-memory state
        self.outcomes: List[TaskOutcome] = []
        self.profiles: Dict[TaskType, CapabilityProfile] = {}

        self._load()

    def record_outcome(self, outcome: TaskOutcome):
        """Record a task outcome and update profiles."""
        self.outcomes.append(outcome)
        self._update_profile(outcome)
        self._save_outcome(outcome)
        self._save_profiles()

    def get_profile(self, task_type: TaskType) -> CapabilityProfile:
        """Get capability profile for a task type."""
        if task_type not in self.profiles:
            self.profiles[task_type] = CapabilityProfile(task_type=task_type)
        return self.profiles[task_type]

    def get_best_strategy(self, task_type: TaskType) -> Optional[str]:
        """Get the most successful strategy for a task type."""
        profile = self.get_profile(task_type)
        if not profile.strategy_success:
            return None
        return max(profile.strategy_success, key=profile.strategy_success.get)

    def should_escalate(self, task_type: TaskType, local_attempts: int) -> bool:
        """Decide if we should escalate to Opus based on history."""
        profile = self.get_profile(task_type)

        # If success rate is low, escalate earlier
        if profile.success_rate < 0.5 and local_attempts >= 2:
            return True

        # If we typically need many iterations, escalate
        if profile.avg_iterations > 3 and local_attempts >= 2:
            return True

        # Default: escalate after 3 local attempts
        return local_attempts >= 3

    def predict_difficulty(self, task_description: str, task_type: TaskType) -> Difficulty:
        """Predict task difficulty based on history."""
        profile = self.get_profile(task_type)

        # Simple heuristic based on historical distribution
        if profile.total_attempts < 5:
            return Difficulty.MEDIUM  # Not enough data

        # Weight by frequency
        total = profile.total_attempts
        if profile.trivial_count / total > 0.5:
            return Difficulty.EASY
        elif profile.hard_count / total > 0.3:
            return Difficulty.HARD
        else:
            return Difficulty.MEDIUM

    def get_insights(self) -> str:
        """Generate human-readable insights about capabilities."""
        lines = [
            "# Self-Knowledge Insights",
            f"Generated: {datetime.utcnow().isoformat()}",
            f"Total tasks recorded: {len(self.outcomes)}",
            "",
            "## Capability Summary",
            ""
        ]

        for task_type in TaskType:
            profile = self.get_profile(task_type)
            if profile.total_attempts > 0:
                lines.append(f"### {task_type.value}")
                lines.append(f"- Success rate: {profile.success_rate:.1%}")
                lines.append(f"- Attempts: {profile.total_attempts}")
                lines.append(f"- Avg iterations: {profile.avg_iterations:.1f}")
                lines.append(f"- Avg cost: ${profile.avg_cost:.4f}")

                if profile.failure_patterns:
                    lines.append("- Common failures:")
                    for pattern, count in sorted(profile.failure_patterns.items(),
                                                  key=lambda x: -x[1])[:3]:
                        lines.append(f"  - {pattern}: {count}x")

                if profile.strategy_success:
                    best = max(profile.strategy_success, key=profile.strategy_success.get)
                    lines.append(f"- Best strategy: {best} ({profile.strategy_success[best]:.1%})")

                lines.append("")

        return "\n".join(lines)

    def _update_profile(self, outcome: TaskOutcome):
        """Update capability profile with new outcome."""
        profile = self.get_profile(outcome.task_type)

        # Update counts
        profile.total_attempts += 1
        if outcome.success:
            profile.successes += 1

        # Update difficulty distribution
        if outcome.difficulty == Difficulty.TRIVIAL:
            profile.trivial_count += 1
        elif outcome.difficulty == Difficulty.EASY:
            profile.easy_count += 1
        elif outcome.difficulty == Difficulty.MEDIUM:
            profile.medium_count += 1
        elif outcome.difficulty == Difficulty.HARD:
            profile.hard_count += 1
        else:
            profile.failed_count += 1

        # Update running averages
        n = profile.total_attempts
        profile.avg_iterations = ((n-1) * profile.avg_iterations + outcome.iterations) / n
        profile.avg_tokens = ((n-1) * profile.avg_tokens + outcome.tokens_used) / n
        profile.avg_cost = ((n-1) * profile.avg_cost + outcome.cost_usd) / n
        profile.avg_time = ((n-1) * profile.avg_time + outcome.time_seconds) / n

        # Update strategy success rates
        strategy = outcome.strategy
        if strategy not in profile.strategy_success:
            profile.strategy_success[strategy] = 0.0
        # Exponential moving average
        alpha = 0.3
        success_val = 1.0 if outcome.success else 0.0
        profile.strategy_success[strategy] = (
            alpha * success_val + (1 - alpha) * profile.strategy_success[strategy]
        )

        # Track failure patterns
        if not outcome.success and outcome.failure_reason:
            pattern = outcome.failure_reason[:50]  # Truncate
            profile.failure_patterns[pattern] = profile.failure_patterns.get(pattern, 0) + 1

    def _save_outcome(self, outcome: TaskOutcome):
        """Append outcome to JSONL file."""
        with open(self.outcomes_file, "a") as f:
            f.write(json.dumps(outcome.to_dict()) + "\n")

    def _save_profiles(self):
        """Save capability profiles."""
        profiles_dict = {
            t.value: self.profiles[t].to_dict()
            for t in self.profiles
        }
        with open(self.profile_file, "w") as f:
            json.dump(profiles_dict, f, indent=2)

        # Also update insights file
        with open(self.insights_file, "w") as f:
            f.write(self.get_insights())

    def _load(self):
        """Load existing data."""
        # Load outcomes
        if self.outcomes_file.exists():
            with open(self.outcomes_file) as f:
                for line in f:
                    if line.strip():
                        data = json.loads(line)
                        data["task_type"] = TaskType(data["task_type"])
                        data["difficulty"] = Difficulty(data["difficulty"])
                        self.outcomes.append(TaskOutcome(**data))

        # Load profiles
        if self.profile_file.exists():
            with open(self.profile_file) as f:
                profiles_dict = json.load(f)
                for type_str, profile_data in profiles_dict.items():
                    task_type = TaskType(type_str)
                    profile_data["task_type"] = task_type
                    self.profiles[task_type] = CapabilityProfile(**profile_data)
