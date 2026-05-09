"""
Refinement Loop - Core Generate-Verify-Analyze-Refine cycle.

Based on poetiq architecture:
1. GENERATE: Propose solution using proposer model
2. VERIFY: Check solution correctness using evaluator
3. ANALYZE: If incorrect, analyze why and extract feedback
4. REFINE: Improve solution based on feedback
5. REPEAT: Until solution found or iteration limit reached
"""

from dataclasses import dataclass, field
from typing import List, Optional, Callable, Any, Awaitable
from enum import Enum
from datetime import datetime
import json

from ..backends.router import BackendRouter


class RefinementStatus(Enum):
    PENDING = "pending"
    GENERATING = "generating"
    VERIFYING = "verifying"
    ANALYZING = "analyzing"
    REFINING = "refining"
    SUCCESS = "success"
    FAILED = "failed"
    MAX_ITERATIONS = "max_iterations"
    COST_LIMIT = "cost_limit"


@dataclass
class RefinementStep:
    """Record of a single refinement iteration."""
    iteration: int
    status: RefinementStatus
    proposal: str
    verification_passed: Optional[bool] = None
    verification_feedback: Optional[str] = None
    confidence: float = 0.0
    cost_usd: float = 0.0
    latency_ms: float = 0.0
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> dict:
        return {
            "iteration": self.iteration,
            "status": self.status.value,
            "proposal": self.proposal[:500] + "..." if len(self.proposal) > 500 else self.proposal,
            "verification_passed": self.verification_passed,
            "verification_feedback": self.verification_feedback,
            "confidence": self.confidence,
            "cost_usd": self.cost_usd,
            "latency_ms": self.latency_ms,
            "timestamp": self.timestamp,
        }


@dataclass
class RefinementResult:
    """Result of a complete refinement run."""
    success: bool
    final_solution: Optional[str]
    iterations: int
    total_cost_usd: float
    total_latency_ms: float
    termination_reason: str
    steps: List[RefinementStep] = field(default_factory=list)
    problem: str = ""

    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "final_solution": self.final_solution,
            "iterations": self.iterations,
            "total_cost_usd": round(self.total_cost_usd, 4),
            "total_latency_ms": round(self.total_latency_ms, 2),
            "termination_reason": self.termination_reason,
            "steps": [s.to_dict() for s in self.steps],
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2)


@dataclass
class RefinementConfig:
    """Configuration for refinement loop."""
    max_iterations: int = 5
    confidence_threshold: float = 0.9
    cost_limit_usd: float = 1.0
    early_stop_on_success: bool = True
    verbose: bool = False


# Type for external verifiers
Verifier = Callable[[str, Any], Awaitable[tuple[bool, str]]]


