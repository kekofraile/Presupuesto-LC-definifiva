import { get, set, del } from 'idb-keyval';
import type { TarifaParseResult } from '../../logica/parse_tarifa';
import { AppConfig, BudgetLine, Product } from '../types';
import { fallbackProducts } from '../data/products';
import { defaultConfig } from '../data/defaultConfig';

const TARIFA_KEY = 'tarifa.dataset';
const BUDGET_KEY = 'tarifa.budget';
const CONFIG_KEY = 'tarifa.config';
const SESSION_KEY = 'tarifa.session';

function ensureUpper(input: string): string {
  return input.trim().toUpperCase();
}

function normaliseName(name: string, pack: number): string {
  const base = name.trim();
  if (base.match(/\d+\s*LC$/i)) {
    return base;
  }
  return `${base} ${pack}LC`;
}

function tarifaToProducts(tarifa: TarifaParseResult): Product[] {
  return tarifa.productos.map((item) => ({
    id: item.id,
    name: normaliseName(item.producto, item.pack),
    brand: ensureUpper(item.marca),
    geometry: item.tipo,
    modality: item.modalidad,
    pack_qty: item.pack,
    price_eur: item.precio,
    notes: item.notas
  }));
}

export async function loadTarifa(): Promise<TarifaParseResult | null> {
  const data = await get<TarifaParseResult | undefined>(TARIFA_KEY);
  return data ?? null;
}

export async function saveTarifa(tarifa: TarifaParseResult): Promise<void> {
  await set(TARIFA_KEY, tarifa);
}

export async function loadProducts(): Promise<Product[]> {
  const tarifa = await loadTarifa();
  return tarifa ? tarifaToProducts(tarifa) : fallbackProducts;
}

export async function loadBudget(): Promise<BudgetLine[]> {
  const data = await get<BudgetLine[] | undefined>(BUDGET_KEY);
  return data ?? [];
}

export async function saveBudget(lines: BudgetLine[]): Promise<void> {
  await set(BUDGET_KEY, lines);
}

export async function clearBudget(): Promise<void> {
  await del(BUDGET_KEY);
}

export async function loadConfig(): Promise<AppConfig> {
  const saved = await get<AppConfig | undefined>(CONFIG_KEY);
  return saved ?? defaultConfig;
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await set(CONFIG_KEY, config);
}

export async function setSessionAuthenticated(value: boolean): Promise<void> {
  if (value) {
    await set(SESSION_KEY, { authenticatedAt: Date.now() });
  } else {
    await del(SESSION_KEY);
  }
}

export async function isSessionAuthenticated(): Promise<boolean> {
  const data = await get<{ authenticatedAt: number } | undefined>(SESSION_KEY);
  return Boolean(data);
}

export async function resetStorage(): Promise<void> {
  await Promise.all([del(TARIFA_KEY), del(BUDGET_KEY), del(CONFIG_KEY), del(SESSION_KEY)]);
}
