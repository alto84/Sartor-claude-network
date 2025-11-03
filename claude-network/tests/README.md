# Sartor Claude Network Testing Framework

## Overview

This testing framework provides comprehensive test coverage for the Sartor Claude Network multi-agent system. It includes unit tests, integration tests, fixtures, mocks, and CI/CD automation.

## Quick Start

### Installation

```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Install pre-commit hooks (optional but recommended)
pre-commit install
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_macs.py

# Run specific test class or function
pytest tests/test_macs.py::TestMACSProtocol
pytest tests/test_macs.py::TestMACSProtocol::test_message_format_validation

# Run tests by marker
pytest -m unit           # Unit tests only
pytest -m integration    # Integration tests only
pytest -m "not slow"     # Skip slow tests

# Run tests in parallel
pytest -n auto          # Auto-detect CPU cores
pytest -n 4            # Use 4 processes

# Run with verbose output
pytest -v

# Stop on first failure
pytest -x

# Show print statements
pytest -s
```

## Test Structure

```
tests/
├── __init__.py              # Test package initialization
├── README.md               # This file
├── unit/                   # Unit tests (planned)
├── integration/            # Integration tests (planned)
├── fixtures/              # Test fixtures and utilities
│   ├── mock_firebase.py   # Firebase mock implementation
│   ├── test_agents.py     # Pre-configured test agents
│   └── test_skills.py     # Pre-configured test skills
├── test_macs.py           # MACS protocol tests
├── test_task_manager.py   # Task management tests
├── test_skill_engine.py   # Skill system tests
├── test_config_manager.py # Configuration tests
└── test_agent_registry.py # Agent registry tests
```

## Test Coverage

### Current Coverage Areas

1. **MACS Protocol** (`test_macs.py`)
   - Message format validation
   - Firebase integration
   - GitHub fallback messaging
   - Message routing and priorities
   - Acknowledgments and heartbeats
   - Reliability features (retry, circuit breaker)

2. **Task Management** (`test_task_manager.py`)
   - Task creation and validation
   - Assignment and distribution
   - Dependency management
   - Priority queuing
   - Load balancing
   - Timeout handling
   - Progress tracking

3. **Skill Engine** (`test_skill_engine.py`)
   - Skill registration and discovery
   - Execution and validation
   - Skill composition/workflows
   - Version management
   - Learning and adaptation
   - Caching and optimization

4. **Configuration Management** (`test_config_manager.py`)
   - Config loading and validation
   - Environment-specific configs
   - Dynamic updates
   - Secret management
   - Schema validation
   - Config persistence

5. **Agent Registry** (`test_agent_registry.py`)
   - Agent registration/discovery
   - Capability tracking
   - Health monitoring
   - Load balancing
   - Group management
   - Resource allocation

### Coverage Goals

- **Target**: 80% code coverage minimum
- **Current**: Run `pytest --cov=. --cov-report=term` to check
- **HTML Report**: `pytest --cov=. --cov-report=html` then open `htmlcov/index.html`

## Test Fixtures

### Mock Firebase (`fixtures/mock_firebase.py`)

In-memory Firebase simulation for testing without external dependencies:

```python
from tests.fixtures.mock_firebase import (
    create_mock_firebase_app,
    populate_test_agents,
    populate_test_messages
)

# Create mock Firebase app
app = create_mock_firebase_app()
db = app.database

# Populate with test data
populate_test_agents(db)
populate_test_messages(db)

# Use in tests
agents = db.get_data("agents")
```

### Test Agents (`fixtures/test_agents.py`)

Pre-configured test agents for various scenarios:

```python
from tests.fixtures.test_agents import (
    create_desktop_agent,
    create_mobile_agent,
    create_worker_agent,
    create_agent_network,
    MockAgentCoordinator
)

# Create individual agents
desktop = create_desktop_agent()
mobile = create_mobile_agent()

# Create agent network
network = create_agent_network(size=10)

# Use coordinator for testing
coordinator = MockAgentCoordinator(network)
task = {"task_id": "t1", "required_capability": "data_processing"}
assigned = coordinator.assign_task(task)
```

### Test Skills (`fixtures/test_skills.py`)

Pre-configured skills and workflows:

```python
from tests.fixtures.test_skills import (
    create_data_processing_skill,
    create_skill_library,
    SkillComposer,
    SkillLearner
)

# Create individual skill
skill = create_data_processing_skill()
result = skill.execute({"data": [1, 2, 3]})

# Create skill library
library = create_skill_library()

# Compose workflows
composer = SkillComposer(library)
workflow = composer.create_workflow("pipeline", steps=[...])
```

## Test Markers

Custom pytest markers for organizing tests:

```python
import pytest

@pytest.mark.unit
def test_unit_example():
    """Unit test example"""
    pass

@pytest.mark.integration
def test_integration_example():
    """Integration test example"""
    pass

@pytest.mark.slow
def test_slow_operation():
    """Test that takes >1 second"""
    pass

@pytest.mark.firebase
def test_firebase_integration():
    """Test requiring Firebase mock"""
    pass

@pytest.mark.network
def test_network_simulation():
    """Test requiring network simulation"""
    pass
```

