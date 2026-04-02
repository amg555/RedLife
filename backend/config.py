import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    LLM_PROVIDER: str = "ollama"
    LLM_MODEL: str = "llama3.1"
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    MAX_CONCURRENT_LLM_CALLS: int = 5
    LLM_TIMEOUT_SECONDS: int = 60
    
    # ═══════════════════════════════════════════
    # AGENT SCALING CONFIGURATION
    # ═══════════════════════════════════════════
    # Total number of adversarial agents to spawn (20-1000)
    AGENT_COUNT: int = 100
    
    # Batch size for parallel LLM calls (keep under API rate limits)
    AGENT_BATCH_SIZE: int = 10
    
    # How many agents participate in Round 2 cross-debate
    # (debating all 1000 would be slow/expensive — sample the most impactful)
    DEBATE_SAMPLE_SIZE: int = 30
    
    # Seed for deterministic agent generation (same seed = same agents)
    AGENT_GENERATION_SEED: int = 42
    
    # Use a robust local file path for SQLite so developers retain history across restarts
    DATABASE_URL: str = "sqlite+aiosqlite:///redlife_local.db"
    
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
