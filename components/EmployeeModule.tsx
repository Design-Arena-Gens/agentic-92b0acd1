import { addDays, format, formatISO, isToday, parseISO } from 'date-fns';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { DailyMenu, DashboardSnapshot, EmployeeSelection, MealSlot } from '../lib/dataStore';

const defaultMeals: MealSlot = { breakfast: false, lunch: false, dinner: false };

interface EmployeeModuleProps {
  menu: DailyMenu[];
  previousSelections: EmployeeSelection[];
  onSubmitPreferences: (entries: SubmitEntry[]) => Promise<DashboardSnapshot>;
}

interface SubmitEntry {
  date: string;
  meals: MealSlot;
  employee: string;
  department: string;
  shift: EmployeeSelection['shift'];
  remarks?: string;
}

const shifts = [
  { value: 'morning', label: 'Morning Shift (7 AM - 3 PM)' },
  { value: 'general', label: 'General Shift (9 AM - 6 PM)' },
  { value: 'evening', label: 'Evening Shift (1 PM - 9 PM)' }
] as const;

const departments = [
  'Engineering',
  'Design',
  'Product',
  'People Success',
  'Finance',
  'Operations',
  'Client Delivery',
  'Sales',
  'Marketing'
];

export function EmployeeModule({ menu, previousSelections, onSubmitPreferences }: EmployeeModuleProps) {
  const planningDays = useMemo(() => {
    if (menu.length) {
      return menu.slice(0, 5).map(day => ({
        date: day.date,
        notes: day.notes
      }));
    }

    const baseline = Array.from({ length: 5 }).map((_, index) => {
      const date = formatISO(addDays(new Date(), index), { representation: 'date' });
      return { date };
    });
    return baseline;
  }, [menu]);

  const prefillMap = useMemo(() => {
    const map = new Map<string, MealSlot>();
    previousSelections.forEach(selection => {
      if (planningDays.find(day => day.date === selection.date)) {
        map.set(selection.date, { ...selection.meals });
      }
    });
    return map;
  }, [planningDays, previousSelections]);

  const [identity, setIdentity] = useState({
    employee: '',
    department: departments[0],
    shift: shifts[1].value as (typeof shifts)[number]['value'],
    remarks: ''
  });

  const [plans, setPlans] = useState<Record<string, MealSlot>>(() => ({}));

  useEffect(() => {
    setPlans(() =>
      planningDays.reduce<Record<string, MealSlot>>((acc, day) => {
        acc[day.date] = prefillMap.get(day.date) ?? { ...defaultMeals };
        return acc;
      }, {})
    );
  }, [planningDays, prefillMap]);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const toggleMeal = (date: string, meal: keyof MealSlot) => {
    setPlans(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [meal]: !prev[date][meal]
      }
    }));
  };

  const isMealSelected = (date: string) => {
    const meals = plans[date];
    return meals.breakfast || meals.lunch || meals.dinner;
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    const trimmedName = identity.employee.trim();
    if (!trimmedName) {
      setFeedback({ type: 'error', message: 'Please share your name so the kitchen can verify your badge.' });
      return;
    }

    const entries = planningDays
      .filter(day => isMealSelected(day.date))
      .map(day => ({
        date: day.date,
        meals: plans[day.date]
      }));

    if (entries.length === 0) {
      setFeedback({ type: 'error', message: 'Select at least one meal slot to confirm your participation.' });
      return;
    }

    setSaving(true);
    try {
      const dashboard = await onSubmitPreferences(
        entries.map(entry => ({
          ...entry,
          employee: trimmedName,
          department: identity.department,
          shift: identity.shift,
          remarks: identity.remarks
        }))
      );

      setFeedback({
        type: 'success',
        message: `All set! Your preferences are locked. Kitchen synced ${dashboard.totalEntries} responses.`
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      setFeedback({ type: 'error', message: 'We hit a snag saving your plan. Try again in a few seconds.' });
    } finally {
      setSaving(false);
    }
  };

  const upcomingMenu = (date: string) => menu.find(day => day.date === date);

  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h2 className="section-title">Plan your canteen visits</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 620 }}>
          Lock in meals for the next five days. You can make changes any time before 10 AM on the same day. The kitchen
          only cooks what is confirmed, helping us stay sustainable and reduce wastage.
        </p>
      </header>

      <form onSubmit={submitForm} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <section className="grid two">
          <label className="input-group">
            <span>Your full name</span>
            <input
              className="input"
              placeholder="e.g. Aanya Patel"
              value={identity.employee}
              onChange={event => setIdentity(prev => ({ ...prev, employee: event.target.value }))}
              autoComplete="name"
              name="employee"
            />
          </label>

          <label className="input-group">
            <span>Department</span>
            <select
              className="select"
              value={identity.department}
              onChange={event => setIdentity(prev => ({ ...prev, department: event.target.value }))}
              name="department"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </label>

          <label className="input-group">
            <span>Shift</span>
            <select
              className="select"
              value={identity.shift}
              onChange={event =>
                setIdentity(prev => ({
                  ...prev,
                  shift: event.target.value as (typeof shifts)[number]['value']
                }))
              }
              name="shift"
            >
              {shifts.map(shift => (
                <option key={shift.value} value={shift.value}>
                  {shift.label}
                </option>
              ))}
            </select>
          </label>

          <label className="input-group">
            <span>Share dietary notes (optional)</span>
            <input
              className="input"
              placeholder="Allergic to nuts, prefer vegan options..."
              value={identity.remarks}
              onChange={event => setIdentity(prev => ({ ...prev, remarks: event.target.value }))}
              maxLength={180}
              name="remarks"
            />
          </label>
        </section>

        <section className="grid" style={{ gap: '1.25rem' }}>
          {planningDays.map(day => {
            const selected = plans[day.date];
            const menuForDay = upcomingMenu(day.date);
            const dateTitle = isToday(parseISO(day.date))
              ? `Today · ${format(parseISO(day.date), 'MMM d')}`
              : format(parseISO(day.date), 'EEEE · MMM d');

            return (
              <article key={day.date} className="card" style={{ borderRadius: 20, padding: '1.5rem' }}>
                <header style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="status-dot" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{dateTitle}</h3>
                    {menuForDay?.theme ? <span className="pill info">{menuForDay.theme}</span> : null}
                  </div>
                  {menuForDay?.chefSpecial ? (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      Chef&apos;s special: <strong>{menuForDay.chefSpecial}</strong> · Approx {menuForDay.calories}{' '}
                      kcal
                    </p>
                  ) : null}
                  {menuForDay?.notes ? (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{menuForDay.notes}</span>
                  ) : null}
                </header>

                <div className="grid three">
                  <button
                    type="button"
                    className={`card ${selected.breakfast ? 'active' : ''}`}
                    onClick={() => toggleMeal(day.date, 'breakfast')}
                    style={{
                      borderRadius: 16,
                      padding: '1rem',
                      border: selected.breakfast ? '2px solid rgba(36,86,229,0.4)' : '1px solid var(--border)',
                      background: selected.breakfast ? 'rgba(36,86,229,0.08)' : 'var(--surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem'
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>🌅</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'left' }}>
                      <strong>Breakfast</strong>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Warm beverages, protein start and seasonal fruit bowls.
                      </span>
                    </div>
                    <span className="tag" style={{ background: selected.breakfast ? undefined : '#f2f4f8' }}>
                      {selected.breakfast ? 'Included' : 'Skip'}
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`card ${selected.lunch ? 'active' : ''}`}
                    onClick={() => toggleMeal(day.date, 'lunch')}
                    style={{
                      borderRadius: 16,
                      padding: '1rem',
                      border: selected.lunch ? '2px solid rgba(36,86,229,0.4)' : '1px solid var(--border)',
                      background: selected.lunch ? 'rgba(36,86,229,0.08)' : 'var(--surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem'
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>🌞</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'left' }}>
                      <strong>Lunch</strong>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Rotational menu with smart carbs and protein-rich mains.
                      </span>
                    </div>
                    <span className="tag" style={{ background: selected.lunch ? undefined : '#f2f4f8' }}>
                      {selected.lunch ? 'Included' : 'Skip'}
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`card ${selected.dinner ? 'active' : ''}`}
                    onClick={() => toggleMeal(day.date, 'dinner')}
                    style={{
                      borderRadius: 16,
                      padding: '1rem',
                      border: selected.dinner ? '2px solid rgba(36,86,229,0.4)' : '1px solid var(--border)',
                      background: selected.dinner ? 'rgba(36,86,229,0.08)' : 'var(--surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem'
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>🌙</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'left' }}>
                      <strong>Dinner</strong>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Refuelling bowls customized for the evening support teams.
                      </span>
                    </div>
                    <span className="tag" style={{ background: selected.dinner ? undefined : '#f2f4f8' }}>
                      {selected.dinner ? 'Included' : 'Skip'}
                    </span>
                  </button>
                </div>

                {menuForDay?.dishes?.length ? (
                  <div style={{ marginTop: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Highlights</strong>
                    <div className="grid three">
                      {menuForDay.dishes.map(category => (
                        <div
                          key={category.category}
                          className="card"
                          style={{ padding: '0.9rem', borderRadius: 16, background: '#f7f9fd' }}
                        >
                          <span style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                            {category.category}
                          </span>
                          <ul style={{ listStyle: 'none', display: 'grid', gap: '0.3rem' }}>
                            {category.items.map(item => (
                              <li key={item} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>

        <footer className="submit-bar">
          {feedback ? (
            <span
              className={`pill ${feedback.type === 'success' ? 'success' : 'warning'}`}
              role="status"
              style={{ marginRight: 'auto' }}
            >
              {feedback.message}
            </span>
          ) : (
            <span className="pill info" style={{ marginRight: 'auto' }}>
              Update anytime before 10 AM on the meal day
            </span>
          )}
          <button
            type="button"
            className="btn secondary"
            onClick={() =>
              setPlans(() =>
                planningDays.reduce<Record<string, MealSlot>>((acc, day) => {
                  acc[day.date] = { ...defaultMeals };
                  return acc;
                }, {})
              )
            }
            disabled={saving}
          >
            Clear selection
          </button>
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? 'Saving...' : 'Confirm meals'}
          </button>
        </footer>
      </form>
    </section>
  );
}

export type EmployeeSubmitEntry = SubmitEntry;
