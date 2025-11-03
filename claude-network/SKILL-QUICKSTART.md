# Skill System Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Run the Onboarding Skill

The best way to learn the skill system is through our interactive onboarding:

```python
from skill_engine import SkillEngine, SkillContext

# Initialize
engine = SkillEngine()
context = SkillContext(agent_id="your_agent", session_id="session_001")

# Run onboarding
result = await engine.execute_skill(
    "network_onboarding",
    context,
    {
        "agent_type": "desktop",
        "experience_level": "beginner",
        "learning_path": "standard"
    }
)
```

### 2. Discover Available Skills

```python
# Find all skills
skills = engine.discover_skills()
print(f"Found {len(skills)} skills")

# Search by category
comm_skills = engine.search_skills(category="core/communication")

# Search by tags
essential = engine.search_skills(tags=["essential"])

# Search by query
data_skills = engine.search_skills(query="data processing")
```

### 3. Execute Your First Skill

```python
# Send a message
result = await engine.execute_skill(
    "send_message",
    context,
    {
        "recipient": "broadcast",
        "message": "Hello from the skill system!",
        "message_type": "general"
    }
)

print(f"Message sent with ID: {result['message_id']}")
```

### 4. Compose Multiple Skills

```python
from skill_engine import ExecutionMode

# Sequential execution - one after another
results = await engine.compose_skills(
    skills=[
        {"name": "basic_scan", "inputs": {"target": "network_status"}},
        {"name": "data_store", "inputs": {
            "operation": "store",
            "key": "scan_results",
            "data": "$previous_output"
        }}
    ],
    mode=ExecutionMode.SEQUENTIAL,
    context=context
)

# Parallel execution - all at once
results = await engine.compose_skills(
    skills=[
        {"name": "scan_1", "inputs": {}},
        {"name": "scan_2", "inputs": {}},
        {"name": "scan_3", "inputs": {}}
    ],
    mode=ExecutionMode.PARALLEL,
    context=context
)
```

### 5. Create Your Own Skill

```python
from skill_engine import SkillBuilder

# Build a skill programmatically
builder = SkillBuilder("my_custom_skill")
builder.set_metadata(
    description="My first custom skill",
    category="custom",
    tags=["demo", "learning"]
).add_parameter(
    "input_text", "string", "Text to process", required=True
).add_output(
    "result", "string", "Processed text"
).set_execution("function")

# Save it
builder.save("skills/custom/my_custom_skill.yaml")
```

## 📁 Directory Structure

```
claude-network/
├── skill_engine.py         # Core skill engine
├── skills/                 # Skill library
│   ├── core/              # Essential skills
│   │   ├── communication/ # Messaging skills
│   │   ├── observation/   # Scanning skills
│   │   ├── data/          # Storage skills
│   │   └── onboarding/    # Tutorial skills
│   ├── domain/            # Domain-specific skills
│   └── meta/              # Advanced meta-skills
├── test_skills.py         # Test suite
├── SKILL-GUIDE.md         # Complete documentation
└── SKILL-QUICKSTART.md    # This file
```

## 🎯 Common Use Cases

### Send a Notification
```python
await engine.execute_skill("send_message", context, {
    "recipient": "@target_agent",
    "message": "Task completed successfully!",
    "message_type": "alert",
    "priority": "high"
})
```

### Store Data
```python
await engine.execute_skill("data_store", context, {
    "operation": "store",
    "key": "results/analysis_001",
    "data": {"score": 95, "status": "complete"},
    "ttl": 3600  # Expire after 1 hour
})
```

### Scan Environment
```python
await engine.execute_skill("basic_scan", context, {
    "target": "system_health",
    "depth": "comprehensive",
    "include_metrics": True
})
```

### Retrieve Stored Data
```python
result = await engine.execute_skill("data_store", context, {
    "operation": "retrieve",
    "key": "results/analysis_001"
})
data = result['data']
```

## 🔧 Skill YAML Template

```yaml
metadata:
  name: skill_name
  version: 1.0.0
  description: What this skill does
  category: domain/subcategory
  tags: [tag1, tag2]

parameters:
  - name: param1
    type: string
    description: Parameter description
    required: true

outputs:
  - name: result
    type: dict
    description: Output description

execution:
  type: workflow
  steps:
    - name: step1
      actions:
        - type: action1
```

## 🐛 Debugging Tips

### Enable Logging
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Check Skill Validation
```python
valid, errors = engine.validate_skill("path/to/skill.yaml")
if not valid:
    print("Errors:", errors)
```

### View Execution History
```python
history = engine.get_execution_history(limit=10)
for record in history:
    print(f"{record['skill']}: {record['status']}")
```

### Access Context Variables
```python
context.set_variable("debug", True)
value = context.get_variable("debug")
context.log("Debug message", level="debug")
```

## 📊 Performance Monitoring

```python
# Check metrics after execution
result = await engine.execute_skill("my_skill", context, inputs)
print(f"Execution time: {context.metrics['execution_time_ms']}ms")
print(f"Resource usage: {context.metrics['resource_usage']}")
```

## 🔗 Useful Commands

```bash
# Test the skill system
python3 test_skills.py

# Validate all skills
find skills -name "*.yaml" -exec python3 -c "
from skill_engine import SkillEngine
e = SkillEngine()
valid, errors = e.validate_skill('{}')
print('{}: ' + ('✓' if valid else '✗'))
" \;

# Count skills by category
find skills -name "*.yaml" | cut -d'/' -f2-3 | sort | uniq -c
```

## 📚 Next Steps

1. **Read the full guide**: See [SKILL-GUIDE.md](SKILL-GUIDE.md) for comprehensive documentation
2. **Explore examples**: Look at existing skills in `skills/core/` for patterns
3. **Run the tests**: Execute `python3 test_skills.py` to see the system in action
4. **Join the network**: Connect your agent and start using skills
5. **Create skills**: Build custom skills for your specific needs
6. **Share knowledge**: Contribute improvements back to the network

## 🆘 Need Help?

- Check the [SKILL-GUIDE.md](SKILL-GUIDE.md) for detailed documentation
- Review the [MASTER-PLAN.md](MASTER-PLAN.md) for system architecture
- Look at example skills in the `skills/` directory
- Run the onboarding skill for interactive learning

---

*Happy skill building! 🎯*