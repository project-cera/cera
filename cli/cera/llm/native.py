"""Native SDK providers for direct API access (bypassing OpenRouter).

Supports: OpenAI, Anthropic, Google Gemini, Perplexity.
Each provider uses its own API endpoint and key from environment variables.

OpenAI, Gemini, and Perplexity all support OpenAI-compatible chat/completions,
so they reuse OpenRouterClient with a custom base_url.
Anthropic uses its own Messages API format and needs a custom adapter.
"""

import os
import json
import logging
import httpx
from dataclasses import dataclass

from .openrouter import OpenRouterClient, ChatResponse

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Provider Registry
# ---------------------------------------------------------------------------

NATIVE_PROVIDERS = {
    "openai": {
        "base_url": "https://api.openai.com/v1",
        "env_key": "OPENAI_API_KEY",
        "label": "OpenAI (Native)",
        "models_endpoint": "/models",  # GET — auto-list supported
        "model_filter": lambda m: m.get("id", "").startswith(("gpt-", "o1", "o3", "o4")),
    },
    "anthropic": {
        "base_url": "https://api.anthropic.com/v1",
        "env_key": "ANTHROPIC_API_KEY",
        "label": "Anthropic (Native)",
        "models_endpoint": "/models",  # GET — auto-list supported
        "model_filter": lambda m: "claude" in m.get("id", ""),
    },
    "google": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai",
        "env_key": "GEMINI_API_KEY",
        "label": "Google (Native)",
        # Gemini models endpoint is different: /v1beta/models with key param
        "models_endpoint": None,  # handled specially
        "model_filter": lambda m: True,
    },
    "perplexity": {
        "base_url": "https://api.perplexity.ai",
        "env_key": "PERPLEXITY_API_KEY",
        "label": "Perplexity (Native)",
        "models_endpoint": None,  # no list endpoint — hardcoded
        "model_filter": lambda m: True,
    },
}

# Perplexity has no models endpoint — hardcode their current lineup
PERPLEXITY_MODELS = [
    {"id": "sonar", "name": "Sonar", "context_length": 128000},
    {"id": "sonar-pro", "name": "Sonar Pro", "context_length": 200000},
    {"id": "sonar-reasoning", "name": "Sonar Reasoning", "context_length": 128000},
    {"id": "sonar-reasoning-pro", "name": "Sonar Reasoning Pro", "context_length": 128000},
    {"id": "sonar-deep-research", "name": "Sonar Deep Research", "context_length": 128000},
]


# ---------------------------------------------------------------------------
# Model ID Parsing
# ---------------------------------------------------------------------------

def parse_native_model(model_id: str) -> tuple[bool, str, str]:
    """Parse a model ID to detect native provider routing.

    Native models use the format: native/{provider}/{model_name}
    e.g., native/openai/gpt-4o, native/anthropic/claude-sonnet-4

    Returns:
        (is_native, provider, actual_model_id)
        If not native: (False, "", model_id)
    """
    if model_id.startswith("native/"):
        parts = model_id.split("/", 2)
        if len(parts) == 3:
            return True, parts[1], parts[2]
    return False, "", model_id


# ---------------------------------------------------------------------------
# Convex settings key mapping (provider -> Convex settings field name)
# ---------------------------------------------------------------------------

CONVEX_KEY_FIELDS = {
    "openai": "openaiApiKey",
    "anthropic": "anthropicApiKey",
    "google": "geminiApiKey",
    "perplexity": "perplexityApiKey",
}


def get_native_api_key(provider: str, settings: dict | None = None) -> str:
    """Get API key for a native provider.

    Priority: Convex settings > environment variable.
    Returns empty string if not configured anywhere.
    """
    config = NATIVE_PROVIDERS.get(provider)
    if not config:
        return ""

    # 1. Check Convex settings first
    if settings:
        convex_field = CONVEX_KEY_FIELDS.get(provider, "")
        if convex_field:
            key = settings.get(convex_field, "")
            if key:
                return key

    # 2. Fall back to environment variable
    return os.environ.get(config["env_key"], "")


# ---------------------------------------------------------------------------
# Client Factory
# ---------------------------------------------------------------------------

