import { useEffect, useMemo, useState } from 'react';
import { AdminModule } from '../components/AdminModule';
import { AppHeader } from '../components/AppHeader';
import { EmployeeModule, type EmployeeSubmitEntry } from '../components/EmployeeModule';
import type { DailyMenu, DashboardSnapshot, EmployeeSelection } from '../lib/dataStore';

type ActiveView = 'employee' | 'admin';

const blankDashboard: DashboardSnapshot = {
  totals: { breakfast: 0, lunch: 0, dinner: 0 },
  days: [],
  lastUpdated: null,
  totalEntries: 0
};

export default function HomePage() {
  const [activeView, setActiveView] = useState<ActiveView>('employee');
  const [menu, setMenu] = useState<DailyMenu[]>([]);
  const [dashboard, setDashboard] = useState<DashboardSnapshot>(blankDashboard);
  const [selections, setSelections] = useState<EmployeeSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const [menuRes, selectionRes] = await Promise.all([fetch('/api/menu'), fetch('/api/selections')]);
      const menuJson = await menuRes.json();
      const selectionJson = await selectionRes.json();
      setMenu(menuJson.menu ?? []);
      setDashboard(selectionJson.dashboard ?? blankDashboard);
      setSelections(selectionJson.selections ?? []);
      setError(null);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError('Unable to sync latest data. Offline mode activated.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh().catch(error => {
      // eslint-disable-next-line no-console
      console.error('Initial load failed', error);
    });
  }, []);

  const handleSubmitPreferences = async (entries: EmployeeSubmitEntry[]) => {
    const response = await fetch('/api/selections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ entries })
    });

    if (!response.ok) {
      throw new Error('Failed to submit');
    }

    const json = await response.json();
    const incomingSelections = (json.selections ?? []) as EmployeeSelection[];

    if (incomingSelections.length) {
      setSelections(prev => {
        const filtered = prev.filter(
          existing => !incomingSelections.some(incoming => incoming.employee === existing.employee && incoming.date === existing.date)
        );
        return [...filtered, ...incomingSelections];
      });
    }

    if (json.dashboard) {
      setDashboard(json.dashboard);
    }

    return json.dashboard ?? blankDashboard;
  };

  const introState = useMemo(
    () => ({
      breakfast: dashboard.totals.breakfast,
      lunch: dashboard.totals.lunch,
      dinner: dashboard.totals.dinner
    }),
    [dashboard.totals.breakfast, dashboard.totals.lunch, dashboard.totals.dinner]
  );

  return (
    <main className="app-shell">
      <AppHeader onToggle={setActiveView} active={activeView} stats={introState} />

      {error ? (
        <div className="card" style={{ marginBottom: '1.5rem', background: '#fff4f0', borderColor: '#ffc7b8' }}>
          <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Heads up</strong>
          <span style={{ color: '#b34725', fontSize: '0.9rem' }}>{error}</span>
        </div>
      ) : null}

      {loading ? (
        <section className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Syncing your canteen cockpit...</span>
        </section>
      ) : activeView === 'employee' ? (
        <EmployeeModule
          menu={menu}
          previousSelections={selections}
          onSubmitPreferences={handleSubmitPreferences}
        />
      ) : (
        <AdminModule dashboard={dashboard} selections={selections} menu={menu} />
      )}
    </main>
  );
}
