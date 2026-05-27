import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, HttpError } from '../lib/http.js';
import { getSettings } from '../services/settingsService.js';

export const alertsRouter = Router();

const statusEnum = z.enum(['PENDING', 'SENT', 'DISMISSED', 'REPURCHASED']);

alertsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const status = statusEnum.optional().parse(req.query.status);
    const alerts = await prisma.alert.findMany({
      where: status ? { status } : undefined,
      orderBy: { reminderDate: 'asc' },
      include: { customer: true, batch: { include: { pet: true } } },
    });
    res.json(alerts);
  })
);

// Gera o alerta de recompra de um lote: reminderDate = início + (dias de comida - buffer).
const createAlertSchema = z.object({ batchId: z.string().uuid() });

alertsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { batchId } = createAlertSchema.parse(req.body);
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { pet: true },
    });
    if (!batch) throw new HttpError(404, 'Lote não encontrado.');
    if (!batch.startConsumptionDate) {
      throw new HttpError(400, 'Defina a data de início do consumo no lote antes de gerar o alerta.');
    }
    if (!batch.daysOfFood) {
      throw new HttpError(400, 'O lote não possui dias de comida calculados.');
    }

    const settings = await getSettings();
    const days = Number(batch.daysOfFood) - settings.reminderBufferDays;
    const reminderDate = new Date(batch.startConsumptionDate);
    reminderDate.setDate(reminderDate.getDate() + Math.max(0, Math.floor(days)));

    const alert = await prisma.alert.upsert({
      where: { batchId },
      create: {
        batchId,
        customerId: batch.pet.customerId,
        reminderDate,
        message: `A comida da ${batch.pet.name} está acabando. Oferecer recompra.`,
      },
      update: { reminderDate, status: 'PENDING' },
    });
    res.status(201).json(alert);
  })
);

const updateAlertSchema = z.object({ status: statusEnum });

alertsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { status } = updateAlertSchema.parse(req.body);
    const alert = await prisma.alert.update({ where: { id: req.params.id }, data: { status } });
    res.json(alert);
  })
);
