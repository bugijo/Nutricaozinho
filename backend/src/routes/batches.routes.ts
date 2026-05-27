import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, HttpError } from '../lib/http.js';
import { buildBatchPlan } from '../services/recipeService.js';
import { calculatePricing } from '../services/pricingCalculator.js';
import { getSettings } from '../services/settingsService.js';

export const batchesRouter = Router();

const statusEnum = z.enum(['PLANNED', 'COOKING', 'DONE', 'DELIVERED']);

const batchSchema = z.object({
  dietId: z.string().uuid(),
  packageCount: z.number().int().positive(),
  packageWeightGrams: z.number().positive(),
  plannedDate: z.coerce.date(),
  startConsumptionDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

batchesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const batches = await prisma.batch.findMany({
      orderBy: { plannedDate: 'desc' },
      include: { pet: true, diet: true },
    });
    res.json(batches);
  })
);

batchesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const batch = await prisma.batch.findUnique({
      where: { id: req.params.id },
      include: {
        pet: { include: { customer: true } },
        diet: true,
        items: { include: { ingredient: true } },
        pricing: true,
        alert: true,
      },
    });
    if (!batch) throw new HttpError(404, 'Lote não encontrado.');
    res.json(batch);
  })
);

batchesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = batchSchema.parse(req.body);
    const diet = await prisma.diet.findUnique({ where: { id: data.dietId } });
    if (!diet) throw new HttpError(404, 'Dieta não encontrada.');

    const { batch: plan } = await buildBatchPlan(
      data.dietId,
      data.packageCount,
      data.packageWeightGrams
    );

    const created = await prisma.batch.create({
      data: {
        dietId: data.dietId,
        petId: diet.petId,
        packageCount: data.packageCount,
        packageWeightGrams: data.packageWeightGrams,
        plannedDate: data.plannedDate,
        startConsumptionDate: data.startConsumptionDate,
        notes: data.notes,
        daysOfFood: plan.daysOfFood,
        items: {
          create: plan.ingredients.map((i) => ({
            ingredientId: i.ingredientId,
            gramsTotal: i.gramsTotal,
            costTotal: i.costTotal,
          })),
        },
      },
      include: { items: { include: { ingredient: true } } },
    });
    res.status(201).json(created);
  })
);

const updateBatchSchema = z.object({
  status: statusEnum.optional(),
  plannedDate: z.coerce.date().optional(),
  startConsumptionDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

batchesRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = updateBatchSchema.parse(req.body);
    const batch = await prisma.batch.update({ where: { id: req.params.id }, data });
    res.json(batch);
  })
);

batchesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.batch.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

// Ficha de Cozinha: gramas totais de cada ingrediente para pesar e cozinhar.
batchesRouter.get(
  '/:id/kitchen-sheet',
  asyncHandler(async (req, res) => {
    const batch = await prisma.batch.findUnique({
      where: { id: req.params.id },
      include: {
        pet: { include: { customer: true } },
        items: { include: { ingredient: true }, orderBy: { gramsTotal: 'desc' } },
      },
    });
    if (!batch) throw new HttpError(404, 'Lote não encontrado.');

    res.json({
      batchId: batch.id,
      petName: batch.pet.name,
      customerName: batch.pet.customer.name,
      packageCount: batch.packageCount,
      packageWeightGrams: Number(batch.packageWeightGrams),
      totalGrams: batch.packageCount * Number(batch.packageWeightGrams),
      daysOfFood: batch.daysOfFood ? Number(batch.daysOfFood) : null,
      ingredients: batch.items.map((i) => ({
        name: i.ingredient.name,
        gramsTotal: Number(i.gramsTotal),
      })),
    });
  })
);

batchesRouter.get(
  '/:id/pricing',
  asyncHandler(async (req, res) => {
    const pricing = await prisma.pricing.findUnique({ where: { batchId: req.params.id } });
    if (!pricing) throw new HttpError(404, 'Precificação ainda não calculada para este lote.');
    res.json(pricing);
  })
);

const pricingInputSchema = z.object({
  laborHours: z.number().nonnegative(),
  marginPercent: z.number().min(0).max(99),
  packagingUnitCost: z.number().nonnegative().optional(),
  laborCostPerHour: z.number().nonnegative().optional(),
});

// Calcula (e salva) a precificação do lote: ingredientes + embalagem + mão de obra + margem.
batchesRouter.put(
  '/:id/pricing',
  asyncHandler(async (req, res) => {
    const input = pricingInputSchema.parse(req.body);
    const batch = await prisma.batch.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });
    if (!batch) throw new HttpError(404, 'Lote não encontrado.');

    const settings = await getSettings();
    const packagingUnitCost = input.packagingUnitCost ?? Number(settings.packagingUnitCost);
    const laborCostPerHour = input.laborCostPerHour ?? Number(settings.laborCostPerHour);
    const ingredientCost = batch.items.reduce((sum, i) => sum + Number(i.costTotal), 0);

    const result = calculatePricing({
      ingredientCost,
      packageCount: batch.packageCount,
      packagingUnitCost,
      laborHours: input.laborHours,
      laborCostPerHour,
      marginPercent: input.marginPercent,
    });

    const pricing = await prisma.pricing.upsert({
      where: { batchId: batch.id },
      create: {
        batchId: batch.id,
        ingredientCost: result.ingredientCost,
        packagingUnitCost,
        packagingCost: result.packagingCost,
        laborHours: input.laborHours,
        laborCostPerHour,
        laborCost: result.laborCost,
        totalCost: result.totalCost,
        marginPercent: input.marginPercent,
        suggestedPrice: result.suggestedPrice,
        profit: result.profit,
      },
      update: {
        ingredientCost: result.ingredientCost,
        packagingUnitCost,
        packagingCost: result.packagingCost,
        laborHours: input.laborHours,
        laborCostPerHour,
        laborCost: result.laborCost,
        totalCost: result.totalCost,
        marginPercent: input.marginPercent,
        suggestedPrice: result.suggestedPrice,
        profit: result.profit,
      },
    });
    res.json(pricing);
  })
);
