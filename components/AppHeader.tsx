import { format } from 'date-fns';

interface AppHeaderProps {
  onToggle: (target: 'employee' | 'admin') => void;
  active: 'employee' | 'admin';
  stats: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
}

const pillText = (active: 'employee' | 'admin') =>
  active === 'employee' ? 'Plan your meals' : 'Monitor demand';

export function AppHeader({ onToggle, active, stats }: AppHeaderProps) {
  const today = format(new Date(), 'EEEE, MMM d');

  return (
    <header className="card" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <span className="pill">{today}</span>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 700, lineHeight: 1.2 }}>
            Karmic Solutions Canteen Management
          </h1>
          <p style={{ maxWidth: 620, color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
            Eliminate food wastage and give every employee a frictionless meal planning experience. Submit meal
            preferences before 10:00 AM to guarantee availability. {pillText(active)}.
          </p>
        </div>

        <div className="tab-bar" role="tablist">
          <button
            className={`tab-button ${active === 'employee' ? 'active' : ''}`}
            type="button"
            onClick={() => onToggle('employee')}
            role="tab"
            aria-selected={active === 'employee'}
          >
            Employee Module
          </button>
          <button
            className={`tab-button ${active === 'admin' ? 'active' : ''}`}
            type="button"
            onClick={() => onToggle('admin')}
            role="tab"
            aria-selected={active === 'admin'}
          >
            Canteen Command Center
          </button>
        </div>
      </div>

      <section className="grid three" aria-label="Live demand snapshot">
        <article className="card metric-card" style={{ background: '#f1f6ff' }}>
          <span className="metric-label">Breakfast commitments</span>
          <span className="metric-value">{stats.breakfast}</span>
          <span className="metric-label">Confirmed till 10 AM today</span>
        </article>
        <article className="card metric-card" style={{ background: '#effaf5' }}>
          <span className="metric-label">Lunch commitments</span>
          <span className="metric-value">{stats.lunch}</span>
          <span className="metric-label">Midday peak demand</span>
        </article>
        <article className="card metric-card" style={{ background: '#fff5ed' }}>
          <span className="metric-label">Dinner commitments</span>
          <span className="metric-value">{stats.dinner}</span>
          <span className="metric-label">Managed for evening shift</span>
        </article>
      </section>
    </header>
  );
}
