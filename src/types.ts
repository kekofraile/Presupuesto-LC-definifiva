export type Geometry = 'esferica' | 'torica' | 'multifocal' | 'multifocal_torica' | 'color';

export type Modality = 'diaria' | 'semanal' | 'mensual' | 'trimestral' | 'semestral' | 'anual';

export interface Product {
  id: string;
  name: string;
  brand: string;
  family?: string;
  geometry: Geometry;
  modality: Modality;
  pack_qty: number;
  price_eur: number;
  material?: string;
  notes?: string;
}

export interface BudgetLine {
  product: Product;
  packs: number;
  eye: 'OD' | 'OI' | 'Ambos';
  createdAt: string;
}

export interface AppConfig {
  pinHash: string;
  pinHint?: string;
  tarifaVersion?: string;
  ultimaActualizacion?: string;
}
