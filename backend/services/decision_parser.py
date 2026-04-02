from backend.models.decision import DecisionInput, DecisionContext
from backend.services.llm_service import llm_service
from pydantic import BaseModel
from typing import List, Optional

class ParseResponse(BaseModel):
    category: str
    key_entities: List[str]
    risk_dimensions: List[str]
    context_summary: str
    inferred_details: Optional[str] = None
    context_quality_score: Optional[int] = None

async def parse_decision(input_data: DecisionInput) -> DecisionContext:
    # Calculate how much context we have
    fields_provided = 0
    total_fields = 6
    if input_data.description and len(input_data.description) > 10:
        fields_provided += 1
    if input_data.stakeholders and len(input_data.stakeholders) > 0:
        fields_provided += 1
    if input_data.timeline:
        fields_provided += 1
    if input_data.budget_impact:
        fields_provided += 1
    if input_data.desired_outcome:
        fields_provided += 1
    if input_data.biggest_fear:
        fields_provided += 1
    
    context_quality = int((fields_provided / total_fields) * 100)

    system_prompt = f'''You are the RedLife Decision Parser — the first stage in a 20-agent adversarial stress test.

Your job is to extract MAXIMUM CONTEXT from the user's input so the adversarial agents can produce surgical critiques.

CONTEXT QUALITY: {context_quality}% of fields were provided.
{"⚠️ LOW CONTEXT WARNING: The user provided minimal details. In your context_summary, explicitly state what is MISSING and what you had to ASSUME. The agents need to know what they're guessing about." if context_quality < 50 else ""}

Output a JSON with:
- category: The decision category (career, financial, relationship, health, education, lifestyle, business, investment, relocation)
- key_entities: List of all specific entities mentioned (people, companies, amounts, locations, dates)
- risk_dimensions: List of risk dimensions relevant to THIS specific decision
- context_summary: A rich 3-4 sentence summary that includes ALL details provided AND explicitly flags what's missing
- inferred_details: What you can reasonably infer that wasn't stated (e.g., if they mention "startup" you can infer "financial risk, time commitment")
- context_quality_score: {context_quality}'''

    user_prompt = f'''Decision Description: {input_data.description}
Stakeholders: {input_data.stakeholders or "NOT PROVIDED"}
Timeline: {input_data.timeline or "NOT PROVIDED"}
Budget Impact: {input_data.budget_impact or "NOT PROVIDED"}
Desired Outcome: {input_data.desired_outcome or "NOT PROVIDED"}
Biggest Fear: {input_data.biggest_fear or "NOT PROVIDED"}
Category: {input_data.category or "NOT PROVIDED"}
'''

    try:
        parsed = await llm_service.generate_json(system_prompt, user_prompt, ParseResponse)
        
        # Enrich the context summary with missing data flags
        summary = parsed.context_summary
        if context_quality < 50:
            summary = f"[LOW CONTEXT - {context_quality}% fields provided] {summary}"
        
        return DecisionContext(
            input=input_data,
            parsed_category=parsed.category or input_data.category or "unknown",
            key_entities=parsed.key_entities,
            risk_dimensions=parsed.risk_dimensions,
            context_summary=summary,
        )
    except Exception as e:
        return DecisionContext(
            input=input_data,
            parsed_category=input_data.category or "general",
            key_entities=[],
            risk_dimensions=[],
            context_summary=f"[PARSE FAILED - {context_quality}% context] {input_data.description}"
        )
