import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, HttpError } from '../lib/http.js';

export const ingredientsRouter = Router();

const categoryEnum = z.enum(['PROTEIN', 'CARB', 'FIBER', 'FAT', 'SUPPLEMENT', 'OTHER']);

const ingredientSchema = z.object({
  name: z.string().min(1),
  category: categoryEnum,
  purchasePrice: z.number().nonnegative(),
  purchaseWeightGrams: z.number().positive(),
  kcalPer100g: z.number().nonnegative(),
  proteinPer100g: z.number().nonnegative(),
  fiberPer100g: z.number().nonnegative(),
  carbPer100g: z.number().nonnegative(),
  fatPer100g: z.number().nonnegative().optional(),
  active: z.boolean().optional(),
});

ingredientsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const ingredients = await prisma.ingredient.findMany({ orderBy: { name: 'asc' } });
    res.json(ingredients);
  })
);

ingredientsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const ingredient = await prisma.ingredient.findUnique({ where: { id: req.params.id } });
    if (!ingredient) throw new HttpError(404, 'Ingrediente não encontrado.');
    res.json(ingredient);
  })
);

ingredientsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = ingredientSchema.parse(req.body);
    const ingredient = await prisma.ingredient.create({ data });
    res.status(201).json(ingredient);
  })
);

ingredientsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = ingredientSchema.partial().parse(req.body);
    const ingredient = await prisma.ingredient.update({ where: { id: req.params.id }, data });
    res.json(ingredient);
  })
);

ingredientsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.ingredient.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
