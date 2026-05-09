"""
Verifiers for checking solution correctness.

Real verification (code execution, test running) is more rigorous than LLM-based verification.
"""

import re
import subprocess
import tempfile
import os
from dataclasses import dataclass
from typing import List, Any, Optional
from pathlib import Path


@dataclass
class TestCase:
    """A single test case."""
    input: Any
    expected: Any
    description: str = ""


@dataclass
class VerificationResult:
    """Result of verification."""
    passed: bool
    feedback: str
    passed_tests: int = 0
    total_tests: int = 0
    details: List[str] = None

    def __post_init__(self):
        if self.details is None:
            self.details = []


class CodeVerifier:
    """
    Verifies code solutions by actually executing them.

    Extracts code blocks from LLM output and runs them against test cases.
    """

    def __init__(self, timeout: float = 5.0):
        self.timeout = timeout

    def extract_python_code(self, text: str) -> Optional[str]:
        """Extract Python code from markdown code blocks or raw text."""
        # Try to find ```python blocks
        pattern = r'```python\s*(.*?)\s*```'
        matches = re.findall(pattern, text, re.DOTALL)
        if matches:
            return matches[0].strip()

        # Try to find ``` blocks (without language)
        pattern = r'```\s*(.*?)\s*```'
        matches = re.findall(pattern, text, re.DOTALL)
        if matches:
            # Check if it looks like Python
            code = matches[0].strip()
            if 'def ' in code or 'import ' in code or 'print(' in code:
                return code

        # Try to find function definition directly
        pattern = r'(def \w+\([^)]*\):.*?)(?=\n\n|\Z)'
        matches = re.findall(pattern, text, re.DOTALL)
        if matches:
            return matches[0].strip()

        return None

    async def verify(
        self,
        solution: str,
        problem: Any,  # Not used, but matches interface
        test_cases: List[TestCase] = None,
        function_name: str = None
    ) -> tuple[bool, str]:
        """
        Verify a solution by running it against test cases.

        Args:
            solution: The LLM output containing code
            problem: The problem description (for context in feedback)
            test_cases: List of TestCase objects to run
            function_name: Name of the function to test

        Returns:
            (passed: bool, feedback: str)
        """
        # Extract code
        code = self.extract_python_code(solution)
        if not code:
            return False, "INCORRECT: Could not extract Python code from solution"

        if not test_cases:
            return True, "CORRECT: No test cases provided (code extracted successfully)"

        # Run tests
        results = []
        passed = 0

        for i, tc in enumerate(test_cases, 1):
            success, output = self._run_test(code, function_name, tc.input, tc.expected)
            if success:
                passed += 1
                results.append(f"Test {i}: PASS - {tc.description or tc.input}")
            else:
                results.append(f"Test {i}: FAIL - {tc.description or tc.input}")
                results.append(f"  Expected: {tc.expected}, Got: {output}")

        all_passed = passed == len(test_cases)

        if all_passed:
            feedback = f"CORRECT: All {len(test_cases)} tests passed"
        else:
            feedback = f"INCORRECT: {passed}/{len(test_cases)} tests passed\n" + "\n".join(results)

        return all_passed, feedback

    def _run_test(
        self,
        code: str,
        function_name: str,
        test_input: Any,
        expected: Any
    ) -> tuple[bool, Any]:
        """Run a single test case."""
        # Build test script
        if isinstance(test_input, tuple):
            args = ", ".join(repr(x) for x in test_input)
        else:
            args = repr(test_input)

        test_script = f"""
{code}

import json
try:
    result = {function_name}({args})
    print(json.dumps({{"success": True, "result": result}}))
except Exception as e:
    print(json.dumps({{"success": False, "error": str(e)}}))
"""

        try:
            # Run in subprocess for isolation
            result = subprocess.run(
                ["python", "-c", test_script],
                capture_output=True,
                text=True,
                timeout=self.timeout
            )

            if result.returncode != 0:
                return False, f"Error: {result.stderr}"

            import json
            output = json.loads(result.stdout.strip())

            if not output.get("success"):
                return False, f"Exception: {output.get('error')}"

            actual = output.get("result")
            if actual == expected:
                return True, actual
            else:
                return False, actual

        except subprocess.TimeoutExpired:
            return False, "Timeout"
        except Exception as e:
            return False, f"Execution error: {e}"


# Convenience function for creating verifier callbacks
def make_code_verifier(
    test_cases: List[TestCase],
    function_name: str
):
    """Create a verifier function for the refinement loop."""
    verifier = CodeVerifier()

    async def verify(solution: str, problem: Any) -> tuple[bool, str]:
        return await verifier.verify(
            solution, problem, test_cases, function_name
        )

    return verify
