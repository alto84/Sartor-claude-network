# Sartor Claude Network - Skill Development Guide

## Table of Contents
1. [Overview](#overview)
2. [Skill Architecture](#skill-architecture)
3. [Creating Skills](#creating-skills)
4. [Using Skills](#using-skills)
5. [Best Practices](#best-practices)
6. [Advanced Patterns](#advanced-patterns)
7. [Testing & Validation](#testing--validation)
8. [Examples](#examples)

---

## Overview

Skills are the fundamental building blocks of the Sartor Claude Network, representing reusable capabilities that agents can discover, execute, and compose. This guide provides comprehensive instructions for creating, using, and managing skills within the network.

### What is a Skill?

A skill is a self-contained unit of functionality that:
- **Encapsulates** specific capabilities or knowledge
- **Exposes** clear inputs and outputs
- **Validates** parameters and ensures safe execution
- **Composes** with other skills to create complex workflows
- **Evolves** through versioning and improvement

### Skill Philosophy

Our skill system follows these core principles:

1. **Progressive Disclosure**: Skills reveal complexity only when needed
2. **Composability**: Skills combine seamlessly into larger workflows
3. **Discoverability**: Skills are easily found through search and tags
4. **Evolvability**: Skills improve over time without breaking compatibility
5. **Safety**: Skills validate inputs and handle errors gracefully

---

## Skill Architecture

### File Structure

Skills are organized in a hierarchical directory structure:

```
skills/
├── core/                    # Essential network skills
│   ├── communication/       # Messaging and coordination
│   ├── observation/         # Scanning and monitoring
│   ├── data/               # Storage and retrieval
│   └── onboarding/         # Learning and tutorials
├── domain/                  # Specialized domain skills
│   ├── house/              # Home management
│   ├── science/            # Scientific computing
│   └── engineering/        # Software development
└── meta/                    # Advanced meta-skills
    ├── learning/           # Self-improvement
    ├── teaching/           # Knowledge transfer
    └── governance/         # Network management
```

### Skill Definition Format

Skills are defined in YAML format with the following structure:

```yaml
metadata:
  name: skill_name           # Unique identifier
  version: 1.0.0             # Semantic version
  description: "..."         # Clear description
  category: core/type        # Hierarchical category
  tags: []                   # Searchable tags
  author: "..."              # Creator
  created: "2025-11-03"      # Creation date
  updated: "2025-11-03"      # Last update
  dependencies: []           # Required skills
  permissions: []            # Required permissions

parameters:                  # Input parameters
  - name: param_name
    type: string            # string|integer|float|boolean|list|dict
    description: "..."
    required: true
    default: null
    validation:             # Optional validation rules
      min: 0
      max: 100
      pattern: "regex"
      enum: [...]

outputs:                    # Output specification
  - name: output_name
    type: string
    description: "..."
    schema:                 # Optional JSON schema
      properties:
        field:
          type: string

execution:                  # How the skill executes
  type: workflow           # workflow|function|external
  steps: []                # Execution steps
```

### Execution Types

1. **Function**: Simple, atomic operations
2. **Workflow**: Multi-step processes with branching
3. **External**: Calls to external systems or APIs

---

## Creating Skills

### Step 1: Design Your Skill

Before writing YAML, answer these questions:

1. **Purpose**: What specific problem does this skill solve?
2. **Inputs**: What information is needed to execute?
3. **Outputs**: What results will be produced?
4. **Dependencies**: What other skills or resources are required?
5. **Error Cases**: What could go wrong and how to handle it?

### Step 2: Write the Skill Definition

Use the SkillBuilder class for programmatic creation:

```python
from skill_engine import SkillBuilder

builder = SkillBuilder("my_skill")
builder.set_metadata(
    description="Performs specific task",
    category="domain/area",
    tags=["tag1", "tag2"]
).add_parameter(
    "input_data", "string", "Data to process", required=True
).add_output(
    "result", "dict", "Processing results"
).set_execution(
    "workflow",
    steps=[...]
)

# Save to file
builder.save("skills/domain/area/my_skill.yaml")
```

### Step 3: Define Workflow Steps

For workflow-based skills, define clear steps:

```yaml
execution:
  type: workflow
  steps:
    - name: validate_input
      description: Validate and prepare input
      actions:
        - type: validate_format
        - type: check_permissions

    - name: process_data
      description: Main processing logic
      parallel: true  # Execute branches in parallel
      branches:
        - name: analyze
          actions:
            - type: statistical_analysis
        - name: transform
          actions:
            - type: data_transformation

    - name: conditional_step
      description: Conditional execution
      condition:
        variable_equals:
          variable: process_type
          value: advanced
      actions:
        - type: advanced_processing
```

### Step 4: Add Error Handling

Define how your skill handles errors:

```yaml
error_handling:
  - error: invalid_input
    action: return_error
    message: "Input validation failed"

  - error: timeout
    action: retry_with_backoff
    max_retries: 3

  - error: resource_unavailable
    action: fallback
    fallback_skill: alternative_skill
```

### Step 5: Validate Your Skill

Use the validation system:

```python
from skill_engine import SkillEngine

engine = SkillEngine()
valid, errors = engine.validate_skill("path/to/skill.yaml")

if not valid:
    print("Validation errors:", errors)
```

---

## Using Skills

### Discovering Skills

Search for skills by query, tags, or category:

```python
# Search by text
skills = engine.search_skills(query="data processing")

# Filter by tags
skills = engine.search_skills(tags=["analysis", "fast"])

# Filter by category
skills = engine.search_skills(category="core/observation")
```

### Loading Skills

Load a skill from file:

```python
skill = engine.load_skill("skills/core/communication/send_message.yaml")
```

### Executing Skills

Execute a single skill:

```python
from skill_engine import SkillContext

# Create execution context
context = SkillContext(
    agent_id="my_agent",
    session_id="session_123"
)

# Execute skill
result = await engine.execute_skill(
    "send_message",
    context,
    inputs={
        "recipient": "@target_agent",
        "message": "Hello!",
        "message_type": "greeting"
    }
)
```

### Composing Skills

Combine multiple skills with different execution patterns:

```python
# Sequential execution
results = await engine.compose_skills(
    skills=[
        {"name": "scan_environment", "inputs": {"target": "network"}},
        {"name": "analyze_results", "use_previous_output": True},
        {"name": "generate_report", "use_previous_output": True}
    ],
    mode=ExecutionMode.SEQUENTIAL,
    context=context
)

# Parallel execution
results = await engine.compose_skills(
    skills=[
        {"name": "scan_network", "inputs": {"depth": "quick"}},
        {"name": "scan_system", "inputs": {"depth": "quick"}},
        {"name": "scan_tasks", "inputs": {"depth": "quick"}}
    ],
    mode=ExecutionMode.PARALLEL,
    context=context
)

# Conditional execution
results = await engine.compose_skills(
    skills=[
        {"name": "check_status", "inputs": {}},
        {
            "name": "send_alert",
            "condition": {"skill_failed": "check_status"},
            "inputs": {"message": "Status check failed"}
        }
    ],
    mode=ExecutionMode.CONDITIONAL,
    context=context
)
```

---

## Best Practices

### 1. Naming Conventions

- Use **lowercase with underscores** for skill names
- Be **descriptive but concise**
- Include **action verbs** (send_message, scan_network)
- Group related skills with **prefixes** (house_check_kitchen)

### 2. Version Management

- Follow **semantic versioning** (MAJOR.MINOR.PATCH)
- **MAJOR**: Breaking changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes

### 3. Parameter Design

- **Minimize required parameters** - use sensible defaults
- **Validate thoroughly** - catch errors early
- **Use enums** for limited choices
- **Document clearly** - include examples

### 4. Output Consistency

- **Standardize output structure** across similar skills
- **Include metadata** (timestamps, versions, confidence)
- **Provide both summary and detail** levels
- **Use consistent error formats**

### 5. Performance Considerations

- **Set appropriate timeouts** - don't block indefinitely
- **Use parallel execution** when possible
- **Cache expensive operations** - respect TTLs
- **Monitor resource usage** - CPU, memory, network

### 6. Documentation Standards

Every skill should include:

- **Clear description** of purpose and use cases
- **Parameter explanations** with examples
- **Output schemas** for complex results
- **Error scenarios** and handling
- **Performance characteristics**
- **Testing coverage**

### 7. Security Guidelines

- **Never store sensitive data** in skill definitions
- **Use environment variables** for credentials
- **Validate all inputs** against injection attacks
- **Implement rate limiting** for expensive operations
- **Audit access patterns** for anomalies

---

## Advanced Patterns

### Pattern 1: Skill Chaining

Create pipelines where each skill transforms data for the next:

```yaml
execution:
  type: workflow
  steps:
    - name: fetch_data
      skill: data_store
      inputs:
        operation: retrieve
        key: "$input.data_key"
      outputs_to_inputs:
        - from: data
          to: raw_data

    - name: process_data
      skill: data_processor
      inputs:
        data: "$previous.raw_data"
      outputs_to_inputs:
        - from: processed
          to: clean_data

    - name: analyze_data
      skill: data_analyzer
      inputs:
        data: "$previous.clean_data"
```

### Pattern 2: Recursive Skills

Skills that call themselves with modified parameters:

```yaml
execution:
  type: workflow
  steps:
    - name: process_item
      actions:
        - type: process_single_item

    - name: check_more_items
      condition:
        items_remaining: true
      skill: $self  # Recursive call
      inputs:
        items: "$remaining_items"
        depth: "$input.depth - 1"
```

### Pattern 3: Dynamic Skill Selection

Choose skills at runtime based on conditions:

```yaml
execution:
  type: workflow
  steps:
    - name: determine_skill
      actions:
        - type: analyze_requirements
        - type: select_best_skill

    - name: execute_selected
      dynamic_skill: "$previous.selected_skill"
      inputs:
        data: "$input.data"
```

### Pattern 4: Fallback Chains

Implement graceful degradation:

```yaml
execution:
  type: workflow
  steps:
    - name: try_primary
      skill: advanced_processor
      on_error: continue

    - name: try_secondary
      condition:
        previous_failed: true
      skill: standard_processor
      on_error: continue

    - name: fallback_basic
      condition:
        all_previous_failed: true
      skill: basic_processor
```

### Pattern 5: Skill Composition

Build complex skills from simpler ones:

```yaml
metadata:
  name: composite_analysis
  dependencies:
    - scan_environment
    - analyze_patterns
    - generate_insights

execution:
  type: workflow
  compose:
    - skill: scan_environment
      map_outputs:
        observations: scan_data
    - skill: analyze_patterns
      map_inputs:
        data: scan_data
      map_outputs:
        patterns: found_patterns
    - skill: generate_insights
      map_inputs:
        patterns: found_patterns
```

---

## Testing & Validation

### Unit Testing

Test individual skills in isolation:

```python
import pytest
from skill_engine import SkillEngine, SkillContext

@pytest.fixture
def engine():
    return SkillEngine()

@pytest.fixture
def context():
    return SkillContext("test_agent", "test_session")

async def test_skill_execution(engine, context):
    """Test basic skill execution"""
    result = await engine.execute_skill(
        "my_skill",
        context,
        {"param1": "value1"}
    )

    assert result['success'] == True
    assert 'output' in result

async def test_skill_validation(engine):
    """Test parameter validation"""
    valid, errors = engine.validate_skill("path/to/skill.yaml")
    assert valid == True
    assert len(errors) == 0

async def test_error_handling(engine, context):
    """Test error scenarios"""
    with pytest.raises(ValueError):
        await engine.execute_skill(
            "my_skill",
            context,
            {"invalid_param": "value"}
        )
```

### Integration Testing

Test skills working together:

```python
async def test_skill_composition(engine, context):
    """Test multiple skills in sequence"""
    results = await engine.compose_skills(
        skills=[
            {"name": "skill1", "inputs": {}},
            {"name": "skill2", "use_previous_output": True}
        ],
        mode=ExecutionMode.SEQUENTIAL,
        context=context
    )

    assert 'skill1' in results
    assert 'skill2' in results
    assert results['skill2']['used_previous'] == True
```

### Performance Testing

Measure skill performance:

```python
import time

async def test_skill_performance(engine, context):
    """Test skill execution time"""
    start = time.time()

    result = await engine.execute_skill(
        "my_skill",
        context,
        {"param1": "value1"}
    )

    duration = time.time() - start
    assert duration < 1.0  # Should complete within 1 second
    assert result['metrics']['execution_time_ms'] < 1000
```

### Validation Checklist

Before deploying a skill, verify:

- [ ] **Metadata complete** - all required fields present
- [ ] **Parameters validated** - types and constraints defined
- [ ] **Outputs documented** - schemas provided
- [ ] **Error handling comprehensive** - all cases covered
- [ ] **Tests passing** - unit and integration
- [ ] **Performance acceptable** - within limits
- [ ] **Documentation clear** - examples included
- [ ] **Security reviewed** - no vulnerabilities

---

## Examples

### Example 1: Simple Notification Skill

```yaml
metadata:
  name: send_notification
  version: 1.0.0
  description: Send notifications to users or agents
  category: core/communication
  tags: [notification, alert, messaging]

parameters:
  - name: recipient
    type: string
    description: Who to notify
    required: true

  - name: message
    type: string
    description: Notification content
    required: true

  - name: priority
    type: string
    description: Notification priority
    default: normal
    validation:
      enum: [low, normal, high, urgent]

outputs:
  - name: sent
    type: boolean
    description: Whether notification was sent

  - name: delivery_time
    type: string
    description: When delivered

execution:
  type: function
  handler: send_notification_handler
```

### Example 2: Complex Analysis Workflow

```yaml
metadata:
  name: comprehensive_analysis
  version: 2.0.0
  description: Perform comprehensive multi-stage analysis
  category: domain/analysis
  tags: [analysis, comprehensive, multi-stage]

parameters:
  - name: data_source
    type: string
    description: Source of data to analyze
    required: true

  - name: analysis_depth
    type: string
    description: How deep to analyze
    default: standard
    validation:
      enum: [quick, standard, deep, exhaustive]

  - name: output_format
    type: string
    description: Format for results
    default: json
    validation:
      enum: [json, yaml, markdown, html]

outputs:
  - name: analysis_results
    type: dict
    description: Complete analysis results
    schema:
      properties:
        summary:
          type: string
        findings:
          type: array
        recommendations:
          type: array
        confidence:
          type: float

  - name: report
    type: string
    description: Formatted report

execution:
  type: workflow
  steps:
    - name: data_collection
      parallel: true
      branches:
        - name: fetch_primary
          skill: data_fetcher
          inputs:
            source: "$input.data_source"

        - name: fetch_context
          skill: context_gatherer
          inputs:
            source: "$input.data_source"

    - name: preprocessing
      skill: data_preprocessor
      inputs:
        raw_data: "$previous.fetch_primary.data"
        context: "$previous.fetch_context.context"

    - name: analysis_pipeline
      condition:
        input.analysis_depth: [deep, exhaustive]
      steps:
        - name: statistical_analysis
          skill: stats_analyzer

        - name: pattern_detection
          skill: pattern_finder

        - name: anomaly_detection
          skill: anomaly_detector

    - name: generate_insights
      skill: insight_generator
      inputs:
        analysis_data: "$previous"
        depth: "$input.analysis_depth"

    - name: format_output
      skill: report_formatter
      inputs:
        data: "$previous.insights"
        format: "$input.output_format"

error_handling:
  - error: data_source_unavailable
    action: use_cached_data
    cache_max_age: 3600

  - error: analysis_timeout
    action: reduce_depth
    new_depth: quick

  - error: insufficient_data
    action: return_partial
    include_warning: true

performance:
  timeout:
    quick: 30
    standard: 120
    deep: 300
    exhaustive: 600

  resource_limits:
    memory_mb: 512
    cpu_cores: 2

testing:
  fixtures:
    - sample_data_small.json
    - sample_data_large.json
    - edge_cases.json
```

### Example 3: Self-Improving Skill

```yaml
metadata:
  name: adaptive_optimizer
  version: 3.1.0
  description: Self-improving optimization skill that learns from execution
  category: meta/learning
  tags: [adaptive, learning, optimization, self-improving]

parameters:
  - name: problem_definition
    type: dict
    description: Problem to optimize
    required: true

  - name: learning_rate
    type: float
    description: How quickly to adapt
    default: 0.1
    validation:
      min: 0.01
      max: 1.0

outputs:
  - name: solution
    type: dict
    description: Optimized solution

  - name: performance_metrics
    type: dict
    description: Performance indicators

  - name: learning_updates
    type: dict
    description: What was learned

execution:
  type: workflow
  steps:
    - name: load_history
      skill: data_store
      inputs:
        operation: retrieve
        key: "learning/optimizer/$input.problem_definition.type"

    - name: apply_learning
      description: Apply previously learned optimizations
      actions:
        - type: load_best_practices
        - type: adjust_parameters
        - type: set_initial_state

    - name: optimize
      description: Run optimization with current knowledge
      skill: base_optimizer
      inputs:
        problem: "$input.problem_definition"
        initial_params: "$previous.adjusted_params"

    - name: evaluate_performance
      description: Measure how well we did
      actions:
        - type: calculate_metrics
        - type: compare_to_baseline
        - type: identify_improvements

    - name: update_knowledge
      description: Learn from this execution
      condition:
        performance_improved: true
      skill: data_store
      inputs:
        operation: update
        key: "learning/optimizer/$input.problem_definition.type"
        data:
          parameters: "$optimization.best_params"
          performance: "$evaluation.metrics"
          timestamp: "$current_time"

    - name: share_learning
      description: Share improvements with network
      condition:
        significant_improvement: true
      skill: send_message
      inputs:
        recipient: broadcast
        message_type: knowledge
        message: "Improved optimization for $input.problem_definition.type"

meta_learning:
  track_metrics:
    - execution_time
    - solution_quality
    - resource_usage

  improvement_threshold: 0.05  # 5% improvement triggers learning

  share_threshold: 0.20  # 20% improvement shared with network
```

---

## Conclusion

The Sartor Claude Network skill system provides a powerful, flexible framework for building and composing agent capabilities. By following the guidelines in this document, you can create skills that are:

- **Discoverable** - Easy to find and understand
- **Reliable** - Validated and error-resistant
- **Composable** - Work well with other skills
- **Evolvable** - Improve over time
- **Performant** - Execute efficiently

Remember that skills are living entities that improve through use and feedback. Start simple, test thoroughly, and iterate based on real-world usage.

For questions or contributions, please refer to the main project documentation or contact the Sartor Network team.

---

*Last updated: 2025-11-03*
*Version: 1.0.0*