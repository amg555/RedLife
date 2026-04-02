import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import type { DimensionScores } from '../../types';

interface Props {
  scores: DimensionScores;
}

const LABELS: Record<keyof DimensionScores, string> = {
  financial_safety: 'Financial',
  relationship_impact: 'Relationships',
  career_growth: 'Career',
  health_impact: 'Health',
  timing: 'Timing',
  reversibility: 'Reversibility',
  values_alignment: 'Values',
  competence_fit: 'Competence',
};

export default function DimensionRadar({ scores }: Props) {
  const data = (Object.entries(scores) as [keyof DimensionScores, number][]).map(([key, val]) => ({
    subject: LABELS[key],
    value: val,
    fullMark: 100,
  }));

  return (
    <div className="w-full" style={{ height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
          />
          <Radar
            name="Score"
            dataKey="value"
            stroke="#ff2244"
            fill="#ff2244"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
