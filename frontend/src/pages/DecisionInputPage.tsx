import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulationStore } from '../stores/simulationStore';
import { runSimulation } from '../lib/simulationEngine';
import { useHistoryStore } from '../stores/historyStore';
import type { DecisionInput, AgentCritique, AgentReaction, AgentVote, DecisionRiskReport } from '../types';

const EXAMPLE_DECISIONS = [
  { label: '💼 Job → Startup', text: "I want to quit my $120k job to start a SaaS company. I have $40k savings, a wife and 2 kids.", category: 'business' },
  { label: '🌏 Relocate to Bali', text: "I'm thinking of moving from New York to Bali to work remotely.", category: 'relocation' },
  { label: '🎓 Drop out of College', text: "Should I drop out of college to pursue my startup full-time?", category: 'education' },
  { label: '₿ Bitcoin 60%', text: "I want to invest 60% of my savings into Bitcoin.", category: 'financial' },
  { label: '💔 End 7-Year Relationship', text: "I'm considering ending a 7-year relationship because I feel unfulfilled.", category: 'relationship' },
];

const CATEGORIES = [
  { value: '', label: '🤖 Auto-detect' },
  { value: 'career', label: '💼 Career' },
  { value: 'business', label: '🚀 Business' },
  { value: 'financial', label: '💰 Financial' },
  { value: 'relationship', label: '❤️ Relationship' },
  { value: 'health', label: '🏥 Health' },
  { value: 'education', label: '🎓 Education' },
  { value: 'relocation', label: '🌍 Relocation' },
  { value: 'major_purchase', label: '🏠 Major Purchase' },
  { value: 'other', label: '🔮 Other' },
];

