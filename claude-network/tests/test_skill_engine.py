"""
Test suite for Skill Engine System

Tests the skill system including:
- Skill registration and discovery
- Skill execution and validation
- Capability matching
- Skill composition
- Learning and adaptation
"""

import pytest
import json
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock
from typing import Dict, List, Any


class TestSkillEngine:
    """Test skill engine functionality"""

    def setup_method(self):
        """Set up test fixtures"""
        self.test_skill = {
            "skill_id": "data_processing",
            "name": "Data Processing",
            "description": "Process and analyze data",
            "version": "1.0.0",
            "category": "analysis",
            "requirements": ["python", "numpy"],
            "inputs": {
                "data": {"type": "array", "required": True},
                "format": {"type": "string", "required": False}
            },
            "outputs": {
                "result": {"type": "object"},
                "metrics": {"type": "object"}
            },
            "examples": [],
            "metadata": {
                "author": "system",
                "created_at": datetime.now().isoformat(),
                "success_rate": 0.95
            }
        }

    def test_skill_registration(self):
        """Test skill registration and validation"""
        skill = self.register_skill(
            skill_id="image_analysis",
            name="Image Analysis",
            category="vision",
            inputs={"image": {"type": "file", "required": True}},
            outputs={"analysis": {"type": "object"}}
        )

        assert skill["skill_id"] == "image_analysis"
        assert skill["category"] == "vision"
        assert "version" in skill
        assert skill["inputs"]["image"]["required"] is True

    def register_skill(self, skill_id, name, category, inputs, outputs):
        """Register a new skill"""
        # Validate required fields
        if not all([skill_id, name, category, inputs, outputs]):
            raise ValueError("Missing required skill fields")

        return {
            "skill_id": skill_id,
            "name": name,
            "description": "",
            "version": "1.0.0",
            "category": category,
            "requirements": [],
            "inputs": inputs,
            "outputs": outputs,
            "examples": [],
            "metadata": {
                "created_at": datetime.now().isoformat(),
                "success_rate": 0.0
            }
        }

    def test_skill_discovery(self):
        """Test skill discovery by capability"""
        skills = [
            self.test_skill,
            self.register_skill("text_analysis", "Text Analysis", "nlp",
                              {"text": {"type": "string"}}, {"analysis": {"type": "object"}}),
            self.register_skill("sensor_reading", "Sensor Reading", "hardware",
                              {"sensor_id": {"type": "string"}}, {"reading": {"type": "number"}})
        ]

        # Find skills by category
        analysis_skills = self.find_skills_by_category(skills, "analysis")
        assert len(analysis_skills) == 1
        assert analysis_skills[0]["skill_id"] == "data_processing"

        # Find skills by input type
        text_skills = self.find_skills_by_input_type(skills, "string")
        assert len(text_skills) == 2  # text_analysis and sensor_reading

    def find_skills_by_category(self, skills, category):
        """Find skills by category"""
        return [s for s in skills if s["category"] == category]

    def find_skills_by_input_type(self, skills, input_type):
        """Find skills accepting specific input type"""
        matching_skills = []
        for skill in skills:
            for input_spec in skill["inputs"].values():
                if input_spec.get("type") == input_type:
                    matching_skills.append(skill)
                    break
        return matching_skills

    def test_skill_execution(self):
        """Test skill execution with validation"""
        # Valid input
        valid_input = {"data": [1, 2, 3, 4, 5]}
        result = self.execute_skill(self.test_skill, valid_input)
        assert result["success"] is True
        assert "output" in result

        # Invalid input (missing required field)
        invalid_input = {"format": "json"}
        result = self.execute_skill(self.test_skill, invalid_input)
        assert result["success"] is False
        assert "error" in result

    def execute_skill(self, skill, input_data):
        """Execute a skill with input validation"""
        # Validate inputs
        validation_result = self.validate_skill_input(skill, input_data)
        if not validation_result["valid"]:
            return {
                "success": False,
                "error": validation_result["error"]
            }

        # Simulate skill execution
        try:
            # Mock execution logic
            output = self.simulate_skill_execution(skill, input_data)
            return {
                "success": True,
                "output": output,
                "execution_time": 0.1,
                "skill_id": skill["skill_id"]
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def validate_skill_input(self, skill, input_data):
        """Validate input against skill requirements"""
        for input_name, spec in skill["inputs"].items():
            if spec.get("required", False) and input_name not in input_data:
                return {
                    "valid": False,
                    "error": f"Missing required input: {input_name}"
                }

            if input_name in input_data:
                # Type checking would go here
                pass

        return {"valid": True}

    def simulate_skill_execution(self, skill, input_data):
        """Simulate skill execution (mock)"""
        if skill["skill_id"] == "data_processing":
            return {
                "result": {"processed": len(input_data.get("data", []))},
                "metrics": {"time": 0.1}
            }
        return {}

    def test_skill_composition(self):
        """Test composing multiple skills into a workflow"""
        # Create a workflow combining multiple skills
        workflow = {
            "workflow_id": "data_pipeline",
            "steps": [
                {
                    "step": 1,
                    "skill_id": "data_collection",
                    "inputs": {"source": "sensor"},
                    "outputs_to": {"data": "step_2.input"}
                },
                {
                    "step": 2,
                    "skill_id": "data_processing",
                    "inputs": {"data": "$step_1.data"},
                    "outputs_to": {"result": "step_3.data"}
                },
                {
                    "step": 3,
                    "skill_id": "data_visualization",
                    "inputs": {"data": "$step_2.result"}
                }
            ]
        }

        # Validate workflow
        is_valid = self.validate_workflow(workflow)
        assert is_valid

        # Check dependency order
        execution_order = self.get_execution_order(workflow)
        assert execution_order == [1, 2, 3]

    def validate_workflow(self, workflow):
        """Validate workflow structure"""
        steps = workflow.get("steps", [])
        if not steps:
            return False

        # Check for unique step numbers
        step_numbers = [s["step"] for s in steps]
        if len(step_numbers) != len(set(step_numbers)):
            return False

        # Validate each step has required fields
        for step in steps:
            if not all(k in step for k in ["step", "skill_id", "inputs"]):
                return False

        return True

    def get_execution_order(self, workflow):
        """Get execution order for workflow steps"""
        steps = workflow.get("steps", [])
        return sorted([s["step"] for s in steps])

    def test_skill_versioning(self):
        """Test skill version management"""
        versions = [
            {"version": "1.0.0", "skill_id": "test"},
            {"version": "1.1.0", "skill_id": "test"},
            {"version": "2.0.0", "skill_id": "test"},
            {"version": "1.0.1", "skill_id": "test"}
        ]

        # Get latest version
        latest = self.get_latest_version(versions)
        assert latest["version"] == "2.0.0"

        # Check version compatibility
        assert self.is_compatible("1.0.0", "1.0.1")  # Patch compatible
        assert self.is_compatible("1.0.0", "1.1.0")  # Minor compatible
        assert not self.is_compatible("1.0.0", "2.0.0")  # Major not compatible

    def get_latest_version(self, versions):
        """Get latest skill version"""
        def parse_version(v):
            parts = v["version"].split(".")
            return tuple(int(p) for p in parts)

        return max(versions, key=parse_version)

    def is_compatible(self, current_version, target_version):
        """Check version compatibility (semantic versioning)"""
        current_parts = [int(p) for p in current_version.split(".")]
        target_parts = [int(p) for p in target_version.split(".")]

        # Major version must match for compatibility
        return current_parts[0] == target_parts[0]

    def test_skill_learning(self):
        """Test skill learning and adaptation"""
        skill = self.test_skill.copy()
        skill["metadata"]["executions"] = []

        # Record executions
        for i in range(10):
            success = i != 5  # One failure
            self.record_execution(skill, success, execution_time=0.1 * (i + 1))

        # Calculate metrics
        metrics = self.calculate_skill_metrics(skill)

        assert metrics["success_rate"] == 0.9  # 9/10 successful
        assert metrics["avg_execution_time"] == 0.55  # Average of 0.1 to 1.0
        assert metrics["total_executions"] == 10

    def record_execution(self, skill, success, execution_time):
        """Record skill execution for learning"""
        execution = {
            "timestamp": datetime.now().isoformat(),
            "success": success,
            "execution_time": execution_time
        }
        skill["metadata"]["executions"].append(execution)

    def calculate_skill_metrics(self, skill):
        """Calculate skill performance metrics"""
        executions = skill["metadata"].get("executions", [])

        if not executions:
            return {
                "success_rate": 0,
                "avg_execution_time": 0,
                "total_executions": 0
            }

        successful = sum(1 for e in executions if e["success"])
        total_time = sum(e["execution_time"] for e in executions)

        return {
            "success_rate": successful / len(executions),
            "avg_execution_time": total_time / len(executions),
            "total_executions": len(executions)
        }

    def test_skill_requirements_check(self):
        """Test checking skill requirements"""
        skill = self.test_skill.copy()
        skill["requirements"] = ["python>=3.8", "numpy", "pandas"]

        # Check if requirements are met
        available = ["python==3.9.0", "numpy", "pandas", "scipy"]
        assert self.check_requirements(skill, available)

        # Missing requirement
        available = ["python==3.9.0", "numpy"]  # Missing pandas
        assert not self.check_requirements(skill, available)

    def check_requirements(self, skill, available_packages):
        """Check if skill requirements are satisfied"""
        for req in skill["requirements"]:
            # Simple check - in production would parse version specs
            base_package = req.split(">=")[0].split("==")[0]
            if not any(base_package in pkg for pkg in available_packages):
                return False
        return True

    def test_skill_caching(self):
        """Test skill result caching"""
        cache = {}

        input_data = {"data": [1, 2, 3]}
        cache_key = self.generate_cache_key(self.test_skill["skill_id"], input_data)

        # First execution - not cached
        result = self.execute_with_cache(self.test_skill, input_data, cache)
        assert result["cached"] is False

        # Second execution - should be cached
        result = self.execute_with_cache(self.test_skill, input_data, cache)
        assert result["cached"] is True
        assert result["output"] is not None

    def generate_cache_key(self, skill_id, input_data):
        """Generate cache key for skill execution"""
        import hashlib
        data_str = json.dumps(input_data, sort_keys=True)
        return f"{skill_id}:{hashlib.md5(data_str.encode()).hexdigest()}"

    def execute_with_cache(self, skill, input_data, cache):
        """Execute skill with caching"""
        cache_key = self.generate_cache_key(skill["skill_id"], input_data)

        if cache_key in cache:
            return {
                "success": True,
                "output": cache[cache_key],
                "cached": True
            }

        # Execute skill
        result = self.execute_skill(skill, input_data)

        if result["success"]:
            cache[cache_key] = result["output"]
            result["cached"] = False

        return result

    def test_skill_specialization(self):
        """Test agent skill specialization"""
        agent = {
            "agent_id": "agent-001",
            "skills": {},
            "specialization_threshold": 0.8
        }

        # Record skill usage
        skills = ["data_processing", "text_analysis", "data_processing",
                 "data_processing", "sensor_reading"]

        for skill_id in skills:
            self.update_skill_proficiency(agent, skill_id)

        # Check specialization
        specializations = self.get_specializations(agent)
        assert "data_processing" in specializations  # Used most frequently

    def update_skill_proficiency(self, agent, skill_id):
        """Update agent's skill proficiency"""
        if skill_id not in agent["skills"]:
            agent["skills"][skill_id] = {"usage_count": 0, "success_rate": 1.0}

        agent["skills"][skill_id]["usage_count"] += 1

    def get_specializations(self, agent):
        """Get agent's specialized skills"""
        if not agent["skills"]:
            return []

        total_usage = sum(s["usage_count"] for s in agent["skills"].values())
        specializations = []

        for skill_id, stats in agent["skills"].items():
            proficiency = stats["usage_count"] / total_usage
            if proficiency >= agent["specialization_threshold"] / len(agent["skills"]):
                specializations.append(skill_id)

        return specializations


class TestSkillLibrary:
    """Test skill library management"""

    def test_skill_search(self):
        """Test searching skills in library"""
        library = [
            {"skill_id": "s1", "name": "Data Analysis", "tags": ["data", "analysis"]},
            {"skill_id": "s2", "name": "Text Processing", "tags": ["text", "nlp"]},
            {"skill_id": "s3", "name": "Image Analysis", "tags": ["image", "vision"]},
            {"skill_id": "s4", "name": "Data Collection", "tags": ["data", "collection"]}
        ]

        # Search by keyword
        results = self.search_skills(library, "data")
        assert len(results) == 2
        assert all("data" in s["name"].lower() or "data" in s["tags"] for s in results)

        # Search by tag
        results = self.search_skills(library, tag="analysis")
        assert len(results) == 1
        assert results[0]["skill_id"] == "s1"

    def search_skills(self, library, keyword=None, tag=None):
        """Search skills in library"""
        results = []

        for skill in library:
            if tag and tag in skill.get("tags", []):
                results.append(skill)
            elif keyword:
                if (keyword.lower() in skill["name"].lower() or
                    keyword in skill.get("tags", [])):
                    results.append(skill)

        return results

    def test_skill_recommendations(self):
        """Test skill recommendation system"""
        agent_history = ["data_processing", "data_analysis", "data_visualization"]
        available_skills = [
            {"skill_id": "data_cleaning", "category": "data"},
            {"skill_id": "text_analysis", "category": "nlp"},
            {"skill_id": "data_export", "category": "data"},
            {"skill_id": "image_processing", "category": "vision"}
        ]

        recommendations = self.recommend_skills(agent_history, available_skills)

        # Should recommend other data-related skills
        assert "data_cleaning" in [r["skill_id"] for r in recommendations]
        assert "data_export" in [r["skill_id"] for r in recommendations]

    def recommend_skills(self, agent_history, available_skills):
        """Recommend skills based on agent history"""
        # Extract patterns from history
        categories = {}
        for skill_id in agent_history:
            # Infer category from skill name
            if "data" in skill_id:
                categories["data"] = categories.get("data", 0) + 1
            elif "text" in skill_id:
                categories["nlp"] = categories.get("nlp", 0) + 1

        # Recommend skills from frequent categories
        recommendations = []
        if categories:
            top_category = max(categories.items(), key=lambda x: x[1])[0]
            recommendations = [s for s in available_skills
                             if s.get("category") == top_category
                             and s["skill_id"] not in agent_history]

        return recommendations


if __name__ == "__main__":
    pytest.main([__file__, "-v"])