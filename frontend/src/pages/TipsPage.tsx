import { useNavigate } from 'react-router-dom';

const ACCURACY_TIERS = [
  {
    level: 'Basic',
    accuracy: '40–55%',
    color: '#ff4444',
    gradient: 'linear-gradient(135deg, #ff4444, #cc2233)',
    fields: ['Decision description only'],
    example: '"I want to quit my job."',
    what: 'Generic risks based on decision category. Agents guess your circumstances.',
    icon: '🔴',
  },
  {
    level: 'Standard',
    accuracy: '60–75%',
    color: '#ffaa00',
    gradient: 'linear-gradient(135deg, #ffaa00, #ff8800)',
    fields: ['Description', 'Category', 'Timeline'],
    example: '"I want to quit my software engineer job in 3 months to start a fintech company."',
    what: 'Targeted risks with timing context. Agents can model opportunity windows.',
    icon: '🟡',
  },
  {
    level: 'Advanced',
    accuracy: '80–90%',
    color: '#44cc88',
    gradient: 'linear-gradient(135deg, #44cc88, #22aa66)',
    fields: ['Description', 'Category', 'Timeline', 'Budget Impact', 'Stakeholders'],
    example: '"I want to quit my $120k/yr job in 3 months to bootstrap a fintech startup. I have $40k savings, a wife and 2-year-old child, and no co-founder."',
    what: 'Surgical risk analysis. Every agent personalizes their attack to YOUR exact situation.',
    icon: '🟢',
  },
  {
    level: 'Maximum',
    accuracy: '90–98%',
    color: '#44aaff',
    gradient: 'linear-gradient(135deg, #44aaff, #2288dd)',
    fields: ['All fields filled', 'Biggest Fear provided', 'Desired Outcome stated'],
    example: '"I want to quit my $120k/yr job in 3 months to bootstrap a fintech startup. $40k savings, wife + toddler, no co-founder. My biggest fear is running out of money at month 8. I want to reach $10k MRR in 12 months."',
    what: 'Full adversarial warfare. Agents target your specific fear, timeline milestones, and success metrics.',
    icon: '🔵',
  },
];

const TIPS = [
  {
    icon: '🎯',
    title: 'Be Specific, Not Vague',
    bad: '"Should I change careers?"',
    good: '"Should I leave my marketing director role at a Fortune 500 to become a freelance UX designer?"',
    why: 'Specificity gives agents concrete attack vectors instead of generic advice.',
  },
  {
    icon: '💰',
    title: 'Include Financial Context',
    bad: '"I want to start a business."',
    good: '"I want to start a bakery with $30k savings and $2k/month fixed expenses."',
    why: 'The Financial Reaper and Exit Strategist need numbers to calculate your runway and burn rate.',
  },
  {
    icon: '👨‍👩‍👧‍👦',
    title: 'Name Your Stakeholders',
    bad: '"I\'m thinking of moving."',
    good: '"I\'m thinking of moving from NYC to Lisbon. My partner works remotely, our kids are 4 and 7."',
    why: 'The Family Protector and Relationship Saboteur can only attack what they know about.',
  },
  {
    icon: '⏰',
    title: 'Set a Real Timeline',
    bad: '"I might do this someday."',
    good: '"I plan to execute this decision by March 2027."',
    why: 'The Timing Skeptic uses your timeline to identify market cycles, seasonal risks, and urgency traps.',
  },
  {
    icon: '😱',
    title: 'Confess Your Biggest Fear',
    bad: '(leaving it blank)',
    good: '"My biggest fear is that I\'ll burn through my savings and have to crawl back to my old job."',
    why: 'This is the most powerful field. It tells all 20 agents exactly where to aim their attack.',
  },
  {
    icon: '🏆',
    title: 'Define Your Success Metric',
    bad: '"I want it to work out."',
    good: '"Success means reaching $10k/month recurring revenue within 12 months."',
    why: 'Measurable outcomes let the agents calculate probability of failure vs. your benchmarks.',
  },
];

const FIELD_IMPACT = [
  { field: 'Decision Description', impact: 'Core', agents: 'All 20', score: 100 },
  { field: 'Biggest Fear', impact: 'Critical', agents: '18/20', score: 95 },
  { field: 'Budget / Financial Impact', impact: 'High', agents: '12/20', score: 85 },
  { field: 'Stakeholders', impact: 'High', agents: '10/20', score: 80 },
  { field: 'Timeline', impact: 'Medium', agents: '8/20', score: 70 },
  { field: 'Desired Outcome', impact: 'Medium', agents: '6/20', score: 65 },
  { field: 'Category', impact: 'Low', agents: '4/20', score: 40 },
];

