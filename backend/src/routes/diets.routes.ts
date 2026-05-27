import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, HttpError } from '../lib/http.js';
import { previewDiet } from '../services/recipeService.js';

export const dietsRouter = Router();

const categoryEnum = z.enum(['PROTEIN', 'CARB', 'FIBER', 'FAT', 'SUPPLEMENT', 'OTHER']);

const dietItemSchema = z.object({
  ingredientId: z.string().uuid(),
  role: categoryEnum,
  shareWithinGroup: z.number().positive().max(1).optional(),
});

const dietSchema = z.object({
  name: z.string().min(1),
  petId: z.string().uuid(),
  proteinPercent: z.number().min(0).max(100),
  fiberPercent: z.number().min(0).max(100),
  carbPercent: z.number().min(0).max(100),
  active: z.boolean().optional(),
  items: z.array(dietItemSchema).min(1),
});

dietsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const diets = await prisma.diet.findMany({
      orderBy: { createdAt: 'desc' },
      include: { pet: true, items: { include: { ingredient: true } } },
    });
    res.json(diets);
  })
);

dietsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const diet = await prisma.diet.findUnique({
      where: { id: req.params.id },
      include: { pet: true, items: { include: { ingredient: true } } },
    });
    if (!diet) throw new HttpError(404, 'Dieta não encontrada.');
    res.json(diet);
  })
);

dietsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { items, ...data } = dietSchema.parse(req.body);
    const diet = await prisma.diet.create({
      data: {
        ...data,
        items: {
          create: items.map((i) => ({
            ingredientId: i.ingredientId,
            role: i.role,
            shareWithinGroup: i.shareWithinGroup ?? 1,
          })),
        },
      },
      include: { items: true },
    });
    res.status(201).json(diet);
  })
);

dietsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { items, ...data } = dietSchema.partial().parse(req.body);
    const diet = await prisma.$transaction(async (tx) => {
      if (items) {
        await tx.dietItem.deleteMany({ where: { dietId: req.params.id } });
        await tx.dietItem.createMany({
          data: items.map((i) => ({
            dietId: req.params.id,
            ingredientId: i.ingredientId,
            role: i.role,
            shareWithinGroup: i.shareWithinGroup ?? 1,
          })),
        });
      }
      return tx.diet.update({
        where: { id: req.params.id },
        data,
        include: { items: true },
      });
    });
    res.json(diet);
  })
);

dietsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.diet.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

// Prévia da receita diária (gramas/dia por ingrediente) sem salvar nada.
dietsRouter.post(
  '/:id/preview',
  asyncHandler(async (req, res) => {
    const recipe = await previewDiet(req.params.id);
    res.json(recipe);
  })
);
