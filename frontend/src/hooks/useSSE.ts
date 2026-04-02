import { useEffect, useRef, useState } from 'react';
import { useSimulationStore } from '../stores/simulationStore';
import type { SimulationEvent } from '../types';

export function useSSE(sessionId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnects = 3;
  const store = useSimulationStore();

  useEffect(() => {
    if (!sessionId) return;
    setError(null);
    connect(sessionId);
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [sessionId]);

  const connect = (id: string) => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    const es = new EventSource(`/api/simulation/${id}/stream`);
    eventSourceRef.current = es;

    es.onopen = () => { setIsConnected(true); setError(null); reconnectAttempts.current = 0; };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleEvent(data);
      } catch (err) {
        console.error('Failed to parse SSE message', err);
      }
    };

    es.onerror = () => {
      if (store.status === 'complete' || store.status === 'error') { es.close(); return; }
      setIsConnected(false);
      es.close();
      if (reconnectAttempts.current < maxReconnects) {
        reconnectAttempts.current++;
        setTimeout(() => connect(id), 2000 * reconnectAttempts.current);
      } else {
        setError('Lost connection to simulation stream');
        store.setError('Connection lost');
      }
    };
  };

  const handleEvent = (event: any) => {
    switch (event.type) {
      case 'simulation_start':
        store.setStatus('parsing');
        break;
      case 'round_start':
        store.setStatus(`round${event.data?.round || event.round}` as any);
        store.setCurrentRound(event.data?.round || event.round || 0);
        break;
      case 'agent_thinking':
        const thinkData = event.data || event;
        if (thinkData.agentId) store.setAgentThinking(thinkData.agentId, thinkData);
        break;
      case 'agent_critique':
        if (event.data?.data) store.setAgentCritique(event.data.data);
        else if (event.data) store.setAgentCritique(event.data);
        break;
      case 'agent_reaction':
        if (event.data?.data) store.setAgentReaction(event.data.data);
        else if (event.data) store.setAgentReaction(event.data);
        break;
      case 'agent_vote':
        if (event.data?.data) store.setAgentVote(event.data.data);
        else if (event.data) store.setAgentVote(event.data);
        break;
      case 'batch_complete':
        break;
      case 'round_complete':
        break;
      case 'report_generating':
        store.setStatus('generating_report');
        break;
      case 'report_complete':
        if (event.data) store.setReport(event.data as any);
        break;
      case 'simulation_error':
        store.setError(event.data?.error || event.error || 'Unknown error');
        break;
    }
  };

  return { isConnected, error };
}