"""
Backend Router - Intelligent model backend selection.

Routes requests based on:
- Role (proposer, evaluator, refiner)
- Backend availability
- Cost preferences
"""

from typing import Optional, Dict
from dataclasses import dataclass, field
from .base import ModelBackend, GenerationResult, ModelConfig, BackendType
from .ollama import OllamaBackend
from .claude import ClaudeBackend


@dataclass
class RouterConfig:
    """Configuration for the backend router."""
    prefer_local: bool = True
    cost_limit_usd: float = 10.0
    ollama_host: str = "localhost"
    ollama_port: int = 11434


@dataclass
class CostTracker:
    """Tracks costs across the session."""
    total_cost: float = 0.0
    by_backend: Dict[str, float] = field(default_factory=dict)
    by_role: Dict[str, float] = field(default_factory=dict)

    def add(self, cost: float, backend: BackendType, role: str):
        self.total_cost += cost
        backend_name = backend.value
        self.by_backend[backend_name] = self.by_backend.get(backend_name, 0) + cost
        self.by_role[role] = self.by_role.get(role, 0) + cost


# Role-based model defaults
# Can override with PROPOSER_MODEL env var for testing
import os
DEFAULT_PROPOSER = os.environ.get("PROPOSER_MODEL", "qwen3:8b")

ROLE_MODELS = {
    "proposer": {
        "ollama": ModelConfig(DEFAULT_PROPOSER, BackendType.OLLAMA, temperature=0.7),
        "claude": ModelConfig("claude-sonnet-4-20250514", BackendType.CLAUDE,
                             temperature=0.7, cost_per_1k_input=0.003,
                             cost_per_1k_output=0.015),
    },
    "evaluator": {
        "ollama": ModelConfig("qwen3:8b", BackendType.OLLAMA, temperature=0.3),
        "claude": ModelConfig("claude-3-5-haiku-20241022", BackendType.CLAUDE,
                             temperature=0.3, cost_per_1k_input=0.0008,
                             cost_per_1k_output=0.004),
    },
    "refiner": {
        "ollama": ModelConfig("qwen3:8b", BackendType.OLLAMA, temperature=0.5),
        "claude": ModelConfig("claude-sonnet-4-20250514", BackendType.CLAUDE,
                             temperature=0.5, cost_per_1k_input=0.003,
                             cost_per_1k_output=0.015),
    },
    "critic": {
        "ollama": ModelConfig("qwen3:8b", BackendType.OLLAMA, temperature=0.3),
        "claude": ModelConfig("claude-sonnet-4-20250514", BackendType.CLAUDE,
                             temperature=0.3, cost_per_1k_input=0.003,
                             cost_per_1k_output=0.015),
    },
}


class BackendRouter:
    """Routes requests to appropriate backends."""

    def __init__(self, config: Optional[RouterConfig] = None):
        self.config = config or RouterConfig()
        self.costs = CostTracker()

        # Initialize backends lazily
        self._ollama: Optional[OllamaBackend] = None
        self._claude: Optional[ClaudeBackend] = None

    @property
    def ollama(self) -> OllamaBackend:
        if self._ollama is None:
            self._ollama = OllamaBackend(
                host=self.config.ollama_host,
                port=self.config.ollama_port
            )
        return self._ollama

    @property
    def claude(self) -> ClaudeBackend:
        if self._claude is None:
            self._claude = ClaudeBackend()
        return self._claude

    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        role: str = "proposer",
        force_backend: Optional[str] = None
    ) -> GenerationResult:
        """
        Generate with automatic backend selection.

        Args:
            prompt: The prompt to send
            system: Optional system prompt
            role: Role determining model choice (proposer, evaluator, refiner, critic)
            force_backend: Force a specific backend ("ollama" or "claude")
        """
        # Check cost limits
        if self.costs.total_cost >= self.config.cost_limit_usd:
            raise CostLimitError(
                f"Session cost ${self.costs.total_cost:.2f} >= limit ${self.config.cost_limit_usd:.2f}"
            )

        # Select backend and config
        backend, model_config = await self._select_backend(role, force_backend)

        # Generate
        result = await backend.generate(prompt, system, model_config)

        # Track costs
        self.costs.add(result.cost_usd, result.backend_used, role)

        return result

    async def _select_backend(
        self,
        role: str,
        force_backend: Optional[str] = None
    ) -> tuple[ModelBackend, ModelConfig]:
        """Select backend and model config based on role and preferences."""

        role_configs = ROLE_MODELS.get(role, ROLE_MODELS["proposer"])

        if force_backend:
            if force_backend == "ollama":
                return self.ollama, role_configs["ollama"]
            elif force_backend == "claude":
                return self.claude, role_configs["claude"]

        # Prefer local if configured
        if self.config.prefer_local:
            if await self.ollama.is_available():
                return self.ollama, role_configs["ollama"]

        # Fall back to Claude
        return self.claude, role_configs["claude"]

    async def embed(self, text: str) -> list[float]:
        """Generate embeddings using local model."""
        return await self.ollama.embed(text)

    def get_cost_summary(self) -> dict:
        """Get cost summary for the session."""
        return {
            "total_usd": round(self.costs.total_cost, 4),
            "by_backend": {k: round(v, 4) for k, v in self.costs.by_backend.items()},
            "by_role": {k: round(v, 4) for k, v in self.costs.by_role.items()},
            "remaining_budget": round(self.config.cost_limit_usd - self.costs.total_cost, 4),
        }

    async def close(self):
        """Close all backends."""
        if self._ollama:
            await self._ollama.close()
        if self._claude:
            await self._claude.close()


class CostLimitError(Exception):
    """Raised when cost limit is exceeded."""
    pass
