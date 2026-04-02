export interface DecisionInput {
  description: string;
  category?: string;
  timeline?: string;
  budget_impact?: string;
  stakeholders?: string[];
  desired_outcome?: string;
  biggest_fear?: string;
}

export interface IdentifiedRisk {
  name: string;
  description: string;
  category: string;
  probability: number; // 1-5
  severity: number; // 1-5
  detectability: number; // 1-5
  rpn: number; // probability * severity * (6 - detectability)
}

export interface Mitigation {
  risk_name: string;
  action: string;
  effort: 'easy' | 'medium' | 'hard';
  explanation: string;
}

export interface AgentCritique {
  agent_id: string;
  agent_name: string;
  agent_icon: string;
  agent_color: string;
  critique_text: string;
  risks: IdentifiedRisk[];
  confidence: number;
  recommendation: 'GO' | 'CAUTION' | 'NO_GO';
}

export interface AgentReaction {
  agent_id: string;
  agent_name: string;
  agent_icon: string;
  agent_color: string;
  reacting_to_agent_id: string;
  reacting_to_agent_name: string;
  reaction_type: 'agree' | 'disagree' | 'build';
  reaction_text: string;
}

export interface AgentVote {
  agent_id: string;
  agent_name: string;
  agent_icon: string;
  agent_color: string;
  top_risks_ranked: string[];
  recommendation: 'GO' | 'CAUTION' | 'NO_GO';
  confidence: number;
  mitigations: Mitigation[];
}

export type AgentStatus = 'inactive' | 'thinking' | 'complete' | 'debating' | 'voted';

export interface AgentState {
  id: string;
  name: string;
  icon: string;
  color: string;
  role: string;
  status: AgentStatus;
  critique?: AgentCritique;
  reaction?: AgentReaction;
  vote?: AgentVote;
  riskCount: number;
}

export interface DebateEntry {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_icon: string;
  agent_color: string;
  type: 'critique' | 'reaction' | 'vote';
  reaction_type?: 'agree' | 'disagree' | 'build';
  reacting_to?: string;
  text: string;
  timestamp: number;
}

export interface RankedRisk {
  rank: number;
  name: string;
  description: string;
  category: string;
  probability: number;
  severity: number;
  detectability: number;
  rpn: number;
  agents_flagged: { id: string; icon: string; name: string }[];
  debate_summary: string;
  mitigations: Mitigation[];
}

export interface DebateHighlight {
  agent_a_id: string;
  agent_a_name: string;
  agent_a_icon: string;
  agent_a_color: string;
  agent_a_quote: string;
  agent_b_id: string;
  agent_b_name: string;
  agent_b_icon: string;
  agent_b_color: string;
  agent_b_quote: string;
  tension_level: 'low' | 'medium' | 'high';
}

export interface ActionItem {
  action: string;
  effort: 'easy' | 'medium' | 'hard';
  timeframe: string;
}

export interface DimensionScores {
  financial_safety: number;
  relationship_impact: number;
  career_growth: number;
  health_impact: number;
  timing: number;
  reversibility: number;
  values_alignment: number;
  competence_fit: number;
}

export interface DecisionRiskReport {
  session_id: string;
  created_at: string;
  decision_summary: string;
  overall_risk_score: number;
  recommendation: 'GO' | 'CAUTION' | 'NO_GO';
  recommendation_confidence: number;
  consensus: {
    go_count: number;
    caution_count: number;
    nogo_count: number;
  };
  risk_matrix: RankedRisk[];
  top_risks: RankedRisk[];
  pre_mortem_narrative: string;
  hidden_opportunities: string[];
  debate_highlights: DebateHighlight[];
  dimension_scores: DimensionScores;
  action_plan_go: ActionItem[];
  action_plan_wait: string[];
  action_plan_nogo: string[];
  all_critiques: AgentCritique[];
  all_reactions: AgentReaction[];
  all_votes: AgentVote[];
}

export type SimulationStatus =
  | 'idle'
  | 'parsing'
  | 'round1'
  | 'round2'
  | 'round3'
  | 'generating_report'
  | 'complete'
  | 'error';

export interface SimulationEvent {
  type:
    | 'simulation_start'
    | 'round_start'
    | 'agent_thinking'
    | 'agent_critique'
    | 'agent_reaction'
    | 'agent_vote'
    | 'round_complete'
    | 'report_generating'
    | 'report_complete'
    | 'simulation_error';
  session_id?: string;
  agent_id?: string;
  round?: number;
  data?: unknown;
  error?: string;
}

export interface Persona {
  id: string;
  name: string;
  icon: string;
  color: string;
  role: string;
  focus: string;
  style: string;
  sample_questions: string[];
  relevance_categories: string[];
}

export interface HistoryItem {
  session_id: string;
  decision_summary: string;
  category: string;
  created_at: string;
  overall_risk_score: number;
  recommendation: 'GO' | 'CAUTION' | 'NO_GO';
  report: DecisionRiskReport;
}
