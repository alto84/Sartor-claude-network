"""
Hybrid orchestration system.

Uses cheap local tokens to support expensive Claude Opus:
- Draft & Refine: Local drafts, Opus polishes
- Filter & Escalate: Local handles easy, escalates hard
- Verify & Critique: Opus generates, local verifies
- Parallel Exploration: Local explores many, Opus synthesizes
"""

from .orchestrator import HybridOrchestrator
from .self_knowledge import SelfKnowledge, TaskOutcome

__all__ = ["HybridOrchestrator", "SelfKnowledge", "TaskOutcome"]
