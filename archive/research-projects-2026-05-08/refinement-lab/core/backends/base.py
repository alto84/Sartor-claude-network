"""
Base classes for model backends.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional, Dict, Any
from enum import Enum
import time


class BackendType(Enum):
    OLLAMA = "ollama"
    CLAUDE = "claude"
    OPENAI = "openai"


@dataclass
class ModelConfig:
    """Configuration for a model."""
    name: str
    backend: BackendType
    temperature: float = 0.7
    max_tokens: int = 4096
    cost_per_1k_input: float = 0.0
    cost_per_1k_output: float = 0.0

    def estimate_cost(self, input_tokens: int, output_tokens: int) -> float:
        """Estimate cost for given token counts."""
        return (
            (input_tokens / 1000) * self.cost_per_1k_input +
            (output_tokens / 1000) * self.cost_per_1k_output
        )


@dataclass
class GenerationResult:
    """Result from a model generation."""
    content: str
    input_tokens: int
    output_tokens: int
    cost_usd: float
    latency_ms: float
    backend_used: BackendType
    model_used: str
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def total_tokens(self) -> int:
        return self.input_tokens + self.output_tokens


class ModelBackend(ABC):
    """Abstract base class for model backends."""

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        config: Optional[ModelConfig] = None
    ) -> GenerationResult:
        """Generate a response from the model."""
        pass

    @abstractmethod
    async def is_available(self) -> bool:
        """Check if the backend is available."""
        pass

    @abstractmethod
    async def embed(self, text: str) -> list[float]:
        """Generate embeddings for text."""
        pass


class Timer:
    """Simple timer context manager."""

    def __enter__(self):
        self.start = time.perf_counter()
        return self

    def __exit__(self, *args):
        self.elapsed_ms = (time.perf_counter() - self.start) * 1000
