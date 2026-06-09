"""
Test skill configurations and utilities

Provides pre-configured test skills for various testing scenarios.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
import random
import json


class TestSkill:
    """Test skill with configurable properties"""

    def __init__(self, skill_id: str, name: str, category: str,
                 inputs: Dict = None, outputs: Dict = None,
                 success_rate: float = 0.95):
        """Initialize test skill"""
        self.skill_id = skill_id
        self.name = name
        self.category = category
        self.version = "1.0.0"
        self.inputs = inputs or {}
        self.outputs = outputs or {}
        self.success_rate = success_rate
        self.execution_count = 0
        self.total_duration = 0
        self.last_executed = None
        self.metadata = {
            "created_at": datetime.now().isoformat(),
            "author": "test_system"
        }

    def to_dict(self) -> Dict[str, Any]:
        """Convert skill to dictionary"""
        return {
            "skill_id": self.skill_id,
            "name": self.name,
            "category": self.category,
            "version": self.version,
            "inputs": self.inputs,
            "outputs": self.outputs,
            "success_rate": self.success_rate,
            "metadata": self.metadata
        }

    def execute(self, input_data: Dict) -> Dict[str, Any]:
        """Execute skill with input data"""
        # Validate inputs
        for input_name, spec in self.inputs.items():
            if spec.get("required", False) and input_name not in input_data:
                return {
                    "success": False,
                    "error": f"Missing required input: {input_name}"
                }

        # Simulate execution
        import time
        execution_time = random.uniform(0.1, 2.0)
        time.sleep(execution_time / 10)  # Scale down for testing

        self.execution_count += 1
        self.total_duration += execution_time
        self.last_executed = datetime.now().isoformat()

        # Simulate success/failure based on success rate
        if random.random() < self.success_rate:
            return {
                "success": True,
                "output": self._generate_output(input_data),
                "execution_time": execution_time,
                "skill_id": self.skill_id
            }
        else:
            return {
                "success": False,
                "error": "Simulated execution failure",
                "execution_time": execution_time,
                "skill_id": self.skill_id
            }

    def _generate_output(self, input_data: Dict) -> Dict:
        """Generate output based on skill type"""
        if self.category == "data_processing":
            return {
                "processed_items": len(input_data.get("data", [])),
                "summary": "Data processed successfully"
            }
        elif self.category == "analysis":
            return {
                "insights": ["Pattern A detected", "Anomaly at index 5"],
                "confidence": 0.87
            }
        elif self.category == "communication":
            return {
                "message_sent": True,
                "recipients": input_data.get("recipients", [])
            }
        else:
            return {"result": "Execution completed"}

    def get_metrics(self) -> Dict[str, Any]:
        """Get skill performance metrics"""
        if self.execution_count == 0:
            return {
                "execution_count": 0,
                "avg_duration": 0,
                "success_rate": self.success_rate
            }

        return {
            "execution_count": self.execution_count,
            "avg_duration": self.total_duration / self.execution_count,
            "success_rate": self.success_rate,
            "last_executed": self.last_executed
        }


# Pre-configured test skills

def create_data_processing_skill() -> TestSkill:
    """Create data processing skill"""
    return TestSkill(
        skill_id="data_processing",
        name="Data Processing",
        category="data_processing",
        inputs={
            "data": {"type": "array", "required": True},
            "format": {"type": "string", "required": False, "default": "json"}
        },
        outputs={
            "processed_items": {"type": "integer"},
            "summary": {"type": "string"}
        },
        success_rate=0.95
    )


def create_image_analysis_skill() -> TestSkill:
    """Create image analysis skill"""
    return TestSkill(
        skill_id="image_analysis",
        name="Image Analysis",
        category="vision",
        inputs={
            "image_path": {"type": "string", "required": True},
            "analysis_type": {"type": "string", "required": False, "enum": ["objects", "faces", "text"]}
        },
        outputs={
            "detections": {"type": "array"},
            "confidence_scores": {"type": "array"},
            "metadata": {"type": "object"}
        },
        success_rate=0.9
    )


def create_text_analysis_skill() -> TestSkill:
    """Create text analysis skill"""
    return TestSkill(
        skill_id="text_analysis",
        name="Text Analysis",
        category="nlp",
        inputs={
            "text": {"type": "string", "required": True},
            "language": {"type": "string", "required": False, "default": "en"},
            "analysis": {"type": "array", "required": False, "default": ["sentiment", "entities"]}
        },
        outputs={
            "sentiment": {"type": "object"},
            "entities": {"type": "array"},
            "keywords": {"type": "array"}
        },
        success_rate=0.92
    )


def create_sensor_reading_skill() -> TestSkill:
    """Create sensor reading skill"""
    return TestSkill(
        skill_id="sensor_reading",
        name="Sensor Reading",
        category="hardware",
        inputs={
            "sensor_id": {"type": "string", "required": True},
            "reading_type": {"type": "string", "required": False}
        },
        outputs={
            "value": {"type": "number"},
            "unit": {"type": "string"},
            "timestamp": {"type": "string"}
        },
        success_rate=0.98
    )


def create_task_coordination_skill() -> TestSkill:
    """Create task coordination skill"""
    return TestSkill(
        skill_id="task_coordination",
        name="Task Coordination",
        category="coordination",
        inputs={
            "tasks": {"type": "array", "required": True},
            "agents": {"type": "array", "required": True},
            "strategy": {"type": "string", "required": False, "default": "load_balanced"}
        },
        outputs={
            "assignments": {"type": "array"},
            "schedule": {"type": "object"},
            "estimated_completion": {"type": "string"}
        },
        success_rate=0.93
    )


def create_consensus_skill() -> TestSkill:
    """Create consensus building skill"""
    return TestSkill(
        skill_id="consensus_building",
        name="Consensus Building",
        category="governance",
        inputs={
            "proposal": {"type": "object", "required": True},
            "voters": {"type": "array", "required": True},
            "threshold": {"type": "number", "required": False, "default": 0.66}
        },
        outputs={
            "decision": {"type": "string", "enum": ["approved", "rejected"]},
            "vote_count": {"type": "object"},
            "participation_rate": {"type": "number"}
        },
        success_rate=0.99
    )


def create_learning_skill() -> TestSkill:
    """Create machine learning skill"""
    return TestSkill(
        skill_id="machine_learning",
        name="Machine Learning",
        category="learning",
        inputs={
            "training_data": {"type": "array", "required": True},
            "model_type": {"type": "string", "required": False},
            "parameters": {"type": "object", "required": False}
        },
        outputs={
            "model": {"type": "object"},
            "accuracy": {"type": "number"},
            "predictions": {"type": "array"}
        },
        success_rate=0.88
    )


def create_unreliable_skill() -> TestSkill:
    """Create skill with low reliability for testing"""
    return TestSkill(
        skill_id="unreliable_task",
        name="Unreliable Task",
        category="testing",
        inputs={
            "input": {"type": "any", "required": False}
        },
        outputs={
            "result": {"type": "any"}
        },
        success_rate=0.3  # Fails 70% of the time
    )


def create_skill_library() -> List[TestSkill]:
    """Create a library of diverse skills"""
    return [
        create_data_processing_skill(),
        create_image_analysis_skill(),
        create_text_analysis_skill(),
        create_sensor_reading_skill(),
        create_task_coordination_skill(),
        create_consensus_skill(),
        create_learning_skill()
    ]


class SkillComposer:
    """Compose multiple skills into workflows"""

    def __init__(self, skills: List[TestSkill] = None):
        """Initialize skill composer"""
        self.skills = {s.skill_id: s for s in (skills or [])}
        self.workflows = {}

    def add_skill(self, skill: TestSkill):
        """Add skill to composer"""
        self.skills[skill.skill_id] = skill

    def create_workflow(self, workflow_id: str, steps: List[Dict]) -> Dict:
        """Create workflow from skill steps"""
        workflow = {
            "workflow_id": workflow_id,
            "steps": steps,
            "created_at": datetime.now().isoformat(),
            "status": "created"
        }

        # Validate workflow
        for step in steps:
            if step["skill_id"] not in self.skills:
                raise ValueError(f"Unknown skill: {step['skill_id']}")

        self.workflows[workflow_id] = workflow
        return workflow

    def execute_workflow(self, workflow_id: str, initial_input: Dict) -> Dict:
        """Execute workflow with initial input"""
        if workflow_id not in self.workflows:
            return {"success": False, "error": "Workflow not found"}

        workflow = self.workflows[workflow_id]
        results = []
        current_input = initial_input

        for step in workflow["steps"]:
            skill = self.skills[step["skill_id"]]

            # Map inputs from previous outputs
            if "input_mapping" in step:
                mapped_input = {}
                for key, source in step["input_mapping"].items():
                    if source.startswith("$"):
                        # Reference to previous output
                        mapped_input[key] = current_input.get(source[1:])
                    else:
                        mapped_input[key] = source
                step_input = mapped_input
            else:
                step_input = current_input

            # Execute skill
            result = skill.execute(step_input)
            results.append(result)

            if not result["success"]:
                return {
                    "success": False,
                    "error": f"Step {step['skill_id']} failed: {result.get('error')}",
                    "completed_steps": results
                }

            # Update current input with output
            if "output" in result:
                current_input.update(result["output"])

        return {
            "success": True,
            "workflow_id": workflow_id,
            "results": results,
            "final_output": current_input
        }


class SkillLearner:
    """Simulate skill learning and improvement"""

    def __init__(self, skill: TestSkill):
        """Initialize skill learner"""
        self.skill = skill
        self.execution_history = []
        self.performance_trend = []

    def record_execution(self, success: bool, duration: float, input_size: int = 0):
        """Record skill execution for learning"""
        record = {
            "timestamp": datetime.now().isoformat(),
            "success": success,
            "duration": duration,
            "input_size": input_size
        }
        self.execution_history.append(record)

        # Update performance trend
        if len(self.execution_history) >= 10:
            recent = self.execution_history[-10:]
            success_rate = sum(1 for r in recent if r["success"]) / len(recent)
            self.performance_trend.append(success_rate)

            # Simulate learning - improve success rate slightly
            if success_rate > 0.5:
                self.skill.success_rate = min(0.99, self.skill.success_rate * 1.01)

    def get_learning_metrics(self) -> Dict:
        """Get learning progress metrics"""
        if not self.execution_history:
            return {
                "executions": 0,
                "improvement": 0,
                "current_success_rate": self.skill.success_rate
            }

        initial_rate = self.skill.success_rate
        improvement = (self.skill.success_rate - initial_rate) / initial_rate if initial_rate > 0 else 0

        return {
            "executions": len(self.execution_history),
            "improvement": improvement,
            "current_success_rate": self.skill.success_rate,
            "trend": self.performance_trend[-5:] if self.performance_trend else []
        }

    def recommend_optimizations(self) -> List[str]:
        """Recommend optimizations based on history"""
        recommendations = []

        if not self.execution_history:
            return ["Insufficient data for recommendations"]

        # Analyze failure patterns
        failures = [r for r in self.execution_history if not r["success"]]
        if len(failures) > len(self.execution_history) * 0.3:
            recommendations.append("High failure rate detected - review error handling")

        # Analyze performance
        avg_duration = sum(r["duration"] for r in self.execution_history) / len(self.execution_history)
        if avg_duration > 5.0:
            recommendations.append("Consider performance optimization - high average duration")

        # Analyze input patterns
        large_inputs = [r for r in self.execution_history if r["input_size"] > 1000]
        if large_inputs and len(large_inputs) > len(self.execution_history) * 0.5:
            recommendations.append("Optimize for large input handling")

        return recommendations if recommendations else ["Skill performing within normal parameters"]


# Test scenarios

def create_data_pipeline_workflow() -> Dict:
    """Create a data processing pipeline workflow"""
    composer = SkillComposer(create_skill_library())

    workflow = composer.create_workflow(
        "data_pipeline",
        [
            {
                "skill_id": "sensor_reading",
                "input_mapping": {
                    "sensor_id": "temperature_sensor"
                }
            },
            {
                "skill_id": "data_processing",
                "input_mapping": {
                    "data": "$value",
                    "format": "numeric"
                }
            },
            {
                "skill_id": "text_analysis",
                "input_mapping": {
                    "text": "$summary"
                }
            }
        ]
    )

    return workflow


def test_skill_execution():
    """Test skill execution example"""
    skill = create_data_processing_skill()

    # Execute with valid input
    result = skill.execute({"data": [1, 2, 3, 4, 5]})
    print(f"Execution result: {result}")

    # Execute with invalid input
    result = skill.execute({"wrong_field": "value"})
    print(f"Invalid input result: {result}")

    # Get metrics
    metrics = skill.get_metrics()
    print(f"Skill metrics: {metrics}")


if __name__ == "__main__":
    # Test individual skills
    print("Testing individual skills...")
    test_skill_execution()

    # Test skill composition
    print("\nTesting skill composition...")
    composer = SkillComposer(create_skill_library())

    # Create and execute workflow
    workflow = create_data_pipeline_workflow()
    print(f"Created workflow: {workflow['workflow_id']}")

    result = composer.execute_workflow(
        "data_pipeline",
        {"sensor_id": "temp_001"}
    )
    print(f"Workflow result: {json.dumps(result, indent=2)}")

    # Test skill learning
    print("\nTesting skill learning...")
    skill = create_data_processing_skill()
    learner = SkillLearner(skill)

    # Simulate executions
    for i in range(20):
        success = random.random() < skill.success_rate
        duration = random.uniform(0.5, 3.0)
        learner.record_execution(success, duration, i * 10)

    metrics = learner.get_learning_metrics()
    print(f"Learning metrics: {metrics}")

    recommendations = learner.recommend_optimizations()
    print(f"Recommendations: {recommendations}")