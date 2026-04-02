import asyncio
import json
import uuid
from fastapi import APIRouter, Request, BackgroundTasks, Depends, HTTPException
from sse_starlette.sse import EventSourceResponse
from backend.models.decision import DecisionInput
from backend.models.report import DecisionRiskReport
from backend.services.decision_parser import parse_decision
from backend.agents.debate_engine import DebateEngine
from backend.agents.report_generator import ReportGenerator
from backend.agents.agent_factory import AgentFactory
from backend.agents.persona_generator import get_generation_stats
from backend.services.sse_manager import sse_manager
from backend.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/simulation", tags=["simulation"])

# In-memory store for quick lookups
_reports = {}

async def run_simulation_task(request_data: DecisionInput, session_id: str):
    logger.info(f"Starting background simulation task for session {session_id}")
    try:
        import asyncio
        await asyncio.sleep(1.5)
        
        # Broadcast early so the frontend gets out of the loading screen!
        await sse_manager.broadcast(session_id, "simulation_start", {
            "total_agents": settings.AGENT_COUNT,
            "rounds": 3
        })
        
        context = await parse_decision(request_data)
        sim_result = await DebateEngine.run_simulation(context, session_id)
        report = await ReportGenerator.generate_report(sim_result)
        
        # Keep in memory for quick retrieval
        _reports[session_id] = report
        
        await sse_manager.broadcast(session_id, "report_complete", report)
        logger.info(f"[{session_id}] Simulation complete, report stored.")
        
    except Exception as e:
        import traceback
        with open("error.txt", "w") as f:
            f.write(traceback.format_exc())
        logger.error(f"Simulation failed: {traceback.format_exc()}")
        await sse_manager.broadcast(session_id, "simulation_error", {"error": str(e)})

@router.post("/start")
async def start_simulation(input_data: DecisionInput, background_tasks: BackgroundTasks):
    session_id = str(uuid.uuid4())
    background_tasks.add_task(run_simulation_task, input_data, session_id)
    return {"session_id": session_id}

@router.get("/{session_id}/stream")
async def stream_simulation(session_id: str, request: Request):
    from sse_starlette.sse import EventSourceResponse
    queue = sse_manager.subscribe(session_id)
    
    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                message = await queue.get()
                yield message
        except asyncio.CancelledError:
            pass
        finally:
            sse_manager.unsubscribe(session_id, queue)

    return EventSourceResponse(event_generator())

@router.get("/{session_id}/report")
async def get_report(session_id: str):
    if session_id in _reports:
        return _reports[session_id]
    raise HTTPException(status_code=404, detail="Report not found")


# ═══════════════════════════════════════════════════════════════════
# NEW: Agent Manifest & Configuration API (Python-first architecture)
# ═══════════════════════════════════════════════════════════════════

agents_router = APIRouter(prefix="/api/agents", tags=["agents"])

@agents_router.get("/manifest")
async def get_agent_manifest():
    """
    Returns the full list of agent personas for frontend rendering.
    Frontend fetches this instead of using hardcoded TypeScript data.
    All agent generation logic lives in Python.
    """
    manifest = AgentFactory.get_manifest()
    return {
        "agents": manifest,
        "total_count": len(manifest),
        "config": {
            "agent_count": settings.AGENT_COUNT,
            "batch_size": settings.AGENT_BATCH_SIZE,
            "debate_sample_size": settings.DEBATE_SAMPLE_SIZE,
        }
    }

@agents_router.get("/stats")
async def get_agent_stats():
    """
    Returns statistics about the agent generation system.
    """
    return get_generation_stats(settings.AGENT_COUNT)

@agents_router.get("/config")
async def get_agent_config():
    """
    Returns current agent scaling configuration.
    """
    return {
        "agent_count": settings.AGENT_COUNT,
        "batch_size": settings.AGENT_BATCH_SIZE,
        "debate_sample_size": settings.DEBATE_SAMPLE_SIZE,
        "max_concurrent_llm_calls": settings.MAX_CONCURRENT_LLM_CALLS,
        "llm_timeout_seconds": settings.LLM_TIMEOUT_SECONDS,
    }
