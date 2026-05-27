// Mock em memória do backend, para o frontend rodar sem API (preview/demonstração).
// Ativado quando VITE_USE_MOCK === 'true'. Replica os endpoints que a interface usa,
// usando o mesmo motor de cálculo (./calc).

import {
  buildDailyRecipe,
  scaleRecipeToBatch,
  pricePerGram,
  calculatePricing,
  type MacroRole,
  type RecipeIngredientInput,
} from './calc';

type Category = MacroRole;

interface Ingredient {
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
interface Customer { id: string; name: string; phone?: string; email?: string; notes?: string }
interface Pet { id: string; name: string; weightKg: string; activityFactor: string; customerId: string }
interface DietItem { ingredientId: string; role: Category; shareWithinGroup: number }
interface Diet {
  id: string; name: string; petId: string;
  proteinPercent: string; fiberPercent: string; carbPercent: string; items: DietItem[];
}
interface BatchItem { ingredientId: string; gramsTotal: number; costTotal: number }
interface Batch {
  id: string; dietId: string; petId: string; packageCount: number; packageWeightGrams: string;
  plannedDate: string; startConsumptionDate?: string; daysOfFood?: string; createdAt: string; items: BatchItem[];
}
interface Pricing {
  batchId: string; ingredientCost: string; packagingUnitCost: string; packagingCost: string;
  laborHours: string; laborCostPerHour: string; laborCost: string; totalCost: string;
  marginPercent: string; suggestedPrice: string; profit: string;
}
interface Alert {
  id: string; batchId: string; customerId: string; reminderDate: string; status: string; message?: string;
}
interface Setting {
  laborCostPerHour: string; packagingUnitCost: string; defaultMarginPercent: string; reminderBufferDays: number;
}

const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? 'id-' + Math.random().toString(36).slice(2) + Date.now());
const s = (n: unknown) => String(n);
const num = (v: unknown) => Number(v);

// ---------- Estado em memória (com dados de exemplo) ----------
const db = {
  ingredients: [] as Ingredient[],
  customers: [] as Customer[],
  pets: [] as Pet[],
  diets: [] as Diet[],
  batches: [] as Batch[],
  pricings: [] as Pricing[],
  alerts: [] as Alert[],
  settings: { laborCostPerHour: '20', packagingUnitCost: '1.5', defaultMarginPercent: '30', reminderBufferDays: 5 } as Setting,
};

function seed() {
  const frango: Ingredient = { id: uid(), name: 'Frango', category: 'PROTEIN', purchasePrice: '20', purchaseWeightGrams: '1000', kcalPer100g: '160', proteinPer100g: '27', fiberPer100g: '0', carbPer100g: '0', fatPer100g: '5', active: true };
  const abobora: Ingredient = { id: uid(), name: 'Abóbora', category: 'FIBER', purchasePrice: '5', purchaseWeightGrams: '1000', kcalPer100g: '40', proteinPer100g: '1', fiberPer100g: '3', carbPer100g: '8', fatPer100g: '0', active: true };
  const batata: Ingredient = { id: uid(), name: 'Batata-doce', category: 'CARB', purchasePrice: '6', purchaseWeightGrams: '1000', kcalPer100g: '80', proteinPer100g: '2', fiberPer100g: '2', carbPer100g: '18', fatPer100g: '0', active: true };
  db.ingredients.push(frango, abobora, batata);

  const maria: Customer = { id: uid(), name: 'Maria Silva', phone: '(11) 90000-0000' };
  db.customers.push(maria);
  const chloe: Pet = { id: uid(), name: 'Chloe', weightKg: '10', activityFactor: '1.6', customerId: maria.id };
  db.pets.push(chloe);

  db.diets.push({
    id: uid(), name: 'Dieta da Chloe', petId: chloe.id,
    proteinPercent: '35', fiberPercent: '30', carbPercent: '30',
    items: [
      { ingredientId: frango.id, role: 'PROTEIN', shareWithinGroup: 1 },
      { ingredientId: abobora.id, role: 'FIBER', shareWithinGroup: 1 },
      { ingredientId: batata.id, role: 'CARB', shareWithinGroup: 1 },
    ],
  });
}
seed();

// ---------- Helpers de domínio ----------
const ppgOf = (ing: Ingredient) => pricePerGram(num(ing.purchasePrice), num(ing.purchaseWeightGrams));
const findIng = (id: string) => db.ingredients.find((i) => i.id === id);

function dietWithRelations(d: Diet) {
  const pet = db.pets.find((p) => p.id === d.petId);
  return {
    ...d,
    pet,
    items: d.items.map((it) => ({ ...it, ingredient: findIng(it.ingredientId) })),
  };
}

