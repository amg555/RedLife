import { useEffect, useRef } from 'react';
import type { DebateEntry } from '../../types';

interface Props {
  entries: DebateEntry[];
}

const REACTION_COLORS = {
  agree: '#44cc88',
  disagree: '#ff4444',
  build: '#4488ff',
};

const REACTION_LABELS = {
  agree: '👍 AGREES',
  disagree: '⚡ DISAGREES',
  build: '🔗 BUILDS ON',
};

export default function DebateTimeline({ entries }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  if (entries.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-3xl mb-2 opacity-30">💬</div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Agent arguments will appear here…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3 space-y-2">
      {entries.map(entry => {
        const borderColor = entry.type === 'reaction' && entry.reaction_type
          ? REACTION_COLORS[entry.reaction_type]
          : entry.type === 'vote'
          ? '#aa44ff'
          : entry.agent_color;

        return (
          <div
            key={entry.id}
            className="rounded-lg p-2.5 text-xs leading-relaxed animate-slide-up"
            style={{
              background: 'rgba(255,255,255,0.03)',
              borderLeft: `2px solid ${borderColor}`,
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="text-base leading-none">{entry.agent_icon}</span>
              <span className="font-semibold text-xs" style={{ color: entry.agent_color }}>
                {entry.agent_name}
              </span>
              {entry.type === 'reaction' && entry.reaction_type && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    background: `${REACTION_COLORS[entry.reaction_type]}18`,
                    color: REACTION_COLORS[entry.reaction_type],
                  }}
                >
                  {REACTION_LABELS[entry.reaction_type]}
                </span>
              )}
              {entry.reacting_to && (
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  → {entry.reacting_to}
                </span>
              )}
              {entry.type === 'vote' && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: 'rgba(170,68,255,0.15)', color: '#aa44ff' }}
                >
                  🗳️ VOTE
                </span>
              )}
            </div>

            {/* Text */}
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
              {entry.text}
            </p>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
