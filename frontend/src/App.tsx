import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DecisionInputPage from './pages/DecisionInputPage';
import SimulationPage from './pages/SimulationPage';
import ReportPage from './pages/ReportPage';
import HistoryPage from './pages/HistoryPage';
import TipsPage from './pages/TipsPage';
import Sidebar from './components/shared/Sidebar';
import { useState, useEffect } from 'react';
import { useSimulationStore } from './stores/simulationStore';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { loadManifest } = useSimulationStore();

  useEffect(() => {
    loadManifest();
  }, [loadManifest]);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen" style={{ background: 'var(--navy)', color: 'var(--text-primary)' }}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile top bar */}
          <div
            className="flex items-center gap-3 px-4 py-3 lg:hidden"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)' }}
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-lg">🛡️</span>
              <span className="font-bold text-lg" style={{ color: '#ff2244' }}>RedLife</span>
            </div>
          </div>

          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<DecisionInputPage />} />
              <Route path="/simulation/:sessionId" element={<SimulationPage />} />
              <Route path="/report/:sessionId" element={<ReportPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/tips" element={<TipsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
