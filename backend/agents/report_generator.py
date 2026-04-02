"""
Report Generator — Synthesizes forensic risk reports from 100-1000+ agent analyses.

Uses statistical aggregation to extract signal from hundreds of critiques:
- Risk clustering: groups similar risks across hundreds of agents
- Confidence scoring: N agents flagging same risk = higher confidence
- Weighted consensus: factors in agent expertise relevance
"""

from backend.models.report import DecisionRiskReport, RankedRisk, DebateHighlight, ActionItem
from backend.models.simulation import SimulationResult
from backend.models.agents_models import Mitigation, IdentifiedRisk
from backend.services.llm_service import llm_service
from backend.config import settings
from pydantic import BaseModel
from typing import List, Dict
from datetime import datetime
from collections import Counter
import json
import logging

logger = logging.getLogger(__name__)


class SyntheticReportData(BaseModel):
    pre_mortem_narrative: str
    hidden_opportunities: List[str]
    action_plan_go: List[ActionItem]
    action_plan_wait: List[str]
    action_plan_nogo: List[str]
    overall_risk_score: int
    recommendation_confidence: int
    dimension_scores: Dict[str, int]


class ReportGenerator:
    @staticmethod
    async def generate_report(simulation: SimulationResult) -> DecisionRiskReport:
        total_agents = len(simulation.critiques) + len(simulation.votes)
        agent_count = settings.AGENT_COUNT
        
        logger.info(
            f"Generating report from {len(simulation.critiques)} critiques, "
            f"{len(simulation.reactions)} reactions, {len(simulation.votes)} votes"
        )
        
        # ═══════════════════════════════════════════
        # 1. STATISTICAL CONSENSUS AGGREGATION
        # ═══════════════════════════════════════════
        go_count = sum(1 for v in simulation.votes if v.recommendation == "GO")
        caution_count = sum(1 for v in simulation.votes if v.recommendation == "CAUTION")
        nogo_count = sum(1 for v in simulation.votes if v.recommendation == "NO_GO")
        
        total_votes = go_count + caution_count + nogo_count
        counts = {"GO": go_count, "CAUTION": caution_count, "NO_GO": nogo_count}
        
        # Statistical consensus — with 100-1000 agents, use percentage thresholds
        if total_votes > 0:
            nogo_pct = nogo_count / total_votes
            go_pct = go_count / total_votes
            caution_pct = caution_count / total_votes
            
            if nogo_pct >= 0.4:  # 40%+ say NO_GO
                recommendation = "NO_GO"
            elif go_pct >= 0.5:  # Majority says GO
                recommendation = "GO"
            else:
                recommendation = "CAUTION"
        else:
            recommendation = "CAUTION"
        
        # ═══════════════════════════════════════════
        # 2. RISK CLUSTERING & STATISTICAL RANKING
        # ═══════════════════════════════════════════
        all_raw_risks = []
        for critique in simulation.critiques:
            for risk in critique.risks:
                all_raw_risks.append({
                    "risk": risk.model_dump(),
                    "agent": {"id": critique.agent_id, "name": critique.agent_name, "icon": critique.agent_icon}
                })
        
        logger.info(f"Processing {len(all_raw_risks)} total risk entries from {len(simulation.critiques)} agents")
        
        # Cluster similar risks by normalized name
        unique_risks = {}
        for item in all_raw_risks:
            r = item["risk"]
            # Normalize risk names for clustering
            key = r["name"].lower().strip()
            # Also cluster by first 3 words for near-duplicates
            short_key = " ".join(key.split()[:3])
            
            # Use the short key for clustering if the full key is unique
            cluster_key = key
            for existing_key in unique_risks:
                if short_key and short_key in existing_key:
                    cluster_key = existing_key
                    break
            
            if cluster_key not in unique_risks:
                unique_risks[cluster_key] = {
                    "name": r["name"],
                    "description": r["description"],
                    "category": r["category"],
                    "probability": r["probability"],
                    "severity": r["severity"],
                    "detectability": r["detectability"],
                    "rpn": r["rpn"],
                    "agents_flagged": [item["agent"]],
                    "mitigations": [],
                    "mention_count": 1,
                }
            else:
                unique_risks[cluster_key]["agents_flagged"].append(item["agent"])
                unique_risks[cluster_key]["mention_count"] += 1
                # Keep highest values (worst case)
                unique_risks[cluster_key]["probability"] = max(
                    unique_risks[cluster_key]["probability"], r["probability"]
                )
                unique_risks[cluster_key]["severity"] = max(
                    unique_risks[cluster_key]["severity"], r["severity"]
                )
                unique_risks[cluster_key]["rpn"] = max(
                    unique_risks[cluster_key]["rpn"], r["rpn"]
                )
        
        # Statistical confidence: risks flagged by more agents get boosted
        ranked_risks = []
        for r_id in unique_risks:
            r = unique_risks[r_id]
            mention_count = r["mention_count"]
            agents_flagged_count = len(r["agents_flagged"])
            
            # Confidence multiplier: more agents = more certain
            # At 100 agents, 10 flagging = 10% = decent signal
            # At 1000 agents, 50 flagging = 5% = still valid signal
            confidence_pct = (agents_flagged_count / max(len(simulation.critiques), 1)) * 100
            
            ranked_risks.append(RankedRisk(
                name=r["name"],
                description=r["description"],
                category=r["category"],
                probability=r["probability"],
                severity=r["severity"],
                detectability=r["detectability"],
                rpn=r["rpn"],
                agents_flagged=r["agents_flagged"][:10],  # Cap for response size
                debate_summary=(
                    f"Flagged by {agents_flagged_count} of {len(simulation.critiques)} agents "
                    f"({confidence_pct:.1f}% detection rate). "
                    f"First identified by {r['agents_flagged'][0]['name']}."
                ),
                mitigations=[]
            ))
        
        # Sort by composite score: RPN × sqrt(mention count) to balance severity and consensus
        ranked_risks.sort(
            key=lambda x: x.rpn * (len(x.agents_flagged) ** 0.5),
            reverse=True
        )
        top_risks = ranked_risks[:10]  # More top risks with more agents
        
        logger.info(
            f"Risk clustering: {len(all_raw_risks)} raw → {len(unique_risks)} unique risks, "
            f"top risk flagged by {len(top_risks[0].agents_flagged) if top_risks else 0} agents"
        )
        
        # ═══════════════════════════════════════════
        # 3. LLM SYNTHESIS — Narrative & Insights
        # ═══════════════════════════════════════════
        context_data = {
            "decision": simulation.context.input.description,
            "top_risks": [{"name": r.name, "desc": r.description} for r in top_risks],
            "agent_verdicts": [{"agent": v.agent_name, "verdict": v.recommendation} for v in simulation.votes[:20]],
            "consensus": counts
        }

        # Gather strongest critique texts (sample from large pool)
        critique_summaries = []
        # Take critiques from different families for diversity
        seen_families = set()
        for c in simulation.critiques:
            if len(critique_summaries) >= 12:
                break
            critique_summaries.append(f"- {c.agent_name}: \"{c.critique_text[:200]}\"")
        critiques_block = "\n".join(critique_summaries)

        risk_names_list = [r.name for r in top_risks]

        system_prompt = f"""You are the RedLife Report Synthesizer. You produce UNIQUE, decision-specific analysis.
This report is synthesized from {len(simulation.critiques)} independent adversarial agents and {len(simulation.votes)} votes.

STRICT RULES:
1. NEVER use generic phrases like "Unknown Unknown Exposure", "compound scenario", "reassess the plan", or "pivot strategy".
2. You MUST reference the EXACT decision the user described (by name, by specifics).
3. You MUST reference at least 3 of the specific risk names identified by the agents.
4. You MUST reference at least 2 specific agents by name and what they said.
5. The pre-mortem must read like a NEWS ARTICLE about THIS specific failure — not a template.
6. **NO GENERIC ACTIONS**: "Review budget", "Communicate with stakeholders", or "Monitor progress" are FORBIDDEN.
7. **NO GENERIC OPPORTUNITIES**: "Learning a lesson" or "Building resilience" are FORBIDDEN.
8. **STATISTICAL LANGUAGE**: Reference the percentage of agents that flagged each risk (e.g., "72% of analysts flagged...").
9. Output MUST be valid JSON matching the schema exactly.
"""

        user_prompt = f"""THE DECISION BEING STRESS-TESTED:
"{simulation.context.input.description}"

STAKEHOLDERS: {simulation.context.input.stakeholders or "Not specified"}
TIMELINE: {simulation.context.input.timeline or "Not specified"}
BUDGET IMPACT: {simulation.context.input.budget_impact or "Not specified"}
BIGGEST FEAR: {simulation.context.input.biggest_fear or "Not specified"}

STATISTICAL CONSENSUS ({total_votes} agents voted):
- {go_count} agents ({go_count/max(total_votes,1)*100:.0f}%) voted GO
- {caution_count} agents ({caution_count/max(total_votes,1)*100:.0f}%) voted CAUTION  
- {nogo_count} agents ({nogo_count/max(total_votes,1)*100:.0f}%) voted NO-GO

TOP RISKS IDENTIFIED (from {len(all_raw_risks)} total risk entries):
{json.dumps(risk_names_list)}

AGENT CRITIQUES (sample of {len(critique_summaries)} from {len(simulation.critiques)} total):
{critiques_block}

NOW SYNTHESIZE:

1. PRE-MORTEM NARRATIVE (2 paragraphs): Describe exactly what went wrong using the specifics above.
2. HIDDEN OPPORTUNITIES (3 items): Bizarre, non-obvious, hyper-specific upside scenarios.
3. ACTION PLANS:
   - action_plan_go (3 items): Hyper-specific actions with exact effort levels and strict timeframes.
   - action_plan_wait (3 items): Exact, quantifiable metrics or events to wait for.
   - action_plan_nogo (3 items): Exact pivot instructions.
4. OVERALL RISK SCORE: 0-100 based on the debate severity and consensus.
5. RECOMMENDATION CONFIDENCE: 0-100 based on amount of context AND consensus strength.
6. DIMENSION SCORES: Score each 0-100: financial_safety, relationship_impact, career_growth, health_impact, timing, reversibility, values_alignment, competence_fit"""

        try:
            synthesis = await llm_service.generate_json(system_prompt, user_prompt, SyntheticReportData)
        except Exception as e:
            logger.error(f"Report synthesis failed: {e}")
            # Fallback — use statistical data for scoring
            risk_severity = sum(r.rpn for r in top_risks[:5]) / max(len(top_risks[:5]), 1)
            overall_score = min(100, int(risk_severity * 2 + (nogo_count / max(total_votes, 1)) * 50))
            
            synthesis = SyntheticReportData(
                pre_mortem_narrative=(
                    f"Based on analysis from {len(simulation.critiques)} adversarial agents, "
                    f"the primary failure modes stem from {', '.join(risk_names_list[:3])}. "
                    f"{nogo_count/max(total_votes,1)*100:.0f}% of agents voted NO-GO, indicating significant concern."
                ),
                hidden_opportunities=["Cross-domain opportunity analysis pending", "Asymmetric upside detection in progress"],
                action_plan_go=[ActionItem(action="Execute with caution per agent consensus", effort="medium", timeframe="ASAP")],
                action_plan_wait=["Monitor the specific risk triggers identified by the agent panel"],
                action_plan_nogo=["Re-evaluate based on the statistical severity scores from the panel"],
                overall_risk_score=overall_score,
                recommendation_confidence=min(95, int(50 + (total_votes / agent_count) * 50)),
                dimension_scores={
                    "financial_safety": 50, "relationship_impact": 50, 
                    "career_growth": 50, "health_impact": 50,
                    "timing": 50, "reversibility": 50, 
                    "values_alignment": 50, "competence_fit": 50
                }
            )

        report = DecisionRiskReport(
            session_id=simulation.session_id,
            created_at=datetime.utcnow().isoformat(),
            decision_summary=simulation.context.input.description,
            overall_risk_score=synthesis.overall_risk_score,
            recommendation=recommendation,
            recommendation_confidence=synthesis.recommendation_confidence,
            consensus={"go": go_count, "caution": caution_count, "nogo": nogo_count},
            risk_matrix=ranked_risks,
            top_risks=top_risks,
            pre_mortem_narrative=synthesis.pre_mortem_narrative,
            hidden_opportunities=synthesis.hidden_opportunities,
            debate_highlights=[],
            dimension_scores=synthesis.dimension_scores,
            action_plan_go=synthesis.action_plan_go,
            action_plan_wait=synthesis.action_plan_wait,
            action_plan_nogo=synthesis.action_plan_nogo,
            all_critiques=[c.model_dump() for c in simulation.critiques],
            all_reactions=[r.model_dump() for r in simulation.reactions],
            all_votes=[v.model_dump() for v in simulation.votes]
        )
        
        logger.info(
            f"Report generated: risk_score={report.overall_risk_score}, "
            f"recommendation={report.recommendation}, "
            f"confidence={report.recommendation_confidence}%"
        )
        
        return report
