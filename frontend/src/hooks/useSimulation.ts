import { startSimulation as startApiSimulation } from '../lib/api';
import { useSimulationStore } from '../stores/simulationStore';
import type { DecisionInput } from '../types';

export function useSimulation() {
  const store = useSimulationStore();

  const startSimulation = async (decision: DecisionInput) => {
    try {
      store.reset();
      store.setDecisionInput(decision.description);
      store.setStatus('parsing');
      
      const { session_id } = await startApiSimulation(decision);
      store.setSessionId(session_id);
      
      return session_id;
    } catch (err: any) {
      store.setError(err.message || 'Failed to start simulation');
      return null;
    }
  };

  return {
    startSimulation,
  };
}
