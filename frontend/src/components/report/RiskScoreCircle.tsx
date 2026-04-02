import { useEffect, useState } from 'react';

interface Props {
  score: number; // 0-100
  size?: number;
}

export default function RiskScoreCircle({ score, size = 120 }: Props) {
  const [animated, setAnimated] = useState(0);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (animated / 100) * circumference;

  const color = score >= 67 ? '#ff4444' : score >= 34 ? '#ffaa00' : '#44cc44';
  const label = score >= 67 ? 'HIGH RISK' : score >= 34 ? 'MODERATE' : 'LOW RISK';

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 300);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
        />
        {/* Score arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeDashoffset="0"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 6px ${color}88)` }}
        />
        {/* Score text */}
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          fill={color}
          fontSize={size * 0.22}
          fontWeight="900"
          fontFamily="JetBrains Mono, monospace"
        >
          {score}
        </text>
      </svg>
      <span className="text-xs font-bold" style={{ color, letterSpacing: '0.1em' }}>{label}</span>
    </div>
  );
}