class RefinementLoop:
    """
    Implements the Generate -> Verify -> Analyze -> Refine cycle.

    Usage:
        router = BackendRouter(...)
        loop = RefinementLoop(router, verifier=my_verifier)
        result = await loop.run("Solve this problem...")
    """

    def __init__(
        self,
        router: BackendRouter,
        verifier: Optional[Verifier] = None,
        config: Optional[RefinementConfig] = None
    ):
        self.router = router
        self.verifier = verifier
        self.config = config or RefinementConfig()

    async def run(
        self,
        problem: str,
        context: Optional[str] = None,
        initial_solution: Optional[str] = None
    ) -> RefinementResult:
        """
        Execute refinement loop until success or termination.

        Args:
            problem: The problem to solve
            context: Optional additional context
            initial_solution: Optional starting solution to refine
        """
        steps: List[RefinementStep] = []
        current_solution = initial_solution
        total_cost = 0.0
        total_latency = 0.0

        for iteration in range(1, self.config.max_iterations + 1):
            step_start = datetime.utcnow()

            if self.config.verbose:
                print(f"\n--- Iteration {iteration} ---")

            # GENERATE
            if current_solution is None:
                if self.config.verbose:
                    print("Generating initial solution...")
                proposal, gen_cost = await self._generate(problem, context)
            else:
                proposal = current_solution
                gen_cost = 0.0
                current_solution = None  # Only use initial on first pass

            total_cost += gen_cost

            # VERIFY
            if self.config.verbose:
                print("Verifying solution...")
            is_correct, feedback, verify_cost = await self._verify(problem, proposal)
            total_cost += verify_cost

            # ANALYZE confidence
            confidence, analyze_cost = await self._analyze_confidence(
                problem, proposal, feedback
            )
            total_cost += analyze_cost

            # Calculate step latency
            step_latency = (datetime.utcnow() - step_start).total_seconds() * 1000
            total_latency += step_latency

            # Record step
            step = RefinementStep(
                iteration=iteration,
                status=RefinementStatus.SUCCESS if is_correct else RefinementStatus.REFINING,
                proposal=proposal,
                verification_passed=is_correct,
                verification_feedback=feedback,
                confidence=confidence,
                cost_usd=gen_cost + verify_cost + analyze_cost,
                latency_ms=step_latency,
            )
            steps.append(step)

            if self.config.verbose:
                print(f"Verified: {is_correct}, Confidence: {confidence:.2f}")

            # Check termination conditions
            if is_correct and self.config.early_stop_on_success:
                return RefinementResult(
                    success=True,
                    final_solution=proposal,
                    iterations=iteration,
                    total_cost_usd=total_cost,
                    total_latency_ms=total_latency,
                    termination_reason="solution_verified",
                    steps=steps,
                    problem=problem,
                )

            if confidence >= self.config.confidence_threshold:
                return RefinementResult(
                    success=True,
                    final_solution=proposal,
                    iterations=iteration,
                    total_cost_usd=total_cost,
                    total_latency_ms=total_latency,
                    termination_reason="confidence_threshold",
                    steps=steps,
                    problem=problem,
                )

            # Check cost limit
            if total_cost >= self.config.cost_limit_usd:
                return RefinementResult(
                    success=False,
                    final_solution=proposal,
                    iterations=iteration,
                    total_cost_usd=total_cost,
                    total_latency_ms=total_latency,
                    termination_reason="cost_limit",
                    steps=steps,
                    problem=problem,
                )

            # REFINE for next iteration
            if self.config.verbose:
                print("Refining solution...")
            current_solution, refine_cost = await self._refine(problem, proposal, feedback)
            total_cost += refine_cost

        # Max iterations reached
        return RefinementResult(
            success=False,
            final_solution=steps[-1].proposal if steps else None,
            iterations=self.config.max_iterations,
            total_cost_usd=total_cost,
            total_latency_ms=total_latency,
            termination_reason="max_iterations",
            steps=steps,
            problem=problem,
        )

    async def _generate(
        self,
        problem: str,
        context: Optional[str]
    ) -> tuple[str, float]:
        """Generate initial solution."""
        system = """You are solving a problem. Provide a complete, working solution.
Think through the problem step by step before giving your final answer.
Be concise but thorough."""

        prompt = f"""Problem:
{problem}

{f"Additional Context: {context}" if context else ""}

Provide your solution:"""

        result = await self.router.generate(prompt, system, role="proposer")
        return result.content, result.cost_usd

    async def _verify(
        self,
        problem: str,
        solution: str
    ) -> tuple[bool, str, float]:
        """Verify solution correctness."""
        # Use external verifier if provided
        if self.verifier:
            is_correct, feedback = await self.verifier(solution, problem)
            return is_correct, feedback, 0.0

        # Otherwise use model-based verification
        system = """You are a strict solution verifier. Check if the solution is correct.
Only say CORRECT if the solution is completely right and would work.
Be rigorous - look for edge cases, bugs, and logical errors."""

        prompt = f"""Problem:
{problem}

Solution to verify:
{solution}

Is this solution correct? Respond with exactly one of:
CORRECT: [brief explanation of why it's correct]
INCORRECT: [specific issues found]"""

        result = await self.router.generate(prompt, system, role="evaluator")

        content = result.content.strip()
        is_correct = content.upper().startswith("CORRECT")

        return is_correct, content, result.cost_usd

    async def _analyze_confidence(
        self,
        problem: str,
        solution: str,
        feedback: str
    ) -> tuple[float, float]:
        """Analyze solution confidence (0-1)."""
        system = """Analyze the quality of a solution and provide a confidence score.
Consider: correctness, completeness, edge cases, and the verification feedback."""

        prompt = f"""Problem: {problem}

Solution: {solution}

Verification feedback: {feedback}

Rate your confidence that this solution is correct.
Respond with ONLY a number between 0.0 and 1.0:
- 0.0 = definitely wrong
- 0.5 = uncertain
- 1.0 = definitely correct

CONFIDENCE:"""

        result = await self.router.generate(prompt, system, role="evaluator")

        try:
            import re
            match = re.search(r'(\d+\.?\d*)', result.content)
            if match:
                confidence = float(match.group(1))
                return min(1.0, max(0.0, confidence)), result.cost_usd
        except (ValueError, AttributeError):
            pass

        return 0.5, result.cost_usd  # Default if parsing fails

    async def _refine(
        self,
        problem: str,
        current_solution: str,
        feedback: str
    ) -> tuple[str, float]:
        """Refine solution based on feedback."""
        system = """You are improving a solution based on feedback.
Fix the identified issues while preserving what works.
Provide a complete, improved solution."""

        prompt = f"""Problem:
{problem}

Current solution:
{current_solution}

Issues identified:
{feedback}

Provide an improved solution that addresses the feedback:"""

        result = await self.router.generate(prompt, system, role="refiner")
        return result.content, result.cost_usd
