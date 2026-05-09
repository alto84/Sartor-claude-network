"""
Hybrid Orchestrator.

Routes tasks between local models (cheap/free) and Claude Opus (expensive).
Implements multiple collaboration patterns:
- Draft & Refine: Local drafts, Opus polishes
- Filter & Escalate: Local handles easy, escalates hard
- Verify & Critique: Opus generates, local verifies
- Parallel Exploration: Local explores many, Opus synthesizes
"""

import asyncio
import time
from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from enum import Enum
from pathlib import Path

from ..backends.router import BackendRouter, RouterConfig
from ..refinement.loop import RefinementLoop, RefinementConfig, RefinementResult
from .self_knowledge import SelfKnowledge, TaskOutcome, TaskType, Difficulty


class Strategy(Enum):
    SINGLE_SHOT = "single_shot"           # Just ask once
    LOCAL_ONLY = "local_only"             # Only use local model
    OPUS_ONLY = "opus_only"               # Only use Opus
    DRAFT_REFINE = "draft_refine"         # Local drafts, Opus refines
    FILTER_ESCALATE = "filter_escalate"   # Try local, escalate if needed
    VERIFY_CRITIQUE = "verify_critique"   # Opus generates, local verifies
    PARALLEL_EXPLORE = "parallel_explore" # Multiple local attempts, Opus synthesizes


@dataclass
class HybridResult:
    """Result from hybrid orchestration."""
    success: bool
    solution: str
    strategy_used: Strategy

    # Resource usage
    local_tokens: int
    opus_tokens: int
    total_cost: float
    total_time: float

    # Execution details
    local_attempts: int
    opus_attempts: int
    escalated: bool

    # Learning
    difficulty: Difficulty
    what_worked: Optional[str] = None
    failure_reason: Optional[str] = None


