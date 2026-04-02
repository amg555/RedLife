from typing import List, Dict, Literal
from pydantic import BaseModel
from .agents_models import Mitigation

class RankedRisk(BaseModel):
    name: str
    description: str
    category: str
    probability: int
    severity: int
    detectability: int
    rpn: int
    agents_flagged: List[Dict[str, str]]
    debate_summary: str
    mitigations: List[Mitigation]

class DebateHighlight(BaseModel):
    agent_a_id: str
    agent_a_name: str
    agent_a_icon: str
    agent_a_color: str
    agent_a_quote: str
    agent_b_id: str
    agent_b_name: str
    agent_b_icon: str
    agent_b_color: str
    agent_b_quote: str
    tension_level: Literal["low", "medium", "high"]

class ActionItem(BaseModel):
    action: str
    effort: Literal["easy", "medium", "hard"]
    timeframe: str

class DecisionRiskReport(BaseModel):
    session_id: str
    created_at: str
    decision_summary: str
    overall_risk_score: int
    recommendation: Literal["GO", "CAUTION", "NO_GO"]
    recommendation_confidence: int
    consensus: Dict[str, int]
    risk_matrix: List[RankedRisk]
    top_risks: List[RankedRisk]
    pre_mortem_narrative: str
    hidden_opportunities: List[str]
    debate_highlights: List[DebateHighlight]
    dimension_scores: Dict[str, int]
    action_plan_go: List[ActionItem]
    action_plan_wait: List[str]
    action_plan_nogo: List[str]
    all_critiques: List[Dict] = []
    all_reactions: List[Dict] = []
    all_votes: List[Dict] = []
