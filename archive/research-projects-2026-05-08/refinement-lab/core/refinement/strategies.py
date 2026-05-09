"""
Refinement Strategies - Different approaches to self-improvement.

Strategies implement different refinement patterns:
- IterativeFeedback: Standard generate-verify-refine loop
- SelfCritique: Model critiques own output before verification
- BeamSearch: Maintain multiple candidates (future)
- Consensus: Multiple models vote on solutions (future)
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, List
from ..backends.router import BackendRouter


@dataclass
class StrategyResult:
    """Result from a strategy execution."""
    solution: str
    confidence: float
    iterations: int
    cost_usd: float
    metadata: dict


class RefinementStrategy(ABC):
    """Base class for refinement strategies."""

    @abstractmethod
    async def execute(
        self,
        problem: str,
        router: BackendRouter,
        max_iterations: int = 5
    ) -> StrategyResult:
        """Execute the refinement strategy."""
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """Strategy name for logging/comparison."""
        pass


class IterativeFeedback(RefinementStrategy):
    """
    Standard iterative feedback strategy.

    1. Generate solution
    2. Verify correctness
    3. If incorrect, refine based on feedback
    4. Repeat until correct or max iterations
    """

    @property
    def name(self) -> str:
        return "iterative_feedback"

    async def execute(
        self,
        problem: str,
        router: BackendRouter,
        max_iterations: int = 5
    ) -> StrategyResult:
        """Execute iterative feedback refinement."""
        total_cost = 0.0
        solution = None

        for iteration in range(max_iterations):
            # Generate or refine
            if solution is None:
                result = await router.generate(
                    f"Solve this problem:\n{problem}",
                    system="Provide a complete solution. Think step by step.",
                    role="proposer"
                )
                solution = result.content
                total_cost += result.cost_usd

            # Verify
            verify_result = await router.generate(
                f"Problem: {problem}\n\nSolution: {solution}\n\nIs this correct? Say CORRECT or INCORRECT with reason.",
                system="Be a strict verifier. Only say CORRECT if completely right.",
                role="evaluator"
            )
            total_cost += verify_result.cost_usd

            if verify_result.content.strip().upper().startswith("CORRECT"):
                return StrategyResult(
                    solution=solution,
                    confidence=1.0,
                    iterations=iteration + 1,
                    cost_usd=total_cost,
                    metadata={"termination": "verified_correct"}
                )

            # Refine
            refine_result = await router.generate(
                f"Problem: {problem}\n\nCurrent solution: {solution}\n\nFeedback: {verify_result.content}\n\nProvide improved solution:",
                system="Fix the issues identified. Provide complete solution.",
                role="refiner"
            )
            solution = refine_result.content
            total_cost += refine_result.cost_usd

        return StrategyResult(
            solution=solution,
            confidence=0.5,
            iterations=max_iterations,
            cost_usd=total_cost,
            metadata={"termination": "max_iterations"}
        )


class SelfCritique(RefinementStrategy):
    """
    Self-critique strategy.

    1. Generate solution
    2. Model critiques own solution
    3. Refine based on self-critique
    4. Then verify with evaluator
    """

    @property
    def name(self) -> str:
        return "self_critique"

    async def execute(
        self,
        problem: str,
        router: BackendRouter,
        max_iterations: int = 5
    ) -> StrategyResult:
        """Execute self-critique refinement."""
        total_cost = 0.0

        # Initial generation
        result = await router.generate(
            f"Solve this problem:\n{problem}",
            system="Provide a complete solution. Think step by step.",
            role="proposer"
        )
        solution = result.content
        total_cost += result.cost_usd

        for iteration in range(max_iterations):
            # Self-critique
            critique_result = await router.generate(
                f"Problem: {problem}\n\nYour solution: {solution}\n\nCritique your own solution. What could be wrong?",
                system="Be critical. Look for bugs, edge cases, logical errors.",
                role="critic"
            )
            total_cost += critique_result.cost_usd

            # Check if critique found issues
            if "no issues" in critique_result.content.lower() or "looks correct" in critique_result.content.lower():
                # Verify with separate evaluator
                verify_result = await router.generate(
                    f"Problem: {problem}\n\nSolution: {solution}\n\nIs this correct?",
                    system="Verify strictly. CORRECT or INCORRECT.",
                    role="evaluator"
                )
                total_cost += verify_result.cost_usd

                if verify_result.content.strip().upper().startswith("CORRECT"):
                    return StrategyResult(
                        solution=solution,
                        confidence=1.0,
                        iterations=iteration + 1,
                        cost_usd=total_cost,
                        metadata={"termination": "verified_correct"}
                    )

            # Refine based on critique
            refine_result = await router.generate(
                f"Problem: {problem}\n\nCurrent: {solution}\n\nCritique: {critique_result.content}\n\nImprove:",
                system="Address the critique. Provide complete improved solution.",
                role="refiner"
            )
            solution = refine_result.content
            total_cost += refine_result.cost_usd

        return StrategyResult(
            solution=solution,
            confidence=0.5,
            iterations=max_iterations,
            cost_usd=total_cost,
            metadata={"termination": "max_iterations"}
        )
