import { ChangeEvent, useState } from 'react';
import type { TarifaParseResult } from '../../logica/parse_tarifa';
import { parseTarifaFile } from '../../logica/parse_tarifa';
import { Product } from '../types';
import { saveTarifa, loadProducts } from '../utils/storage';

interface TariffUploaderProps {
  onTarifaLoaded: (productos: Product[], tarifa: TarifaParseResult) => void;
}

export function TariffUploader({ onTarifaLoaded }: TariffUploaderProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!event.target.files?.[0]) return;
    const selected = event.target.files[0];
    setFile(selected);
    setFileName(selected.name);
    setStatus(null);
    setError(null);
  };

  const handleImport = async () => {
    if (!file) {
      setError('Selecciona un archivo Excel o CSV antes de importar.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const parsed = await parseTarifaFile(file, { fuente: file.name });
      await saveTarifa(parsed);
      const productos = await loadProducts();
      onTarifaLoaded(productos, parsed);
      setStatus('Tarifa importada correctamente.');
    } catch (importError) {
      const message = importError instanceof Error ? importError.message : 'Error desconocido al importar tarifa.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '1.75rem',
        boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)',
        display: 'grid',
        gap: '1.25rem'
      }}
    >
      <header style={{ display: 'grid', gap: '0.35rem' }}>
        <h2 style={{ margin: 0 }}>Actualizar tarifa</h2>
        <p style={{ margin: 0, color: '#475569' }}>
          Importa el fichero Excel/CSV con las referencias vigentes. El archivo se almacenará en el dispositivo para su uso offline.
        </p>
      </header>

      <input
        id="tarifa-file-input"
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        disabled={loading}
      />

      {fileName && <span style={{ color: '#1d4ed8' }}>Archivo seleccionado: {fileName}</span>}

      <button
        type="button"
        onClick={handleImport}
        disabled={loading}
        style={{
          justifySelf: 'flex-start',
          padding: '0.75rem 1.2rem',
          borderRadius: '12px',
          border: 'none',
          background: '#15803d',
          color: '#fff',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Importando…' : 'Cargar tarifa'}
      </button>

      {status && (
        <div
          style={{
            background: '#dcfce7',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            color: '#166534'
          }}
        >
          {status}
        </div>
      )}

      {error && (
        <div
          style={{
            background: '#fee2e2',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            color: '#b91c1c'
          }}
        >
          {error}
        </div>
      )}
    </section>
  );
}
