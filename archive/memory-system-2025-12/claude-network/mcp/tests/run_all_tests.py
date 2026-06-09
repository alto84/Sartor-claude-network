#!/usr/bin/env python3
"""
Test Runner for MCP Server Test Suite
======================================
Runs all tests, generates reports, and measures code coverage.
"""

import sys
import os
import json
import time
from pathlib import Path
from datetime import datetime
import subprocess

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


class TestRunner:
    """Main test runner class."""

    def __init__(self):
        """Initialize test runner."""
        self.test_dir = Path(__file__).parent
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'suites': {},
            'summary': {}
        }

    def run_test_suite(self, test_file, suite_name):
        """Run a specific test suite."""
        print(f"\n{'='*70}")
        print(f"Running {suite_name}")
        print(f"{'='*70}\n")

        start_time = time.time()

        # Run pytest
        cmd = [
            sys.executable, '-m', 'pytest',
            str(self.test_dir / test_file),
            '-v',
            '--tb=short',
            '--color=yes',
            '-x'  # Stop on first failure
        ]

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )

            duration = time.time() - start_time

            # Parse output
            output_lines = result.stdout.split('\n')
            passed = sum(1 for line in output_lines if 'PASSED' in line)
            failed = sum(1 for line in output_lines if 'FAILED' in line)
            skipped = sum(1 for line in output_lines if 'SKIPPED' in line)

            self.results['suites'][suite_name] = {
                'file': test_file,
                'passed': passed,
                'failed': failed,
                'skipped': skipped,
                'duration': duration,
                'return_code': result.returncode,
                'output': result.stdout[-1000:] if len(result.stdout) > 1000 else result.stdout
            }

            print(f"\n{suite_name} Results:")
            print(f"  Passed:  {passed}")
            print(f"  Failed:  {failed}")
            print(f"  Skipped: {skipped}")
            print(f"  Duration: {duration:.2f}s")

            return result.returncode == 0

        except subprocess.TimeoutExpired:
            print(f"\n{suite_name} TIMED OUT")
            self.results['suites'][suite_name] = {
                'file': test_file,
                'error': 'timeout',
                'duration': 300
            }
            return False

        except Exception as e:
            print(f"\n{suite_name} ERROR: {e}")
            self.results['suites'][suite_name] = {
                'file': test_file,
                'error': str(e),
                'duration': time.time() - start_time
            }
            return False

    def run_all_tests(self):
        """Run all test suites."""
        print("\n" + "="*70)
        print("MCP SERVER TEST SUITE")
        print("="*70)
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        # Check dependencies
        print("\nChecking dependencies...")
        self.check_dependencies()

        # Define test suites in order
        test_suites = [
            ('test_unit.py', 'Unit Tests'),
            ('test_integration.py', 'Integration Tests'),
            ('test_gateway_comprehensive.py', 'Gateway Tests'),
            ('test_e2e.py', 'End-to-End Tests'),
            ('test_performance.py', 'Performance Tests'),
            ('test_security.py', 'Security Tests')
        ]

        overall_start = time.time()
        all_passed = True

        # Run each test suite
        for test_file, suite_name in test_suites:
            if not (self.test_dir / test_file).exists():
                print(f"\nSkipping {suite_name} - file not found: {test_file}")
                continue

            passed = self.run_test_suite(test_file, suite_name)

            if not passed:
                all_passed = False
                print(f"\n{suite_name} FAILED - stopping test run")
                break

        overall_duration = time.time() - overall_start

        # Generate summary
        self.generate_summary(overall_duration, all_passed)

        # Save results
        self.save_results()

        # Print final report
        self.print_final_report()

        return 0 if all_passed else 1

    def check_dependencies(self):
        """Check if required dependencies are installed."""
        required_packages = ['pytest', 'asyncio', 'psutil']

        missing = []
        for package in required_packages:
            try:
                __import__(package)
                print(f"  ✓ {package}")
            except ImportError:
                print(f"  ✗ {package} - MISSING")
                missing.append(package)

        if missing:
            print(f"\nMissing packages: {', '.join(missing)}")
            print("Install with: pip install " + " ".join(missing))
            sys.exit(1)

    def generate_summary(self, duration, all_passed):
        """Generate summary statistics."""
        total_passed = sum(s.get('passed', 0) for s in self.results['suites'].values())
        total_failed = sum(s.get('failed', 0) for s in self.results['suites'].values())
        total_skipped = sum(s.get('skipped', 0) for s in self.results['suites'].values())
        total_tests = total_passed + total_failed + total_skipped

        self.results['summary'] = {
            'total_suites': len(self.results['suites']),
            'total_tests': total_tests,
            'total_passed': total_passed,
            'total_failed': total_failed,
            'total_skipped': total_skipped,
            'duration': duration,
            'all_passed': all_passed
        }

    def save_results(self):
        """Save test results to file."""
        results_file = self.test_dir / 'test_results.json'

        with open(results_file, 'w') as f:
            json.dump(self.results, f, indent=2)

        print(f"\nResults saved to: {results_file}")

    def print_final_report(self):
        """Print final test report."""
        summary = self.results['summary']

        print("\n" + "="*70)
        print("FINAL TEST REPORT")
        print("="*70)

        print(f"\nTotal Suites:  {summary['total_suites']}")
        print(f"Total Tests:   {summary['total_tests']}")
        print(f"  Passed:      {summary['total_passed']}")
        print(f"  Failed:      {summary['total_failed']}")
        print(f"  Skipped:     {summary['total_skipped']}")
        print(f"Duration:      {summary['duration']:.2f}s")

        if summary['all_passed']:
            print("\n✓ ALL TESTS PASSED")
        else:
            print("\n✗ SOME TESTS FAILED")

        print("\nSuite Breakdown:")
        for suite_name, suite_results in self.results['suites'].items():
            if 'error' in suite_results:
                print(f"  {suite_name}: ERROR - {suite_results['error']}")
            else:
                status = "✓" if suite_results['return_code'] == 0 else "✗"
                print(f"  {status} {suite_name}: {suite_results['passed']} passed, "
                      f"{suite_results['failed']} failed, "
                      f"{suite_results['skipped']} skipped "
                      f"({suite_results['duration']:.2f}s)")

        print("\n" + "="*70)


def main():
    """Main entry point."""
    runner = TestRunner()
    exit_code = runner.run_all_tests()
    sys.exit(exit_code)


if __name__ == '__main__':
    main()
