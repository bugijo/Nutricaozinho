import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, HttpError } from '../lib/http.js';

export const petsRouter = Router();

const petSchema = z.object({
  name: z.string().min(1),
  weightKg: z.number().positive(),
  activityFactor: z.number().positive(),
  notes: z.string().optional(),
  customerId: z.string().uuid(),
});

petsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const pets = await prisma.pet.findMany({
      orderBy: { name: 'asc' },
      include: { customer: true },
    });
    res.json(pets);
  })
);

petsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const pet = await prisma.pet.findUnique({
      where: { id: req.params.id },
      include: { customer: true, diets: true },
    });
    if (!pet) throw new HttpError(404, 'Pet não encontrado.');
    res.json(pet);
  })
);

petsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = petSchema.parse(req.body);
    const pet = await prisma.pet.create({ data });
    res.status(201).json(pet);
  })
);

petsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = petSchema.partial().parse(req.body);
    const pet = await prisma.pet.update({ where: { id: req.params.id }, data });
    res.json(pet);
  })
);

petsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.pet.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