export default function DecisionInputPage() {
  const navigate = useNavigate();
  const addHistoryItem = useHistoryStore(s => s.addItem);
  const store = useSimulationStore();

  const [description, setDescription] = useState('');
  const [showContext, setShowContext] = useState(false);
  const [category, setCategory] = useState('');
  const [timeline, setTimeline] = useState('');
  const [budgetImpact, setBudgetImpact] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [biggestFear, setBiggestFear] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startSimulation = async (input: DecisionInput) => {
    if (!input.description.trim() || isSubmitting) return;
    setIsSubmitting(true);

    store.reset();
    store.initAgents();

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    store.setSessionId(sessionId);
    store.setDecisionInput(input.description);
    store.setStatus('parsing');

    navigate(`/simulation/${sessionId}`);

    try {
      await runSimulation(input, (event) => {
        switch (event.type) {
          case 'simulation_start':
            store.setStatus('round1');
            break;
          case 'round_start':
            store.setCurrentRound(event.round ?? 1);
            if (event.round === 1) store.setStatus('round1');
            if (event.round === 2) store.setStatus('round2');
            if (event.round === 3) store.setStatus('round3');
            break;
          case 'agent_thinking':
            if (event.agentId) store.setAgentThinking(event.agentId);
            break;
          case 'agent_critique':
            store.setAgentCritique(event.data as AgentCritique);
            break;
          case 'agent_reaction':
            store.setAgentReaction(event.data as AgentReaction);
            break;
          case 'agent_vote':
            store.setAgentVote(event.data as AgentVote);
            break;
          case 'report_generating':
            store.setStatus('generating_report');
            break;
          case 'report_complete': {
            const rep = event.data as DecisionRiskReport;
            store.setReport(rep);
            addHistoryItem({
              session_id: sessionId,
              decision_summary: input.description.slice(0, 120),
              category: input.category ?? 'other',
              created_at: new Date().toISOString(),
              overall_risk_score: rep.overall_risk_score,
              recommendation: rep.recommendation,
              report: rep,
            });
            navigate(`/report/${sessionId}`);
            break;
          }
          case 'simulation_error':
            store.setError(String(event.data ?? 'Unknown error'));
            break;
        }
      }, sessionId);
    } catch (err) {
      console.error(err);
      store.setError('Simulation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startSimulation({
      description: description.trim(),
      category: category || undefined,
      timeline: timeline || undefined,
      budget_impact: budgetImpact || undefined,
      desired_outcome: desiredOutcome || undefined,
      biggest_fear: biggestFear || undefined,
    });
  };

  const handleExample = (ex: typeof EXAMPLE_DECISIONS[0]) => {
    setDescription(ex.text);
    setCategory(ex.category);
    startSimulation({ description: ex.text, category: ex.category });
  };

  const canSubmit = description.trim().length > 0 && !isSubmitting;

  return (
    <div className="min-h-full flex flex-col" style={{ background: 'var(--navy)' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-2xl mx-auto">

          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase"
              style={{ background: 'rgba(255,34,68,0.12)', color: '#ff2244', border: '1px solid rgba(255,34,68,0.25)' }}
            >
              🛡️ 20 AI Adversaries · Zero Sugarcoating
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-center leading-tight mb-3" style={{ letterSpacing: '-0.02em' }}>
            What decision are you
            <br />
            <span style={{ color: '#ff2244' }}>stress-testing?</span>
          </h1>
          <p className="text-center text-sm sm:text-base mb-8" style={{ color: 'var(--text-secondary)' }}>
            A swarm of 20 adversarial AI agents tears it apart from every angle and produces a comprehensive risk report.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, 1500))}
              placeholder="Describe your decision in plain language… Be specific. The more detail, the more accurate the analysis."
              rows={4}
              className="w-full rounded-xl p-4 text-sm sm:text-base resize-none outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: description ? '1px solid rgba(255,34,68,0.4)' : '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-primary)',
                lineHeight: 1.6,
              }}
              disabled={isSubmitting}
            />

            {/* Context toggle */}
            <button
              type="button"
              onClick={() => setShowContext(!showContext)}
              className="flex items-center gap-2 text-sm transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span style={{ display: 'inline-block', transform: showContext ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▶</span>
              {showContext ? 'Hide' : 'Add'} context (optional but recommended)
            </button>

            {showContext && (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}
              >
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    disabled={isSubmitting}
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value} style={{ background: '#111827' }}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Timeline</label>
                  <input
                    type="text"
                    value={timeline}
                    onChange={e => setTimeline(e.target.value)}
                    placeholder="e.g. Next 3 months"
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Budget / Financial Impact</label>
                  <input
                    type="text"
                    value={budgetImpact}
                    onChange={e => setBudgetImpact(e.target.value)}
                    placeholder="e.g. $40k savings, $5k/month"
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Desired Outcome</label>
                  <input
                    type="text"
                    value={desiredOutcome}
                    onChange={e => setDesiredOutcome(e.target.value)}
                    placeholder="What does success look like?"
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Biggest Fear</label>
                  <input
                    type="text"
                    value={biggestFear}
                    onChange={e => setBiggestFear(e.target.value)}
                    placeholder="What scares you most about this?"
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-4 rounded-xl font-black text-base sm:text-lg tracking-wide transition-all duration-200"
              style={{
                background: canSubmit ? 'linear-gradient(135deg, #ff2244, #cc0022)' : 'rgba(255,255,255,0.06)',
                color: canSubmit ? '#fff' : 'rgba(255,255,255,0.3)',
                boxShadow: canSubmit ? '0 0 30px rgba(255,34,68,0.35)' : 'none',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Assembling War Room…
                </span>
              ) : (
                '🛡️ STRESS TEST THIS DECISION'
              )}
            </button>
          </form>

          {/* Examples */}
          <div className="mt-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-center mb-4" style={{ color: 'var(--text-secondary)' }}>
              Try an example — click to instantly run
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLE_DECISIONS.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => handleExample(ex)}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-secondary)',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom feature strip */}
      <div className="px-4 py-5" style={{ borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
        <div className="max-w-2xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { icon: '⚔️', label: '20 Adversarial Agents' },
            { icon: '🔴', label: '3-Round Debate' },
            { icon: '📊', label: 'Full Risk Report' },
            { icon: '🛡️', label: 'Bulletproof Decisions' },
          ].map((f, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-xl">{f.icon}</span>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
