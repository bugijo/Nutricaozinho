import { describe, it, expect } from 'vitest';
import {
  calculateNEM,
  buildDailyRecipe,
  scaleRecipeToBatch,
  pricePerGram,
  type RecipeIngredientInput,
} from './nutritionCalculator.js';

describe('calculateNEM', () => {
  it('aplica a fórmula 70 * peso^0.75 * fator', () => {
    // 10 kg, fator 1.6 -> ~629,82 kcal/dia
    expect(calculateNEM(10, 1.6)).toBeCloseTo(629.82, 1);
  });

  it('rejeita peso e fator inválidos', () => {
    expect(() => calculateNEM(0, 1.6)).toThrow();
    expect(() => calculateNEM(10, 0)).toThrow();
  });
});

describe('buildDailyRecipe', () => {
  const ingredients: RecipeIngredientInput[] = [
    { ingredientId: 'p', name: 'Frango', role: 'PROTEIN', kcalPer100g: 160, shareWithinGroup: 1, pricePerGram: 0.02 },
    { ingredientId: 'f', name: 'Abóbora', role: 'FIBER', kcalPer100g: 40, shareWithinGroup: 1, pricePerGram: 0.005 },
    { ingredientId: 'c', name: 'Batata', role: 'CARB', kcalPer100g: 80, shareWithinGroup: 1, pricePerGram: 0.008 },
  ];

  it('distribui a NEM entre os macros e a soma das kcal por ingrediente ≈ NEM', () => {
    const recipe = buildDailyRecipe(10, 1.6, { proteinPercent: 35, fiberPercent: 30, carbPercent: 30 }, ingredients);
    const somaKcal = recipe.ingredients.reduce((s, i) => s + i.kcalPerDay, 0);
    // Proporções 35/30/30 (soma 95) são normalizadas para somar 100% da NEM.
    expect(somaKcal).toBeCloseTo(recipe.nemKcalPerDay, 0);
  });

  it('converte kcal em gramas reais por ingrediente', () => {
    const recipe = buildDailyRecipe(10, 1.6, { proteinPercent: 50, fiberPercent: 0, carbPercent: 0 }, [
      ingredients[0],
    ]);
    // 100% da NEM em frango (160 kcal/100g): gramas = NEM/160*100
    const esperado = (recipe.nemKcalPerDay / 160) * 100;
    expect(recipe.ingredients[0].gramsPerDay).toBeCloseTo(Math.round(esperado * 100) / 100, 1);
  });

  it('exige ao menos um ingrediente', () => {
    expect(() => buildDailyRecipe(10, 1.6, { proteinPercent: 35, fiberPercent: 30, carbPercent: 30 }, [])).toThrow();
  });

  it('inclui com 0g o ingrediente cujo macro não tem proporção na dieta', () => {
    const recipe = buildDailyRecipe(
      10,
      1.6,
      { proteinPercent: 100, fiberPercent: 0, carbPercent: 0 },
      [
        ingredients[0], // PROTEIN -> recebe gramas
        { ingredientId: 's', name: 'Suplemento', role: 'SUPPLEMENT', kcalPer100g: 300, shareWithinGroup: 1, pricePerGram: 0.1 },
      ]
    );
    const sup = recipe.ingredients.find((i) => i.ingredientId === 's');
    expect(sup).toBeDefined();
    expect(sup!.gramsPerDay).toBe(0);
    expect(recipe.ingredients.find((i) => i.ingredientId === 'p')!.gramsPerDay).toBeGreaterThan(0);
  });
});

describe('scaleRecipeToBatch', () => {
  it('escala a receita para o lote e calcula dias de comida e custo', () => {
    const recipe = buildDailyRecipe(10, 1.6, { proteinPercent: 35, fiberPercent: 30, carbPercent: 30 }, [
      { ingredientId: 'p', name: 'Frango', role: 'PROTEIN', kcalPer100g: 160, shareWithinGroup: 1, pricePerGram: 0.02 },
      { ingredientId: 'f', name: 'Abóbora', role: 'FIBER', kcalPer100g: 40, shareWithinGroup: 1, pricePerGram: 0.005 },
      { ingredientId: 'c', name: 'Batata', role: 'CARB', kcalPer100g: 80, shareWithinGroup: 1, pricePerGram: 0.008 },
    ]);

    // Lote: 30 pacotes de 350g = 10.500g
    const batch = scaleRecipeToBatch(recipe, 30, 350, { p: 0.02, f: 0.005, c: 0.008 });

    expect(batch.totalBatchGrams).toBe(10500);
    expect(batch.daysOfFood).toBeCloseTo(10500 / recipe.dailyGramsTotal, 1);
    // Soma das gramas do lote ≈ total do lote
    const somaGramas = batch.ingredients.reduce((s, i) => s + i.gramsTotal, 0);
    expect(somaGramas).toBeCloseTo(10500, 0);
    expect(batch.ingredientCostTotal).toBeGreaterThan(0);
  });
});

describe('pricePerGram', () => {
  it('R$ 20 por 1000g = R$ 0,02/g', () => {
    expect(pricePerGram(20, 1000)).toBeCloseTo(0.02, 5);
  });
});
