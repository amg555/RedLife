import { useState } from 'react';
import type { RankedRisk } from '../../types';

interface RiskCardProps {
  risk: RankedRisk;
  index?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  financial: '#ff4444',
  career: '#4488ff',
  relationship: '#ff66aa',
  health: '#44cc88',
  legal: '#888888',
  timing: '#ffcc00',
  competence: '#cc4444',
  ethical: '#ccaa44',
};

function ScoreBar({ label, value, max = 5 }: { label: string; value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color = pct >= 70 ? '#ff4444' : pct >= 50 ? '#ffaa00' : '#44cc88';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className="font-mono font-bold" style={{ color }}>{value}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

const EFFORT_COLORS = { easy: '#44cc88', medium: '#ffaa00', hard: '#ff4444' };

export default function RiskCard({ risk, index = 0 }: RiskCardProps) {
  const [expanded, setExpanded] = useState(index === 0);
  const catColor = CATEGORY_COLORS[risk.category] ?? '#888';

  return (
    <div
      id={`risk-${risk.rank}`}
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <button
        className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors"
        style={{ background: expanded ? 'rgba(255,255,255,0.02)' : 'transparent' }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Rank badge */}
        <span
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black font-mono"
          style={{ background: 'rgba(255,68,68,0.15)', color: '#ff4444' }}
        >
          {risk.rank}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold truncate">{risk.name}</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0"
              style={{ background: `${catColor}18`, color: catColor }}
            >
              {risk.category}
            </span>
          </div>
        </div>

        {/* RPN badge */}
        <span
          className="flex-shrink-0 text-xs font-mono font-bold px-2 py-1 rounded-lg"
          style={{ background: 'rgba(255,68,68,0.1)', color: '#ff6644' }}
        >
          RPN {risk.rpn}
        </span>

        {/* Agent icons */}
        <div className="flex-shrink-0 hidden sm:flex gap-0.5">
          {risk.agents_flagged.slice(0, 4).map(a => (
            <span key={a.id} className="text-sm" title={a.name}>{a.icon}</span>
          ))}
          {risk.agents_flagged.length > 4 && (
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>+{risk.agents_flagged.length - 4}</span>
          )}
        </div>

        {/* Chevron */}
        <span className="flex-shrink-0 text-xs" style={{ color: 'var(--text-secondary)' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <p className="text-sm leading-relaxed pt-3" style={{ color: 'rgba(240,240,240,0.75)' }}>
            {risk.description}
          </p>

          {/* Score bars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ScoreBar label="Probability" value={risk.probability} />
            <ScoreBar label="Severity" value={risk.severity} />
            <ScoreBar label="Detectability" value={risk.detectability} />
          </div>

          {/* Agents flagged */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Flagged by {risk.agents_flagged.length} agents
            </p>
            <div className="flex flex-wrap gap-1">
              {risk.agents_flagged.map(a => (
                <span
                  key={a.id}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
                >
                  {a.icon} {a.name}
                </span>
              ))}
            </div>
          </div>

          {/* Debate summary */}
          <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Agent Consensus</p>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,240,240,0.6)' }}>{risk.debate_summary}</p>
          </div>

          {/* Mitigations */}
          {risk.mitigations.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Recommended Mitigations</p>
              <div className="space-y-2">
                {risk.mitigations.map((m, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span
                      className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded font-bold mt-0.5"
                      style={{ background: `${EFFORT_COLORS[m.effort]}18`, color: EFFORT_COLORS[m.effort] }}
                    >
                      {m.effort}
                    </span>
                    <div>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{m.action}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{m.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
