import { useEffect } from 'react';

export type FilterState = {
  presbicia: boolean;
  astig075: boolean;
  modality: 'diaria' | 'semanal' | 'mensual';
  pack: number | null;
};

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  packOptions: number[];
  hasSemanal: boolean;
}

const modalityLabels: Record<FilterState['modality'], string> = {
  diaria: 'Diaria',
  semanal: 'Semanal',
  mensual: 'Mensual'
};

const toggleButtonStyle = (active: boolean) => ({
  padding: '0.45rem 0.9rem',
  borderRadius: '999px',
  border: '1px solid',
  borderColor: active ? '#2563eb' : '#d0d5dd',
  background: active ? '#2563eb' : '#fff',
  color: active ? '#fff' : '#1f2933',
  cursor: 'pointer',
  fontWeight: 500,
  transition: 'all 0.2s ease-in-out',
  boxShadow: active ? '0 8px 16px rgba(37, 99, 235, 0.2)' : 'none'
});

export function FilterPanel({ filters, onChange, packOptions, hasSemanal }: FilterPanelProps) {
  useEffect(() => {
    if (filters.pack && !packOptions.includes(filters.pack)) {
      onChange({ ...filters, pack: packOptions[0] ?? null });
    }
  }, [filters, packOptions, onChange]);

  const update = (partial: Partial<FilterState>) => onChange({ ...filters, ...partial });

  const modalityOrder: FilterState['modality'][] = hasSemanal
    ? ['diaria', 'semanal', 'mensual']
    : ['diaria', 'mensual'];

  return (
    <section
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
        display: 'grid',
        gap: '1.25rem'
      }}
    >
      <header>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem' }}>Necesidad visual</h2>
        <p style={{ margin: 0, color: '#475569' }}>
          Selecciona la combinación de presbicia y astigmatismo para ajustar la geometría.
        </p>
      </header>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button
          type="button"
          style={toggleButtonStyle(filters.presbicia)}
          onClick={() => update({ presbicia: !filters.presbicia })}
        >
          Presbicia
        </button>
        <button
          type="button"
          style={toggleButtonStyle(filters.astig075)}
          onClick={() => update({ astig075: !filters.astig075 })}
        >
          Astig ≥ 0,75
        </button>
      </div>

      <div>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem' }}>Formato de reemplazo</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {modalityOrder.map((value) => (
            <button
              key={value}
              type="button"
              style={toggleButtonStyle(filters.modality === value)}
              onClick={() => update({ modality: value })}
            >
              {modalityLabels[value]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem' }}>Pack disponible</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {packOptions.map((option) => (
            <button
              key={option}
              type="button"
              style={toggleButtonStyle(filters.pack === option)}
              onClick={() => update({ pack: option })}
            >
              {option} LC
            </button>
          ))}
          {packOptions.length === 0 && (
            <span style={{ color: '#64748b' }}>Selecciona un formato disponible</span>
          )}
        </div>
      </div>
    </section>
  );
}
