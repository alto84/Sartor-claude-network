"""
Skill Engine for Sartor Claude Network
Implements skill definition, discovery, execution, validation, and composition
"""

import json
import yaml
import os
import re
import asyncio
from typing import Dict, List, Any, Optional, Union, Callable
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
import logging
from datetime import datetime
import hashlib

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SkillStatus(Enum):
    """Skill execution status"""
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"
    SKIPPED = "skipped"


class ExecutionMode(Enum):
    """Skill execution modes"""
    SEQUENTIAL = "sequential"
    PARALLEL = "parallel"
    CONDITIONAL = "conditional"
    PIPELINE = "pipeline"


@dataclass
class SkillMetadata:
    """Skill metadata structure"""
    name: str
    version: str
    description: str
    category: str
    tags: List[str] = field(default_factory=list)
    author: Optional[str] = None
    created: Optional[str] = None
    updated: Optional[str] = None
    dependencies: List[str] = field(default_factory=list)
    permissions: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'name': self.name,
            'version': self.version,
            'description': self.description,
            'category': self.category,
            'tags': self.tags,
            'author': self.author,
            'created': self.created,
            'updated': self.updated,
            'dependencies': self.dependencies,
            'permissions': self.permissions
        }


@dataclass
class SkillParameter:
    """Skill parameter definition"""
    name: str
    type: str
    description: str
    required: bool = True
    default: Any = None
    validation: Optional[Dict] = None

    def validate(self, value: Any) -> bool:
        """Validate parameter value"""
        # Type checking
        type_map = {
            'string': str,
            'integer': int,
            'float': float,
            'boolean': bool,
            'list': list,
            'dict': dict
        }

        expected_type = type_map.get(self.type)
        if expected_type and not isinstance(value, expected_type):
            return False

        # Custom validation rules
        if self.validation:
            if 'min' in self.validation and value < self.validation['min']:
                return False
            if 'max' in self.validation and value > self.validation['max']:
                return False
            if 'pattern' in self.validation:
                if isinstance(value, str) and not re.match(self.validation['pattern'], value):
                    return False
            if 'enum' in self.validation and value not in self.validation['enum']:
                return False

        return True


@dataclass
class SkillOutput:
    """Skill output definition"""
    name: str
    type: str
    description: str
    schema: Optional[Dict] = None


@dataclass
class SkillContext:
    """Runtime context for skill execution"""
    agent_id: str
    session_id: str
    parent_skill: Optional[str] = None
    variables: Dict[str, Any] = field(default_factory=dict)
    logs: List[str] = field(default_factory=list)
    metrics: Dict[str, Any] = field(default_factory=dict)

    def log(self, message: str, level: str = "info"):
        """Add log entry"""
        entry = f"[{datetime.now().isoformat()}] [{level.upper()}] {message}"
        self.logs.append(entry)
        logger.log(getattr(logging, level.upper()), message)

    def set_variable(self, key: str, value: Any):
        """Set context variable"""
        self.variables[key] = value

    def get_variable(self, key: str, default: Any = None) -> Any:
        """Get context variable"""
        return self.variables.get(key, default)

    def record_metric(self, key: str, value: Any):
        """Record performance metric"""
        self.metrics[key] = value


