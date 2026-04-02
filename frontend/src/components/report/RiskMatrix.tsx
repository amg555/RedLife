import { useState } from 'react';
import type { RankedRisk } from '../../types';

interface Props {
  risks: RankedRisk[];
}

const PROB_LABELS = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost\nCertain'];
const SEV_LABELS = ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'];

function getCellColor(prob: number, sev: number): string {
  const score = prob * sev;
  if (score >= 16) return 'rgba(255,68,68,0.25)';
  if (score >= 10) return 'rgba(255,120,0,0.2)';
  if (score >= 5) return 'rgba(255,200,0,0.15)';
  return 'rgba(68,204,68,0.1)';
}

export default function RiskMatrix({ risks }: Props) {
  const [tooltip, setTooltip] = useState<{ risk: RankedRisk; x: number; y: number } | null>(null);

  const scrollToRisk = (rank: number) => {
    const el = document.getElementById(`risk-${rank}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="relative select-none">
      {/* Y axis label */}
      <div className="flex gap-2 sm:gap-3">
        {/* Y axis labels */}
        <div className="flex flex-col justify-around" style={{ minWidth: 60 }}>
          {[...SEV_LABELS].reverse().map(label => (
            <span key={label} className="text-xs text-right leading-tight" style={{ color: 'var(--text-secondary)', fontSize: '0.6rem' }}>
              {label}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1">
          {/* Grid cells */}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(5, 1fr)', gap: 2, aspectRatio: '5/4' }}>
            {[5, 4, 3, 2, 1].map(sev =>
              [1, 2, 3, 4, 5].map(prob => {
                const risksHere = risks.filter(r => r.probability === prob && r.severity === sev);
                return (
                  <div
                    key={`${sev}-${prob}`}
                    className="rounded relative flex flex-wrap gap-0.5 items-center justify-center p-1 min-h-8 transition-all duration-200"
                    style={{
                      background: getCellColor(prob, sev),
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    {risksHere.map(risk => (
                      <button
                        key={risk.rank}
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-xs font-black transition-transform hover:scale-125 cursor-pointer"
                        style={{
                          background: '#ff4444',
                          color: '#fff',
                          boxShadow: '0 0 6px rgba(255,68,68,0.6)',
                          fontSize: '0.55rem',
                        }}
                        title={risk.name}
                        onMouseEnter={e => {
                          const rect = (e.target as HTMLElement).getBoundingClientRect();
                          setTooltip({ risk, x: rect.x, y: rect.y });
                        }}
                        onClick={() => scrollToRisk(risk.rank)}
                      >
                        {risk.rank}
                      </button>
                    ))}
                  </div>
                );
              })
            )}
          </div>

          {/* X axis labels */}
          <div className="grid mt-1" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: 2 }}>
            {PROB_LABELS.map(label => (
              <span key={label} className="text-center leading-tight" style={{ color: 'var(--text-secondary)', fontSize: '0.6rem' }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Axis titles */}
      <div className="flex justify-between mt-2 text-xs" style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>
        <span style={{ marginLeft: 64 }}>← Probability →</span>
        <span className="font-semibold">Severity ↑</span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 justify-end">
        {[
          { label: 'Low', color: 'rgba(68,204,68,0.3)' },
          { label: 'Medium', color: 'rgba(255,200,0,0.3)' },
          { label: 'High', color: 'rgba(255,120,0,0.35)' },
          { label: 'Critical', color: 'rgba(255,68,68,0.4)' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ background: l.color }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 p-2 rounded-lg text-xs pointer-events-none"
          style={{
            background: 'var(--card)',
            border: '1px solid rgba(255,68,68,0.3)',
            top: tooltip.y - 80,
            left: tooltip.x - 80,
            maxWidth: 200,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          <p className="font-bold mb-1">{tooltip.risk.name}</p>
          <p style={{ color: 'var(--text-secondary)' }}>P:{tooltip.risk.probability} × S:{tooltip.risk.severity} = RPN {tooltip.risk.rpn}</p>
        </div>
      )}
    </div>
  );
}
