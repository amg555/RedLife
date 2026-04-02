import asyncio
from typing import List
from pydantic import BaseModel
import json

from backend.models.decision import DecisionContext
from backend.models.agents_models import AgentCritique, AgentReaction, AgentVote, IdentifiedRisk, Mitigation
from backend.services.llm_service import llm_service
from backend.agents.persona_generator import GeneratedPersona
from backend.config import settings

class CritiqueResponse(BaseModel):
    critique_text: str
    risks: List[IdentifiedRisk]
    confidence: float
    recommendation: str

class ReactionResponse(BaseModel):
    reaction_type: str
    reaction_text: str
    updated_risks: List[IdentifiedRisk]

class VoteResponse(BaseModel):
    top_risks_ranked: List[str]
    recommendation: str
    confidence: float
    mitigations: List[Mitigation]

class AdversarialAgent:
    def __init__(self, persona: GeneratedPersona):
        """Initialize from a GeneratedPersona dataclass (from persona_generator.py)."""
        self.id = persona.id
        self.name = persona.name
        self.icon = persona.icon
        self.color = persona.color
        self.role = persona.role
        self.focus = persona.focus
        self.attack_style = persona.attack_style
        self.question_style = persona.question_style
        self.family = persona.family
        self.is_hybrid = persona.is_hybrid

    async def critique_decision(self, context: DecisionContext) -> AgentCritique:
        agent_count = settings.AGENT_COUNT
        
        system_prompt = f"""You are {self.name}.
ROLE: {self.role}
FOCUS AREAS: {self.focus}
ATTACK STYLE: {self.attack_style}

You are one of {agent_count} adversarial experts in a RED TEAM exercise. Your job is to ATTACK this decision from your unique angle.

STRICT RULES FOR UNIQUENESS:
1. You MUST critique from YOUR specific lens of "{self.focus}" — do NOT overlap with other agents' domains.
2. Every risk you identify must be SPECIFIC to this exact decision — no generic risks like "financial uncertainty".
3. Name risks with specific, vivid names (e.g., "Month-4 Cash Cliff" not "financial risk").
4. Your critique_text must reference SPECIFIC details from the user's input.
5. Include at least 2 but no more than 4 risks, each with probability (1-5), severity (1-5), and a calculated RPN.
6. Your recommendation must be GO, CAUTION, or NO_GO.
7. Ask at least one devastating question in your critique using this style: {self.question_style}"""

        # Build a rich context block from ALL available user data
        context_parts = [f"DECISION: {context.input.description}"]
        if context.input.stakeholders:
            context_parts.append(f"STAKEHOLDERS: {', '.join(context.input.stakeholders)}")
        if context.input.timeline:
            context_parts.append(f"TIMELINE: {context.input.timeline}")
        if context.input.budget_impact:
            context_parts.append(f"BUDGET/FINANCIAL IMPACT: {context.input.budget_impact}")
        if context.input.desired_outcome:
            context_parts.append(f"DESIRED OUTCOME: {context.input.desired_outcome}")
        if context.input.biggest_fear:
            context_parts.append(f"BIGGEST FEAR: {context.input.biggest_fear}")
        if context.parsed_category:
            context_parts.append(f"CATEGORY: {context.parsed_category}")
        if context.key_entities:
            context_parts.append(f"KEY ENTITIES: {', '.join(context.key_entities)}")
        if context.context_summary and context.context_summary != context.input.description:
            context_parts.append(f"PARSED CONTEXT: {context.context_summary}")

        # Flag missing context
        missing = []
        if not context.input.stakeholders:
            missing.append("stakeholders")
        if not context.input.timeline:
            missing.append("timeline")
        if not context.input.budget_impact:
            missing.append("budget/financial details")
        if not context.input.biggest_fear:
            missing.append("biggest fear")
        if missing:
            context_parts.append(f"⚠️ MISSING CONTEXT (acknowledge this in your critique): {', '.join(missing)}")

        user_prompt = "\n".join(context_parts)
        
        try:
            res = await llm_service.generate_json(system_prompt, user_prompt, CritiqueResponse)
            return AgentCritique(
                agent_id=self.id,
                agent_name=self.name,
                agent_icon=self.icon,
                agent_color=self.color,
                critique_text=res.critique_text,
                risks=res.risks,
                confidence=res.confidence,
                recommendation=res.recommendation if res.recommendation in ["GO", "CAUTION", "NO_GO"] else "CAUTION"
            )
        except Exception as e:
            return AgentCritique(
                agent_id=self.id,
                agent_name=self.name,
                agent_icon=self.icon,
                agent_color=self.color,
                critique_text=f"As {self.name}, I've analyzed this from the lens of {self.focus}. While I couldn't complete my full analysis, the decision warrants careful scrutiny in these areas before proceeding.",
                risks=[],
                confidence=0.4,
                recommendation="CAUTION"
            )

    async def react_to_others(self, target_critique: AgentCritique, all_critiques: List[AgentCritique]) -> AgentReaction:
        """React to a specific critique, with awareness of others."""
        try:
            # Build summary of other agents' positions for cross-debate awareness
            others_summary = []
            for c in all_critiques[:8]:
                if c.agent_id != self.id and c.agent_id != target_critique.agent_id:
                    risk_names = [r.name for r in c.risks] if c.risks else ["(no specific risks)"]
                    others_summary.append(f"  - {c.agent_name}: {', '.join(risk_names)}")
            others_block = "\n".join(others_summary) if others_summary else "  (none available)"

            agent_count = settings.AGENT_COUNT
            system_prompt = f"""You are {self.name}, {self.role}.
Your focus: {self.focus}
Your attack style: {self.attack_style}

You are in ROUND 2 of a heated adversarial debate with {agent_count} agents. React to {target_critique.agent_name}'s critique.

RULES FOR UNIQUE REACTIONS:
1. Your reaction_type MUST be one of: "agree", "disagree", or "build"
2. If you AGREE: explain WHY from your specific lens, and add a risk they missed.
3. If you DISAGREE: explain what they got WRONG and why, from your expertise.
4. If you BUILD: take their point and escalate it — show how the risk is WORSE than they think.
5. Reference their SPECIFIC critique and risk names — do not be vague.
6. You may identify updated_risks if the debate changes your assessment."""

            user_prompt = f"""{target_critique.agent_name} ({target_critique.agent_icon}) said:
"{target_critique.critique_text}"

Their identified risks: {[r.name for r in target_critique.risks] if target_critique.risks else ["(none)"]}

Other agents also raised:
{others_block}

Now react as {self.name}. Be sharp, specific, and adversarial."""
            
            res = await llm_service.generate_json(system_prompt, user_prompt, ReactionResponse)
            
            return AgentReaction(
                agent_id=self.id,
                agent_name=self.name,
                agent_icon=self.icon,
                agent_color=self.color,
                reacting_to_agent_id=target_critique.agent_id,
                reacting_to_agent_name=target_critique.agent_name,
                reaction_type=res.reaction_type if res.reaction_type in ["agree", "disagree", "build"] else "build",
                reaction_text=res.reaction_text,
                updated_risks=res.updated_risks
            )
        except Exception:
            return AgentReaction(
                agent_id=self.id,
                agent_name=self.name,
                agent_icon=self.icon,
                agent_color=self.color,
                reacting_to_agent_id=target_critique.agent_id,
                reacting_to_agent_name=target_critique.agent_name,
                reaction_type="build",
                reaction_text=f"Building on {target_critique.agent_name}'s analysis — from my perspective on {self.focus}, the risk profile is more nuanced than presented."
            )

    async def final_vote(self, context: DecisionContext, all_critiques: List[AgentCritique]) -> AgentVote:
        """Cast final vote with full context from the debate."""
        try:
            agent_count = settings.AGENT_COUNT
            
            # Summarize the debate for voting context — sample top risks
            risk_landscape = []
            for c in all_critiques:
                for r in c.risks:
                    risk_landscape.append(f"  - {r.name} (RPN: {r.rpn}, by {c.agent_name})")
            
            # Only include top 20 risks to keep prompt manageable regardless of agent count
            risk_landscape.sort(key=lambda x: x, reverse=True)
            risk_block = "\n".join(risk_landscape[:20]) if risk_landscape else "  (no risks identified)"

            system_prompt = f"""You are {self.name}, {self.role}.
Your focus: {self.focus}

This is ROUND 3 — your FINAL VOTE. The debate is over. Based on everything you've heard from all {agent_count} agents, cast your verdict.

RULES:
1. Rank the top 3-5 risks from the ENTIRE debate (not just yours).
2. Your recommendation must be GO, CAUTION, or NO_GO.
3. Your confidence must reflect how much information was available (0.0 to 1.0).
4. Provide 1-3 specific, actionable mitigations from YOUR area of expertise."""

            user_prompt = f"""DECISION: {context.input.description}

FULL RISK LANDSCAPE FROM ALL AGENTS (TOP 20):
{risk_block}

Cast your final vote as {self.name}."""

            res = await llm_service.generate_json(system_prompt, user_prompt, VoteResponse)
            return AgentVote(
                agent_id=self.id,
                agent_name=self.name,
                agent_icon=self.icon,
                agent_color=self.color,
                top_risks_ranked=res.top_risks_ranked,
                recommendation=res.recommendation if res.recommendation in ["GO", "CAUTION", "NO_GO"] else "CAUTION",
                confidence=res.confidence,
                mitigations=res.mitigations
            )
        except Exception:
            return AgentVote(
                agent_id=self.id,
                agent_name=self.name,
                agent_icon=self.icon,
                agent_color=self.color,
                top_risks_ranked=[],
                recommendation="CAUTION",
                confidence=0.5,
                mitigations=[]
            )
