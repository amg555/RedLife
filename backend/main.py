from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routes_simulation import router as simulation_router, agents_router
from contextlib import asynccontextmanager
# trigger reload
import uvicorn
from backend.config import settings
import logging

# Configure logging for the engine
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s"
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Log startup configuration
    logger = logging.getLogger("redlife")
    logger.info(f"RedLife Engine Starting — {settings.AGENT_COUNT} agents configured")
    logger.info(f"LLM: {settings.LLM_PROVIDER}/{settings.LLM_MODEL}")
    logger.info(f"Batch size: {settings.AGENT_BATCH_SIZE}, Debate sample: {settings.DEBATE_SAMPLE_SIZE}")
    yield

app = FastAPI(
    title="RedLife Backend — AI Decision Stress-Testing Engine",
    description=f"Adversarial multi-agent simulation with {settings.AGENT_COUNT} agents",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "*"],  # Allow frontend port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(simulation_router)
app.include_router(agents_router)

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "agent_count": settings.AGENT_COUNT,
        "llm_provider": settings.LLM_PROVIDER,
        "llm_model": settings.LLM_MODEL,
    }

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
