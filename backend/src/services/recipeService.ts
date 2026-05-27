// Ponte entre o Prisma e os motores de cálculo puros (nutritionCalculator).
// Carrega uma dieta do banco e produz a receita diária / escala para o lote.

import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/http.js';
import {
  buildDailyRecipe,
  scaleRecipeToBatch,
  pricePerGram,
  type RecipeIngredientInput,
  type RecipeResult,
  type BatchResult,
} from './nutritionCalculator.js';

async function loadDietContext(dietId: string) {
  const diet = await prisma.diet.findUnique({
    where: { id: dietId },
    include: { pet: true, items: { include: { ingredient: true } } },
  });
  if (!diet) throw new HttpError(404, 'Dieta não encontrada.');
  if (diet.items.length === 0) throw new HttpError(400, 'A dieta não possui ingredientes.');

  const ingredients: RecipeIngredientInput[] = diet.items.map((item) => ({
    ingredientId: item.ingredientId,
    name: item.ingredient.name,
    role: item.role,
    kcalPer100g: Number(item.ingredient.kcalPer100g),
    shareWithinGroup: Number(item.shareWithinGroup),
    pricePerGram: pricePerGram(
      Number(item.ingredient.purchasePrice),
      Number(item.ingredient.purchaseWeightGrams)
    ),
  }));

  return { diet, ingredients };
}

export async function previewDiet(dietId: string): Promise<RecipeResult> {
  const { diet, ingredients } = await loadDietContext(dietId);
  return buildDailyRecipe(
    Number(diet.pet.weightKg),
    Number(diet.pet.activityFactor),
    {
      proteinPercent: Number(diet.proteinPercent),
      fiberPercent: Number(diet.fiberPercent),
      carbPercent: Number(diet.carbPercent),
    },
    ingredients
  );
}

export async function buildBatchPlan(
  dietId: string,
  packageCount: number,
  packageWeightGrams: number
): Promise<{ recipe: RecipeResult; batch: BatchResult }> {
  const { diet, ingredients } = await loadDietContext(dietId);
  const recipe = buildDailyRecipe(
    Number(diet.pet.weightKg),
    Number(diet.pet.activityFactor),
    {
      proteinPercent: Number(diet.proteinPercent),
      fiberPercent: Number(diet.fiberPercent),
      carbPercent: Number(diet.carbPercent),
    },
    ingredients
  );
  const pricePerGramByIngredient = Object.fromEntries(
    ingredients.map((i) => [i.ingredientId, i.pricePerGram])
  );
  const batch = scaleRecipeToBatch(recipe, packageCount, packageWeightGrams, pricePerGramByIngredient);
  return { recipe, batch };
}
