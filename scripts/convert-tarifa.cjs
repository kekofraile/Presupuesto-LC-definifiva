#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const SHEET_MODALITY_MAPPING = {
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

const HEADER_ALIASES = {
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

const DEFAULT_HEADERS = [
  'modalidad',
  'tipo',
  'marca',
  'descripcion',
  'precio',
  'codigo',
  'notas'
];

const BRAND_ALIASES = {
  'JHONSON': 'JOHNSON & JOHNSON',
  'JOHNSON': 'JOHNSON & JOHNSON',
  'JOHNSON & JOHNSON': 'JOHNSON & JOHNSON',
  'COOPER': 'COOPERVISION',
  'COOPERVISION': 'COOPERVISION',
  "MARK' ENNOVY": "MARK'ENNOVY",
  "MARK'ENNOVY": "MARK'ENNOVY",
  'OTROS': 'OTHERS',
  'OTRAS': 'OTHERS',
  'OTHERS': 'OTHERS'
};

function normalizeHeader(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9_ ]/g, '')
    .replace(/\s+/g, '_');
}

function normalizeModalidad(value, fallback) {
  if (!value && fallback) return fallback;
  const key = value
    .toUpperCase()
    .normalize('NFD')
    .replace(/[^A-Z]/g, '');
  return SHEET_MODALITY_MAPPING[key] || fallback;
}

function normalizeTipo(value) {
  const base = (value || '').toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
  if (base.includes('multifocal') && base.includes('toric')) return 'multifocal_torica';
  if (base.includes('multifocal')) return 'multifocal';
  if (base.includes('toric')) return 'torica';
  if (base.includes('color')) return 'color';
  return 'esferica';
}

function ensureNumber(value) {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.trim().replace(/€/g, '').replace(/,/g, '.'));
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function ensurePack(value, descripcion) {
  const num = ensureNumber(value);
  if (num) return num;
  if (typeof value === 'string') {
    const match = value.match(/(\d+)/);
    if (match) return Number.parseInt(match[1], 10);
  }
  if (descripcion) {
    const match = descripcion.match(/(\d+)(?=\s*LC|$)/i);
    if (match) return Number.parseInt(match[1], 10);
  }
  return undefined;
}

function buildProductoId(marca, descripcion, pack) {
  const slug = `${marca}-${descripcion}-${pack}`
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);
  return slug || `SKU${pack}`;
}

function parseWorkbook(filePath) {
  const workbook = XLSX.readFile(filePath, { cellDates: false });
  const productos = [];

  const usedIds = new Set();

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;

    const modalityFromSheet = normalizeModalidad(sheetName, undefined);
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      blankrows: false,
      defval: null
    });
    if (rows.length === 0) return;

    const headersRow = rows[0];
    const headers = headersRow.map((cell, index) => {
      if (typeof cell === 'string' && cell.trim() !== '') {
        const normalised = HEADER_ALIASES[normalizeHeader(cell)] || normalizeHeader(cell);
        return normalised;
      }
      return DEFAULT_HEADERS[index] || '';
    });

    const lastValues = {};

    rows.slice(1).forEach((row) => {
      const record = {};

      headers.forEach((key, index) => {
        if (!key) return;
        const cell = row[index];
        if (cell === null || cell === undefined || cell === '') {
          if (lastValues[key]) {
            record[key] = lastValues[key];
          }
          return;
        }
        if (typeof cell === 'string') {
          const trimmed = cell.trim();
          record[key] = trimmed;
          lastValues[key] = trimmed;
        } else if (typeof cell === 'number') {
          record[key] = cell;
          lastValues[key] = String(cell);
        }
      });

      const descripcion = (record.descripcion || record.producto || record.nombre || '').toString().trim();
      const rawMarca = (record.marca || lastValues.marca || '').toString().trim();
      const marca = (BRAND_ALIASES[rawMarca.toUpperCase()] || rawMarca).trim();
      if (!descripcion || !marca) return;

      const modalidad = normalizeModalidad(record.modalidad ? record.modalidad.toString() : '', modalityFromSheet);
      if (!modalidad) return;

      const tipo = normalizeTipo(record.tipo || lastValues.tipo || 'esferica');
      const precio = ensureNumber(record.precio || record.pvp);
      if (precio === undefined) return;

      const pack = ensurePack(record.pack || record.unidades, descripcion);
      if (!pack) return;

      const codigoBase = (record.codigo || '').toString().trim();
      let codigo = codigoBase || buildProductoId(marca, descripcion, pack);
      if (!codigo) return;
      let finalId = codigo;
      let counter = 1;
      while (usedIds.has(finalId)) {
        counter += 1;
        finalId = `${codigo}-${counter}`;
      }
      usedIds.add(finalId);

      productos.push({
        id: finalId,
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
    throw new Error('No se detectaron productos válidos en la tarifa.');
  }

  return {
    metadata: {
      anio: 2024,
      fecha_carga: new Date().toISOString(),
      fuente: path.basename(filePath)
    },
    productos
  };
}

function loadBrandColors() {
  const filePath = path.resolve('src', 'data', 'products.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/export const BRAND_COLORS:[^=]+= ([\s\S]*?);\s*$/m);
  if (match) {
    return eval('(' + match[1] + ')');
  }
  return {};
}

function writeOutputs(tarifa, targetJson, fallbackTs) {
  fs.writeFileSync(targetJson, JSON.stringify(tarifa, null, 2));

  const products = tarifa.productos.map((item) => ({
    id: item.id,
    name: item.producto.trim(),
    brand: item.marca.trim().toUpperCase(),
    geometry: item.tipo,
    modality: item.modalidad,
    pack_qty: item.pack,
    price_eur: item.precio,
    notes: item.notas
  }));

  const brandColors = loadBrandColors();

  const content = `import { Product } from '../types';

export const fallbackProducts: Product[] = ${JSON.stringify(products, null, 2)};

export const BRAND_COLORS: Record<string, string> = ${JSON.stringify(brandColors, null, 2)};
`;

  fs.writeFileSync(fallbackTs, content);
}

function main() {
  const [, , inputPath] = process.argv;
  if (!inputPath) {
    console.error('Uso: node scripts/convert-tarifa.js <ruta_excel>');
    process.exit(1);
  }
  const absInput = path.resolve(inputPath);
  const tarifa = parseWorkbook(absInput);
  const targetJson = path.resolve('datos', 'tarifa.json');
  const fallbackTs = path.resolve('src', 'data', 'products.ts');

  writeOutputs(tarifa, targetJson, fallbackTs);
  console.log(`Tarifa procesada: ${tarifa.productos.length} productos`);
  console.log(`Actualizado ${targetJson} y ${fallbackTs}`);
}

main();
