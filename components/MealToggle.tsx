import { clsx } from 'clsx';
import { ReactNode } from 'react';

interface MealToggleProps {
  label: string;
  description: string;
  active: boolean;
  icon: ReactNode;
  onToggle: () => void;
}

export function MealToggle({ label, description, active, icon, onToggle }: MealToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={clsx('card', 'meal-toggle', active && 'meal-toggle__active')}
      style={{
        borderRadius: 16,
        border: active ? '2px solid rgba(36, 86, 229, 0.45)' : '1px solid var(--border)',
        background: active ? 'rgba(36, 86, 229, 0.08)' : 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '0.5rem',
        padding: '1rem 1.2rem'
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 44,
          height: 44,
          borderRadius: 14,
          background: active ? 'rgba(36, 86, 229, 0.14)' : 'rgba(36, 86, 229, 0.08)',
          color: 'var(--primary-dark)',
          fontSize: '1.3rem'
        }}
      >
        {icon}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-start' }}>
        <span style={{ fontWeight: 700, fontSize: '1rem' }}>{label}</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{description}</span>
        <span className={`tag ${active ? 'tag--on' : 'tag--off'}`} style={{ background: active ? undefined : '#f2f4f8' }}>
          {active ? 'Planned' : 'Skip'}
        </span>
      </div>
    </button>
  );
}
