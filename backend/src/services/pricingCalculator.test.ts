import { describe, it, expect } from 'vitest';
import { calculatePricing } from './pricingCalculator.js';

describe('calculatePricing', () => {
  it('soma ingredientes + embalagem + mão de obra e aplica a margem sobre o preço de venda', () => {
    const result = calculatePricing({
      ingredientCost: 100,
      packageCount: 30,
      packagingUnitCost: 1, // 30 de embalagem
      laborHours: 2,
      laborCostPerHour: 20, // 40 de mão de obra
      marginPercent: 30,
    });

    expect(result.packagingCost).toBe(30);
    expect(result.laborCost).toBe(40);
    expect(result.totalCost).toBe(170);
    // suggestedPrice = 170 / (1 - 0.30) = 242.857...
    expect(result.suggestedPrice).toBeCloseTo(242.86, 1);
    expect(result.profit).toBeCloseTo(72.86, 1);
  });

  it('rejeita margem >= 100%', () => {
    expect(() =>
      calculatePricing({
        ingredientCost: 10,
        packageCount: 1,
        packagingUnitCost: 0,
        laborHours: 0,
        laborCostPerHour: 0,
        marginPercent: 100,
      })
    ).toThrow();
  });
});
