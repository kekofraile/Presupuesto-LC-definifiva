import { read, utils } from 'xlsx';

export type ModalidadInterna =
  | 'diaria'
  | 'semanal'
  | 'mensual'
  | 'trimestral'
  | 'semestral'
  | 'anual';

export interface TarifaProducto {
  id: string;
  modalidad: ModalidadInterna;
  tipo: 'esferica' | 'torica' | 'multifocal' | 'multifocal_torica' | 'color';
  marca: string;
  producto: string;
  pack: number;
  precio: number;
  codigo: string;
  notas?: string;
}

export interface TarifaMetadata {
  anio?: number;
  fecha_carga?: string;
  fuente?: string;
}

export interface TarifaParseResult {
  metadata: TarifaMetadata;
  productos: TarifaProducto[];
}

type FileLike = File | Blob | ArrayBuffer;

const SHEET_MODALITY_MAPPING: Record<string, ModalidadInterna> = {
  DIARIAS: 'diaria',
  DIARIA: 'diaria',
  SEMANALES: 'semanal',
  SEMANAL: 'semanal',
  QUINCENALES: 'semanal',
  QUINCENAL: 'semanal',
  MENSUALES: 'mensual',
  MENSUAL: 'mensual',
  TRIMESTRALES: 'trimestral',
  TRIMESTRAL: 'trimestral',
  SEMESTRALES: 'semestral',
  SEMESTRAL: 'semestral',
  ANUALES: 'anual',
  ANUAL: 'anual'
};

const HEADER_ALIASES: Record<string, string> = {
  modalidad: 'modalidad',
  reemplazo: 'modalidad',
  formato: 'modalidad',
  type: 'tipo',
  tipo: 'tipo',
  geometria: 'tipo',
  marca: 'marca',
  fabricante: 'marca',
  brand: 'marca',
  descripcion: 'descripcion',
  descripcion_producto: 'descripcion',
  producto: 'descripcion',
  nombre: 'descripcion',
  pack: 'pack',
  cajas: 'pack',
  unidades: 'pack',
  pvp: 'precio',
  precio: 'precio',
  price: 'precio',
  codigo: 'codigo',
  sku: 'codigo',
  id: 'codigo',
  notas: 'notas',
  comentarios: 'notas'
};

function normaliseHeader(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9_ ]/g, '')
    .replace(/\s+/g, '_');
}

async function toArrayBuffer(file: FileLike): Promise<ArrayBuffer> {
  if (file instanceof ArrayBuffer) {
    return file;
  }

  if (typeof File !== 'undefined' && file instanceof File) {
    return file.arrayBuffer();
  }

  if (typeof Blob !== 'undefined' && file instanceof Blob) {
    return file.arrayBuffer();
  }

  throw new Error('Formato de archivo no soportado para parseo');
}

function ensureNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim().replace(/€/g, '').replace(/,/g, '.');
    const parsed = Number.parseFloat(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function ensurePack(value: unknown, descripcion?: string): number | undefined {
  const numeric = ensureNumber(value)?.valueOf();
  if (numeric) {
    return numeric;
  }
  if (typeof value === 'string') {
    const match = value.match(/(\d+)/);
    if (match) {
      return Number.parseInt(match[1], 10);
    }
  }
  if (descripcion) {
    const match = descripcion.match(/(\d+)(?=\s*LC|$)/i);
    if (match) {
      return Number.parseInt(match[1], 10);
    }
  }
  return undefined;
}

function normaliseTipo(value: string): TarifaProducto['tipo'] {
  const base = value.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
  if (base.includes('multifocal') && base.includes('toric')) return 'multifocal_torica';
  if (base.includes('multifocal')) return 'multifocal';
  if (base.includes('toric')) return 'torica';
  if (base.includes('color')) return 'color';
  return 'esferica';
}

function normaliseModalidad(value: string, fallback?: ModalidadInterna): ModalidadInterna | undefined {
  if (!value && fallback) return fallback;
  const key = value
    .toUpperCase()
    .normalize('NFD')
    .replace(/[^A-Z]/g, '');
  return SHEET_MODALITY_MAPPING[key] ?? fallback;
}

function buildProductoId(marca: string, descripcion: string, pack: number): string {
  const slug = `${marca}-${descripcion}-${pack}`
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10);
  return slug || `SKU${pack}`;
}

export async function parseTarifaFile(file: FileLike, metadata: TarifaMetadata = {}): Promise<TarifaParseResult> {
  const buffer = await toArrayBuffer(file);
  const workbook = read(buffer, { type: 'array', cellDates: false });

  const productos: TarifaProducto[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;

    const modalityFromSheet = normaliseModalidad(sheetName, undefined);

    const rows = utils.sheet_to_json<(string | number | null)[]>(sheet, {
      header: 1,
      raw: false,
      blankrows: false,
      defval: null
    });

    if (rows.length === 0) return;

    const headersRow = rows[0];
    const headers = headersRow.map((headerCell) => {
      if (typeof headerCell !== 'string') {
        return '';
      }
      const normalised = HEADER_ALIASES[normaliseHeader(headerCell)] ?? normaliseHeader(headerCell);
      return normalised;
    });

    const lastValues: Record<string, string> = {};

    rows.slice(1).forEach((row) => {
      const record: Record<string, unknown> = {};

      headers.forEach((headerKey, index) => {
        if (!headerKey) return;
        const cell = row[index];
        if (cell === null || cell === undefined || cell === '') {
          if (lastValues[headerKey]) {
            record[headerKey] = lastValues[headerKey];
          }
          return;
        }

        if (typeof cell === 'string') {
          const trimmed = cell.trim();
          record[headerKey] = trimmed;
          lastValues[headerKey] = trimmed;
        } else if (typeof cell === 'number') {
          record[headerKey] = cell;
          lastValues[headerKey] = String(cell);
        }
      });

      const descripcion = (record.descripcion ?? record.producto ?? record.nombre ?? '') as string;
      const marca = (record.marca ?? lastValues.marca ?? '').toString();
      if (!descripcion || !marca) {
        return;
      }

      const modalidad = normaliseModalidad(String(record.modalidad ?? ''), modalityFromSheet);
      if (!modalidad) {
        return;
      }

      const tipo = normaliseTipo(String(record.tipo ?? lastValues.tipo ?? 'esferica'));

      const precio = ensureNumber(record.precio ?? record.pvp);
      if (precio === undefined) {
        return;
      }

      const pack = ensurePack(record.pack ?? record.unidades, descripcion);
      if (!pack) {
        return;
      }

      const codigoBase = String(record.codigo ?? '').trim();
      const codigo = codigoBase || buildProductoId(marca, descripcion, pack);

      productos.push({
        id: codigo,
        codigo,
        marca,
        modalidad,
        producto: descripcion,
        tipo,
        pack,
        precio,
        notas: typeof record.notas === 'string' ? record.notas : undefined
      });
    });
  });

  if (productos.length === 0) {
    throw new Error('No se detectaron productos válidos en la tarifa. Verifica el formato del archivo.');
  }

  return {
    metadata: {
      ...metadata,
      fecha_carga: metadata.fecha_carga ?? new Date().toISOString(),
      fuente: metadata.fuente ?? (file instanceof File ? file.name : metadata.fuente)
    },
    productos
  };
}

export async function parseTarifaDesdeRuta(path: string, metadata: TarifaMetadata = {}): Promise<TarifaParseResult> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`No se pudo cargar el archivo de tarifa desde ${path}`);
  }
  const blob = await response.blob();
  return parseTarifaFile(blob, metadata);
}
