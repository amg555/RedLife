from typing import List, Optional
from pydantic import BaseModel

class DecisionInput(BaseModel):
    description: str
    category: Optional[str] = None
    timeline: Optional[str] = None
    budget_impact: Optional[str] = None
    stakeholders: Optional[List[str]] = None
    desired_outcome: Optional[str] = None
    biggest_fear: Optional[str] = None

class DecisionContext(BaseModel):
    input: DecisionInput
    parsed_category: str
    key_entities: List[str]
    risk_dimensions: List[str]
    context_summary: str
