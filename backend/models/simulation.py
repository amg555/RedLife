from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
from .decision import DecisionContext
from .agents_models import AgentCritique, AgentReaction, AgentVote

class SimulationResult(BaseModel):
    session_id: str
    context: DecisionContext
    critiques: List[AgentCritique]
    reactions: List[AgentReaction]
    votes: List[AgentVote]

class SimulationSession(BaseModel):
    id: str
    decision_text: str
    category: str
    status: str
    created_at: datetime