## Writing Tests

### Test Structure Guidelines

```python
class TestFeatureName:
    """Test suite for specific feature"""

    def setup_method(self):
        """Set up test fixtures before each test"""
        self.fixture = create_fixture()

    def teardown_method(self):
        """Clean up after each test"""
        self.fixture.cleanup()

    def test_normal_operation(self):
        """Test normal/happy path"""
        # Arrange
        input_data = {"key": "value"}

        # Act
        result = self.fixture.process(input_data)

        # Assert
        assert result["success"] is True
        assert "output" in result

    def test_error_handling(self):
        """Test error conditions"""
        with pytest.raises(ValueError):
            self.fixture.process(invalid_input)

    def test_edge_cases(self):
        """Test boundary conditions"""
        pass
```

### Best Practices

1. **Test Isolation**: Each test should be independent
2. **Clear Names**: Test names should describe what they test
3. **Arrange-Act-Assert**: Follow AAA pattern
4. **Mock External Dependencies**: Use fixtures for external services
5. **Test Data**: Use fixtures for consistent test data
6. **Assertions**: Be specific about what you're testing
7. **Documentation**: Add docstrings to test functions
8. **Markers**: Use appropriate markers for test categorization

## CI/CD Integration

### GitHub Actions Workflow

The `.github/workflows/tests.yml` file runs:

1. **Linting**: Code quality checks (black, flake8, mypy)
2. **Test Matrix**: Multiple Python versions and OS platforms
3. **Coverage**: Generate and upload coverage reports
4. **Security**: Bandit and safety checks
5. **Performance**: Basic performance benchmarks

### Running CI Locally

```bash
# Install act (GitHub Actions locally)
# https://github.com/nektos/act

# Run tests locally
act -j test

# Run specific job
act -j lint
```

## Performance Testing

### Load Testing

```python
# Example using locust
from locust import HttpUser, task, between

class NetworkUser(HttpUser):
    wait_time = between(1, 3)

    @task
    def send_message(self):
        self.client.post("/messages", json={
            "from": "test-agent",
            "content": "Test message"
        })
```

Run with: `locust -f perf_tests.py --host=http://localhost:8080`

### Profiling

```bash
# Profile specific test
python -m cProfile -s cumtime tests/test_macs.py

# Memory profiling
python -m memory_profiler tests/test_task_manager.py
```

## Debugging Tests

### Using pytest debugger

```bash
# Drop into debugger on failure
pytest --pdb

# Drop into debugger at start of test
pytest --trace
```

### Using IPython debugger

```python
def test_debug_example():
    data = process_data()
    import ipdb; ipdb.set_trace()  # Breakpoint
    assert data is not None
```

### Verbose Output

```bash
# Show all output
pytest -vvs

# Show local variables on failure
pytest -l

# Show test durations
pytest --durations=10
```

## Test Reports

### Coverage Reports

```bash
# Terminal report
pytest --cov=. --cov-report=term-missing

# HTML report
pytest --cov=. --cov-report=html
open htmlcov/index.html

# XML report (for CI)
pytest --cov=. --cov-report=xml

# JSON report
pytest --cov=. --cov-report=json
```

### Test Result Reports

```bash
# JUnit XML (for CI)
pytest --junitxml=report.xml

# HTML report
pytest --html=report.html --self-contained-html
```

## Troubleshooting

### Common Issues

1. **Import Errors**
   ```bash
   # Ensure PYTHONPATH includes project root
   export PYTHONPATH="${PYTHONPATH}:$(pwd)"
   ```

2. **Fixture Not Found**
   ```bash
   # Check fixture scope and availability
   pytest --fixtures
   ```

3. **Slow Tests**
   ```bash
   # Skip slow tests
   pytest -m "not slow"

   # Set timeout
   pytest --timeout=30
   ```

4. **Flaky Tests**
   ```bash
   # Re-run failures
   pytest --reruns 3 --reruns-delay 1
   ```

## Contributing

### Adding New Tests

1. Create test file following naming convention: `test_<feature>.py`
2. Add appropriate markers
3. Include docstrings
4. Update this README if adding new test categories
5. Ensure tests pass locally before committing

### Test Review Checklist

- [ ] Tests are isolated and independent
- [ ] Clear test names and descriptions
- [ ] Appropriate use of fixtures
- [ ] Good coverage of edge cases
- [ ] Proper error handling tests
- [ ] Performance considerations
- [ ] Documentation updated

## Resources

- [pytest Documentation](https://docs.pytest.org/)
- [pytest-cov Documentation](https://pytest-cov.readthedocs.io/)
- [Python Testing Best Practices](https://realpython.com/pytest-python-testing/)
- [Test-Driven Development](https://testdriven.io/)

## Contact

For questions about testing:
- Create an issue in the repository
- Check existing test examples
- Refer to pytest documentation

---

**Remember**: Good tests are the foundation of reliable software. Write tests first, code second!