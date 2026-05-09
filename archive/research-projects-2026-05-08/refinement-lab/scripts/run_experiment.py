#!/usr/bin/env python3
"""
Run a refinement experiment.

Usage:
    python scripts/run_experiment.py --problem "Write a Python function..." --backend ollama
    python scripts/run_experiment.py --problem-file problems.txt --compare-strategies
"""

import asyncio
import argparse
import json
import sys
from pathlib import Path
from datetime import datetime

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.backends.router import BackendRouter, RouterConfig
from core.refinement.loop import RefinementLoop, RefinementConfig


async def run_single_problem(
    problem: str,
    router: BackendRouter,
    config: RefinementConfig
) -> dict:
    """Run refinement on a single problem."""
    loop = RefinementLoop(router, config=config)
    result = await loop.run(problem)
    return result.to_dict()


async def run_experiment(args):
    """Main experiment runner."""
    # Configure router
    router_config = RouterConfig(
        prefer_local=(args.backend == "ollama"),
        cost_limit_usd=args.cost_limit,
        ollama_host=args.ollama_host,
        ollama_port=args.ollama_port,
    )
    router = BackendRouter(router_config)

    # Configure refinement
    refinement_config = RefinementConfig(
        max_iterations=args.max_iterations,
        confidence_threshold=args.confidence_threshold,
        cost_limit_usd=args.cost_limit,
        verbose=args.verbose,
    )

    try:
        # Get problem(s)
        if args.problem:
            problems = [args.problem]
        elif args.problem_file:
            with open(args.problem_file) as f:
                problems = [line.strip() for line in f if line.strip()]
        else:
            # Default test problem
            problems = [
                "Write a Python function that checks if a string is a valid palindrome, "
                "ignoring case and non-alphanumeric characters. Include example usage."
            ]

        results = []
        for i, problem in enumerate(problems, 1):
            print(f"\n{'='*60}")
            print(f"Problem {i}/{len(problems)}")
            print(f"{'='*60}")
            print(problem[:200] + "..." if len(problem) > 200 else problem)
            print()

            result = await run_single_problem(problem, router, refinement_config)
            results.append(result)

            print(f"\nResult: {'SUCCESS' if result['success'] else 'FAILED'}")
            print(f"Iterations: {result['iterations']}")
            print(f"Cost: ${result['total_cost_usd']:.4f}")
            print(f"Latency: {result['total_latency_ms']:.0f}ms")
            print(f"Termination: {result['termination_reason']}")

        # Summary
        print(f"\n{'='*60}")
        print("EXPERIMENT SUMMARY")
        print(f"{'='*60}")
        success_count = sum(1 for r in results if r["success"])
        total_cost = sum(r["total_cost_usd"] for r in results)
        avg_iterations = sum(r["iterations"] for r in results) / len(results)

        print(f"Success rate: {success_count}/{len(results)} ({100*success_count/len(results):.1f}%)")
        print(f"Total cost: ${total_cost:.4f}")
        print(f"Average iterations: {avg_iterations:.1f}")

        # Save results
        if args.output:
            output_path = Path(args.output)
        else:
            output_path = Path(f"experiments/runs/experiment_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")

        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w") as f:
            json.dump({
                "config": {
                    "backend": args.backend,
                    "max_iterations": args.max_iterations,
                    "cost_limit": args.cost_limit,
                },
                "summary": {
                    "success_rate": success_count / len(results),
                    "total_cost_usd": total_cost,
                    "avg_iterations": avg_iterations,
                },
                "results": results,
            }, f, indent=2)
        print(f"\nResults saved to: {output_path}")

        # Print cost breakdown
        print("\nCost breakdown:")
        print(json.dumps(router.get_cost_summary(), indent=2))

    finally:
        await router.close()


def main():
    parser = argparse.ArgumentParser(description="Run refinement experiment")
    parser.add_argument("--problem", type=str, help="Problem to solve")
    parser.add_argument("--problem-file", type=str, help="File with problems (one per line)")
    parser.add_argument("--backend", choices=["ollama", "claude", "auto"], default="ollama",
                       help="Backend to use (default: ollama)")
    parser.add_argument("--ollama-host", default="192.168.1.100",
                       help="Ollama host (default: 192.168.1.100 = gpuserver1)")
    parser.add_argument("--ollama-port", type=int, default=11434,
                       help="Ollama port (default: 11434)")
    parser.add_argument("--max-iterations", type=int, default=5,
                       help="Maximum refinement iterations")
    parser.add_argument("--confidence-threshold", type=float, default=0.9,
                       help="Confidence threshold for early stopping")
    parser.add_argument("--cost-limit", type=float, default=1.0,
                       help="Cost limit in USD")
    parser.add_argument("--output", type=str, help="Output file path")
    parser.add_argument("--verbose", action="store_true", help="Verbose output")

    args = parser.parse_args()
    asyncio.run(run_experiment(args))


if __name__ == "__main__":
    main()
