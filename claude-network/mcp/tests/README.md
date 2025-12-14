# MCP Server Test Suite

Comprehensive test suite for the Sartor Claude Network MCP server and gateway skill.

## Overview

This test suite provides complete coverage of the MCP server implementation, including:

- **Unit Tests**: Individual tool testing with mocked dependencies
- **Integration Tests**: Server and tool pipeline integration
- **Gateway Tests**: All 5 discovery methods and connection workflows
- **End-to-End Tests**: Complete workflows from start to finish
- **Performance Tests**: Measured performance metrics
- **Security Tests**: Authentication, input validation, and attack prevention

## Directory Structure

```
tests/
├── fixtures/               # Test fixtures and mocks
│   ├── __init__.py
│   ├── mock_firebase.py   # Mock Firebase client
│   ├── mock_github.py     # Mock GitHub client
│   ├── test_config.json   # Test configuration
│   └── test_data.py       # Test data generators
│
├── test_unit.py           # Unit tests for all tools
├── test_integration.py    # Integration tests
├── test_gateway_comprehensive.py  # Gateway tests
├── test_e2e.py           # End-to-end tests
├── test_performance.py    # Performance benchmarks
├── test_security.py       # Security tests
├── run_all_tests.py       # Test runner
└── README.md             # This file
```

## Installation

### Requirements

- Python 3.10+
- pytest
- asyncio (standard library)
- psutil (for performance tests)

### Install Dependencies

```bash
cd /home/alton/vayu-learning-project/claude-network/mcp/tests
pip install pytest pytest-asyncio psutil
```

## Running Tests

### Run All Tests

```bash
# From the tests directory
python run_all_tests.py

# Or using pytest directly
pytest -v
```

### Run Specific Test Suite

```bash
# Unit tests
pytest test_unit.py -v

# Integration tests
pytest test_integration.py -v

# Gateway tests
pytest test_gateway_comprehensive.py -v

# End-to-end tests
pytest test_e2e.py -v

# Performance tests
pytest test_performance.py -v -s  # -s to show print output

# Security tests
pytest test_security.py -v
```

### Run Specific Test

```bash
# Run a specific test class
pytest test_unit.py::TestFirebaseTools -v

# Run a specific test method
pytest test_unit.py::TestFirebaseTools::test_read_root -v
```

### Run Tests with Coverage

```bash
# Install coverage tool
pip install pytest-cov

# Run with coverage
pytest --cov=../tools --cov-report=html

# View coverage report
open htmlcov/index.html
```

## Test Suites

### 1. Unit Tests (`test_unit.py`)

Tests each tool independently with mocked dependencies.

**Coverage:**

- Firebase tools: read, write, delete, query
- GitHub tools: read_file, search, get_history, list_files
- Onboarding tools: welcome, checklist, setup_guide, verify_setup
- Navigation tools: list_agents, list_skills, list_tasks, get_system_status, find_expert

**Example:**

```bash
pytest test_unit.py::TestFirebaseTools::test_write_merge -v
```

### 2. Integration Tests (`test_integration.py`)

Tests the complete MCP server with tool integration.

**Coverage:**

- Server initialization and configuration
- Tool registration and loading
- Request handling (initialize, list_tools, call_tool, shutdown)
- Tool execution pipeline
- Error handling
- Session management

**Example:**

```bash
pytest test_integration.py::TestRequestHandling -v
```

### 3. Gateway Tests (`test_gateway_comprehensive.py`)

Tests all 5 discovery methods and connection workflows.

**Coverage:**

- Discovery methods: local, network, Firebase, GitHub, environment
- Connection establishment
- Tool activation
- Onboarding workflow
- Error scenarios
- Connection resilience

**Example:**

```bash
pytest test_gateway_comprehensive.py::TestDiscoveryMethods -v
```

### 4. End-to-End Tests (`test_e2e.py`)

Tests complete workflows from start to finish.

**Coverage:**

- Complete agent lifecycle
- Multi-agent scenarios
- Concurrent operations
- Message passing
- Task workflows
- Skill execution
- Error recovery

**Example:**

```bash
pytest test_e2e.py::TestMultiAgentScenarios -v
```

### 5. Performance Tests (`test_performance.py`)

Measures actual performance metrics.

**Metrics:**

- Connection speed (discovery, establishment)
- Tool execution latency (Firebase, GitHub)
- Multi-agent load capacity
- Memory usage per agent
- Message throughput
- Scalability

**Example:**

```bash
pytest test_performance.py -v -s  # -s to show performance output
```

**Sample Output:**

```
Local discovery: 12.34ms
Full discovery: 156.78ms for 4 endpoints
Connection establishment: 45.67ms
Firebase read latency: avg=8.92ms, max=23.45ms
100 concurrent writes: 234.56ms (426 writes/sec)
```

