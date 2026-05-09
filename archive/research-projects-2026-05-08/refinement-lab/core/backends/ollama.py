"""
Ollama backend for local model inference.
"""

import httpx
import asyncio
from typing import Optional
from .base import ModelBackend, GenerationResult, ModelConfig, BackendType, Timer


class OllamaBackend(ModelBackend):
    """Backend for Ollama local inference server."""

    def __init__(
        self,
        host: str = "localhost",
        port: int = 11434,
        default_model: str = "qwen3:8b",
        embed_model: str = "nomic-embed-text",
        timeout: float = 120.0
    ):
        self.base_url = f"http://{host}:{port}"
        self.default_model = default_model
        self.embed_model = embed_model
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=self.timeout)
        return self._client

    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        config: Optional[ModelConfig] = None
    ) -> GenerationResult:
        """Generate using Ollama API."""
        client = await self._get_client()
        model = config.name if config else self.default_model

        # Build messages
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        with Timer() as timer:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": model,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": config.temperature if config else 0.7,
                        "num_predict": config.max_tokens if config else 4096,
                    }
                }
            )
            response.raise_for_status()
            data = response.json()

        # Extract token counts from response
        content = data.get("message", {}).get("content", "")
        input_tokens = data.get("prompt_eval_count", 0)
        output_tokens = data.get("eval_count", 0)

        return GenerationResult(
            content=content,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_usd=0.0,  # Local inference is free
            latency_ms=timer.elapsed_ms,
            backend_used=BackendType.OLLAMA,
            model_used=model,
            metadata={
                "total_duration": data.get("total_duration"),
                "load_duration": data.get("load_duration"),
            }
        )

    async def is_available(self) -> bool:
        """Check if Ollama server is responding."""
        try:
            client = await self._get_client()
            response = await client.get(f"{self.base_url}/api/tags")
            return response.status_code == 200
        except Exception:
            return False

    async def embed(self, text: str) -> list[float]:
        """Generate embeddings using Ollama."""
        client = await self._get_client()
        response = await client.post(
            f"{self.base_url}/api/embeddings",
            json={
                "model": self.embed_model,
                "prompt": text
            }
        )
        response.raise_for_status()
        data = response.json()
        return data.get("embedding", [])

    async def list_models(self) -> list[str]:
        """List available models."""
        client = await self._get_client()
        response = await client.get(f"{self.base_url}/api/tags")
        response.raise_for_status()
        data = response.json()
        return [m["name"] for m in data.get("models", [])]

    async def close(self):
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None
