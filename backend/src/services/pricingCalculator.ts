// Motor de precificação. Função pura: custo total + margem -> preço de venda sugerido e lucro.

export interface PricingInput {
  ingredientCost: number;
  packageCount: number;
  packagingUnitCost: number;
  laborHours: number;
  laborCostPerHour: number;
  marginPercent: number; // margem sobre o preço de venda (0-100)
}

export interface PricingResult {
  ingredientCost: number;
  packagingCost: number;
  laborCost: number;
  totalCost: number;
  suggestedPrice: number;
  profit: number;
}

export function calculatePricing(input: PricingInput): PricingResult {
  const packagingCost = input.packageCount * input.packagingUnitCost;
  const laborCost = input.laborHours * input.laborCostPerHour;
  const totalCost = input.ingredientCost + packagingCost + laborCost;

  const m = input.marginPercent / 100;
  if (m >= 1) throw new Error('Margem deve ser menor que 100%.');
  if (m < 0) throw new Error('Margem não pode ser negativa.');
  const suggestedPrice = totalCost / (1 - m); // preço que garante a margem desejada
  const profit = suggestedPrice - totalCost;

  const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  return {
    ingredientCost: r2(input.ingredientCost),
    packagingCost: r2(packagingCost),
    laborCost: r2(laborCost),
    totalCost: r2(totalCost),
    suggestedPrice: r2(suggestedPrice),
    profit: r2(profit),
  };
}
