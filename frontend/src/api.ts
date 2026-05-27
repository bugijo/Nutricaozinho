// Cliente HTTP da API do Nutriçãozinho.
// - VITE_USE_MOCK=true  -> usa dados falsos em memória (preview/demonstração, sem backend).
// - VITE_API_URL=...    -> base da API em produção (ex: https://api.exemplo.com). Padrão: /api (proxy do Vite em dev).
import { mockApi } from './mock/mockApi';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const BASE = import.meta.env.VITE_API_URL || '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erro ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

const realApi = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: (path: string) => request<void>(path, { method: 'DELETE' }),
};

export const api = USE_MOCK ? mockApi : realApi;

// ---- Tipos compartilhados (espelham o backend) ----
export type Category = 'PROTEIN' | 'CARB' | 'FIBER' | 'FAT' | 'SUPPLEMENT' | 'OTHER';

export interface Ingredient {
  id: string;
  name: string;
  category: Category;
  purchasePrice: string;
  purchaseWeightGrams: string;
  kcalPer100g: string;
  proteinPer100g: string;
  fiberPer100g: string;
  carbPer100g: string;
  fatPer100g: string;
  active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  pets?: Pet[];
}

export interface Pet {
  id: string;
  name: string;
  weightKg: string;
  activityFactor: string;
  customerId: string;
}

export interface Diet {
  id: string;
  name: string;
  petId: string;
  proteinPercent: string;
  fiberPercent: string;
  carbPercent: string;
  pet?: Pet;
}

export interface RecipeResult {
  nemKcalPerDay: number;
  dailyGramsTotal: number;
  ingredients: { ingredientId: string; name: string; gramsPerDay: number; kcalPerDay: number }[];
}

export interface Batch {
  id: string;
  dietId: string;
  petId: string;
  packageCount: number;
  packageWeightGrams: string;
  plannedDate: string;
  daysOfFood?: string;
  pet?: Pet;
  diet?: Diet;
}

export interface KitchenSheet {
  batchId: string;
  petName: string;
  customerName: string;
  packageCount: number;
  packageWeightGrams: number;
  totalGrams: number;
  daysOfFood: number | null;
  ingredients: { name: string; gramsTotal: number }[];
}

export interface Setting {
  laborCostPerHour: string;
  packagingUnitCost: string;
  defaultMarginPercent: string;
  reminderBufferDays: number;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  PROTEIN: 'Proteína',
  CARB: 'Carboidrato',
  FIBER: 'Fibra',
  FAT: 'Gordura',
  SUPPLEMENT: 'Suplemento',
  OTHER: 'Outro',
};
