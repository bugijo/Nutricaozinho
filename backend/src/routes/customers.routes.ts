import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, HttpError } from '../lib/http.js';

export const customersRouter = Router();

const customerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  notes: z.string().optional(),
});

customersRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const customers = await prisma.customer.findMany({
      orderBy: { name: 'asc' },
      include: { pets: true },
    });
    res.json(customers);
  })
);

customersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: { pets: true },
    });
    if (!customer) throw new HttpError(404, 'Cliente não encontrado.');
    res.json(customer);
  })
);

customersRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = customerSchema.parse(req.body);
    const customer = await prisma.customer.create({ data });
    res.status(201).json(customer);
  })
);

customersRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = customerSchema.partial().parse(req.body);
    const customer = await prisma.customer.update({ where: { id: req.params.id }, data });
    res.json(customer);
  })
);

customersRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.customer.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
