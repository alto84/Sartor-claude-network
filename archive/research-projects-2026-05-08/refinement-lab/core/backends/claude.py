"""
Claude API backend.
"""

import os
import httpx
from typing import Optional
from .base import ModelBackend, GenerationResult, ModelConfig, BackendType, Timer


# Pricing per 1K tokens (as of Dec 2024)
CLAUDE_PRICING = {
    "claude-opus-4-5-20251101": {"input": 0.015, "output": 0.075},
    "claude-sonnet-4-20250514": {"input": 0.003, "output": 0.015},
    "claude-3-5-haiku-20241022": {"input": 0.0008, "output": 0.004},
}


class ClaudeBackend(ModelBackend):
    """Backend for Claude API."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        default_model: str = "claude-sonnet-4-20250514",
        timeout: float = 120.0
    ):
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY not set")

        self.default_model = default_model
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=self.timeout,
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                }
            )
        return self._client

    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        config: Optional[ModelConfig] = None
    ) -> GenerationResult:
        """Generate using Claude API."""
        client = await self._get_client()
        model = config.name if config else self.default_model

        request_body = {
            "model": model,
            "max_tokens": config.max_tokens if config else 4096,
            "messages": [{"role": "user", "content": prompt}],
        }

        if system:
            request_body["system"] = system

        if config and config.temperature is not None:
            request_body["temperature"] = config.temperature

        with Timer() as timer:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                json=request_body
            )
            response.raise_for_status()
            data = response.json()

        # Extract content
        content = ""
        for block in data.get("content", []):
            if block.get("type") == "text":
                content += block.get("text", "")

        # Get token counts
        usage = data.get("usage", {})
        input_tokens = usage.get("input_tokens", 0)
        output_tokens = usage.get("output_tokens", 0)

        # Calculate cost
        pricing = CLAUDE_PRICING.get(model, {"input": 0.003, "output": 0.015})
        cost = (
            (input_tokens / 1000) * pricing["input"] +
            (output_tokens / 1000) * pricing["output"]
        )

        return GenerationResult(
            content=content,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_usd=cost,
            latency_ms=timer.elapsed_ms,
            backend_used=BackendType.CLAUDE,
            model_used=model,
            metadata={
                "stop_reason": data.get("stop_reason"),
            }
        )

    async def is_available(self) -> bool:
        """Check if Claude API is accessible."""
        try:
            # Just verify we have an API key
            return bool(self.api_key)
        except Exception:
            return False

    async def embed(self, text: str) -> list[float]:
        """Claude doesn't have native embeddings - use Voyage or fallback."""
        raise NotImplementedError(
            "Claude doesn't have native embeddings. Use OllamaBackend for embeddings."
        )

    async def close(self):
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None
