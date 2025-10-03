import { useMemo } from 'react';
import { Product } from '../types';
import { BRAND_COLORS } from '../data/products';
import { eurPerDayPair, formatCurrency, formatModality, percentageDifference } from '../utils/pricing';

interface ComparatorProps {
  products: Product[];
  selectedIds: (string | null)[];
  onChange: (index: number, productId: string | null) => void;
  onAddToBudget?: (product: Product) => void;
}

export function Comparator({ products, selectedIds, onChange, onAddToBudget }: ComparatorProps) {
  const selectedProducts = selectedIds
    .map((id) => (id ? products.find((product) => product.id === id) ?? null : null))
    .filter(Boolean) as Product[];

  const sorted = [...selectedProducts].sort((a, b) => eurPerDayPair(a) - eurPerDayPair(b));
  const best = sorted[0];

  const suggestions = useMemo(() => {
    const referenceId = selectedIds[0];
    if (!referenceId) return [];
    const reference = products.find((item) => item.id === referenceId);
    if (!reference) return [];
    const sameBrand = products.filter((item) => item.brand === reference.brand && item.id !== reference.id);
    const alternativeModalities = sameBrand.filter((item) => item.modality !== reference.modality);
    const rankedAlternatives = [...alternativeModalities].sort(
      (a, b) => eurPerDayPair(a) - eurPerDayPair(b)
    );
    if (rankedAlternatives.length >= 3) {
      return rankedAlternatives.slice(0, 3);
    }

    const crossBrand = products
      .filter((item) => item.brand !== reference.brand)
      .sort((a, b) => Math.abs(eurPerDayPair(a) - eurPerDayPair(reference)) - Math.abs(eurPerDayPair(b) - eurPerDayPair(reference)));

    return [...rankedAlternatives, ...crossBrand].slice(0, 3);
  }, [products, selectedIds]);

  const allOptions = useMemo(
    () =>
      [...products]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((product) => ({ value: product.id, label: `${product.name} · ${formatModality(product.modality)} · ${product.pack_qty} LC` })),
    [products]
  );

  return (
    <section
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
        display: 'grid',
        gap: '1.5rem'
      }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Comparador de formatos</h2>
        <p style={{ margin: 0, color: '#475569' }}>
          Selecciona hasta tres referencias para evaluar €/día, €/mes y €/año. Ordenamos automáticamente por la
          mejor relación coste/uso.
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem'
        }}
      >
        {selectedIds.map((id, index) => (
          <div
            key={index}
            style={{
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '1rem',
              display: 'grid',
              gap: '0.5rem',
              border: '1px solid rgba(148, 163, 184, 0.25)'
            }}
          >
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>
              Referencia {String.fromCharCode(65 + index)}
            </span>
            <select
              value={id ?? ''}
              onChange={(event) => onChange(index, event.target.value || null)}
              style={{
                width: '100%',
                padding: '0.55rem 0.65rem',
                borderRadius: '10px',
                border: '1px solid #cbd5f5',
                fontSize: '0.9rem'
              }}
            >
              <option value="">Selecciona producto…</option>
              {allOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {id && (
              <button
                type="button"
                onClick={() => onChange(index, null)}
                style={{
                  justifySelf: 'flex-start',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#e11d48',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                Quitar
              </button>
            )}
          </div>
        ))}
      </div>

      {suggestions.length > 0 && suggestions.length <= 3 && selectedIds.some((id) => !id) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            alignItems: 'center'
          }}
        >
          <span style={{ fontWeight: 600, color: '#0f172a' }}>Sugerencias rápidas:</span>
          {suggestions.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => {
                const emptySlot = selectedIds.findIndex((value) => value === null);
                if (emptySlot !== -1) {
                  onChange(emptySlot, product.id);
                }
              }}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '999px',
                border: '1px solid rgba(37, 99, 235, 0.4)',
                background: 'rgba(37, 99, 235, 0.08)',
                color: '#1d4ed8',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {product.name}
            </button>
          ))}
        </div>
      )}

      {sorted.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem'
          }}
        >
          {sorted.map((product) => {
            const eurDay = eurPerDayPair(product);
            const eurMonth = eurDay * 30;
            const eurYear = eurDay * 365;
            const isBest = best?.id === product.id;
            const diff = best ? percentageDifference(eurPerDayPair(best), eurDay) : 0;
            const chipColor = BRAND_COLORS[product.brand] ?? '#1f2937';

            return (
              <div
                key={product.id}
                style={{
                  borderRadius: '16px',
                  padding: '1.1rem',
                  border: isBest ? '2px solid #22c55e' : '1px solid rgba(148, 163, 184, 0.35)',
                  background: '#fff',
                  boxShadow: isBest ? '0 20px 35px rgba(34, 197, 94, 0.25)' : '0 12px 24px rgba(15, 23, 42, 0.1)',
                  display: 'grid',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      background: chipColor,
                      color: '#fff',
                      padding: '0.2rem 0.6rem',
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
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        fontWeight: 600,
                        fontSize: '0.8rem'
                      }}
                    >
                      Exclusiva Todo Óptica
                    </span>
                  )}
                  {isBest && (
                    <span
                      style={{
                        background: '#22c55e',
                        color: '#fff',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        fontWeight: 600,
                        fontSize: '0.8rem'
                      }}
                    >
                      Mejor valor
                    </span>
                  )}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.15rem' }}>{product.name}</h3>
                  <p style={{ margin: 0, color: '#475569' }}>
                    {formatModality(product.modality)} · {product.pack_qty} LC · {formatCurrency(product.price_eur)}
                  </p>
                </div>
                <div style={{ display: 'grid', gap: '0.35rem' }}>
                  <ComparisonMetric label="€/día (par)" value={formatCurrency(eurDay)} highlight={isBest} />
                  <ComparisonMetric label="€/mes (30d)" value={formatCurrency(eurMonth)} />
                  <ComparisonMetric label="€/año" value={formatCurrency(eurYear)} />
                </div>
                {!isBest && diff > 0 && (
                  <div style={{ color: '#dc2626', fontWeight: 600 }}>
                    +{diff.toFixed(0)}% vs mejor valor
                  </div>
                )}
                {onAddToBudget && (
                  <button
                    type="button"
                    onClick={() => onAddToBudget(product)}
                    style={{
                      padding: '0.5rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid #2563eb',
                      background: 'rgba(37, 99, 235, 0.1)',
                      color: '#1d4ed8',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Añadir al presupuesto
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ margin: 0, color: '#94a3b8' }}>
          Añade al menos una referencia para iniciar la comparativa.
        </p>
      )}
    </section>
  );
}

interface ComparisonMetricProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function ComparisonMetric({ label, value, highlight = false }: ComparisonMetricProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: highlight ? 'rgba(34, 197, 94, 0.12)' : '#f8fafc',
        padding: '0.45rem 0.65rem',
        borderRadius: '8px',
        border: highlight ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(148, 163, 184, 0.2)'
      }}
    >
      <span style={{ fontSize: '0.85rem', color: '#475569' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
