import { BudgetLine } from '../types';
import { formatCurrency } from '../utils/pricing';

interface BudgetPanelProps {
  lines: BudgetLine[];
  onRemove: (createdAt: string) => void;
  onUpdatePacks: (createdAt: string, packs: number) => void;
  onReset: () => void;
}

export function BudgetPanel({ lines, onRemove, onUpdatePacks, onReset }: BudgetPanelProps) {
  const total = lines.reduce((acc, line) => acc + line.product.price_eur * line.packs, 0);

  return (
    <section
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
        display: 'grid',
        gap: '1rem'
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Presupuesto actual</h2>
          <p style={{ margin: 0, color: '#475569' }}>Añade hasta cubrir ambos ojos o combina distintas opciones.</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={lines.length === 0}
          style={{
            padding: '0.45rem 0.85rem',
            borderRadius: '8px',
            border: '1px solid #ef4444',
            color: '#b91c1c',
            background: 'transparent',
            cursor: lines.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          Limpiar
        </button>
      </header>

      {lines.length === 0 ? (
        <p style={{ margin: 0, color: '#94a3b8' }}>Añade productos desde los resultados o el comparador para componer el presupuesto.</p>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {lines.map((line) => (
            <article
              key={line.createdAt}
              style={{
                display: 'grid',
                gap: '0.5rem',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                background: '#f8fafc'
              }}
            >
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <div>
                  <strong>{line.product.name}</strong>
                  <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                    {line.product.brand} · {line.product.pack_qty} LC · {formatCurrency(line.product.price_eur)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(line.createdAt)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#dc2626',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Quitar
                </button>
              </header>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <label style={{ color: '#475569', fontWeight: 500 }} htmlFor={`packs-${line.createdAt}`}>
                  Packs
                </label>
                <input
                  id={`packs-${line.createdAt}`}
                  type="number"
                  min={1}
                  max={10}
                  value={line.packs}
                  onChange={(event) => onUpdatePacks(line.createdAt, Number.parseInt(event.target.value, 10) || 1)}
                  style={{
                    width: '72px',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5f5'
                  }}
                />
                <span style={{ marginLeft: 'auto', fontWeight: 600 }}>
                  {formatCurrency(line.product.price_eur * line.packs)}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#1e293b', fontWeight: 600 }}>Total estimado</span>
        <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatCurrency(total)}</span>
      </footer>
    </section>
  );
}