class HybridOrchestrator:
    """
    Orchestrates between local models and Claude Opus.

    Learns over time which strategies work best for which task types.
    """

    def __init__(
        self,
        local_router: BackendRouter,
        opus_router: Optional[BackendRouter] = None,
        knowledge_path: Path = Path("data/self_knowledge"),
        log_path: Path = Path("logs/discoveries.md")
    ):
        self.local = local_router
        self.opus = opus_router  # None = use local router with claude backend
        self.knowledge = SelfKnowledge(knowledge_path)
        self.log_path = Path(log_path)
        self.log_path.parent.mkdir(parents=True, exist_ok=True)

    async def solve(
        self,
        task: str,
        task_type: TaskType = TaskType.CODE_GENERATION,
        strategy: Optional[Strategy] = None,
        verifier=None,
        max_local_attempts: int = 3,
        max_opus_attempts: int = 2,
    ) -> HybridResult:
        """
        Solve a task using hybrid local + Opus approach.

        If no strategy specified, picks based on self-knowledge.
        """
        start_time = time.time()

        # Pick strategy if not specified
        if strategy is None:
            strategy = self._pick_strategy(task_type)

        # Execute strategy
        if strategy == Strategy.SINGLE_SHOT:
            result = await self._single_shot(task, verifier)
        elif strategy == Strategy.LOCAL_ONLY:
            result = await self._local_only(task, verifier, max_local_attempts)
        elif strategy == Strategy.OPUS_ONLY:
            result = await self._opus_only(task, verifier, max_opus_attempts)
        elif strategy == Strategy.DRAFT_REFINE:
            result = await self._draft_refine(task, verifier)
        elif strategy == Strategy.FILTER_ESCALATE:
            result = await self._filter_escalate(task, verifier, max_local_attempts)
        elif strategy == Strategy.VERIFY_CRITIQUE:
            result = await self._verify_critique(task, verifier, max_opus_attempts)
        elif strategy == Strategy.PARALLEL_EXPLORE:
            result = await self._parallel_explore(task, verifier)
        else:
            result = await self._filter_escalate(task, verifier, max_local_attempts)

        result.strategy_used = strategy
        result.total_time = time.time() - start_time

        # Determine difficulty from result
        result.difficulty = self._assess_difficulty(result)

        # Record outcome for learning
        outcome = TaskOutcome(
            task_id=f"task_{int(time.time()*1000)}",
            task_type=task_type,
            difficulty=result.difficulty,
            success=result.success,
            iterations=result.local_attempts + result.opus_attempts,
            tokens_used=result.local_tokens + result.opus_tokens,
            cost_usd=result.total_cost,
            time_seconds=result.total_time,
            model_used="hybrid" if result.opus_attempts > 0 else "local",
            strategy=strategy.value,
            failure_reason=result.failure_reason,
            what_worked=result.what_worked,
        )
        self.knowledge.record_outcome(outcome)

        # Log discovery if interesting
        if result.success and result.what_worked:
            self._log_discovery(task_type, strategy, result.what_worked)

        return result

    async def _single_shot(self, task: str, verifier) -> HybridResult:
        """Just ask once with local model."""
        result = await self.local.generate(task, role="proposer")

        success = True
        failure_reason = None
        if verifier:
            success, feedback = await verifier(result.content, task)
            if not success:
                failure_reason = feedback[:100]

        return HybridResult(
            success=success,
            solution=result.content,
            strategy_used=Strategy.SINGLE_SHOT,
            local_tokens=result.total_tokens,
            opus_tokens=0,
            total_cost=result.cost_usd,
            total_time=0,
            local_attempts=1,
            opus_attempts=0,
            escalated=False,
            difficulty=Difficulty.TRIVIAL if success else Difficulty.FAILED,
            failure_reason=failure_reason,
            what_worked="single_shot" if success else None,
        )

    async def _local_only(self, task: str, verifier, max_attempts: int) -> HybridResult:
        """Use local model with refinement loop."""
        config = RefinementConfig(max_iterations=max_attempts, verbose=False)
        loop = RefinementLoop(self.local, verifier=verifier, config=config)
        result = await loop.run(task)

        return HybridResult(
            success=result.success,
            solution=result.final_solution or "",
            strategy_used=Strategy.LOCAL_ONLY,
            local_tokens=sum(s.cost_usd for s in result.steps),  # Approximate
            opus_tokens=0,
            total_cost=result.total_cost_usd,
            total_time=result.total_latency_ms / 1000,
            local_attempts=result.iterations,
            opus_attempts=0,
            escalated=False,
            difficulty=Difficulty.EASY if result.iterations <= 2 else Difficulty.MEDIUM,
            failure_reason=result.steps[-1].verification_feedback if not result.success else None,
            what_worked=f"local_refinement_{result.iterations}" if result.success else None,
        )

    async def _opus_only(self, task: str, verifier, max_attempts: int) -> HybridResult:
        """Use Opus directly."""
        # Force Claude backend
        total_tokens = 0
        total_cost = 0.0
        solution = ""
        success = False
        failure_reason = None

        for attempt in range(max_attempts):
            result = await self.local.generate(
                task,
                role="proposer",
                force_backend="claude"
            )
            solution = result.content
            total_tokens += result.total_tokens
            total_cost += result.cost_usd

            if verifier:
                success, feedback = await verifier(solution, task)
                if success:
                    break
                failure_reason = feedback[:100]
                task = f"{task}\n\nPrevious attempt failed: {feedback}\n\nPlease try again:"
            else:
                success = True
                break

        return HybridResult(
            success=success,
            solution=solution,
            strategy_used=Strategy.OPUS_ONLY,
            local_tokens=0,
            opus_tokens=total_tokens,
            total_cost=total_cost,
            total_time=0,
            local_attempts=0,
            opus_attempts=attempt + 1,
            escalated=False,
            difficulty=Difficulty.HARD,
            failure_reason=failure_reason,
            what_worked="opus_direct" if success else None,
        )

    async def _draft_refine(self, task: str, verifier) -> HybridResult:
        """Local drafts, Opus refines."""
        # Step 1: Local draft
        draft = await self.local.generate(
            f"Create a draft solution for:\n{task}\n\nThis is a first draft, focus on getting the structure right.",
            role="proposer"
        )
        local_tokens = draft.total_tokens

        # Step 2: Opus refines
        refined = await self.local.generate(
            f"Original task:\n{task}\n\nDraft solution:\n{draft.content}\n\nPlease refine and improve this solution. Fix any bugs, improve clarity, and ensure correctness.",
            role="proposer",
            force_backend="claude"
        )
        opus_tokens = refined.total_tokens

        success = True
        failure_reason = None
        if verifier:
            success, feedback = await verifier(refined.content, task)
            if not success:
                failure_reason = feedback[:100]

        return HybridResult(
            success=success,
            solution=refined.content,
            strategy_used=Strategy.DRAFT_REFINE,
            local_tokens=local_tokens,
            opus_tokens=opus_tokens,
            total_cost=draft.cost_usd + refined.cost_usd,
            total_time=0,
            local_attempts=1,
            opus_attempts=1,
            escalated=False,
            difficulty=Difficulty.MEDIUM,
            failure_reason=failure_reason,
            what_worked="draft_refine" if success else None,
        )

    async def _filter_escalate(self, task: str, verifier, max_local: int) -> HybridResult:
        """Try local first, escalate to Opus if needed."""
        # Try local
        local_result = await self._local_only(task, verifier, max_local)

        if local_result.success:
            return local_result

        # Escalate to Opus
        escalation_prompt = f"""Task: {task}

A local model attempted this {local_result.local_attempts} times but failed.
Last feedback: {local_result.failure_reason}

Please solve this correctly."""

        opus_result = await self._opus_only(escalation_prompt, verifier, 2)

        return HybridResult(
            success=opus_result.success,
            solution=opus_result.solution,
            strategy_used=Strategy.FILTER_ESCALATE,
            local_tokens=local_result.local_tokens,
            opus_tokens=opus_result.opus_tokens,
            total_cost=local_result.total_cost + opus_result.total_cost,
            total_time=local_result.total_time + opus_result.total_time,
            local_attempts=local_result.local_attempts,
            opus_attempts=opus_result.opus_attempts,
            escalated=True,
            difficulty=Difficulty.HARD,
            failure_reason=opus_result.failure_reason,
            what_worked="escalation" if opus_result.success else None,
        )

    async def _verify_critique(self, task: str, verifier, max_attempts: int) -> HybridResult:
        """Opus generates, local verifies and critiques."""
        total_local = 0
        total_opus = 0
        total_cost = 0.0
        solution = ""
        success = False

        for attempt in range(max_attempts):
            # Opus generates
            opus_result = await self.local.generate(
                task if attempt == 0 else f"{task}\n\nPrevious critique:\n{critique}\n\nPlease address these issues.",
                role="proposer",
                force_backend="claude"
            )
            solution = opus_result.content
            total_opus += opus_result.total_tokens
            total_cost += opus_result.cost_usd

            # Local critiques
            critique_result = await self.local.generate(
                f"Task: {task}\n\nSolution:\n{solution}\n\nCritique this solution. List any bugs, issues, or improvements needed. If it's correct, say 'APPROVED'.",
                role="evaluator"
            )
            total_local += critique_result.total_tokens
            critique = critique_result.content

            if "APPROVED" in critique.upper():
                success = True
                break

            # Also run verifier if provided
            if verifier:
                verified, feedback = await verifier(solution, task)
                if verified:
                    success = True
                    break

        return HybridResult(
            success=success,
            solution=solution,
            strategy_used=Strategy.VERIFY_CRITIQUE,
            local_tokens=total_local,
            opus_tokens=total_opus,
            total_cost=total_cost,
            total_time=0,
            local_attempts=attempt + 1,
            opus_attempts=attempt + 1,
            escalated=False,
            difficulty=Difficulty.MEDIUM if attempt < 2 else Difficulty.HARD,
            what_worked="verify_critique" if success else None,
        )

    async def _parallel_explore(self, task: str, verifier) -> HybridResult:
        """Multiple local attempts in parallel, Opus synthesizes."""
        # Generate 3 different approaches in parallel
        prompts = [
            f"Solve this task with a focus on SIMPLICITY:\n{task}",
            f"Solve this task with a focus on CORRECTNESS (handle all edge cases):\n{task}",
            f"Solve this task with a focus on EFFICIENCY:\n{task}",
        ]

        # Run in parallel
        results = await asyncio.gather(*[
            self.local.generate(p, role="proposer") for p in prompts
        ])

        local_tokens = sum(r.total_tokens for r in results)
        solutions = [r.content for r in results]

        # Opus synthesizes
        synthesis_prompt = f"""Task: {task}

Three different approaches were generated:

APPROACH 1 (Simplicity focus):
{solutions[0]}

APPROACH 2 (Correctness focus):
{solutions[1]}

APPROACH 3 (Efficiency focus):
{solutions[2]}

Synthesize the best aspects of these approaches into a single, optimal solution."""

        synthesis = await self.local.generate(
            synthesis_prompt,
            role="proposer",
            force_backend="claude"
        )

        success = True
        failure_reason = None
        if verifier:
            success, feedback = await verifier(synthesis.content, task)
            if not success:
                failure_reason = feedback[:100]

        return HybridResult(
            success=success,
            solution=synthesis.content,
            strategy_used=Strategy.PARALLEL_EXPLORE,
            local_tokens=local_tokens,
            opus_tokens=synthesis.total_tokens,
            total_cost=sum(r.cost_usd for r in results) + synthesis.cost_usd,
            total_time=0,
            local_attempts=3,
            opus_attempts=1,
            escalated=False,
            difficulty=Difficulty.MEDIUM,
            failure_reason=failure_reason,
            what_worked="parallel_synthesis" if success else None,
        )

    def _pick_strategy(self, task_type: TaskType) -> Strategy:
        """Pick best strategy based on self-knowledge."""
        profile = self.knowledge.get_profile(task_type)

        # Not enough data - use filter_escalate as default
        if profile.total_attempts < 5:
            return Strategy.FILTER_ESCALATE

        # High success rate locally - try local first
        if profile.success_rate > 0.8:
            return Strategy.LOCAL_ONLY

        # Low success rate - consider parallel exploration
        if profile.success_rate < 0.5:
            return Strategy.PARALLEL_EXPLORE

        # Check what strategy has worked best
        best_strategy = self.knowledge.get_best_strategy(task_type)
        if best_strategy:
            try:
                return Strategy(best_strategy)
            except ValueError:
                pass

        return Strategy.FILTER_ESCALATE

    def _assess_difficulty(self, result: HybridResult) -> Difficulty:
        """Assess difficulty based on what happened."""
        if not result.success:
            return Difficulty.FAILED

        total_attempts = result.local_attempts + result.opus_attempts

        if total_attempts == 1 and result.opus_attempts == 0:
            return Difficulty.TRIVIAL
        elif total_attempts <= 2 and result.opus_attempts == 0:
            return Difficulty.EASY
        elif result.escalated or result.opus_attempts > 0:
            return Difficulty.HARD
        else:
            return Difficulty.MEDIUM

    def _log_discovery(self, task_type: TaskType, strategy: Strategy, what_worked: str):
        """Log interesting discoveries."""
        from datetime import datetime

        entry = f"""
## Discovery - {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}
- Task Type: {task_type.value}
- Strategy: {strategy.value}
- What Worked: {what_worked}
"""

        with open(self.log_path, "a") as f:
            f.write(entry)
