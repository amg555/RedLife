import { useParams, useNavigate } from 'react-router-dom';
import { useSimulationStore } from '../stores/simulationStore';
import { useHistoryStore } from '../stores/historyStore';
import { useState } from 'react';
import RiskScoreCircle from '../components/report/RiskScoreCircle';
import RecommendationBadge from '../components/report/RecommendationBadge';
import RiskMatrix from '../components/report/RiskMatrix';
import RiskCard from '../components/report/RiskCard';
import DimensionRadar from '../components/report/DimensionRadar';
import type { DecisionRiskReport } from '../types';

export default function ReportPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const storeReport = useSimulationStore(s => s.report);
  const historyItem = useHistoryStore(s => s.getItem(sessionId ?? ''));
  const [actionTab, setActionTab] = useState<'go' | 'wait' | 'nogo'>('go');
  const [copied, setCopied] = useState(false);

  const report: DecisionRiskReport | null = storeReport ?? historyItem?.report ?? null;

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <div className="text-center space-y-4">
          <div className="text-5xl">🔍</div>
          <h2 className="text-xl font-bold">Report not found</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            This session may have expired or not completed.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'rgba(255,34,68,0.15)', color: '#ff2244', border: '1px solid rgba(255,34,68,0.3)' }}
          >
            New Decision
          </button>
        </div>
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const dimensionLabels: Record<string, string> = {
    financial_safety: 'Financial Safety',
    relationship_impact: 'Relationship Impact',
    career_growth: 'Career Growth',
    health_impact: 'Health Impact',
    timing: 'Timing',
    reversibility: 'Reversibility',
    values_alignment: 'Values Alignment',
    competence_fit: 'Competence Fit',
  };

  const effortColors = { easy: '#44cc88', medium: '#ffaa00', hard: '#ff4444' };

  return (
    <div className="min-h-full" style={{ background: 'var(--navy)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                Decision Risk Report
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                {new Date(report.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-base sm:text-lg font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
              "{report.decision_summary.slice(0, 160)}{report.decision_summary.length > 160 ? '…' : ''}"
            </p>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              {copied ? '✅ Copied!' : '🔗 Share'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: 'rgba(255,34,68,0.1)', border: '1px solid rgba(255,34,68,0.25)', color: '#ff2244' }}
            >
              ⚡ New Decision
            </button>
          </div>
        </div>

        {/* ── SECTION 1: EXECUTIVE SUMMARY ── */}
        <section>
          <SectionTitle icon="📊" title="Executive Summary" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Risk Score */}
            <div className="card-dark rounded-xl p-5 flex flex-col items-center gap-3">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                Overall Risk Score
              </p>
              <RiskScoreCircle score={report.overall_risk_score} size={110} />
            </div>

            {/* Recommendation */}
            <div className="card-dark rounded-xl p-5 flex flex-col items-center justify-center gap-3">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                Recommendation
              </p>
              <RecommendationBadge recommendation={report.recommendation} />
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {report.recommendation_confidence}% confidence
              </p>
            </div>

            {/* Consensus */}
            <div className="card-dark rounded-xl p-5 flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                Agent Consensus
              </p>
              <div className="space-y-2">
                {[
                  { label: 'GO', count: report.consensus.go_count, color: '#44cc44' },
                  { label: 'CAUTION', count: report.consensus.caution_count, color: '#ffaa00' },
                  { label: 'NO-GO', count: report.consensus.nogo_count, color: '#ff4444' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="text-xs font-bold w-16" style={{ color: item.color }}>{item.label}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${(item.count / 20) * 100}%`, background: item.color }}
                      />
                    </div>
                    <span className="text-xs font-mono w-4" style={{ color: item.color }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 2: RISK MATRIX ── */}
        <section>
          <SectionTitle icon="🎯" title="Risk Matrix" subtitle="Probability vs. Severity — click a dot to jump to the risk" />
          <div className="card-dark rounded-xl p-4 sm:p-6">
            <RiskMatrix risks={report.risk_matrix} />
          </div>
        </section>

        {/* ── SECTION 3: TOP RISKS ── */}
        <section>
          <SectionTitle icon="⚠️" title="Top 10 Identified Risks" subtitle="Ranked by Risk Priority Number (Probability × Severity × Detectability)" />
          <div className="space-y-3">
            {report.top_risks.map((risk, idx) => (
              <RiskCard key={risk.name} risk={risk} index={idx} />
            ))}
          </div>
        </section>

        {/* ── SECTION 4: PRE-MORTEM ── */}
        <section>
          <SectionTitle icon="💀" title="Pre-Mortem: How This Decision Fails" subtitle="Imagine it's one year from now and this decision failed. Here's what happened…" />
          <div
            className="rounded-xl p-5 sm:p-7"
            style={{
              background: 'rgba(255,34,68,0.04)',
              border: '1px solid rgba(255,34,68,0.15)',
              borderTop: '3px solid #ff2244',
            }}
          >
            <div className="text-3xl mb-4">💀</div>
            {report.pre_mortem_narrative.split('\n\n').map((para, i) => (
              <p key={i} className="mb-4 last:mb-0 leading-relaxed text-sm sm:text-base" style={{ fontFamily: 'Merriweather, serif', color: 'rgba(240,240,240,0.85)' }}>
                {para}
              </p>
            ))}
          </div>
        </section>

        {/* ── SECTION 5: HIDDEN OPPORTUNITIES ── */}
        <section>
          <SectionTitle icon="🌅" title="Hidden Opportunities" subtitle="What the stress-testing accidentally discovered…" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {report.hidden_opportunities.map((opp, i) => (
              <div
                key={i}
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(255,200,50,0.05)',
                  border: '1px solid rgba(255,200,50,0.15)',
                  boxShadow: '0 0 20px rgba(255,200,50,0.05)',
                }}
              >
                <div className="text-xl mb-2">✨</div>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,240,240,0.8)' }}>{opp}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 6: DECISION SCORECARD ── */}
        <section>
          <SectionTitle icon="🎖️" title="Decision Scorecard" subtitle="8-dimension assessment by the agent swarm" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-dark rounded-xl p-4 sm:p-6">
              <DimensionRadar scores={report.dimension_scores} />
            </div>
            <div className="card-dark rounded-xl p-4 sm:p-6 space-y-3">
              {Object.entries(report.dimension_scores).map(([key, val]) => {
                const color = val >= 60 ? '#44cc88' : val >= 35 ? '#ffaa00' : '#ff4444';
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: 'var(--text-secondary)' }}>{dimensionLabels[key] ?? key}</span>
                      <span className="font-mono font-bold" style={{ color }}>{val}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${val}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── SECTION 7: DEBATE HIGHLIGHTS ── */}
        <section>
          <SectionTitle icon="⚡" title="Agent Debate Highlights" subtitle="The most interesting clashes between adversarial agents" />
          <div className="space-y-4">
            {report.debate_highlights.map((d, i) => (
              <div
                key={i}
                className="rounded-xl p-4 sm:p-5"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${d.tension_level === 'high' ? 'rgba(255,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                  {/* Agent A */}
                  <div className="flex-1 p-3 rounded-lg" style={{ background: `${d.agent_a_color}0d`, border: `1px solid ${d.agent_a_color}22` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{d.agent_a_icon}</span>
                      <span className="text-xs font-bold" style={{ color: d.agent_a_color }}>{d.agent_a_name}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,240,240,0.7)' }}>
                      "{d.agent_a_quote}"
                    </p>
                  </div>

                  {/* VS */}
                  <div className="flex sm:flex-col items-center justify-center gap-1 flex-shrink-0">
                    <div className="w-full sm:w-px h-px sm:h-full" style={{ background: d.tension_level === 'high' ? 'rgba(255,68,68,0.3)' : 'rgba(255,255,255,0.1)' }} />
                    <span
                      className="text-xs font-black px-2 py-1 rounded"
                      style={{
                        background: d.tension_level === 'high' ? 'rgba(255,68,68,0.15)' : 'rgba(255,255,255,0.06)',
                        color: d.tension_level === 'high' ? '#ff4444' : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      VS
                    </span>
                    <div className="w-full sm:w-px h-px sm:h-full" style={{ background: d.tension_level === 'high' ? 'rgba(255,68,68,0.3)' : 'rgba(255,255,255,0.1)' }} />
                  </div>

                  {/* Agent B */}
                  <div className="flex-1 p-3 rounded-lg" style={{ background: `${d.agent_b_color}0d`, border: `1px solid ${d.agent_b_color}22` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{d.agent_b_icon}</span>
                      <span className="text-xs font-bold" style={{ color: d.agent_b_color }}>{d.agent_b_name}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,240,240,0.7)' }}>
                      "{d.agent_b_quote}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 8: ACTION PLAN ── */}
        <section>
          <SectionTitle icon="🗺️" title="Action Plan" subtitle="What to do based on your final decision" />
          <div className="card-dark rounded-xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
              {[
                { key: 'go' as const, label: '✅ If You GO', color: '#44cc44' },
                { key: 'wait' as const, label: '⏳ If You WAIT', color: '#ffaa00' },
                { key: 'nogo' as const, label: '🛑 If You DON\'T', color: '#ff4444' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActionTab(tab.key)}
                  className="flex-1 px-3 py-3 text-xs font-bold transition-all"
                  style={{
                    background: actionTab === tab.key ? `${tab.color}12` : 'transparent',
                    color: actionTab === tab.key ? tab.color : 'var(--text-secondary)',
                    borderBottom: actionTab === tab.key ? `2px solid ${tab.color}` : '2px solid transparent',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-4 sm:p-6 space-y-3">
              {actionTab === 'go' && report.action_plan_go.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(68,204,68,0.15)', color: '#44cc44' }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.action}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{
                          background: `${effortColors[item.effort]}18`,
                          color: effortColors[item.effort],
                        }}
                      >
                        {item.effort.toUpperCase()}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.timeframe}</span>
                    </div>
                  </div>
                </div>
              ))}

              {actionTab === 'wait' && report.action_plan_wait.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(255,170,0,0.15)', color: '#ffaa00' }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{item}</p>
                </div>
              ))}

              {actionTab === 'nogo' && report.action_plan_nogo.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(255,68,68,0.15)', color: '#ff4444' }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 pb-8">
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
            style={{
              background: 'linear-gradient(135deg, #ff2244, #cc0022)',
              color: '#fff',
              boxShadow: '0 0 20px rgba(255,34,68,0.3)',
            }}
          >
            ⚡ Stress-Test Another Decision
          </button>
          <button
            onClick={() => navigate('/history')}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            📋 View All Reports
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <h2 className="text-base sm:text-lg font-bold">{title}</h2>
      </div>
      {subtitle && <p className="text-xs pl-7" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
      <div className="mt-2 h-px" style={{ background: 'var(--border)' }} />
    </div>
  );
}
