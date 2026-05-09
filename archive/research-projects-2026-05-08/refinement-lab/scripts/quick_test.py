#!/usr/bin/env python3
"""
Quick test of the refinement lab infrastructure.

Tests:
1. Ollama backend connection
2. Simple generation
3. Basic refinement loop
"""

import asyncio
import sys
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.backends.ollama import OllamaBackend
from core.backends.router import BackendRouter, RouterConfig
from core.refinement.loop import RefinementLoop, RefinementConfig


async def test_ollama_connection():
    """Test basic Ollama connectivity."""
    print("1. Testing Ollama connection...")
    backend = OllamaBackend(host="192.168.1.100", port=11434)

    available = await backend.is_available()
    print(f"   Ollama available: {available}")

    if available:
        models = await backend.list_models()
        print(f"   Available models: {models}")

    await backend.close()
    return available


async def test_simple_generation():
    """Test simple generation."""
    print("\n2. Testing simple generation...")
    backend = OllamaBackend(host="192.168.1.100", port=11434)

    result = await backend.generate(
        "What is 15 + 27? Just give the number.",
        system="Answer concisely."
    )

    print(f"   Response: {result.content[:200]}")
    print(f"   Tokens: {result.input_tokens} in, {result.output_tokens} out")
    print(f"   Latency: {result.latency_ms:.0f}ms")

    await backend.close()
    return True


async def test_embeddings():
    """Test embedding generation."""
    print("\n3. Testing embeddings...")
    backend = OllamaBackend(host="192.168.1.100", port=11434)

    embedding = await backend.embed("This is a test sentence for embeddings.")
    print(f"   Embedding dimensions: {len(embedding)}")
    print(f"   First 5 values: {embedding[:5]}")

    await backend.close()
    return len(embedding) > 0


async def test_refinement_loop():
    """Test a simple refinement loop."""
    print("\n4. Testing refinement loop...")

    router = BackendRouter(RouterConfig(
        prefer_local=True,
        cost_limit_usd=1.0,
        ollama_host="192.168.1.100",
        ollama_port=11434,
    ))

    config = RefinementConfig(
        max_iterations=3,
        verbose=True,
    )

    loop = RefinementLoop(router, config=config)

    # Simple problem that should be solvable
    problem = """Write a Python function called 'add_numbers' that takes two arguments and returns their sum.

Example:
    add_numbers(2, 3) should return 5
    add_numbers(-1, 1) should return 0"""

    print(f"   Problem: {problem[:100]}...")
    result = await loop.run(problem)

    print(f"\n   Result: {'SUCCESS' if result.success else 'FAILED'}")
    print(f"   Iterations: {result.iterations}")
    print(f"   Termination: {result.termination_reason}")
    print(f"   Final solution preview:")
    print(f"   {result.final_solution[:300] if result.final_solution else 'None'}...")

    await router.close()
    return result.success


async def main():
    print("=" * 60)
    print("REFINEMENT LAB QUICK TEST")
    print("=" * 60)

    tests = [
        ("Ollama Connection", test_ollama_connection),
        ("Simple Generation", test_simple_generation),
        ("Embeddings", test_embeddings),
        ("Refinement Loop", test_refinement_loop),
    ]

    results = []
    for name, test_fn in tests:
        try:
            result = await test_fn()
            results.append((name, "PASS" if result else "FAIL"))
        except Exception as e:
            print(f"   ERROR: {e}")
            results.append((name, f"ERROR: {e}"))

    print("\n" + "=" * 60)
    print("TEST RESULTS")
    print("=" * 60)
    for name, result in results:
        status = "[OK]" if result == "PASS" else "[FAIL]"
        print(f"  {status} {name}: {result}")

    passed = sum(1 for _, r in results if r == "PASS")
    print(f"\nPassed: {passed}/{len(tests)}")


if __name__ == "__main__":
    asyncio.run(main())
