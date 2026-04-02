import asyncio
import random
import logging
from typing import List
from datetime import datetime
from backend.models.decision import DecisionContext
from backend.models.simulation import SimulationResult
from backend.agents.agent_factory import AgentFactory
from backend.services.sse_manager import sse_manager
from backend.config import settings

logger = logging.getLogger(__name__)


class DebateEngine:
    @staticmethod
    async def run_simulation(context: DecisionContext, session_id: str) -> SimulationResult:
        """
        Run the full 3-round adversarial simulation with N agents (100-1000+).
        
        Architecture for scale:
        - Round 1: All N agents critique in parallel batches
        - Round 2: Top DEBATE_SAMPLE_SIZE agents cross-debate (most impactful)
        - Round 3: All N agents vote in parallel batches
        - Statistical aggregation handles consensus from hundreds of votes
        """
        agent_count = settings.AGENT_COUNT
        batch_size = settings.AGENT_BATCH_SIZE
        debate_sample = settings.DEBATE_SAMPLE_SIZE
        
        agents = AgentFactory.spawn_agents(context)
        
        logger.info(f"Starting simulation with {len(agents)} agents (batch_size={batch_size}, debate_sample={debate_sample})")
        
        await sse_manager.broadcast(session_id, "simulation_start", {
            "total_agents": len(agents),
            "batch_size": batch_size,
            "debate_sample_size": debate_sample,
            "decision_preview": context.input.description[:100]
        })
        
        # ═══════════════════════════════════════════
        # ROUND 1 — CRITIQUES (All N agents attack in waves)
        # ═══════════════════════════════════════════
        await sse_manager.broadcast(session_id, "round_start", {
            "round": 1,
            "title": "Adversarial Critiques",
            "description": f"{len(agents)} agents independently tear apart your decision"
        })
        
        valid_critiques = []
        total_batches = (len(agents) + batch_size - 1) // batch_size
        
        for batch_idx in range(0, len(agents), batch_size):
            batch = agents[batch_idx:batch_idx + batch_size]
            batch_num = (batch_idx // batch_size) + 1
            
            critique_tasks = []
            for agent in batch:
                await sse_manager.broadcast(session_id, "agent_thinking", {
                    "agentId": agent.id,
                    "agentName": agent.name,
                    "agentIcon": agent.icon,
                    "agentColor": agent.color,
                    "phase": "critique",
                    "batch": batch_num,
                    "totalBatches": total_batches
                })
                critique_tasks.append(agent.critique_decision(context))
            
            batch_results = await asyncio.gather(*critique_tasks, return_exceptions=True)
            
            for result in batch_results:
                if not isinstance(result, Exception):
                    valid_critiques.append(result)
                    await sse_manager.broadcast(session_id, "agent_critique", {
                        "agentId": result.agent_id,
                        "data": result.model_dump()
                    })
                else:
                    logger.warning(f"Agent critique failed: {result}")
            
            # Progress update per batch
            await sse_manager.broadcast(session_id, "batch_complete", {
                "round": 1,
                "batch": batch_num,
                "totalBatches": total_batches,
                "completedAgents": len(valid_critiques),
                "totalAgents": len(agents)
            })
        
        await sse_manager.broadcast(session_id, "round_complete", {
            "round": 1,
            "critiques_count": len(valid_critiques)
        })
        
        logger.info(f"Round 1 complete: {len(valid_critiques)}/{len(agents)} critiques collected")
        
        # ═══════════════════════════════════════════
        # ROUND 2 — CROSS-DEBATE (Top N most impactful agents)
        # ═══════════════════════════════════════════
        await sse_manager.broadcast(session_id, "round_start", {
            "round": 2,
            "title": "Adversarial Debate",
            "description": f"Top {debate_sample} agents challenge each other's findings"
        })
        
        reactions = []
        if len(valid_critiques) >= 2:
            # RANK critiques by impact: total RPN, risk count, and recommendation severity
            ranked_critiques = DebateEngine._rank_critiques_by_impact(valid_critiques)
            
            # Select top debaters — agents whose critiques were most impactful
            top_critique_ids = {c.agent_id for c in ranked_critiques[:debate_sample]}
            debater_agents = [a for a in agents if a.id in top_critique_ids]
            
            # Create diverse debate pairings
            debate_pairs = DebateEngine._create_debate_pairings(
                debater_agents, ranked_critiques[:debate_sample * 2]
            )
            
            logger.info(f"Round 2: {len(debate_pairs)} debate pairs from top {len(debater_agents)} agents")
            
            # Run debates in batches too
            debate_batch_size = batch_size
            for db_idx in range(0, len(debate_pairs), debate_batch_size):
                debate_batch = debate_pairs[db_idx:db_idx + debate_batch_size]
                debate_tasks = []
                
                for agent, target_critique in debate_batch:
                    await sse_manager.broadcast(session_id, "agent_thinking", {
                        "agentId": agent.id,
                        "agentName": agent.name,
                        "agentIcon": agent.icon,
                        "agentColor": agent.color,
                        "phase": "debate",
                        "target": target_critique.agent_name
                    })
                    debate_tasks.append(
                        agent.react_to_others(target_critique, valid_critiques)
                    )
                
                debate_results = await asyncio.gather(*debate_tasks, return_exceptions=True)
                
                for result in debate_results:
                    if not isinstance(result, Exception):
                        reactions.append(result)
                        await sse_manager.broadcast(session_id, "agent_reaction", {
                            "agentId": result.agent_id,
                            "data": result.model_dump()
                        })
        
        await sse_manager.broadcast(session_id, "round_complete", {
            "round": 2,
            "reactions_count": len(reactions)
        })
        
        logger.info(f"Round 2 complete: {len(reactions)} reactions collected")
        
        # ═══════════════════════════════════════════
        # ROUND 3 — FINAL VOTES (All N agents vote in waves)
        # ═══════════════════════════════════════════
        await sse_manager.broadcast(session_id, "round_start", {
            "round": 3,
            "title": "Final Verdict",
            "description": f"All {len(agents)} agents cast their final votes"
        })
        
        valid_votes = []
        for batch_idx in range(0, len(agents), batch_size):
            batch = agents[batch_idx:batch_idx + batch_size]
            batch_num = (batch_idx // batch_size) + 1
            
            vote_tasks = []
            for agent in batch:
                await sse_manager.broadcast(session_id, "agent_thinking", {
                    "agentId": agent.id,
                    "agentName": agent.name,
                    "agentIcon": agent.icon,
                    "agentColor": agent.color,
                    "phase": "vote"
                })
                vote_tasks.append(agent.final_vote(context, valid_critiques))
            
            batch_results = await asyncio.gather(*vote_tasks, return_exceptions=True)
            for result in batch_results:
                if not isinstance(result, Exception):
                    valid_votes.append(result)
                    await sse_manager.broadcast(session_id, "agent_vote", {
                        "agentId": result.agent_id,
                        "data": result.model_dump()
                    })
            
            # Progress update per vote batch
            await sse_manager.broadcast(session_id, "batch_complete", {
                "round": 3,
                "batch": batch_num,
                "totalBatches": total_batches,
                "completedAgents": len(valid_votes),
                "totalAgents": len(agents)
            })
        
        await sse_manager.broadcast(session_id, "round_complete", {"round": 3})
        await sse_manager.broadcast(session_id, "report_generating")
        
        logger.info(
            f"Simulation complete: {len(valid_critiques)} critiques, "
            f"{len(reactions)} reactions, {len(valid_votes)} votes"
        )
        
        return SimulationResult(
            session_id=session_id,
            context=context,
            critiques=valid_critiques,
            reactions=reactions,
            votes=valid_votes
        )

    @staticmethod
    def _rank_critiques_by_impact(critiques):
        """
        Rank critiques by their impact score for debate selection.
        Impact = total RPN of risks + severity bonus for NO_GO + risk count bonus.
        """
        def impact_score(critique):
            rpn_total = sum(r.rpn for r in critique.risks) if critique.risks else 0
            recommendation_weight = {"NO_GO": 50, "CAUTION": 20, "GO": 0}
            rec_bonus = recommendation_weight.get(critique.recommendation, 10)
            risk_count_bonus = len(critique.risks) * 5 if critique.risks else 0
            confidence_factor = critique.confidence * 10
            return rpn_total + rec_bonus + risk_count_bonus + confidence_factor
        
        return sorted(critiques, key=impact_score, reverse=True)

    @staticmethod
    def _create_debate_pairings(agents, critiques):
        """
        Create diverse debate pairings optimized for large agent pools.
        
        Strategy:
        - Pair agents from DIFFERENT archetype families when possible
        - Ensure each critique gets challenged by at least one agent
        - Rotate critiques so debates are diverse, not repetitive
        """
        pairs = []
        critique_map = {c.agent_id: c for c in critiques}
        available_critiques = list(critiques)
        
        if not available_critiques:
            return pairs
        
        for agent in agents:
            # Find a critique that is NOT from this agent
            best_target = None
            for c in available_critiques:
                if c.agent_id != agent.id:
                    best_target = c
                    break
            
            if best_target:
                pairs.append((agent, best_target))
                # Rotate critiques so next agent gets a different one
                if available_critiques:
                    available_critiques.append(available_critiques.pop(0))
        
        return pairs