class Skill:
    """Base skill class"""

    def __init__(self, definition: Dict, base_path: Optional[Path] = None):
        """Initialize skill from definition"""
        self.definition = definition
        self.base_path = base_path or Path.cwd()

        # Parse metadata
        meta = definition.get('metadata', {})
        self.metadata = SkillMetadata(
            name=meta.get('name', 'unnamed'),
            version=meta.get('version', '1.0.0'),
            description=meta.get('description', ''),
            category=meta.get('category', 'general'),
            tags=meta.get('tags', []),
            author=meta.get('author'),
            created=meta.get('created'),
            updated=meta.get('updated'),
            dependencies=meta.get('dependencies', []),
            permissions=meta.get('permissions', [])
        )

        # Parse parameters
        self.parameters = []
        for param_def in definition.get('parameters', []):
            self.parameters.append(SkillParameter(
                name=param_def['name'],
                type=param_def['type'],
                description=param_def.get('description', ''),
                required=param_def.get('required', True),
                default=param_def.get('default'),
                validation=param_def.get('validation')
            ))

        # Parse outputs
        self.outputs = []
        for output_def in definition.get('outputs', []):
            self.outputs.append(SkillOutput(
                name=output_def['name'],
                type=output_def['type'],
                description=output_def.get('description', ''),
                schema=output_def.get('schema')
            ))

        # Execution definition
        self.execution = definition.get('execution', {})

    def validate_inputs(self, inputs: Dict[str, Any]) -> tuple[bool, List[str]]:
        """Validate input parameters"""
        errors = []

        for param in self.parameters:
            if param.required and param.name not in inputs:
                errors.append(f"Required parameter '{param.name}' is missing")
                continue

            if param.name in inputs:
                value = inputs[param.name]
                if not param.validate(value):
                    errors.append(f"Parameter '{param.name}' validation failed")

        return len(errors) == 0, errors

    async def execute(self, context: SkillContext, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the skill"""
        context.log(f"Executing skill: {self.metadata.name}")

        # Validate inputs
        valid, errors = self.validate_inputs(inputs)
        if not valid:
            raise ValueError(f"Input validation failed: {', '.join(errors)}")

        # Execute based on type
        exec_type = self.execution.get('type', 'function')

        if exec_type == 'function':
            return await self._execute_function(context, inputs)
        elif exec_type == 'workflow':
            return await self._execute_workflow(context, inputs)
        elif exec_type == 'external':
            return await self._execute_external(context, inputs)
        else:
            raise ValueError(f"Unknown execution type: {exec_type}")

    async def _execute_function(self, context: SkillContext, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Execute function-based skill"""
        # This would be implemented by subclasses or dynamically loaded
        context.log("Executing function-based skill")
        return {'status': 'success', 'message': f"Executed {self.metadata.name}"}

    async def _execute_workflow(self, context: SkillContext, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Execute workflow-based skill"""
        steps = self.execution.get('steps', [])
        results = {}

        for step in steps:
            step_name = step.get('name', 'unnamed_step')
            context.log(f"Executing workflow step: {step_name}")

            # Handle different step types
            if step.get('skill'):
                # Execute another skill
                skill_result = await self._execute_skill_step(context, step, inputs)
                results[step_name] = skill_result
            elif step.get('condition'):
                # Conditional execution
                if self._evaluate_condition(step['condition'], context, results):
                    if step.get('then'):
                        results[step_name] = await self._execute_workflow_branch(
                            context, step['then'], inputs
                        )
                elif step.get('else'):
                    results[step_name] = await self._execute_workflow_branch(
                        context, step['else'], inputs
                    )

            # Update inputs with step results for next steps
            if step.get('outputs_to_inputs'):
                for mapping in step['outputs_to_inputs']:
                    inputs[mapping['to']] = results[step_name].get(mapping['from'])

        return results

    async def _execute_external(self, context: SkillContext, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Execute external command or API"""
        context.log("Executing external skill")
        # Implementation would handle external processes, APIs, etc.
        return {'status': 'success'}

    async def _execute_skill_step(self, context: SkillContext, step: Dict, inputs: Dict) -> Dict:
        """Execute a skill step within a workflow"""
        # This would load and execute another skill
        return {'status': 'success', 'step': step.get('name')}

    async def _execute_workflow_branch(self, context: SkillContext, branch: List, inputs: Dict) -> Dict:
        """Execute a workflow branch"""
        results = {}
        for step in branch:
            # Recursive execution of branch steps
            pass
        return results

    def _evaluate_condition(self, condition: Dict, context: SkillContext, results: Dict) -> bool:
        """Evaluate a workflow condition"""
        # Simple condition evaluation
        if 'equals' in condition:
            left = self._resolve_value(condition['equals']['left'], context, results)
            right = self._resolve_value(condition['equals']['right'], context, results)
            return left == right
        elif 'greater_than' in condition:
            left = self._resolve_value(condition['greater_than']['left'], context, results)
            right = self._resolve_value(condition['greater_than']['right'], context, results)
            return left > right
        # Add more condition types as needed
        return True

    def _resolve_value(self, value: Any, context: SkillContext, results: Dict) -> Any:
        """Resolve a value that might be a reference"""
        if isinstance(value, str) and value.startswith('$'):
            # Variable reference
            parts = value[1:].split('.')
            if parts[0] == 'context':
                return context.get_variable(parts[1]) if len(parts) > 1 else None
            elif parts[0] == 'results':
                return results.get(parts[1]) if len(parts) > 1 else None
        return value


class SkillEngine:
    """Main skill execution engine"""

    def __init__(self, skills_dir: Optional[Path] = None):
        """Initialize skill engine"""
        self.skills_dir = skills_dir or Path.cwd() / 'skills'
        self.skills_cache: Dict[str, Skill] = {}
        self.execution_history: List[Dict] = []
        self.running_skills: Dict[str, asyncio.Task] = {}

    def discover_skills(self) -> List[SkillMetadata]:
        """Discover all available skills"""
        discovered = []

        # Recursively search for skill files
        for skill_file in self.skills_dir.rglob('*.yaml'):
            try:
                skill = self.load_skill(skill_file)
                discovered.append(skill.metadata)
            except Exception as e:
                logger.error(f"Failed to load skill {skill_file}: {e}")

        for skill_file in self.skills_dir.rglob('*.yml'):
            try:
                skill = self.load_skill(skill_file)
                discovered.append(skill.metadata)
            except Exception as e:
                logger.error(f"Failed to load skill {skill_file}: {e}")

        return discovered

    def load_skill(self, skill_path: Union[str, Path]) -> Skill:
        """Load a skill from file"""
        skill_path = Path(skill_path)

        # Check cache
        cache_key = str(skill_path.absolute())
        if cache_key in self.skills_cache:
            return self.skills_cache[cache_key]

        # Load skill definition
        with open(skill_path, 'r') as f:
            if skill_path.suffix in ['.yaml', '.yml']:
                definition = yaml.safe_load(f)
            elif skill_path.suffix == '.json':
                definition = json.load(f)
            else:
                raise ValueError(f"Unsupported skill file format: {skill_path.suffix}")

        # Create skill instance
        skill = Skill(definition, skill_path.parent)

        # Cache it
        self.skills_cache[cache_key] = skill

        return skill

    def search_skills(self, query: str = "", tags: List[str] = None,
                     category: str = None) -> List[SkillMetadata]:
        """Search for skills by query, tags, or category"""
        skills = self.discover_skills()
        results = []

        for skill in skills:
            # Match query in name or description
            if query:
                query_lower = query.lower()
                if (query_lower not in skill.name.lower() and
                    query_lower not in skill.description.lower()):
                    continue

            # Match tags
            if tags and not any(tag in skill.tags for tag in tags):
                continue

            # Match category
            if category and skill.category != category:
                continue

            results.append(skill)

        return results

    async def execute_skill(self, skill_name: str, context: SkillContext,
                           inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a single skill"""
        # Find skill file
        skill_file = None
        for ext in ['.yaml', '.yml', '.json']:
            potential_path = self.skills_dir / f"{skill_name}{ext}"
            if potential_path.exists():
                skill_file = potential_path
                break

        if not skill_file:
            # Search in subdirectories
            for path in self.skills_dir.rglob(f"{skill_name}.*"):
                if path.suffix in ['.yaml', '.yml', '.json']:
                    skill_file = path
                    break

        if not skill_file:
            raise ValueError(f"Skill '{skill_name}' not found")

        # Load and execute
        skill = self.load_skill(skill_file)

        # Record execution start
        execution_id = hashlib.md5(f"{skill_name}_{datetime.now().isoformat()}".encode()).hexdigest()
        self.execution_history.append({
            'id': execution_id,
            'skill': skill_name,
            'started': datetime.now().isoformat(),
            'status': SkillStatus.RUNNING.value
        })

        try:
            result = await skill.execute(context, inputs)

            # Update execution history
            for record in self.execution_history:
                if record['id'] == execution_id:
                    record['completed'] = datetime.now().isoformat()
                    record['status'] = SkillStatus.SUCCESS.value
                    record['result'] = result
                    break

            return result

        except Exception as e:
            # Update execution history
            for record in self.execution_history:
                if record['id'] == execution_id:
                    record['completed'] = datetime.now().isoformat()
                    record['status'] = SkillStatus.FAILED.value
                    record['error'] = str(e)
                    break
            raise

    async def compose_skills(self, skills: List[Dict], mode: ExecutionMode,
                            context: SkillContext) -> Dict[str, Any]:
        """Compose multiple skills with specified execution mode"""
        results = {}

        if mode == ExecutionMode.SEQUENTIAL:
            # Execute skills one after another
            previous_output = {}
            for skill_config in skills:
                skill_name = skill_config['name']
                inputs = skill_config.get('inputs', {})

                # Map outputs from previous skill if specified
                if skill_config.get('use_previous_output'):
                    inputs.update(previous_output)

                result = await self.execute_skill(skill_name, context, inputs)
                results[skill_name] = result
                previous_output = result

        elif mode == ExecutionMode.PARALLEL:
            # Execute all skills concurrently
            tasks = []
            for skill_config in skills:
                skill_name = skill_config['name']
                inputs = skill_config.get('inputs', {})
                task = asyncio.create_task(
                    self.execute_skill(skill_name, context, inputs)
                )
                tasks.append((skill_name, task))

            # Wait for all to complete
            for skill_name, task in tasks:
                try:
                    results[skill_name] = await task
                except Exception as e:
                    results[skill_name] = {'error': str(e), 'status': 'failed'}

        elif mode == ExecutionMode.CONDITIONAL:
            # Execute based on conditions
            for skill_config in skills:
                condition = skill_config.get('condition')
                if condition:
                    # Evaluate condition
                    if self._evaluate_skill_condition(condition, context, results):
                        skill_name = skill_config['name']
                        inputs = skill_config.get('inputs', {})
                        result = await self.execute_skill(skill_name, context, inputs)
                        results[skill_name] = result
                else:
                    # No condition, always execute
                    skill_name = skill_config['name']
                    inputs = skill_config.get('inputs', {})
                    result = await self.execute_skill(skill_name, context, inputs)
                    results[skill_name] = result

        elif mode == ExecutionMode.PIPELINE:
            # Execute as a data pipeline
            pipeline_data = {}
            for skill_config in skills:
                skill_name = skill_config['name']
                inputs = skill_config.get('inputs', {})

                # Add pipeline data to inputs
                inputs['pipeline_data'] = pipeline_data

                result = await self.execute_skill(skill_name, context, inputs)
                results[skill_name] = result

                # Update pipeline data
                if 'pipeline_output' in result:
                    pipeline_data.update(result['pipeline_output'])

        return results

    def _evaluate_skill_condition(self, condition: Dict, context: SkillContext,
                                 results: Dict) -> bool:
        """Evaluate a condition for skill composition"""
        # Similar to Skill._evaluate_condition but at composition level
        if 'skill_succeeded' in condition:
            skill_name = condition['skill_succeeded']
            return skill_name in results and results[skill_name].get('status') == 'success'
        elif 'skill_failed' in condition:
            skill_name = condition['skill_failed']
            return skill_name in results and results[skill_name].get('status') == 'failed'
        elif 'variable_equals' in condition:
            var_name = condition['variable_equals']['variable']
            expected = condition['variable_equals']['value']
            return context.get_variable(var_name) == expected

        return True

    def validate_skill(self, skill_path: Union[str, Path]) -> tuple[bool, List[str]]:
        """Validate a skill definition"""
        errors = []

        try:
            skill = self.load_skill(skill_path)

            # Check required metadata
            if not skill.metadata.name:
                errors.append("Skill name is required")
            if not skill.metadata.version:
                errors.append("Skill version is required")
            if not skill.metadata.description:
                errors.append("Skill description is required")

            # Check parameters
            for param in skill.parameters:
                if not param.name:
                    errors.append("Parameter name is required")
                if not param.type:
                    errors.append(f"Parameter '{param.name}' type is required")

            # Check execution
            if not skill.execution:
                errors.append("Execution definition is required")

            exec_type = skill.execution.get('type')
            if exec_type not in ['function', 'workflow', 'external']:
                errors.append(f"Invalid execution type: {exec_type}")

            # Workflow-specific validation
            if exec_type == 'workflow':
                steps = skill.execution.get('steps', [])
                if not steps:
                    errors.append("Workflow must have at least one step")

        except Exception as e:
            errors.append(f"Failed to load skill: {str(e)}")

        return len(errors) == 0, errors

    def get_execution_history(self, limit: int = 10) -> List[Dict]:
        """Get recent execution history"""
        return self.execution_history[-limit:]

    def clear_cache(self):
        """Clear the skills cache"""
        self.skills_cache.clear()


# Skill Builder Helper
class SkillBuilder:
    """Helper class to build skill definitions programmatically"""

    def __init__(self, name: str):
        self.definition = {
            'metadata': {
                'name': name,
                'version': '1.0.0',
                'created': datetime.now().isoformat()
            },
            'parameters': [],
            'outputs': [],
            'execution': {}
        }

    def set_metadata(self, **kwargs) -> 'SkillBuilder':
        """Set metadata fields"""
        self.definition['metadata'].update(kwargs)
        return self

    def add_parameter(self, name: str, param_type: str, description: str = "",
                     required: bool = True, default: Any = None,
                     validation: Dict = None) -> 'SkillBuilder':
        """Add a parameter"""
        param = {
            'name': name,
            'type': param_type,
            'description': description,
            'required': required
        }
        if default is not None:
            param['default'] = default
        if validation:
            param['validation'] = validation

        self.definition['parameters'].append(param)
        return self

    def add_output(self, name: str, output_type: str,
                  description: str = "") -> 'SkillBuilder':
        """Add an output"""
        self.definition['outputs'].append({
            'name': name,
            'type': output_type,
            'description': description
        })
        return self

    def set_execution(self, exec_type: str, **kwargs) -> 'SkillBuilder':
        """Set execution definition"""
        self.definition['execution'] = {
            'type': exec_type,
            **kwargs
        }
        return self

    def add_workflow_step(self, name: str, **kwargs) -> 'SkillBuilder':
        """Add a workflow step"""
        if 'steps' not in self.definition['execution']:
            self.definition['execution']['steps'] = []

        step = {'name': name, **kwargs}
        self.definition['execution']['steps'].append(step)
        return self

    def build(self) -> Dict:
        """Build the skill definition"""
        return self.definition

    def save(self, path: Union[str, Path]):
        """Save skill definition to file"""
        path = Path(path)

        with open(path, 'w') as f:
            if path.suffix in ['.yaml', '.yml']:
                yaml.dump(self.definition, f, default_flow_style=False, sort_keys=False)
            elif path.suffix == '.json':
                json.dump(self.definition, f, indent=2)
            else:
                raise ValueError(f"Unsupported file format: {path.suffix}")


if __name__ == "__main__":
    # Example usage
    async def main():
        # Initialize engine
        engine = SkillEngine()

        # Create a sample skill programmatically
        builder = SkillBuilder("example_skill")
        builder.set_metadata(
            description="An example skill for demonstration",
            category="demo",
            tags=["example", "test"]
        ).add_parameter(
            "message", "string", "Message to process", required=True
        ).add_output(
            "result", "string", "Processed message"
        ).set_execution(
            "function"
        )

        # Save the skill
        skill_def = builder.build()
        print("Created skill definition:", json.dumps(skill_def, indent=2))

        # Create context
        context = SkillContext(
            agent_id="test_agent",
            session_id="test_session"
        )

        # Discover skills
        skills = engine.discover_skills()
        print(f"\nDiscovered {len(skills)} skills")

        # Search skills
        results = engine.search_skills(query="example")
        print(f"Found {len(results)} skills matching 'example'")

    # Run example
    asyncio.run(main())