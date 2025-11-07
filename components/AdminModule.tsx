import { format, parseISO } from 'date-fns';
import type { DailyMenu, DashboardSnapshot, EmployeeSelection } from '../lib/dataStore';

interface AdminModuleProps {
  dashboard: DashboardSnapshot;
  selections: EmployeeSelection[];
  menu: DailyMenu[];
}

const formatDate = (date: string) => format(parseISO(date), 'EEE, MMM d');

const totalMeals = (entry: EmployeeSelection) =>
  Object.values(entry.meals).reduce((count, slot) => (slot ? count + 1 : count), 0);

const mealSummary = (entry: EmployeeSelection) =>
  (['breakfast', 'lunch', 'dinner'] as const)
    .filter(meal => entry.meals[meal])
    .map(meal => meal[0].toUpperCase())
    .join(' · ')
    .replace(/·/g, '·');

export function AdminModule({ dashboard, selections, menu }: AdminModuleProps) {
  const demandCap = Math.max(
    1,
    ...dashboard.days.map(day => Math.max(day.breakfast, day.lunch, day.dinner))
  );

  const latestEntries = [...selections]
    .sort((a, b) => (a.submittedAt > b.submittedAt ? -1 : 1))
    .slice(0, 12);

  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <h2 className="section-title">Canteen command center</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 640 }}>
          Live demand signals flowing in from employees. Use this view to align prep volumes, coordinate procurement,
          and communicate with vendors. Data refreshes in real-time.
        </p>
      </header>

      <section className="grid three">
        <article className="card metric-card" style={{ background: '#f1f6ff' }}>
          <span className="metric-label">Meals committed this cycle</span>
          <span className="metric-value">
            {dashboard.totals.breakfast + dashboard.totals.lunch + dashboard.totals.dinner}
          </span>
          <span className="metric-label">
            {dashboard.totalEntries} unique employee responses
          </span>
        </article>
        <article className="card metric-card" style={{ background: '#effaf5' }}>
          <span className="metric-label">Last confirmation received</span>
          <span className="metric-value" style={{ fontSize: '1.2rem' }}>
            {dashboard.lastUpdated ? format(parseISO(dashboard.lastUpdated), 'MMM d · h:mm a') : 'Awaiting input'}
          </span>
          <span className="metric-label">Shift leads notified instantly</span>
        </article>
        <article className="card metric-card" style={{ background: '#fff5ed' }}>
          <span className="metric-label">Most in-demand slot</span>
          <span className="metric-value">
            {(() => {
              const slots = dashboard.totals;
              const [top] = Object.entries(slots).sort(([, a], [, b]) => b - a);
              return `${top?.[0] ?? '—'} • ${top?.[1] ?? 0}`;
            })()}
          </span>
          <span className="metric-label">Use to align production batches</span>
        </article>
      </section>

      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <strong>Demand by meal slot</strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Visualize meal confirmations to scale prep volumes per service.
            </span>
          </div>
          <span className="pill info">Auto-refreshing</span>
        </header>
        <div className="bar-chart">
          {dashboard.days.length === 0 ? (
            <span style={{ color: 'var(--text-secondary)' }}>No confirmations yet. Encourage teams to log their meals.</span>
          ) : (
            dashboard.days.map(day => (
              <div key={day.date} className="card" style={{ padding: '1rem', borderRadius: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <strong>{formatDate(day.date)}</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Menu anchor: {menu.find(entry => entry.date === day.date)?.chefSpecial ?? 'NA'}
                  </span>
                </div>
                {(['breakfast', 'lunch', 'dinner'] as const).map(slot => (
                  <div key={slot} className="bar-row">
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{slot}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${Math.round((day[slot] / demandCap) * 100)}%` }}
                      />
                    </div>
                    <span style={{ fontWeight: 600 }}>{day[slot]}</span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <strong>Latest confirmations</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Spot-check for overbooked days or special accommodations.
            </span>
          </div>
          <span className="pill success">Kitchen sync ready</span>
        </header>

        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Department</th>
                <th>Shift</th>
                <th>Date</th>
                <th>Meals</th>
                <th>Notes</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {latestEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    Waiting for the first set of confirmations.
                  </td>
                </tr>
              ) : (
                latestEntries.map(entry => (
                  <tr key={entry.id}>
                    <td>{entry.employee}</td>
                    <td>{entry.department}</td>
                    <td style={{ textTransform: 'capitalize' }}>{entry.shift}</td>
                    <td>{formatDate(entry.date)}</td>
                    <td>
                      <span className="pill info">
                        {mealSummary(entry)} · {totalMeals(entry)}
                      </span>
                    </td>
                    <td style={{ maxWidth: 180 }}>{entry.remarks ?? '—'}</td>
                    <td>{format(parseISO(entry.submittedAt), 'MMM d, h:mm a')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
