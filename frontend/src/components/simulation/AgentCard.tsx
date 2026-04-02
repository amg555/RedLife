import { useState } from 'react';
import type { AgentState } from '../../types';

interface AgentCardProps {
  agent: AgentState;
  animDelay?: number;
}

export default function AgentCard({ agent, animDelay = 0 }: AgentCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getBorderStyle = () => {
    if (agent.status === 'inactive') return '1px solid rgba(255,255,255,0.06)';
    return `1px solid ${agent.color}44`;
  };

  const getGlowStyle = () => {
    if (agent.status === 'thinking') {
      return `0 0 20px ${agent.color}44, 0 0 40px ${agent.color}22`;
    }
    if (agent.status === 'complete' || agent.status === 'voted') {
      return `0 0 10px ${agent.color}22`;
    }
    return 'none';
  };

  const getVoteBadge = () => {
    if (!agent.vote) return null;
    const colors = { GO: '#44cc44', CAUTION: '#ffaa00', NO_GO: '#ff4444' };
    const labels = { GO: '✅ GO', CAUTION: '⚠️ CAUTION', NO_GO: '🛑 NO-GO' };
    const color = colors[agent.vote.recommendation];
    return (
      <span
        className="text-xs font-bold px-2 py-0.5 rounded-full"
        style={{ background: `${color}20`, color, border: `1px solid ${color}44` }}
      >
        {labels[agent.vote.recommendation]}
      </span>
    );
  };

  const getReactionBadge = () => {
    if (!agent.reaction) return null;
    const configs = {
      agree: { emoji: '👍', label: 'AGREES', color: '#44cc44' },
      disagree: { emoji: '⚡', label: 'DISAGREES', color: '#ff4444' },
      build: { emoji: '🔗', label: 'BUILDS ON', color: '#4488ff' },
    };
    const config = configs[agent.reaction.reaction_type];
    return (
      <span
        className="text-xs font-bold px-2 py-0.5 rounded-full"
        style={{ background: `${config.color}20`, color: config.color, border: `1px solid ${config.color}44` }}
      >
        {config.emoji} {config.label}
      </span>
    );
  };

  return (
    <div
      className="rounded-xl p-3 cursor-pointer transition-all duration-300 relative overflow-hidden"
      style={{
        background: agent.status === 'inactive' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
        border: getBorderStyle(),
        boxShadow: getGlowStyle(),
        borderLeft: `3px solid ${agent.status === 'inactive' ? 'rgba(255,255,255,0.06)' : agent.color}`,
        animationDelay: `${animDelay}ms`,
        opacity: agent.status === 'inactive' ? 0.5 : 1,
      }}
      onClick={() => agent.status !== 'inactive' && setExpanded(!expanded)}
    >
      {/* Thinking animation overlay */}
      {agent.status === 'thinking' && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: `linear-gradient(135deg, transparent 60%, ${agent.color}08 100%)`,
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-start gap-2">
        <div
          className="text-xl flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg"
          style={{
            background: `${agent.color}15`,
            animation: agent.status === 'thinking' ? 'thinking-pulse 1.5s ease-in-out infinite' : 'none',
          }}
        >
          {agent.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-xs font-bold truncate"
              style={{ color: agent.status === 'inactive' ? '#556677' : '#e0e0e0' }}
            >
              {agent.name}
            </span>
            {agent.status === 'complete' && agent.riskCount > 0 && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-mono font-bold flex-shrink-0"
                style={{ background: 'rgba(255,68,68,0.15)', color: '#ff6666', border: '1px solid rgba(255,68,68,0.3)' }}
              >
                {agent.riskCount} risks
              </span>
            )}
          </div>
          <p className="text-xs truncate" style={{ color: '#445566' }}>
            {agent.role}
          </p>
        </div>
      </div>

      {/* Status content */}
      {agent.status === 'thinking' && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-xs" style={{ color: '#556677' }}>Analyzing</span>
          <div className="flex gap-1">
            <span className="thinking-dot" style={{ background: agent.color }} />
            <span className="thinking-dot" style={{ background: agent.color }} />
            <span className="thinking-dot" style={{ background: agent.color }} />
          </div>
        </div>
      )}

      {agent.status === 'complete' && agent.critique && (
        <div className="mt-2">
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#8899aa' }}>
            {agent.critique.critique_text.slice(0, 120)}...
          </p>
          <div className="mt-1.5 flex items-center gap-1.5">
            {agent.critique.recommendation && (
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded"
                style={{
                  background: agent.critique.recommendation === 'GO' ? 'rgba(68,204,68,0.15)' : agent.critique.recommendation === 'CAUTION' ? 'rgba(255,170,0,0.15)' : 'rgba(255,68,68,0.15)',
                  color: agent.critique.recommendation === 'GO' ? '#44cc44' : agent.critique.recommendation === 'CAUTION' ? '#ffaa00' : '#ff4444',
                }}
              >
                {agent.critique.recommendation}
              </span>
            )}
          </div>
        </div>
      )}

      {agent.status === 'debating' && agent.reaction && (
        <div className="mt-2 space-y-1">
          {getReactionBadge()}
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#8899aa' }}>
            {agent.reaction.reaction_text.slice(0, 100)}...
          </p>
        </div>
      )}

      {agent.status === 'voted' && (
        <div className="mt-2">
          {getVoteBadge()}
        </div>
      )}

      {/* Expanded modal */}
      {expanded && agent.critique && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
        >
          <div
            className="max-w-lg w-full rounded-2xl p-6 max-h-96 overflow-y-auto"
            style={{ background: '#1a2235', border: `1px solid ${agent.color}44` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{agent.icon}</span>
              <div>
                <h3 className="font-bold" style={{ color: agent.color }}>{agent.name}</h3>
                <p className="text-xs" style={{ color: '#8899aa' }}>{agent.role}</p>
              </div>
              <button
                className="ml-auto text-xs px-3 py-1 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#aaa' }}
                onClick={() => setExpanded(false)}
              >
                Close
              </button>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#c0c8d8' }}>
              {agent.critique.critique_text}
            </p>
            {agent.critique.risks.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#556677' }}>Identified Risks</h4>
                <div className="space-y-2">
                  {agent.critique.risks.map((risk, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: 'rgba(255,68,68,0.08)' }}>
                      <span className="text-red-400 mt-0.5">⚠</span>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: '#e0e0e0' }}>{risk.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#8899aa' }}>{risk.description.slice(0, 100)}...</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
