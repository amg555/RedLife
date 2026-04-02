import { useEffect, useState } from 'react';

interface RecommendationBadgeProps {
  recommendation: 'GO' | 'CAUTION' | 'NO_GO';
}

const CONFIGS = {
  GO: {
    icon: '✅',
    label: 'GO',
    subtitle: 'PROCEED — RISKS ARE MANAGEABLE',
    bg: 'rgba(68,204,68,0.1)',
    border: 'rgba(68,204,68,0.3)',
    color: '#44cc44',
    glow: '0 0 30px rgba(68,204,68,0.2)',
  },
  CAUTION: {
    icon: '⚠️',
    label: 'CAUTION',
    subtitle: 'SIGNIFICANT RISKS — MITIGATE FIRST',
    bg: 'rgba(255,170,0,0.1)',
    border: 'rgba(255,170,0,0.3)',
    color: '#ffaa00',
    glow: '0 0 30px rgba(255,170,0,0.2)',
  },
  NO_GO: {
    icon: '🛑',
    label: 'NO-GO',
    subtitle: 'RECONSIDER THIS DECISION',
    bg: 'rgba(255,68,68,0.1)',
    border: 'rgba(255,68,68,0.3)',
    color: '#ff4444',
    glow: '0 0 30px rgba(255,68,68,0.2)',
  },
};

export default function RecommendationBadge({ recommendation }: RecommendationBadgeProps) {
  const [visible, setVisible] = useState(false);
  const config = CONFIGS[recommendation];

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-500 w-full"
      style={{
        background: config.bg,
        border: `2px solid ${config.border}`,
        boxShadow: config.glow,
        transform: visible ? 'scale(1)' : 'scale(0.85)',
        opacity: visible ? 1 : 0,
      }}
    >
      <span className="text-3xl">{config.icon}</span>
      <span className="text-xl font-black tracking-wider" style={{ color: config.color }}>
        {config.label}
      </span>
      <span className="text-xs font-semibold text-center" style={{ color: config.color, opacity: 0.8 }}>
        {config.subtitle}
      </span>
    </div>
  );
}
