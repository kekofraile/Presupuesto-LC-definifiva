import { Modality, Product } from '../types';

export const REPLACEMENT_DAYS: Record<Modality, number> = {
  diaria: 1,
  // En tarifas semanales se manejan como quincenales (12/27 LC ≈ 14 días por lente)
  semanal: 14,
  mensual: 30,
  trimestral: 90,
  semestral: 180,
  anual: 365
};

export function daysCovered(product: Product): number {
  const replacement = REPLACEMENT_DAYS[product.modality];
  return (product.pack_qty / 2) * replacement;
}

export function eurPerDayPair(product: Product): number {
  return product.price_eur / daysCovered(product);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(value);
}

export function formatModality(modality: Product['modality']): string {
  switch (modality) {
    case 'diaria':
      return 'Diaria';
    case 'semanal':
      return 'Semanal';
    case 'mensual':
      return 'Mensual';
    case 'trimestral':
      return 'Trimestral';
    case 'semestral':
      return 'Semestral';
    case 'anual':
      return 'Anual';
    default:
      return modality;
  }
}

export function percentageDifference(base: number, compare: number): number {
  if (base === 0) return 0;
  return ((compare - base) / base) * 100;
}
