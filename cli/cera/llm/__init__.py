"""LLM Module - Language model abstractions and verification."""

from .openrouter import (
    OpenRouterClient,
    supports_online_search,
    get_search_model_id,
    NATIVE_SEARCH_MODELS,
)
from .mav import MultiAgentVerification
from .web_search import WebSearchClient, TavilySearchClient, PerplexitySearchClient
from .native import (
    parse_native_model,
    get_native_client,
    fetch_all_native_models,
    NATIVE_PROVIDERS,
    AnthropicNativeClient,
    GoogleNativeClient,
    OpenAINativeClient,
)

__all__ = [
    "OpenRouterClient",
    "supports_online_search",
    "get_search_model_id",
    "NATIVE_SEARCH_MODELS",
    "MultiAgentVerification",
    "WebSearchClient",
    "TavilySearchClient",
    "PerplexitySearchClient",
    "parse_native_model",
    "get_native_client",
    "fetch_all_native_models",
    "NATIVE_PROVIDERS",
    "AnthropicNativeClient",
    "GoogleNativeClient",
    "OpenAINativeClient",
]
