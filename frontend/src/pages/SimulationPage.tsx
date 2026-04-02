import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSimulationStore } from '../stores/simulationStore';
import { useSSE } from '../hooks/useSSE';
import AgentCard from '../components/simulation/AgentCard';
import DebateTimeline from '../components/simulation/DebateTimeline';
import RoundIndicator from '../components/simulation/RoundIndicator';

const STATUS_LABELS: Record<string, string> = {
  idle: 'Initializing…',
  parsing: 'Parsing decision…',
  round1: 'Round 1 — Independent Assault',
  round2: 'Round 2 — The Argument',
  round3: 'Round 3 — The Verdict',
  generating_report: 'Generating Risk Report…',
  complete: 'Report Ready',
  error: 'Error',
};

export default function SimulationPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { status, currentRound, agents, debateEntries, report, error, decisionInput, totalAgentCount } = useSimulationStore();
  const redirectedRef = useRef(false);

  useSSE(sessionId || null);

  useEffect(() => {
    if (status === 'complete' && report && sessionId && !redirectedRef.current) {
      redirectedRef.current = true;
      setTimeout(() => navigate(`/report/${sessionId}`), 1200);
    }
  }, [status, report, sessionId, navigate]);

  useEffect(() => {
    if (!sessionId) navigate('/');
  }, [sessionId, navigate]);

  const agentList = Object.values(agents).filter(Boolean);
  const completedCount = agentList.filter(a => a.status === 'complete' || a.status === 'voted').length;
  const thinkingCount = agentList.filter(a => a.status === 'thinking').length;
  const totalRisks = agentList.reduce((sum, a) => sum + a.riskCount, 0);
  const total = totalAgentCount || agentList.length || 100;

  const progress =
    status === 'generating_report' || status === 'complete' ? 100
    : currentRound === 3 ? 75 + (completedCount / total) * 25
    : currentRound === 2 ? 40 + (debateEntries.filter(e => e.type === 'reaction').length / Math.max(total * 0.3, 1)) * 35
    : currentRound === 1 ? (completedCount / total) * 40
    : 0;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-bold text-red-400">Simulation Failed</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <button onClick={() => navigate('/')} className="px-6 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'rgba(255,34,68,0.15)', color: '#ff2244', border: '1px solid rgba(255,34,68,0.3)' }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-screen" style={{ background: 'var(--navy)' }}>
      <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <RoundIndicator currentRound={currentRound} status={status} />
            <span className="text-xs font-semibold" style={{ color: '#ff2244' }}>
              {STATUS_LABELS[status] ?? status}
            </span>
          </div>
          {decisionInput && (
            <p className="text-xs truncate max-w-lg" style={{ color: 'var(--text-secondary)' }}>
              "{decisionInput.slice(0, 100)}{decisionInput.length > 100 ? '…' : ''}"
            </p>
          )}
        </div>
        <div className="w-full sm:w-48">
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
            <span>{Math.round(progress)}%</span>
            <span>{completedCount}/{total} agents</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #ff2244, #ff6644)' }} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 overflow-auto p-3 sm:p-4">
          <div className="flex flex-wrap gap-3 mb-4">
            {[
              { label: 'Thinking', value: thinkingCount, color: '#ffaa00' },
              { label: 'Risks Found', value: totalRisks, color: '#ff4444' },
              { label: 'Completed', value: completedCount, color: '#44cc88' },
              { label: 'Total Agents', value: total, color: '#44aaff' },
            ].map(stat => (
              <div key={stat.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                <span className="font-bold" style={{ color: stat.color, fontFamily: 'JetBrains Mono, monospace' }}>
                  {stat.value}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-8 gap-2 sm:gap-3">
            {agentList.filter(a => a.status !== 'inactive').map((agent, idx) => (
              <AgentCard key={agent.id} agent={agent} animDelay={idx * 30} />
            ))}
          </div>

          {(status === 'generating_report' || status === 'complete') && (
            <div className="mt-6 p-5 rounded-xl text-center"
              style={{ background: 'rgba(255,34,68,0.06)', border: '1px solid rgba(255,34,68,0.2)' }}>
              {status === 'complete' ? (
                <>
                  <div className="text-3xl mb-2">✅</div>
                  <p className="font-bold text-green-400">Report Ready! Redirecting…</p>
                </>
              ) : (
                <>
                  <div className="flex justify-center mb-3">
                    <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                  </div>
                  <p className="font-semibold" style={{ color: '#ff2244' }}>Compiling Decision Risk Report…</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Aggregating {totalRisks} identified risks from {completedCount} agents
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <div className="lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l flex flex-col"
          style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.01)', maxHeight: '50vh' }}>
          <div className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            🔴 Live Debate Feed
          </div>
          <div className="flex-1 overflow-hidden" style={{ maxHeight: 'calc(50vh - 36px)' }}>
            <DebateTimeline entries={debateEntries} />
          </div>
        </div>
      </div>
    </div>
  );
}