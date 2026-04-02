import { create } from 'zustand';
import type { AgentState, DebateEntry, DecisionRiskReport, SimulationStatus, AgentCritique, AgentReaction, AgentVote } from '../types';
import { getAgentManifest } from '../lib/api';
import { setPersonasFromManifest } from '../data/personas';

interface SimulationStore {
  sessionId: string | null;
  status: SimulationStatus;
  currentRound: number;
  agents: Record<string, AgentState>;
  debateEntries: DebateEntry[];
  report: DecisionRiskReport | null;
  error: string | null;
  decisionInput: string;
  totalAgentCount: number;
  manifestLoaded: boolean;
  setSessionId: (id: string) => void;
  setStatus: (status: SimulationStatus) => void;
  setCurrentRound: (round: number) => void;
  setAgentThinking: (agentId: string, agentData?: any) => void;
  setAgentCritique: (critique: AgentCritique) => void;
  setAgentReaction: (reaction: AgentReaction) => void;
  setAgentVote: (vote: AgentVote) => void;
  addDebateEntry: (entry: Omit<DebateEntry, 'id' | 'timestamp'>) => void;
  setReport: (report: DecisionRiskReport) => void;
  setError: (error: string) => void;
  setDecisionInput: (input: string) => void;
  reset: () => void;
  initAgents: () => void;
  loadManifest: () => Promise<void>;
}

let entryCounter = 0;

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  sessionId: null, status: 'idle', currentRound: 0, agents: {},
  debateEntries: [], report: null, error: null, decisionInput: '',
  totalAgentCount: 100, manifestLoaded: false,

  setSessionId: (id) => set({ sessionId: id }),
  setStatus: (status) => set({ status }),
  setCurrentRound: (round) => set({ currentRound: round }),
  setDecisionInput: (input) => set({ decisionInput: input }),
  initAgents: () => set({ agents: {} }),

  loadManifest: async () => {
    try {
      const manifest = await getAgentManifest();
      setPersonasFromManifest(manifest.agents);
      const agents: Record<string, AgentState> = {};
      for (const a of manifest.agents) {
        agents[a.id] = { id: a.id, name: a.name, icon: a.icon, color: a.color, role: a.role, status: 'inactive', riskCount: 0 };
      }
      set({ agents, totalAgentCount: manifest.total_count, manifestLoaded: true });
    } catch (e) {
      console.error('Failed to load agent manifest', e);
      set({ totalAgentCount: 100, manifestLoaded: false });
    }
  },

  setAgentThinking: (agentId, agentData) =>
    set(state => {
      const existing = state.agents[agentId];
      if (existing) return { agents: { ...state.agents, [agentId]: { ...existing, status: 'thinking' } } };
      if (agentData) return { agents: { ...state.agents, [agentId]: {
        id: agentId, name: agentData.agentName || agentId, icon: agentData.agentIcon || '🤖',
        color: agentData.agentColor || '#888', role: '', status: 'thinking', riskCount: 0,
      } } };
      return state;
    }),

  setAgentCritique: (critique) =>
    set(state => {
      const entry: DebateEntry = {
        id: `entry-${++entryCounter}`, agent_id: critique.agent_id,
        agent_name: critique.agent_name, agent_icon: critique.agent_icon,
        agent_color: critique.agent_color || '#888', type: 'critique',
        text: critique.critique_text.slice(0, 200) + '...', timestamp: Date.now(),
      };
      const existing = state.agents[critique.agent_id] || {
        id: critique.agent_id, name: critique.agent_name, icon: critique.agent_icon,
        color: critique.agent_color || '#888', role: '', status: 'inactive', riskCount: 0,
      };
      return {
        agents: { ...state.agents, [critique.agent_id]: { ...existing, status: 'complete', critique, riskCount: critique.risks.length } },
        debateEntries: [...state.debateEntries, entry],
      };
    }),

  setAgentReaction: (reaction) =>
    set(state => {
      const entry: DebateEntry = {
        id: `entry-${++entryCounter}`, agent_id: reaction.agent_id,
        agent_name: reaction.agent_name, agent_icon: reaction.agent_icon,
        agent_color: reaction.agent_color || '#888', type: 'reaction',
        reaction_type: reaction.reaction_type, reacting_to: reaction.reacting_to_agent_name,
        text: reaction.reaction_text, timestamp: Date.now(),
      };
      const existing = state.agents[reaction.agent_id] || {
        id: reaction.agent_id, name: reaction.agent_name, icon: reaction.agent_icon,
        color: reaction.agent_color || '#888', role: '', status: 'inactive', riskCount: 0,
      };
      return {
        agents: { ...state.agents, [reaction.agent_id]: { ...existing, status: 'debating', reaction } },
        debateEntries: [...state.debateEntries, entry],
      };
    }),

  setAgentVote: (vote) =>
    set(state => {
      const entry: DebateEntry = {
        id: `entry-${++entryCounter}`, agent_id: vote.agent_id,
        agent_name: vote.agent_name, agent_icon: vote.agent_icon,
        agent_color: vote.agent_color || '#888', type: 'vote',
        text: `Final verdict: ${vote.recommendation} (${Math.round(vote.confidence * 100)}% confidence)`,
        timestamp: Date.now(),
      };
      const existing = state.agents[vote.agent_id] || {
        id: vote.agent_id, name: vote.agent_name, icon: vote.agent_icon,
        color: vote.agent_color || '#888', role: '', status: 'inactive', riskCount: 0,
      };
      return {
        agents: { ...state.agents, [vote.agent_id]: { ...existing, status: 'voted', vote } },
        debateEntries: [...state.debateEntries, entry],
      };
    }),

  addDebateEntry: (entry) =>
    set(state => ({
      debateEntries: [...state.debateEntries, { ...entry, id: `entry-${++entryCounter}`, timestamp: Date.now() }],
    })),

  setReport: (report) => set({ report, status: 'complete' }),
  setError: (error) => set({ error, status: 'error' }),

  reset: () => {
    entryCounter = 0;
    const state = get();
    const resetAgents: Record<string, AgentState> = {};
    for (const [id, agent] of Object.entries(state.agents)) {
      resetAgents[id] = { ...agent, status: 'inactive', riskCount: 0, critique: undefined, reaction: undefined, vote: undefined };
    }
    set({ sessionId: null, status: 'idle', currentRound: 0, agents: resetAgents, debateEntries: [], report: null, error: null });
  },
}));