function recipeInputs(d: Diet): RecipeIngredientInput[] {
  return d.items.map((it) => {
    const ing = findIng(it.ingredientId)!;
    return {
      ingredientId: it.ingredientId,
      name: ing.name,
      role: it.role,
      kcalPer100g: num(ing.kcalPer100g),
      shareWithinGroup: it.shareWithinGroup,
      pricePerGram: ppgOf(ing),
    };
  });
}

function previewDiet(dietId: string) {
  const d = db.diets.find((x) => x.id === dietId);
  if (!d) throw httpErr(404, 'Dieta não encontrada.');
  const pet = db.pets.find((p) => p.id === d.petId)!;
  return buildDailyRecipe(num(pet.weightKg), num(pet.activityFactor),
    { proteinPercent: num(d.proteinPercent), fiberPercent: num(d.fiberPercent), carbPercent: num(d.carbPercent) },
    recipeInputs(d));
}

function httpErr(status: number, msg: string) {
  const e = new Error(msg) as Error & { status?: number };
  e.status = status;
  return e;
}

// ---------- Roteamento ----------
async function handle(method: string, path: string, body?: any): Promise<any> {
  const [rawPath, query] = path.split('?');
  const params = new URLSearchParams(query ?? '');
  const seg = rawPath.split('/').filter(Boolean); // ex: ['ingredients','abc']
  const r = seg[0];
  const id = seg[1];
  const sub = seg[2];

  // ----- ingredients -----
  if (r === 'ingredients') {
    if (method === 'GET' && !id) return db.ingredients.filter((i) => i.active);
    if (method === 'GET' && id) return findIng(id) ?? notFound();
    if (method === 'POST') {
      const ing: Ingredient = {
        id: uid(), name: body.name, category: body.category,
        purchasePrice: s(body.purchasePrice), purchaseWeightGrams: s(body.purchaseWeightGrams),
        kcalPer100g: s(body.kcalPer100g), proteinPer100g: s(body.proteinPer100g),
        fiberPer100g: s(body.fiberPer100g), carbPer100g: s(body.carbPer100g),
        fatPer100g: s(body.fatPer100g ?? 0), active: true,
      };
      db.ingredients.push(ing); return ing;
    }
    if (method === 'PUT') {
      const ing = findIng(id); if (!ing) return notFound();
      Object.assign(ing, Object.fromEntries(Object.entries(body).map(([k, v]) => [k, typeof v === 'number' ? s(v) : v])));
      return ing;
    }
    if (method === 'DELETE') { const ing = findIng(id); if (!ing) return notFound(); ing.active = false; return undefined; }
  }

  // ----- customers -----
  if (r === 'customers') {
    if (method === 'GET' && !id)
      return db.customers.map((c) => ({ ...c, pets: db.pets.filter((p) => p.customerId === c.id) }));
    if (method === 'GET' && id) {
      const c = db.customers.find((x) => x.id === id); if (!c) return notFound();
      return { ...c, pets: db.pets.filter((p) => p.customerId === c.id) };
    }
    if (method === 'POST') { const c: Customer = { id: uid(), name: body.name, phone: body.phone, email: body.email, notes: body.notes }; db.customers.push(c); return c; }
    if (method === 'PUT') { const c = db.customers.find((x) => x.id === id); if (!c) return notFound(); Object.assign(c, body); return c; }
    if (method === 'DELETE') {
      if (db.pets.some((p) => p.customerId === id)) throw httpErr(409, 'Não foi possível excluir: este cliente possui pets cadastrados.');
      db.customers = db.customers.filter((x) => x.id !== id); return undefined;
    }
  }

  // ----- pets -----
  if (r === 'pets') {
    if (method === 'GET' && !id) return db.pets.map((p) => ({ ...p, customer: db.customers.find((c) => c.id === p.customerId) }));
    if (method === 'GET' && id) { const p = db.pets.find((x) => x.id === id); return p ?? notFound(); }
    if (method === 'POST') {
      if (!db.customers.some((c) => c.id === body.customerId)) throw httpErr(409, 'Cliente inválido.');
      const p: Pet = { id: uid(), name: body.name, weightKg: s(body.weightKg), activityFactor: s(body.activityFactor), customerId: body.customerId };
      db.pets.push(p); return p;
    }
    if (method === 'PUT') {
      const p = db.pets.find((x) => x.id === id); if (!p) return notFound();
      if (body.customerId && !db.customers.some((c) => c.id === body.customerId)) throw httpErr(409, 'Cliente inválido.');
      Object.assign(p, { ...body, weightKg: body.weightKg != null ? s(body.weightKg) : p.weightKg, activityFactor: body.activityFactor != null ? s(body.activityFactor) : p.activityFactor });
      return p;
    }
  }

  // ----- diets -----
  if (r === 'diets') {
    if (method === 'GET' && !id) return db.diets.map(dietWithRelations);
    if (method === 'GET' && id) { const d = db.diets.find((x) => x.id === id); return d ? dietWithRelations(d) : notFound(); }
    if (method === 'POST' && !id) {
      const d: Diet = {
        id: uid(), name: body.name, petId: body.petId,
        proteinPercent: s(body.proteinPercent), fiberPercent: s(body.fiberPercent), carbPercent: s(body.carbPercent),
        items: (body.items ?? []).map((i: any) => ({ ingredientId: i.ingredientId, role: i.role, shareWithinGroup: i.shareWithinGroup ?? 1 })),
      };
      db.diets.push(d); return d;
    }
    if (method === 'POST' && id && sub === 'preview') return previewDiet(id);
    if (method === 'DELETE' && id) {
      if (db.batches.some((b) => b.dietId === id)) throw httpErr(409, 'Não foi possível excluir: esta dieta possui lotes.');
      db.diets = db.diets.filter((x) => x.id !== id); return undefined;
    }
  }

  // ----- batches -----
  if (r === 'batches') {
    if (method === 'GET' && !id)
      return db.batches.map((b) => ({ ...b, pet: db.pets.find((p) => p.id === b.petId), diet: db.diets.find((d) => d.id === b.dietId) }));
    if (method === 'GET' && id && !sub) {
      const b = db.batches.find((x) => x.id === id); return b ?? notFound();
    }
    if (method === 'POST' && !id) {
      const d = db.diets.find((x) => x.id === body.dietId); if (!d) throw httpErr(404, 'Dieta não encontrada.');
      const pet = db.pets.find((p) => p.id === d.petId)!;
      const recipe = buildDailyRecipe(num(pet.weightKg), num(pet.activityFactor),
        { proteinPercent: num(d.proteinPercent), fiberPercent: num(d.fiberPercent), carbPercent: num(d.carbPercent) }, recipeInputs(d));
      const ppgMap = Object.fromEntries(recipeInputs(d).map((i) => [i.ingredientId, i.pricePerGram]));
      const plan = scaleRecipeToBatch(recipe, num(body.packageCount), num(body.packageWeightGrams), ppgMap);
      const b: Batch = {
        id: uid(), dietId: d.id, petId: d.petId, packageCount: num(body.packageCount), packageWeightGrams: s(body.packageWeightGrams),
        plannedDate: new Date(body.plannedDate).toISOString(),
        startConsumptionDate: body.startConsumptionDate ? new Date(body.startConsumptionDate).toISOString() : undefined,
        daysOfFood: s(plan.daysOfFood), createdAt: new Date().toISOString(),
        items: plan.ingredients.map((i) => ({ ingredientId: i.ingredientId, gramsTotal: i.gramsTotal, costTotal: i.costTotal })),
      };
      db.batches.push(b); return b;
    }
    if (method === 'GET' && id && sub === 'kitchen-sheet') {
      const b = db.batches.find((x) => x.id === id); if (!b) return notFound();
      const pet = db.pets.find((p) => p.id === b.petId)!;
      const customer = db.customers.find((c) => c.id === pet.customerId)!;
      return {
        batchId: b.id, petName: pet.name, customerName: customer.name,
        packageCount: b.packageCount, packageWeightGrams: num(b.packageWeightGrams),
        totalGrams: b.packageCount * num(b.packageWeightGrams), daysOfFood: b.daysOfFood ? num(b.daysOfFood) : null,
        ingredients: [...b.items].sort((a, z) => z.gramsTotal - a.gramsTotal).map((i) => ({ name: findIng(i.ingredientId)?.name ?? '?', gramsTotal: i.gramsTotal })),
      };
    }
    if (id && sub === 'pricing') {
      const b = db.batches.find((x) => x.id === id); if (!b) return notFound();
      if (method === 'GET') { const pr = db.pricings.find((p) => p.batchId === id); return pr ?? notFound(); }
      if (method === 'PUT') {
        const ingredientCost = b.items.reduce((sum, i) => sum + i.costTotal, 0);
        const packagingUnitCost = body.packagingUnitCost ?? num(db.settings.packagingUnitCost);
        const laborCostPerHour = body.laborCostPerHour ?? num(db.settings.laborCostPerHour);
        const res = calculatePricing({ ingredientCost, packageCount: b.packageCount, packagingUnitCost, laborHours: num(body.laborHours), laborCostPerHour, marginPercent: num(body.marginPercent) });
        const pr: Pricing = {
          batchId: b.id, ingredientCost: s(res.ingredientCost), packagingUnitCost: s(packagingUnitCost), packagingCost: s(res.packagingCost),
          laborHours: s(body.laborHours), laborCostPerHour: s(laborCostPerHour), laborCost: s(res.laborCost),
          totalCost: s(res.totalCost), marginPercent: s(body.marginPercent), suggestedPrice: s(res.suggestedPrice), profit: s(res.profit),
        };
        const i = db.pricings.findIndex((p) => p.batchId === b.id);
        if (i >= 0) db.pricings[i] = pr; else db.pricings.push(pr);
        return pr;
      }
    }
    if (method === 'DELETE' && id) { db.batches = db.batches.filter((x) => x.id !== id); db.pricings = db.pricings.filter((p) => p.batchId !== id); db.alerts = db.alerts.filter((a) => a.batchId !== id); return undefined; }
  }

  // ----- shopping-list -----
  if (r === 'shopping-list' && method === 'GET') {
    const from = new Date(params.get('from') ?? '').getTime();
    const to = new Date(params.get('to') ?? '').getTime();
    const map = new Map<string, { name: string; gramsTotal: number; estimatedCost: number }>();
    for (const b of db.batches) {
      const t = new Date(b.plannedDate).getTime();
      if (t < from || t > to) continue;
      for (const it of b.items) {
        const ing = findIng(it.ingredientId); if (!ing) continue;
        const cur = map.get(it.ingredientId) ?? { name: ing.name, gramsTotal: 0, estimatedCost: 0 };
        cur.gramsTotal += it.gramsTotal;
        cur.estimatedCost += it.gramsTotal * ppgOf(ing);
        map.set(it.ingredientId, cur);
      }
    }
    const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
    const items = [...map.values()].map((i) => ({ name: i.name, gramsTotal: r2(i.gramsTotal), kilos: r2(i.gramsTotal / 1000), estimatedCost: r2(i.estimatedCost) })).sort((a, z) => z.gramsTotal - a.gramsTotal);
    return { from: params.get('from'), to: params.get('to'), totalEstimatedCost: r2(items.reduce((su, i) => su + i.estimatedCost, 0)), items };
  }

  // ----- alerts -----
  if (r === 'alerts') {
    if (method === 'GET') {
      const status = params.get('status');
      return db.alerts.filter((a) => !status || a.status === status).map((a) => ({
        ...a,
        customer: db.customers.find((c) => c.id === a.customerId),
        batch: (() => { const b = db.batches.find((x) => x.id === a.batchId); return b ? { ...b, pet: db.pets.find((p) => p.id === b.petId) } : undefined; })(),
      }));
    }
    if (method === 'POST') {
      const b = db.batches.find((x) => x.id === body.batchId); if (!b) throw httpErr(404, 'Lote não encontrado.');
      if (!b.daysOfFood) throw httpErr(400, 'O lote não possui dias de comida calculados.');
      const pet = db.pets.find((p) => p.id === b.petId)!;
      const base = new Date(b.startConsumptionDate ?? b.createdAt);
      base.setDate(base.getDate() + Math.max(0, Math.floor(num(b.daysOfFood) - db.settings.reminderBufferDays)));
      const existing = db.alerts.find((a) => a.batchId === b.id);
      const al: Alert = existing ?? { id: uid(), batchId: b.id, customerId: pet.customerId, reminderDate: '', status: 'PENDING', message: `A comida da ${pet.name} está acabando. Oferecer recompra.` };
      al.reminderDate = base.toISOString(); al.status = 'PENDING';
      if (!existing) db.alerts.push(al);
      return al;
    }
    if (method === 'PUT' && id) { const a = db.alerts.find((x) => x.id === id); if (!a) return notFound(); a.status = body.status; return a; }
  }

  // ----- settings -----
  if (r === 'settings') {
    if (method === 'GET') return db.settings;
    if (method === 'PUT') {
      db.settings = {
        laborCostPerHour: s(body.laborCostPerHour ?? db.settings.laborCostPerHour),
        packagingUnitCost: s(body.packagingUnitCost ?? db.settings.packagingUnitCost),
        defaultMarginPercent: s(body.defaultMarginPercent ?? db.settings.defaultMarginPercent),
        reminderBufferDays: num(body.reminderBufferDays ?? db.settings.reminderBufferDays),
      };
      return db.settings;
    }
  }

  throw httpErr(404, `Mock: rota não encontrada (${method} ${rawPath}).`);
}

function notFound() {
  throw httpErr(404, 'Registro não encontrado.');
}

// Simula latência de rede pequena para parecer real.
const delay = <T>(v: T) => new Promise<T>((res) => setTimeout(() => res(v), 120));

export const mockApi = {
  get: <T>(path: string) => handle('GET', path).then((d) => delay(d as T)),
  post: <T>(path: string, body: unknown) => handle('POST', path, body).then((d) => delay(d as T)),
  put: <T>(path: string, body: unknown) => handle('PUT', path, body).then((d) => delay(d as T)),
  del: (path: string) => handle('DELETE', path).then(() => delay(undefined as void)),
};
