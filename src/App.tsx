import { useEffect, useMemo, useState } from 'react';
import type { TarifaParseResult } from '../logica/parse_tarifa';
import { fallbackProducts } from './data/products';
import { BudgetLine, Product } from './types';
import { Comparator } from './components/Comparator';
import { FilterPanel, FilterState } from './components/FilterPanel';
import { ProductList } from './components/ProductList';
import { formatCurrency, eurPerDayPair, formatModality } from './utils/pricing';
import { loadBudget, loadProducts, saveBudget, isSessionAuthenticated, loadTarifa } from './utils/storage';
import { LoginScreen } from './components/LoginScreen';
import { TariffUploader } from './components/TariffUploader';
import { BudgetPanel } from './components/BudgetPanel';
import { signOut } from './utils/auth';

const INITIAL_FILTERS: FilterState = {
  presbicia: false,
  astig075: false,
  modality: 'diaria',
  pack: 30
};

function computeGeometry(filters: FilterState): Product['geometry'] {
  if (filters.presbicia) {
    return filters.astig075 ? 'multifocal_torica' : 'multifocal';
  }
  return filters.astig075 ? 'torica' : 'esferica';
}

export default function App() {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [selectedComparisons, setSelectedComparisons] = useState<(string | null)[]>([null, null, null]);
  const [catalog, setCatalog] = useState<Product[]>(fallbackProducts);
  const [budget, setBudget] = useState<BudgetLine[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [tarifaMetadata, setTarifaMetadata] = useState<TarifaParseResult['metadata'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);

  const geometry = useMemo(() => computeGeometry(filters), [filters]);

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      try {
        const [auth, productsData, budgetLines, tarifa] = await Promise.all([
          isSessionAuthenticated(),
          loadProducts(),
          loadBudget(),
          loadTarifa()
        ]);
        if (!mounted) return;
        setAuthenticated(auth);
        setCatalog(productsData.length > 0 ? productsData : fallbackProducts);
        setBudget(budgetLines);
        setTarifaMetadata(tarifa?.metadata ?? null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    void bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    void saveBudget(budget);
  }, [budget, authenticated]);

  const modalityHasWeekly = useMemo(
    () => catalog.some((product) => product.modality === 'semanal' && product.geometry === geometry),
    [catalog, geometry]
  );

  const packOptions = useMemo(() => {
    const available = catalog
      .filter((product) => product.modality === filters.modality && product.geometry === geometry)
      .map((product) => product.pack_qty);
    const unique = Array.from(new Set(available)).sort((a, b) => a - b);
    return unique;
  }, [catalog, filters.modality, geometry]);

  const filteredProducts = useMemo(() => {
    return catalog.filter((product) => {
      if (product.geometry !== geometry) return false;
      if (product.modality !== filters.modality) return false;
      if (filters.pack && product.pack_qty !== filters.pack) return false;
      return true;
    });
  }, [catalog, filters.modality, filters.pack, geometry]);

  const smartEmpty =
    filteredProducts.length === 0 && geometry === 'multifocal_torica' && filters.modality === 'diaria';

  const smartEmptyAlternatives = useMemo(() => {
    if (!smartEmpty) return [] as Product[];
    return catalog.filter((product) => product.geometry === 'multifocal_torica' && product.modality === 'mensual');
  }, [catalog, smartEmpty]);

  const handleAddToComparator = (product: Product) => {
    setSelectedComparisons((current) => {
      const existing = current.findIndex((id) => id === product.id);
      if (existing !== -1) {
        return current;
      }
      const slot = current.findIndex((id) => id === null);
      if (slot === -1) {
        return current;
      }
      const next = [...current];
      next[slot] = product.id;
      return next;
    });
  };

  const handleFiltersChange = (nextFilters: FilterState) => {
    setFilters((current) => {
      if (current.modality !== nextFilters.modality) {
        const firstAvailablePack = catalog
          .filter(
            (product) =>
              product.modality === nextFilters.modality &&
              product.geometry === computeGeometry(nextFilters)
          )
          .map((product) => product.pack_qty)
          .sort((a, b) => a - b)[0];
        return { ...nextFilters, pack: firstAvailablePack ?? null };
      }
      return nextFilters;
    });
  };

  const handleAddToBudget = (product: Product) => {
    setBudget((current) => {
      const existingIndex = current.findIndex((line) => line.product.id === product.id);
      if (existingIndex !== -1) {
        const next = [...current];
        next[existingIndex] = {
          ...next[existingIndex],
          packs: next[existingIndex].packs + 1
        };
        return next;
      }
      return [
        ...current,
        {
          product,
          packs: 1,
          eye: 'Ambos',
          createdAt: `${product.id}-${Date.now()}`
        }
      ];
    });
  };

  const handleRemoveBudgetLine = (createdAt: string) => {
    setBudget((current) => current.filter((line) => line.createdAt !== createdAt));
  };

  const handleUpdatePacks = (createdAt: string, packs: number) => {
    if (packs < 1) return;
    setBudget((current) =>
      current.map((line) => (line.createdAt === createdAt ? { ...line, packs } : line))
    );
  };

  const handleResetBudget = () => {
    setBudget([]);
  };

  const handleTarifaLoaded = (productos: Product[], tarifa: TarifaParseResult) => {
    setCatalog(productos);
    setTarifaMetadata(tarifa.metadata);
    setFilters((current) => ({ ...current }));
    setShowUploader(false);
  };

  const handleLogout = async () => {
    await signOut();
    setAuthenticated(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc' }}>
        <span style={{ color: '#2563eb', fontWeight: 600 }}>Cargando datos locales…</span>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginScreen onAuthenticated={() => setAuthenticated(true)} />;
  }

  return (
    <div className="app-container" style={{ padding: '2.5rem 1.5rem', display: 'grid', gap: '2rem' }}>
      <header style={{ display: 'grid', gap: '0.75rem', maxWidth: '980px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2.5rem', color: '#0f172a' }}>Presupuesto de lentes de contacto</h1>
            <p style={{ margin: 0, color: '#475569', fontSize: '1.05rem' }}>
              Trabaja offline con la última tarifa importada, compara modalidades y crea presupuestos listos para compartir.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setShowUploader((state) => !state)}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: '10px',
                border: '1px solid #2563eb',
                background: 'rgba(37, 99, 235, 0.08)',
                color: '#1d4ed8',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {showUploader ? 'Ocultar carga' : 'Actualizar tarifa'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: '10px',
                border: '1px solid #ef4444',
                background: 'transparent',
                color: '#b91c1c',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Salir
            </button>
          </div>
        </div>

        {tarifaMetadata && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', color: '#0f172a' }}>
            <span style={{ background: '#e0f2fe', padding: '0.35rem 0.75rem', borderRadius: '999px' }}>
              Tarifa {tarifaMetadata.anio ?? 'actual'}
            </span>
            {tarifaMetadata.fecha_carga && (
              <span style={{ background: '#ede9fe', padding: '0.35rem 0.75rem', borderRadius: '999px' }}>
                Cargada el {new Date(tarifaMetadata.fecha_carga).toLocaleDateString('es-ES')}
              </span>
            )}
            {tarifaMetadata.fuente && (
              <span style={{ background: '#f1f5f9', padding: '0.35rem 0.75rem', borderRadius: '999px' }}>
                Archivo: {tarifaMetadata.fuente}
              </span>
            )}
          </div>
        )}
      </header>

      {showUploader && <TariffUploader onTarifaLoaded={handleTarifaLoaded} />}

      <FilterPanel
        filters={filters}
        onChange={handleFiltersChange}
        packOptions={packOptions}
        hasSemanal={modalityHasWeekly}
      />

      <section style={{ display: 'grid', gap: '1.5rem' }}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.65rem' }}>Resultados</h2>
          <p style={{ margin: 0, color: '#64748b' }}>
            Mostramos referencias por {geometry.replace('_', ' ')} ordenadas por €/día. Añade hasta tres productos al comparador o directamente al presupuesto.
          </p>
        </header>

        {filteredProducts.length > 0 && (
          <ProductList
            products={filteredProducts}
            onAddToCompare={handleAddToComparator}
            onAddToBudget={handleAddToBudget}
          />
        )}

        {filteredProducts.length === 0 && !smartEmpty && (
          <div
            style={{
              background: '#fff1f2',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              border: '1px solid #fecdd3'
            }}
          >
            <strong style={{ color: '#be123c' }}>Sin resultados:</strong>{' '}
            Ajusta el pack o el formato para encontrar una alternativa disponible.
          </div>
        )}

        {smartEmpty && (
          <div
            style={{
              background: '#eff6ff',
              borderRadius: '12px',
              padding: '1.1rem 1.35rem',
              border: '1px solid #bfdbfe',
              display: 'grid',
              gap: '0.75rem'
            }}
          >
            <div style={{ color: '#1d4ed8', fontWeight: 600 }}>
              No hay opciones Diarias Multifocal-Tóricas. Recomendamos estas Mensuales MF-Toric:
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#1e293b' }}>
              {smartEmptyAlternatives.map((product) => (
                <li key={product.id}>
                  {product.name} · {product.pack_qty} LC · {formatModality(product.modality)} ·
                  {` ${formatCurrency(product.price_eur)} (${eurPerDayPair(product).toFixed(2)} €/día)`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <Comparator
        products={catalog}
        selectedIds={selectedComparisons}
        onChange={(index, productId) => {
          setSelectedComparisons((current) => {
            const next = [...current];
            next[index] = productId;
            return next;
          });
        }}
        onAddToBudget={handleAddToBudget}
      />

      <BudgetPanel
        lines={budget}
        onRemove={handleRemoveBudgetLine}
        onUpdatePacks={handleUpdatePacks}
        onReset={handleResetBudget}
      />
    </div>
  );
}
