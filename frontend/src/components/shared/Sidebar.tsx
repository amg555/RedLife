import { NavLink, useNavigate } from 'react-router-dom';
import { useSimulationStore } from '../../stores/simulationStore';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const reset = useSimulationStore(s => s.reset);
  const navigate = useNavigate();

  const handleNewDecision = () => {
    reset();
    navigate('/');
    onClose();
  };

  const links = [
    { to: '/', label: 'New Decision', icon: '⚡', exact: true },
    { to: '/history', label: 'History', icon: '📋', exact: false },
    { to: '/tips', label: 'Input Coaching', icon: '🎓', exact: false },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          lg:relative lg:translate-x-0 lg:z-auto
          transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          width: 220,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          minHeight: '100vh',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5 py-5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <span className="text-2xl">🛡️</span>
          <span className="font-black text-xl tracking-tight" style={{ color: '#ff2244' }}>
            RedLife
          </span>
          {/* Close button mobile */}
          <button
            onClick={onClose}
            className="ml-auto p-1 rounded lg:hidden"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Close menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          <button
            onClick={handleNewDecision}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left text-sm font-semibold transition-all"
            style={{
              background: 'rgba(255,34,68,0.12)',
              color: '#ff2244',
              border: '1px solid rgba(255,34,68,0.25)',
            }}
          >
            <span>⚡</span>
            <span>New Decision</span>
          </button>

          {links.slice(1).map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'bg-white/8 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            RedLife v1.0 · MIT License
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
            20 AI Adversaries · Zero Sugarcoating
          </p>
        </div>
      </aside>
    </>
  );
}
