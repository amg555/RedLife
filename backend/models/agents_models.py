from typing import List, Literal, Optional
from pydantic import BaseModel

class IdentifiedRisk(BaseModel):
    name: str
    description: str
    category: str
    probability: int  # 1-5
    severity: int  # 1-5
    detectability: int  # 1-5
    rpn: int  # probability * severity * (6 - detectability)

class Mitigation(BaseModel):
    risk_name: str
    action: str
    effort: Literal["easy", "medium", "hard"]
    explanation: str

class AgentCritique(BaseModel):
    agent_id: str
    agent_name: str
    agent_icon: str
    agent_color: str = "#888888"
    critique_text: str
    risks: List[IdentifiedRisk]
    confidence: float
    recommendation: Literal["GO", "CAUTION", "NO_GO"]

class AgentReaction(BaseModel):
    agent_id: str
    agent_name: str = ""
    agent_icon: str = ""
    agent_color: str = "#888888"
    reacting_to_agent_id: str
    reacting_to_agent_name: str = ""
    reaction_type: Literal["agree", "disagree", "build"]
    reaction_text: str
    updated_risks: Optional[List[IdentifiedRisk]] = None

class AgentVote(BaseModel):
    agent_id: str
    agent_name: str
    agent_icon: str
    agent_color: str = "#888888"
    top_risks_ranked: List[str]
    recommendation: Literal["GO", "CAUTION", "NO_GO"]
    confidence: float
    mitigations: List[Mitigation]
