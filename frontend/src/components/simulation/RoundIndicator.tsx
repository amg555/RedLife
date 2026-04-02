interface Props {
  currentRound: number;
  status: string;
}

export default function RoundIndicator({ currentRound, status }: Props) {
  const rounds = [
    { n: 1, label: 'Assault' },
    { n: 2, label: 'Debate' },
    { n: 3, label: 'Verdict' },
  ];

  return (
    <div className="flex items-center gap-1">
      {rounds.map((r, i) => {
        const done = currentRound > r.n || status === 'complete';
        const active = currentRound === r.n && status !== 'complete';
        return (
          <div key={r.n} className="flex items-center gap-1">
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: done ? 'rgba(68,204,136,0.15)' : active ? 'rgba(255,34,68,0.15)' : 'rgba(255,255,255,0.04)',
                color: done ? '#44cc88' : active ? '#ff2244' : 'rgba(255,255,255,0.3)',
                border: `1px solid ${done ? 'rgba(68,204,136,0.3)' : active ? 'rgba(255,34,68,0.3)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {done ? '✓' : active ? (
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              ) : r.n}
            </div>
            {i < rounds.length - 1 && (
              <div className="w-2 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
