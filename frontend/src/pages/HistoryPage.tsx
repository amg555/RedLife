import { useNavigate } from 'react-router-dom';
import { useHistoryStore } from '../stores/historyStore';
import { useSimulationStore } from '../stores/simulationStore';

const REC_CONFIG = {
  GO: { color: '#44cc44', icon: '✅', label: 'GO' },
  CAUTION: { color: '#ffaa00', icon: '⚠️', label: 'CAUTION' },
  NO_GO: { color: '#ff4444', icon: '🛑', label: 'NO-GO' },
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const { items, removeItem } = useHistoryStore();
  const setReport = useSimulationStore(s => s.setReport);
  const setSessionId = useSimulationStore(s => s.setSessionId);
  const setStatus = useSimulationStore(s => s.setStatus);

  const handleView = (item: typeof items[0]) => {
    setReport(item.report);
    setSessionId(item.session_id);
    setStatus('complete');
    navigate(`/report/${item.session_id}`);
  };

  return (
    <div className="min-h-full px-4 sm:px-6 py-6 sm:py-10" style={{ background: 'var(--navy)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black mb-1">Decision History</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {items.length} decision{items.length !== 1 ? 's' : ''} stress-tested
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{
              background: 'rgba(255,34,68,0.1)',
              border: '1px solid rgba(255,34,68,0.25)',
              color: '#ff2244',
            }}
          >
            ⚡ New Decision
          </button>
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}
          >
            <div className="text-5xl mb-4">🛡️</div>
            <h2 className="text-xl font-bold mb-2">No decisions stress-tested yet</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Start by entering a major life or business decision
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 rounded-xl text-sm font-bold"
              style={{
                background: 'linear-gradient(135deg, #ff2244, #cc0022)',
                color: '#fff',
              }}
            >
              Stress-Test Your First Decision
            </button>
          </div>
        )}

        {/* Items grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map(item => {
            const rec = REC_CONFIG[item.recommendation];
            const riskColor = item.overall_risk_score >= 67 ? '#ff4444' : item.overall_risk_score >= 34 ? '#ffaa00' : '#44cc44';

            return (
              <div
                key={item.session_id}
                className="rounded-xl overflow-hidden transition-all duration-200 hover:translate-y-[-2px]"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="p-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-snug mb-1 line-clamp-2">
                        "{item.decision_summary}"
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(item.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {/* Risk score */}
                      <div
                        className="text-xl font-black font-mono w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: `${riskColor}15`,
                          color: riskColor,
                          border: `2px solid ${riskColor}30`,
                        }}
                      >
                        {item.overall_risk_score}
                      </div>
                    </div>
                  </div>

                  {/* Recommendation + category */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: `${rec.color}18`,
                        color: rec.color,
                        border: `1px solid ${rec.color}30`,
                      }}
                    >
                      {rec.icon} {rec.label}
                    </span>
                    {item.category && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
                      >
                        {item.category}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(item)}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      View Report
                    </button>
                    <button
                      onClick={() => removeItem(item.session_id)}
                      className="px-3 py-2 rounded-lg text-xs transition-all"
                      style={{ background: 'rgba(255,68,68,0.08)', color: '#ff4444', border: '1px solid rgba(255,68,68,0.15)' }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