def get_native_client(
    provider: str,
    usage_tracker=None,
    component: str = "",
    target: str = "",
    run: str = "",
    settings: dict | None = None,
) -> "OpenRouterClient":
    """Create a client for the given native provider.

    Reads API key from Convex settings first, then falls back to env vars.
    Raises ValueError if not configured anywhere.

    Returns:
        OpenRouterClient (or AnthropicNativeClient for Anthropic)
    """
    if provider not in NATIVE_PROVIDERS:
        raise ValueError(f"Unknown native provider: {provider}")

    config = NATIVE_PROVIDERS[provider]
    api_key = get_native_api_key(provider, settings)
    if not api_key:
        raise ValueError(
            f"Native provider '{provider}' requires an API key. "
            f"Set it in Settings > Native Provider API Keys, or via "
            f"{config['env_key']} environment variable."
        )

    kwargs = dict(
        api_key=api_key,
        base_url=config["base_url"],
        usage_tracker=usage_tracker,
        component=component,
        target=target,
        run=run,
    )

    if provider == "anthropic":
        return AnthropicNativeClient(**kwargs)
    if provider == "google":
        return GoogleNativeClient(**kwargs)
    if provider == "openai":
        return OpenAINativeClient(**kwargs)

    # Perplexity: use OpenAI-compatible client (web search is always-on for sonar models,
    # but we need the client to accept web_search= kwarg without erroring)
    return OpenAINativeClient(**kwargs)


# ---------------------------------------------------------------------------
# Anthropic Native Client (Messages API adapter)
# ---------------------------------------------------------------------------

