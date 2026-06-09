"""
Sartor Claude Network Testing Framework

This testing framework provides comprehensive coverage for all components
of the multi-agent system including:
- MACS protocol communication
- Task management and distribution
- Skill engine and capabilities
- Configuration management
- Agent registry and discovery
"""

import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))