import { PERSONAS } from '../../data/personas';
import { useSimulationStore } from '../../stores/simulationStore';
import AgentCard from './AgentCard';

export default function AgentGrid() {
  const agents = useSimulationStore(s => s.agents);
  const agentList = PERSONAS.map(p => agents[p.id]).filter(Boolean);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
      {agentList.map((agent, idx) => (
        <AgentCard key={agent.id} agent={agent} animDelay={idx * 60} />
      ))}
    </div>
  );
}