class AnthropicNativeClient(OpenRouterClient):
    """Adapter for Anthropic's native Messages API.

    Anthropic uses a different format than OpenAI:
    - System message is a top-level field, not in messages array
    - Uses x-api-key header instead of Authorization: Bearer
    - POST to /messages instead of /chat/completions
    - Different response schema
    """

    ANTHROPIC_API_VERSION = "2023-06-01"

    async def chat(
        self,
        messages: list[dict],
        model: str = "claude-sonnet-4-20250514",
        temperature: float = 0.7,
        max_tokens: int = 4096,
        stream: bool = False,
        reasoning: dict | None = None,
        web_search: bool = False,
    ) -> str:
        """Send a chat request via Anthropic's Messages API."""
        # Extract system message
        system_content = None
        user_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system_content = msg["content"]
            else:
                user_messages.append(msg)

        # Build request body
        body: dict = {
            "model": model,
            "messages": user_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        if system_content:
            body["system"] = system_content

        # Anthropic web search tool (server-side, requires API version 2025-03-05+)
        _use_web_search = False
        if web_search:
            body["tools"] = [
                {
                    "type": "web_search_20250305",
                    "name": "web_search",
                    "max_uses": 5,
                }
            ]
            _use_web_search = True

        # Anthropic extended thinking
        if reasoning:
            body["thinking"] = {
                "type": "enabled",
                "budget_tokens": reasoning.get("max_tokens", 10000),
            }

        # Web search tool requires API version 2025-03-05; use base version otherwise
        api_version = "2025-03-05" if _use_web_search else self.ANTHROPIC_API_VERSION
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": api_version,
            "Content-Type": "application/json",
        }

        url = f"{self._base_url}/messages"

        for attempt in range(3):
            try:
                response = await self.client.post(
                    url, json=body, headers=headers, timeout=300.0
                )
                if response.status_code == 400:
                    error_text = response.text[:500]
                    print(f"[Anthropic] 400 error: {error_text}")
                    # If web search version isn't supported, retry without web search
                    if _use_web_search and "not a valid version" in error_text:
                        print("[Anthropic] Web search API version not supported, falling back to parametric knowledge")
                        body.pop("tools", None)
                        _use_web_search = False
                        headers["anthropic-version"] = self.ANTHROPIC_API_VERSION
                        continue
                    response.raise_for_status()
                if response.status_code in (429, 500, 502, 503, 529):
                    import asyncio
                    wait = 2 ** attempt
                    logger.warning(
                        f"Anthropic API returned {response.status_code}, "
                        f"retrying in {wait}s (attempt {attempt + 1}/3)"
                    )
                    await asyncio.sleep(wait)
                    continue
                response.raise_for_status()
                break
            except httpx.TimeoutException:
                if attempt == 2:
                    raise
                import asyncio
                await asyncio.sleep(2 ** attempt)
                continue

        data = response.json()

        # Extract text from content blocks
        text_parts = []
        for block in data.get("content", []):
            if block.get("type") == "text":
                text_parts.append(block["text"])

        result = "\n".join(text_parts)

        # Track usage
        if self.usage_tracker and data.get("usage"):
            usage = data["usage"]
            from cera.llm.usage import LLMUsage
            inp = usage.get("input_tokens", 0)
            out = usage.get("output_tokens", 0)
            self.usage_tracker.record(LLMUsage(
                model=f"native/anthropic/{model}",
                prompt_tokens=inp,
                completion_tokens=out,
                total_tokens=inp + out,
                component=self._component,
                target=self._target,
                run=self._run,
            ))

        return result

    async def chat_with_usage(
        self,
        messages: list[dict],
        model: str = "claude-sonnet-4-20250514",
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> ChatResponse:
        """Send a chat request and return response with usage info."""
        # Extract system message
        system_content = None
        user_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system_content = msg["content"]
            else:
                user_messages.append(msg)

        body: dict = {
            "model": model,
            "messages": user_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        if system_content:
            body["system"] = system_content

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": self.ANTHROPIC_API_VERSION,
            "Content-Type": "application/json",
        }

        url = f"{self._base_url}/messages"
        response = await self.client.post(
            url, json=body, headers=headers, timeout=300.0
        )
        response.raise_for_status()
        data = response.json()

        text_parts = []
        for block in data.get("content", []):
            if block.get("type") == "text":
                text_parts.append(block["text"])

        usage = data.get("usage")
        usage_dict = None
        if usage:
            usage_dict = {
                "prompt_tokens": usage.get("input_tokens", 0),
                "completion_tokens": usage.get("output_tokens", 0),
                "total_tokens": usage.get("input_tokens", 0) + usage.get("output_tokens", 0),
            }

        return ChatResponse(
            content="\n".join(text_parts),
            usage=usage_dict,
            model=data.get("model"),
            id=data.get("id"),
        )


# ---------------------------------------------------------------------------
# Google Native Client (OpenAI-compatible with google_search tool)
# ---------------------------------------------------------------------------

class GoogleNativeClient(OpenRouterClient):
    """Google Gemini client with native Google Search grounding support.

    Uses Google's OpenAI-compatible endpoint but adds the google_search
    tool when web_search=True.
    """

    async def chat(
        self,
        messages: list[dict],
        model: str = "gemini-2.5-flash",
        temperature: float = 0.7,
        max_tokens: int = 4096,
        stream: bool = False,
        reasoning: dict | None = None,
        web_search: bool = False,
    ) -> str:
        """Send a chat request, optionally with Google Search grounding."""
        # Gemini's OpenAI-compatible endpoint doesn't support the "reasoning" field
        if not web_search:
            return await super().chat(
                messages, model=model, temperature=temperature,
                max_tokens=max_tokens, stream=stream, reasoning=None,
            )

        # Google Search grounding via OpenAI-compatible endpoint.
        # Try multiple formats since Google's support is inconsistent:
        # 1. Native Gemini tools format (works on newer models)
        # 2. Fall back to no grounding if the endpoint rejects it
        # See: https://ai.google.dev/gemini-api/docs/openai
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        url = f"{self._base_url}/chat/completions"

        # Try with google_search grounding first
        grounding_formats = [
            # Format 1: google.tools (extra_body style, documented for Gemini 3+)
            {"google": {"tools": [{"google_search": {}}]}},
            # Format 2: no grounding (fall back to parametric knowledge)
            {},
        ]

        content = ""
        data = {}
        for grounding in grounding_formats:
            body: dict = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                **grounding,
            }

            success = False
            for attempt in range(3):
                try:
                    response = await self.client.post(
                        url, json=body, headers=headers, timeout=300.0
                    )
                    if response.status_code == 400 and grounding:
                        # Grounding format rejected — try next format
                        break
                    if response.status_code in (429, 500, 502, 503):
                        import asyncio
                        await asyncio.sleep(2 ** attempt)
                        continue
                    response.raise_for_status()
                    success = True
                    break
                except httpx.TimeoutException:
                    if attempt == 2:
                        raise
                    import asyncio
                    await asyncio.sleep(2 ** attempt)
                    continue

            if success:
                data = response.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                break

        # Track usage
        if self.usage_tracker and data.get("usage"):
            usage = data["usage"]
            from cera.llm.usage import LLMUsage
            inp = usage.get("prompt_tokens", 0)
            out = usage.get("completion_tokens", 0)
            self.usage_tracker.record(LLMUsage(
                model=f"native/google/{model}",
                prompt_tokens=inp,
                completion_tokens=out,
                total_tokens=inp + out,
                component=self._component,
                target=self._target,
                run=self._run,
            ))

        return content


