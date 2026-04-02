from typing import List
from backend.models.decision import DecisionContext
from backend.agents.persona_generator import generate_personas, GeneratedPersona
from backend.agents.adversarial_agent import AdversarialAgent
from backend.config import settings
import logging

logger = logging.getLogger(__name__)


class AgentFactory:
    @staticmethod
    def spawn_agents(context: DecisionContext, count: int = None) -> List[AdversarialAgent]:
        """
        Spawn N adversarial agents from the procedural persona generator.
        
        Default count comes from settings.AGENT_COUNT (100-1000).
        Uses deterministic generation so same seed = same agent pool.
        """
        agent_count = count or settings.AGENT_COUNT
        personas = generate_personas(
            count=agent_count, 
            seed=settings.AGENT_GENERATION_SEED
        )
        
        agents = []
        for persona in personas:
            agent = AdversarialAgent(persona)
            agents.append(agent)
        
        logger.info(
            f"Spawned {len(agents)} adversarial agents "
            f"({sum(1 for p in personas if p.is_hybrid)} hybrids)"
        )
        return agents

    @staticmethod
    def get_agent_count() -> int:
        """Return the configured agent count."""
        return settings.AGENT_COUNT

    @staticmethod
    def get_manifest(count: int = None) -> List[dict]:
        """
        Get the full agent manifest for frontend rendering.
        Returns serialized persona data without creating full agent instances.
        """
        agent_count = count or settings.AGENT_COUNT
        personas = generate_personas(
            count=agent_count,
            seed=settings.AGENT_GENERATION_SEED
        )
        return [p.to_dict() for p in personas]
