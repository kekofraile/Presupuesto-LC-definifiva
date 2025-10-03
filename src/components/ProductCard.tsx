import { Product } from '../types';
import { BRAND_COLORS } from '../data/products';
import { daysCovered, eurPerDayPair, formatCurrency, formatModality } from '../utils/pricing';

interface ProductCardProps {
  product: Product;
  highlight?: boolean;
  onAddToCompare: (product: Product) => void;
  onAddToBudget: (product: Product) => void;
}

export function ProductCard({ product, highlight = false, onAddToCompare, onAddToBudget }: ProductCardProps) {
  const eurDay = eurPerDayPair(product);
  const eurMonth = eurDay * 30;
  const eurYear = eurDay * 365;
  const chipColor = BRAND_COLORS[product.brand] ?? '#1f2937';

  return (
    <article
      style={{
        background: '#ffffff',
        borderRadius: '18px',
        padding: '1.5rem',
        display: 'grid',
        gap: '1rem',
        border: highlight ? '2px solid #22c55e' : '1px solid #e2e8f0',
        boxShadow: highlight ? '0 20px 35px rgba(34, 197, 94, 0.25)' : '0 12px 24px rgba(15, 23, 42, 0.12)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}
          >
            <span
              style={{
                background: chipColor,
                color: '#fff',
                padding: '0.25rem 0.65rem',
                borderRadius: '999px',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              {product.brand}
            </span>
            {product.notes?.toLowerCase().includes('exclusiva') && (
              <span
                style={{
                  background: '#f97316',
                  color: '#fff',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '999px',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                Exclusiva Todo Óptica
              </span>
            )}
            {highlight && (
              <span
                style={{
                  background: '#22c55e',
                  color: '#fff',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '999px',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                Mejor valor
              </span>
            )}
          </div>
          <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.35rem' }}>{product.name}</h3>
          <p style={{ margin: 0, color: '#475569' }}>
            {formatModality(product.modality)} · {product.pack_qty} LC · {formatCurrency(product.price_eur)}
          </p>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b' }}>Ciclo cubierto: {Math.round(daysCovered(product))} días</p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem'
        }}
      >
        <Metric label="€/día (ambos ojos)" value={formatCurrency(eurDay)} emphasis />
        <Metric label="€/mes (30d)" value={formatCurrency(eurMonth)} />
        <Metric label="€/año" value={formatCurrency(eurYear)} />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => onAddToCompare(product)}
          style={{
            padding: '0.6rem 1.3rem',
            borderRadius: '10px',
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 12px 24px rgba(37, 99, 235, 0.25)'
          }}
        >
          Añadir al comparador
        </button>
        <button
          type="button"
          onClick={() => onAddToBudget(product)}
          style={{
            padding: '0.6rem 1.3rem',
            borderRadius: '10px',
            border: '1px solid #22c55e',
            background: 'rgba(34, 197, 94, 0.12)',
            color: '#15803d',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Añadir al presupuesto
        </button>
      </div>
    </article>
  );
}

interface MetricProps {
  label: string;
  value: string;
  emphasis?: boolean;
}

function Metric({ label, value, emphasis = false }: MetricProps) {
  return (
    <div
      style={{
        background: emphasis ? 'rgba(37, 99, 235, 0.08)' : '#f8fafc',
        borderRadius: '12px',
        padding: '0.75rem',
        display: 'grid',
        gap: '0.25rem',
        border: emphasis ? '1px solid rgba(37, 99, 235, 0.25)' : '1px solid rgba(148, 163, 184, 0.2)'
      }}
    >
      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{label}</span>
      <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{value}</span>
    </div>
  );
}