# ---------------------------------------------------------------------------
# OpenAI Native Client (with web search support)
# ---------------------------------------------------------------------------

class OpenAINativeClient(OpenRouterClient):
    """OpenAI client with native web search support.

    Uses the web_search_options parameter available on newer OpenAI models.
    Newer models (gpt-5+, o-series) require max_completion_tokens instead of max_tokens.
    """

    @staticmethod
    def _needs_completion_tokens(model: str) -> bool:
        """Check if model requires max_completion_tokens instead of max_tokens."""
        # GPT-5+, o1, o3, o4 series all require max_completion_tokens
        for prefix in ("gpt-5", "o1", "o3", "o4"):
            if model.startswith(prefix):
                return True
        return False

    async def chat(
        self,
        messages: list[dict],
        model: str = "gpt-4o",
        temperature: float = 0.7,
        max_tokens: int = 4096,
        stream: bool = False,
        reasoning: dict | None = None,
        web_search: bool = False,
    ) -> str:
        """Send a chat request, optionally with web search."""
        # Determine the correct token limit parameter name
        use_completion_tokens = self._needs_completion_tokens(model)
        token_key = "max_completion_tokens" if use_completion_tokens else "max_tokens"

        if not web_search:
            # For models needing max_completion_tokens, we can't just call super()
            # because it uses "max_tokens". Build the request manually instead.
            if use_completion_tokens:
                return await self._chat_with_completion_tokens(
                    messages, model=model, temperature=temperature,
                    max_completion_tokens=max_tokens, stream=stream, reasoning=reasoning,
                )
            return await super().chat(
                messages, model=model, temperature=temperature,
                max_tokens=max_tokens, stream=stream, reasoning=reasoning,
            )

        # Web search requires OpenAI's Responses API (/v1/responses), NOT Chat Completions.
        # The Responses API uses a different format: "input" instead of "messages",
        # and supports built-in tools like web_search_preview.
        return await self._responses_api_with_search(
            messages, model=model, temperature=temperature,
            max_tokens=max(max_tokens, 16384),
        )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        url = f"{self._base_url}/chat/completions"

        for attempt in range(3):
            try:
                response = await self.client.post(
                    url, json=body, headers=headers, timeout=300.0
                )
                if response.status_code == 400:
                    # Log the error detail for debugging
                    error_body = response.text
                    print(f"[OpenAI] 400 error (web_search): {error_body[:500]}")
                    # If temperature is the issue, retry without it
                    if "temperature" in error_body and "temperature" in body:
                        del body["temperature"]
                        continue
                    response.raise_for_status()
                if response.status_code in (429, 500, 502, 503):
                    import asyncio
                    await asyncio.sleep(2 ** attempt)
                    continue
                response.raise_for_status()
                break
            except httpx.TimeoutException:
                if attempt == 2:
                    raise
                import asyncio
                await asyncio.sleep(2 ** attempt)
                continue

        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")

        # Track usage
        if self.usage_tracker and data.get("usage"):
            usage = data["usage"]
            from cera.llm.usage import LLMUsage
            inp = usage.get("prompt_tokens", 0)
            out = usage.get("completion_tokens", 0)
            self.usage_tracker.record(LLMUsage(
                model=f"native/openai/{model}",
                prompt_tokens=inp,
                completion_tokens=out,
                total_tokens=inp + out,
                component=self._component,
                target=self._target,
                run=self._run,
            ))

        return content

    async def _chat_with_completion_tokens(
        self,
        messages: list[dict],
        model: str,
        temperature: float = 0.7,
        max_completion_tokens: int = 4096,
        stream: bool = False,
        reasoning: dict | None = None,
    ) -> str:
        """Chat using max_completion_tokens (required by GPT-5+, o-series models)."""
        body: dict = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_completion_tokens": max_completion_tokens,
        }
        if reasoning:
            body["reasoning"] = reasoning

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        url = f"{self._base_url}/chat/completions"

        for attempt in range(3):
            try:
                response = await self.client.post(
                    url, json=body, headers=headers, timeout=300.0
                )
                if response.status_code in (429, 500, 502, 503):
                    import asyncio
                    await asyncio.sleep(2 ** attempt)
                    continue
                response.raise_for_status()
                break
            except httpx.TimeoutException:
                if attempt == 2:
                    raise
                import asyncio
                await asyncio.sleep(2 ** attempt)
                continue

        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")

        if self.usage_tracker and data.get("usage"):
            usage = data["usage"]
            from cera.llm.usage import LLMUsage
            inp = usage.get("prompt_tokens", 0)
            out = usage.get("completion_tokens", 0)
            self.usage_tracker.record(LLMUsage(
                model=f"native/openai/{model}",
                prompt_tokens=inp,
                completion_tokens=out,
                total_tokens=inp + out,
                component=self._component,
                target=self._target,
                run=self._run,
            ))

        return content

    async def _responses_api_with_search(
        self,
        messages: list[dict],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> str:
        """Use OpenAI's Responses API with web_search_preview tool.

        The Responses API (/v1/responses) supports built-in tools like web search,
        unlike the Chat Completions API which only supports function tools.
        """
        # Convert messages to Responses API input format
        input_items = []
        for msg in messages:
            role = msg["role"]
            if role == "system":
                input_items.append({"role": "developer", "content": msg["content"]})
            else:
                input_items.append({"role": role, "content": msg["content"]})

        body: dict = {
            "model": model,
            "input": input_items,
            "tools": [{"type": "web_search_preview", "search_context_size": "medium"}],
            "max_output_tokens": max_tokens,
            "temperature": temperature,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        url = f"{self._base_url}/responses"

        for attempt in range(3):
            try:
                response = await self.client.post(
                    url, json=body, headers=headers, timeout=300.0
                )
                if response.status_code == 400:
                    print(f"[OpenAI] 400 error (responses API): {response.text[:500]}")
                    response.raise_for_status()
                if response.status_code in (429, 500, 502, 503):
                    import asyncio
                    await asyncio.sleep(2 ** attempt)
                    continue
                response.raise_for_status()
                break
            except httpx.TimeoutException:
                if attempt == 2:
                    raise
                import asyncio
                await asyncio.sleep(2 ** attempt)
                continue

        data = response.json()

        # Responses API returns output_text at top level
        content = data.get("output_text", "")
        if not content:
            for item in data.get("output", []):
                if item.get("type") == "message":
                    for part in item.get("content", []):
                        if part.get("type") == "output_text":
                            content += part.get("text", "")

        # Track usage
        if self.usage_tracker and data.get("usage"):
            usage = data["usage"]
            from cera.llm.usage import LLMUsage
            inp = usage.get("input_tokens", usage.get("prompt_tokens", 0))
            out = usage.get("output_tokens", usage.get("completion_tokens", 0))
            self.usage_tracker.record(LLMUsage(
                model=f"native/openai/{model}",
                prompt_tokens=inp,
                completion_tokens=out,
                total_tokens=inp + out,
                component=self._component,
                target=self._target,
                run=self._run,
            ))

        return content


# ---------------------------------------------------------------------------
# Model Listing (auto-fetch from provider APIs)
# ---------------------------------------------------------------------------

async def fetch_native_models(provider: str, settings: dict | None = None) -> list[dict]:
    """Fetch available models from a native provider's API.

    Reads API key from Convex settings first, then env vars.
    Returns a list of dicts with: id, name, context_length, provider.
    """
    if provider not in NATIVE_PROVIDERS:
        return []

    config = NATIVE_PROVIDERS[provider]
    api_key = get_native_api_key(provider, settings)
    if not api_key:
        return []

    try:
        if provider == "perplexity":
            return _format_models(PERPLEXITY_MODELS, provider)

        if provider == "google":
            return await _fetch_gemini_models(api_key)

        if provider == "anthropic":
            return await _fetch_anthropic_models(api_key)

        # OpenAI-compatible /models endpoint
        return await _fetch_openai_compatible_models(
            base_url=config["base_url"],
            api_key=api_key,
            provider=provider,
            model_filter=config.get("model_filter"),
        )
    except Exception as e:
        logger.warning(f"Failed to fetch models from {provider}: {e}")
        return []


async def _fetch_openai_compatible_models(
    base_url: str,
    api_key: str,
    provider: str,
    model_filter=None,
) -> list[dict]:
    """Fetch models from an OpenAI-compatible /models endpoint."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{base_url}/models",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=15.0,
        )
        response.raise_for_status()
        data = response.json()

    models = data.get("data", [])
    if model_filter:
        models = [m for m in models if model_filter(m)]

    return [
        {
            "id": m["id"],
            "name": m.get("name", m["id"]),
            "context_length": m.get("context_window", m.get("context_length", 128000)),
            "provider": provider,
        }
        for m in models
    ]


async def _fetch_anthropic_models(api_key: str) -> list[dict]:
    """Fetch models from Anthropic's /v1/models endpoint."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.anthropic.com/v1/models",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
            },
            timeout=15.0,
        )
        response.raise_for_status()
        data = response.json()

    # Models with extended context support (API returns 200K but actual limit is higher)
    EXTENDED_CONTEXT = {
        "claude-opus-4-6": 1000000,
        "claude-sonnet-4-6": 1000000,
    }

    models = data.get("data", [])
    return [
        {
            "id": m["id"],
            "name": m.get("display_name", m["id"]),
            "context_length": EXTENDED_CONTEXT.get(m["id"], m.get("context_window", 200000)),
            "provider": "anthropic",
        }
        for m in models
        if "claude" in m.get("id", "")
    ]


