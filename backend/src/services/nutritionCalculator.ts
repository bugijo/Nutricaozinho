// Motor de cálculo nutricional. Funções puras, testáveis isoladamente.

export type MacroRole = 'PROTEIN' | 'CARB' | 'FIBER' | 'FAT' | 'SUPPLEMENT' | 'OTHER';

export interface MacroProportions {
  proteinPercent: number; // 0-100
  fiberPercent: number; // 0-100
  carbPercent: number; // 0-100
}

export interface RecipeIngredientInput {
  ingredientId: string;
  name: string;
  role: MacroRole;
  kcalPer100g: number;
  shareWithinGroup: number; // 0-1 (fatia dentro do grupo do macro)
  pricePerGram: number;
}

export interface RecipeIngredientResult {
  ingredientId: string;
  name: string;
  gramsPerDay: number;
  kcalPerDay: number;
}

export interface RecipeResult {
  nemKcalPerDay: number;
  dailyGramsTotal: number;
  ingredients: RecipeIngredientResult[];
}

/**
 * Necessidade Energética de Manutenção (NEM), em kcal/dia.
 * Fórmula veterinária: 70 * (peso_kg ^ 0.75) * fator_atividade
 */
export function calculateNEM(weightKg: number, activityFactor: number): number {
  if (!(weightKg > 0)) throw new Error('Peso (kg) deve ser maior que zero.');
  if (!(activityFactor > 0)) throw new Error('Fator de atividade deve ser maior que zero.');
  return 70 * Math.pow(weightKg, 0.75) * activityFactor;
}

/**
 * Mapeia o macro -> proporção (0-100), normalizando para que a soma dos grupos com
 * ingredientes seja 100% das calorias da NEM.
 */
function normalizedGroupFractions(
  proportions: MacroProportions,
  activeRoles: Set<MacroRole>
): Map<MacroRole, number> {
  const raw: Partial<Record<MacroRole, number>> = {
    PROTEIN: proportions.proteinPercent,
    FIBER: proportions.fiberPercent,
    CARB: proportions.carbPercent,
  };
  const fractions = new Map<MacroRole, number>();
  let sum = 0;
  for (const [role, pct] of Object.entries(raw) as [MacroRole, number][]) {
    if (activeRoles.has(role) && pct > 0) {
      fractions.set(role, pct);
      sum += pct;
    }
  }
  if (sum <= 0) throw new Error('As proporções da dieta são inválidas (soma zero).');
  for (const [role, pct] of fractions) fractions.set(role, pct / sum); // normaliza para somar 1
  return fractions;
}

/**
 * Monta a receita diária: converte as calorias da NEM em GRAMAS reais por ingrediente.
 * - Distribui a NEM pelos grupos de macro (proporções normalizadas).
 * - Dentro de cada grupo, divide pelas fatias (shareWithinGroup, normalizadas).
 * - gramas = (kcal_do_ingrediente / kcalPer100g) * 100
 */
export function buildDailyRecipe(
  weightKg: number,
  activityFactor: number,
  proportions: MacroProportions,
  ingredients: RecipeIngredientInput[]
): RecipeResult {
  const nem = calculateNEM(weightKg, activityFactor);
  if (ingredients.length === 0) throw new Error('Selecione ao menos um ingrediente.');

  const activeRoles = new Set<MacroRole>(ingredients.map((i) => i.role));
  const groupFractions = normalizedGroupFractions(proportions, activeRoles);

  // Soma das fatias por grupo (para normalizar shareWithinGroup).
  const groupShareSum = new Map<MacroRole, number>();
  for (const ing of ingredients) {
    if (!groupFractions.has(ing.role)) continue; // grupo sem proporção definida
    groupShareSum.set(ing.role, (groupShareSum.get(ing.role) ?? 0) + ing.shareWithinGroup);
  }

  const results: RecipeIngredientResult[] = [];
  let dailyGramsTotal = 0;

  for (const ing of ingredients) {
    const groupFraction = groupFractions.get(ing.role);
    if (!groupFraction) {
      // Ingrediente cujo macro não tem proporção nesta dieta: entra com 0g
      // para que a interface possa avisar o usuário (não some silenciosamente).
      results.push({ ingredientId: ing.ingredientId, name: ing.name, gramsPerDay: 0, kcalPerDay: 0 });
      continue;
    }
    if (!(ing.kcalPer100g > 0)) {
      throw new Error(`Ingrediente "${ing.name}" precisa de kcal/100g maior que zero.`);
    }
    const shareSum = groupShareSum.get(ing.role) ?? 1;
    const ingredientShare = shareSum > 0 ? ing.shareWithinGroup / shareSum : 0;

    const kcalPerDay = nem * groupFraction * ingredientShare;
    const gramsPerDay = (kcalPerDay / ing.kcalPer100g) * 100;
    dailyGramsTotal += gramsPerDay;

    results.push({
      ingredientId: ing.ingredientId,
      name: ing.name,
      gramsPerDay: round2(gramsPerDay),
      kcalPerDay: round2(kcalPerDay),
    });
  }

  return {
    nemKcalPerDay: round2(nem),
    dailyGramsTotal: round2(dailyGramsTotal),
    ingredients: results,
  };
}

export interface BatchIngredientResult {
  ingredientId: string;
  name: string;
  gramsTotal: number;
  costTotal: number;
}

export interface BatchResult {
  totalBatchGrams: number;
  daysOfFood: number;
  ingredients: BatchIngredientResult[];
  ingredientCostTotal: number;
}

/**
 * Escala a receita diária para o lote (Ficha de Cozinha).
 * totalBatchGrams = packageCount * packageWeightGrams
 * fator de escala = totalBatchGrams / dailyGramsTotal  (= número de dias que o lote dura)
 */
export function scaleRecipeToBatch(
  recipe: RecipeResult,
  packageCount: number,
  packageWeightGrams: number,
  pricePerGramByIngredient: Record<string, number>
): BatchResult {
  if (!(packageCount > 0) || !(packageWeightGrams > 0)) {
    throw new Error('Quantidade e peso dos pacotes devem ser maiores que zero.');
  }
  if (!(recipe.dailyGramsTotal > 0)) {
    throw new Error('Receita diária inválida (0g).');
  }
  const totalBatchGrams = packageCount * packageWeightGrams;
  const scale = totalBatchGrams / recipe.dailyGramsTotal; // = dias de comida

  let ingredientCostTotal = 0;
  const ingredients: BatchIngredientResult[] = recipe.ingredients.map((ing) => {
    const gramsTotal = ing.gramsPerDay * scale;
    const pricePerGram = pricePerGramByIngredient[ing.ingredientId] ?? 0;
    const costTotal = gramsTotal * pricePerGram;
    ingredientCostTotal += costTotal;
    return {
      ingredientId: ing.ingredientId,
      name: ing.name,
      gramsTotal: round2(gramsTotal),
      costTotal: round2(costTotal),
    };
  });

  return {
    totalBatchGrams: round2(totalBatchGrams),
    daysOfFood: round2(scale),
    ingredients,
    ingredientCostTotal: round2(ingredientCostTotal),
  };
}

/** Preço por grama a partir do preço pago por peso (R$ X por Yg). */
export function pricePerGram(purchasePrice: number, purchaseWeightGrams: number): number {
  if (!(purchaseWeightGrams > 0)) throw new Error('Peso de compra deve ser maior que zero.');
  return purchasePrice / purchaseWeightGrams;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
