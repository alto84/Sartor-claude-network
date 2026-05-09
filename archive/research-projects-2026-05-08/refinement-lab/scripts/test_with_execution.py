#!/usr/bin/env python3
"""
Test refinement with actual code execution verification.

This is more rigorous than LLM-based verification.
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from core.backends.router import BackendRouter, RouterConfig
from core.refinement.loop import RefinementLoop, RefinementConfig
from core.evaluation.verifiers import CodeVerifier, TestCase, make_code_verifier


async def test_fizzbuzz():
    """Test FizzBuzz - a classic that often has subtle bugs."""
    print("=" * 60)
    print("TEST: FizzBuzz with Code Execution Verification")
    print("=" * 60)

    problem = """Write a Python function called 'fizzbuzz' that takes an integer n and returns:
- "FizzBuzz" if n is divisible by both 3 and 5
- "Fizz" if n is divisible by 3 only
- "Buzz" if n is divisible by 5 only
- The number as a string otherwise

Examples: fizzbuzz(15) -> "FizzBuzz", fizzbuzz(9) -> "Fizz", fizzbuzz(10) -> "Buzz", fizzbuzz(7) -> "7"
"""

    test_cases = [
        TestCase(15, "FizzBuzz", "divisible by 3 and 5"),
        TestCase(30, "FizzBuzz", "another 3 and 5"),
        TestCase(9, "Fizz", "divisible by 3 only"),
        TestCase(6, "Fizz", "another 3 only"),
        TestCase(10, "Buzz", "divisible by 5 only"),
        TestCase(25, "Buzz", "another 5 only"),
        TestCase(7, "7", "not divisible"),
        TestCase(1, "1", "edge case 1"),
        TestCase(0, "FizzBuzz", "zero is divisible by everything"),
    ]

    verifier = make_code_verifier(test_cases, "fizzbuzz")

    router = BackendRouter(RouterConfig(
        prefer_local=True,
        ollama_host="192.168.1.100",
    ))

    config = RefinementConfig(max_iterations=5, verbose=True)
    loop = RefinementLoop(router, verifier=verifier, config=config)

    result = await loop.run(problem)

    print(f"\nFinal Result: {'SUCCESS' if result.success else 'FAILED'}")
    print(f"Iterations: {result.iterations}")
    print(f"Termination: {result.termination_reason}")

    await router.close()
    return result


async def test_prime_checker():
    """Test prime number checker - easy to get wrong for edge cases."""
    print("\n" + "=" * 60)
    print("TEST: Prime Checker with Code Execution Verification")
    print("=" * 60)

    problem = """Write a Python function called 'is_prime' that returns True if n is a prime number, False otherwise.
A prime number is greater than 1 and has no divisors other than 1 and itself.
Edge cases: 0, 1, 2, negative numbers are all not prime (return False).

Examples: is_prime(2) -> True, is_prime(17) -> True, is_prime(1) -> False, is_prime(4) -> False
"""

    test_cases = [
        TestCase(2, True, "smallest prime"),
        TestCase(3, True, "prime 3"),
        TestCase(17, True, "prime 17"),
        TestCase(97, True, "larger prime"),
        TestCase(1, False, "1 is not prime"),
        TestCase(0, False, "0 is not prime"),
        TestCase(-5, False, "negative not prime"),
        TestCase(4, False, "4 is composite"),
        TestCase(100, False, "100 is composite"),
        TestCase(49, False, "49 = 7*7"),
    ]

    verifier = make_code_verifier(test_cases, "is_prime")

    router = BackendRouter(RouterConfig(
        prefer_local=True,
        ollama_host="192.168.1.100",
    ))

    config = RefinementConfig(max_iterations=5, verbose=True)
    loop = RefinementLoop(router, verifier=verifier, config=config)

    result = await loop.run(problem)

    print(f"\nFinal Result: {'SUCCESS' if result.success else 'FAILED'}")
    print(f"Iterations: {result.iterations}")
    print(f"Termination: {result.termination_reason}")

    await router.close()
    return result


async def test_roman_numerals():
    """Test Roman numeral converter - tricky edge cases."""
    print("\n" + "=" * 60)
    print("TEST: Roman Numeral Converter with Code Execution")
    print("=" * 60)

    problem = """Write a Python function called 'to_roman' that converts an integer (1-3999) to a Roman numeral string.
Roman numerals: I=1, V=5, X=10, L=50, C=100, D=500, M=1000
Subtractive notation: IV=4, IX=9, XL=40, XC=90, CD=400, CM=900

Examples: to_roman(1) -> "I", to_roman(4) -> "IV", to_roman(9) -> "IX", to_roman(58) -> "LVIII", to_roman(1994) -> "MCMXCIV"
"""

    test_cases = [
        TestCase(1, "I", "one"),
        TestCase(4, "IV", "four (subtractive)"),
        TestCase(9, "IX", "nine (subtractive)"),
        TestCase(40, "XL", "forty (subtractive)"),
        TestCase(58, "LVIII", "fifty-eight"),
        TestCase(90, "XC", "ninety (subtractive)"),
        TestCase(400, "CD", "four hundred"),
        TestCase(900, "CM", "nine hundred"),
        TestCase(1994, "MCMXCIV", "1994 - complex"),
        TestCase(3999, "MMMCMXCIX", "maximum"),
    ]

    verifier = make_code_verifier(test_cases, "to_roman")

    router = BackendRouter(RouterConfig(
        prefer_local=True,
        ollama_host="192.168.1.100",
    ))

    config = RefinementConfig(max_iterations=5, verbose=True)
    loop = RefinementLoop(router, verifier=verifier, config=config)

    result = await loop.run(problem)

    print(f"\nFinal Result: {'SUCCESS' if result.success else 'FAILED'}")
    print(f"Iterations: {result.iterations}")
    print(f"Termination: {result.termination_reason}")

    await router.close()
    return result


async def main():
    print("REFINEMENT LAB: Code Execution Verification Tests")
    print("=" * 60)
    print("These tests use REAL code execution, not LLM verification.")
    print("This catches actual bugs, not just surface-level issues.")
    print()

    results = []

    # Run tests
    results.append(("FizzBuzz", await test_fizzbuzz()))
    results.append(("Prime Checker", await test_prime_checker()))
    results.append(("Roman Numerals", await test_roman_numerals()))

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)

    for name, result in results:
        status = "PASS" if result.success else "FAIL"
        print(f"  [{status}] {name}: {result.iterations} iterations, {result.termination_reason}")

    passed = sum(1 for _, r in results if r.success)
    print(f"\nPassed: {passed}/{len(results)}")


if __name__ == "__main__":
    asyncio.run(main())