async def _fetch_gemini_models(api_key: str) -> list[dict]:
    """Fetch models from Google's Gemini API.

    Gemini uses a different endpoint format:
    GET https://generativelanguage.googleapis.com/v1beta/models?key=API_KEY
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://generativelanguage.googleapis.com/v1beta/models",
            params={"key": api_key},
            timeout=15.0,
        )
        response.raise_for_status()
        data = response.json()

    models = data.get("models", [])
    result = []
    for m in models:
        model_id = m.get("name", "").replace("models/", "")
        # Filter to chat-capable Gemini models
        methods = m.get("supportedGenerationMethods", [])
        if "generateContent" not in methods:
            continue
        if not model_id.startswith("gemini"):
            continue
        result.append({
            "id": model_id,
            "name": m.get("displayName", model_id),
            "context_length": m.get("inputTokenLimit", 128000),
            "provider": "google",
        })
    return result


def _format_models(models: list[dict], provider: str) -> list[dict]:
    """Ensure models have the provider field."""
    return [{**m, "provider": provider} for m in models]


async def fetch_all_native_models(settings: dict | None = None) -> dict:
    """Fetch models from all configured native providers.

    Reads API keys from Convex settings first, then env vars.

    Returns:
        {
            "providers": {
                "openai": {"configured": True, "label": "OpenAI (Native)", "models": [...]},
                ...
            }
        }
    """
    import asyncio

    providers = {}
    for name, config in NATIVE_PROVIDERS.items():
        api_key = get_native_api_key(name, settings)
        configured = bool(api_key)

        models = []
        if configured:
            models = await fetch_native_models(name, settings)

        providers[name] = {
            "configured": configured,
            "label": config["label"],
            "models": models,
        }

    return {"providers": providers}
