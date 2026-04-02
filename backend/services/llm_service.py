import json
import httpx
import asyncio
import logging
from typing import Type, TypeVar, Any
from pydantic import BaseModel
from backend.config import settings

logger = logging.getLogger(__name__)

T = TypeVar('T', bound=BaseModel)

class LLMServiceError(Exception):
    pass

class LLMService:
    def __init__(self):
        self._semaphore = None
        # Use a short timeout so that if Ollama isn't running it fails fast
        # instead of deadlocking the backend for 1-2 minutes per try
        self.timeout = httpx.Timeout(4.0)

    @property
    def semaphore(self):
        if self._semaphore is None:
            self._semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_LLM_CALLS)
        return self._semaphore

    async def _call_ollama(self, system_prompt: str, user_prompt: str, json_mode: bool = False) -> str:
        url = f"{settings.OLLAMA_BASE_URL}/api/generate"
        payload = {
            "model": settings.LLM_MODEL,
            "system": system_prompt,
            "prompt": user_prompt,
            "stream": False
        }
        if json_mode:
            payload["format"] = "json"
            
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            return response.json().get("response", "")

    async def _call_openai(self, system_prompt: str, user_prompt: str, json_mode: bool = False) -> str:
        if not settings.OPENAI_API_KEY:
            raise LLMServiceError("OPENAI_API_KEY is missing")
            
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": settings.LLM_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
        }
        if json_mode:
            payload["response_format"] = { "type": "json_object" }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]

    async def generate(self, system_prompt: str, user_prompt: str, json_mode: bool = False) -> str:
        for attempt in range(1):
            try:
                async with self.semaphore:
                    if settings.LLM_PROVIDER.lower() == "openai":
                        return await self._call_openai(system_prompt, user_prompt, json_mode)
                    elif settings.LLM_PROVIDER.lower() == "ollama":
                        return await self._call_ollama(system_prompt, user_prompt, json_mode)
                    else:
                        raise LLMServiceError(f"Unsupported provider: {settings.LLM_PROVIDER}")
            except Exception as e:
                logger.error(f"LLM call failed: {e}")
                raise LLMServiceError(f"LLM generation failed: {e}")
        return ""

    async def generate_json(self, system_prompt: str, user_prompt: str, response_model: Type[T]) -> T:
        raw_response = await self.generate(system_prompt, user_prompt, json_mode=True)
        try:
            # Parse the JSON string
            data = json.loads(raw_response)
            return response_model.model_validate(data)
        except Exception as e:
            logger.error(f"Failed to parse LLM JSON into {response_model.__name__}: {e}")
            raise LLMServiceError(f"JSON validation failed: {e}")

llm_service = LLMService()