export default function TipsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4"
          style={{ background: 'rgba(255,34,68,0.1)', color: '#ff2244', border: '1px solid rgba(255,34,68,0.2)' }}>
          🎓 INPUT COACHING
        </div>
        <h1 className="text-3xl sm:text-4xl font-black mb-3" style={{ color: '#fff' }}>
          Get <span style={{ color: '#ff2244' }}>Surgical</span> Results
        </h1>
        <p className="text-sm sm:text-base max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
          The quality of your stress-test depends entirely on the quality of your input.
          Here's how to go from generic advice to a personalized war-room takedown.
        </p>
      </div>

      {/* Accuracy Tiers */}
      <section className="mb-12">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span>📊</span> Accuracy Tiers — What You Get Based on What You Give
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACCURACY_TIERS.map(tier => (
            <div
              key={tier.level}
              className="rounded-xl p-4 transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: 'var(--surface)',
                border: `1px solid ${tier.color}33`,
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{tier.icon}</span>
                <div>
                  <div className="font-bold text-sm" style={{ color: tier.color }}>{tier.level}</div>
                  <div className="text-xl font-black" style={{ color: '#fff' }}>{tier.accuracy}</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: tier.accuracy.split('–')[1]?.replace('%', '') + '%',
                    background: tier.gradient,
                  }}
                />
              </div>

              <div className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                <span className="font-semibold" style={{ color: '#fff' }}>Fields used: </span>
                {tier.fields.join(' · ')}
              </div>

              <div className="rounded-lg p-2.5 mb-2 text-xs italic"
                style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>
                "{tier.example}"
              </div>

              <div className="text-xs" style={{ color: tier.color }}>
                → {tier.what}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Six Pro Tips */}
      <section className="mb-12">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span>💡</span> 6 Pro Tips for Maximum Devastation
        </h2>
        <div className="space-y-3">
          {TIPS.map((tip, i) => (
            <div
              key={i}
              className="rounded-xl p-4 transition-all duration-200 hover:border-red-500/30"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0 mt-0.5">{tip.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm mb-2" style={{ color: '#fff' }}>{tip.title}</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <div className="rounded-lg p-2.5 text-xs"
                      style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.15)' }}>
                      <span className="font-bold" style={{ color: '#ff4444' }}>❌ Weak: </span>
                      <span style={{ color: 'var(--text-secondary)' }}>{tip.bad}</span>
                    </div>
                    <div className="rounded-lg p-2.5 text-xs"
                      style={{ background: 'rgba(68,204,136,0.08)', border: '1px solid rgba(68,204,136,0.15)' }}>
                      <span className="font-bold" style={{ color: '#44cc88' }}>✅ Strong: </span>
                      <span style={{ color: 'var(--text-secondary)' }}>{tip.good}</span>
                    </div>
                  </div>

                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span className="font-semibold" style={{ color: '#ffaa00' }}>Why: </span>{tip.why}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Field Impact Table */}
      <section className="mb-12">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span>⚡</span> Field Impact on Agent Performance
        </h2>
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}>Field</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}>Impact</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}>Agents Affected</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}>Power</th>
              </tr>
            </thead>
            <tbody>
              {FIELD_IMPACT.map((row, i) => (
                <tr key={i} style={{ borderBottom: i < FIELD_IMPACT.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: '#fff' }}>{row.field}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{
                        background: row.impact === 'Core' ? 'rgba(255,34,68,0.15)' :
                          row.impact === 'Critical' ? 'rgba(255,170,0,0.15)' :
                          row.impact === 'High' ? 'rgba(68,204,136,0.15)' :
                          'rgba(255,255,255,0.06)',
                        color: row.impact === 'Core' ? '#ff2244' :
                          row.impact === 'Critical' ? '#ffaa00' :
                          row.impact === 'High' ? '#44cc88' :
                          'var(--text-secondary)',
                      }}>
                      {row.impact}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{row.agents}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', maxWidth: 80 }}>
                        <div className="h-full rounded-full" style={{
                          width: `${row.score}%`,
                          background: row.score > 80 ? 'linear-gradient(90deg, #ff2244, #ff6644)' :
                            row.score > 60 ? 'linear-gradient(90deg, #ffaa00, #ffcc00)' :
                            'linear-gradient(90deg, #666, #888)',
                        }} />
                      </div>
                      <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{row.score}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center pb-8">
        <button
          onClick={() => navigate('/')}
          className="px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #ff2244, #cc1133)',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(255,34,68,0.3)',
          }}
        >
          🛡️ Start a Precision Stress-Test →
        </button>
        <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>
          Armed with these tips, you'll get the most brutal and accurate analysis possible.
        </p>
      </div>
    </div>
  );
}
