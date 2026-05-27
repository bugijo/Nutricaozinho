import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/http.js';
import { pricePerGram } from '../services/nutritionCalculator.js';

export const shoppingListRouter = Router();

const querySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});

// Lista de compras da semana: soma as gramas de cada ingrediente em todos os lotes
// programados (plannedDate) dentro do intervalo informado.
shoppingListRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { from, to } = querySchema.parse(req.query);

    const items = await prisma.batchItem.findMany({
      where: { batch: { plannedDate: { gte: from, lte: to } } },
      include: { ingredient: true },
    });

    const byIngredient = new Map<
      string,
      { name: string; gramsTotal: number; estimatedCost: number }
    >();

    for (const item of items) {
      const grams = Number(item.gramsTotal);
      const ppg = pricePerGram(
        Number(item.ingredient.purchasePrice),
        Number(item.ingredient.purchaseWeightGrams)
      );
      const current = byIngredient.get(item.ingredientId) ?? {
        name: item.ingredient.name,
        gramsTotal: 0,
        estimatedCost: 0,
      };
      current.gramsTotal += grams;
      current.estimatedCost += grams * ppg;
      byIngredient.set(item.ingredientId, current);
    }

    const list = [...byIngredient.values()]
      .map((i) => ({
        name: i.name,
        gramsTotal: round2(i.gramsTotal),
        kilos: round2(i.gramsTotal / 1000),
        estimatedCost: round2(i.estimatedCost),
      }))
      .sort((a, b) => b.gramsTotal - a.gramsTotal);

    res.json({
      from,
      to,
      totalEstimatedCost: round2(list.reduce((s, i) => s + i.estimatedCost, 0)),
      items: list,
    });
  })
);

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