### 6. Security Tests (`test_security.py`)

Tests security measures and attack prevention.

**Coverage:**

- Authentication and authorization
- Input validation and sanitization
- SQL injection prevention
- Path traversal prevention
- Command injection prevention
- XSS prevention
- Rate limiting
- Malicious payloads
- DoS protection
- Data integrity

**Example:**

```bash
pytest test_security.py::TestInputValidation -v
```

## Test Fixtures

### Mock Firebase Client

Provides in-memory Firebase database for testing.

```python
from fixtures import MockFirebaseTools

firebase_tools = MockFirebaseTools()
result = await firebase_tools.write({'path': 'test/data', 'data': {'key': 'value'}})
```

### Mock GitHub Client

Provides mock GitHub API for testing.

```python
from fixtures import MockGitHubTools

github_tools = MockGitHubTools()
result = await github_tools.read_file({'path': 'README.md'})
```

### Test Data Generators

Generates test data for agents, tasks, skills, and messages.

```python
from fixtures import create_test_agent, create_test_task, generate_bulk_agents

agent = create_test_agent(status='online', role='worker')
task = create_test_task(status='available', priority='high')
agents = generate_bulk_agents(100)
```

## Writing New Tests

### Test Structure

```python
import pytest
import asyncio

class TestMyFeature:
    """Test suite for my feature."""

    @pytest.fixture
    def setup(self):
        """Setup test environment."""
        # Setup code
        yield  # Run test
        # Teardown code

    @pytest.mark.asyncio
    async def test_feature(self, setup):
        """Test specific feature."""
        # Arrange
        input_data = {'test': 'data'}

        # Act
        result = await my_function(input_data)

        # Assert
        assert result['success'] is True
        assert 'expected_key' in result
```

### Best Practices

1. **Use descriptive test names**: `test_firebase_read_nonexistent_path`
2. **One assertion per test** (when possible)
3. **Use fixtures for setup/teardown**
4. **Mock external dependencies**
5. **Test both success and failure cases**
6. **Include edge cases**
7. **Measure actual performance** (no estimates)
8. **Test error messages are helpful**

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.10
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-asyncio pytest-cov psutil
      - name: Run tests
        run: |
          cd claude-network/mcp/tests
          python run_all_tests.py
      - name: Generate coverage
        run: |
          pytest --cov=../tools --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

## Test Results

Test results are saved to `test_results.json` after each run:

```json
{
  "timestamp": "2025-11-03T10:00:00Z",
  "suites": {
    "Unit Tests": {
      "passed": 45,
      "failed": 0,
      "skipped": 0,
      "duration": 12.34
    }
  },
  "summary": {
    "total_tests": 123,
    "total_passed": 123,
    "total_failed": 0,
    "all_passed": true
  }
}
```

## Coverage Goals

- **Unit Tests**: 90%+ coverage of tool code
- **Integration Tests**: 80%+ coverage of server code
- **Gateway Tests**: 100% coverage of discovery methods
- **E2E Tests**: All critical user workflows
- **Performance Tests**: All tools benchmarked
- **Security Tests**: All attack vectors tested

## Troubleshooting

### Common Issues

**Issue**: `ModuleNotFoundError: No module named 'pytest'`

```bash
pip install pytest pytest-asyncio
```

**Issue**: `ModuleNotFoundError: No module named 'fixtures'`

```bash
# Make sure you're in the tests directory
cd /home/alton/vayu-learning-project/claude-network/mcp/tests
```

**Issue**: Tests timeout

```bash
# Increase timeout in pytest.ini or run with custom timeout
pytest --timeout=600
```

**Issue**: Performance tests fail on slow machines

- Performance thresholds are aggressive
- Adjust thresholds in test_performance.py if needed
- Mock delay times can be adjusted in fixture files

### Debug Mode

```bash
# Run with detailed output
pytest -vv --tb=long

# Show print statements
pytest -v -s

# Stop on first failure
pytest -x

# Run only failed tests from last run
pytest --lf
```

## Contributing

When adding new features to the MCP server:

1. **Write tests first** (TDD approach)
2. **Add unit tests** for new tools
3. **Add integration tests** for new request handlers
4. **Update E2E tests** for new workflows
5. **Add performance benchmarks** for new operations
6. **Add security tests** for new inputs
7. **Update this README** with new test information

## License

This test suite is part of the Sartor Claude Network project.

## Support

For questions or issues:

- Check the test output for detailed error messages
- Review the test code for examples
- Consult the main project documentation: `/claude-network/CLAUDE.md`

---

Generated: 2025-11-03
Version: 1.0.0
