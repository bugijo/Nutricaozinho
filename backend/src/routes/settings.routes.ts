import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/http.js';
import { getSettings } from '../services/settingsService.js';

export const settingsRouter = Router();

const settingsSchema = z.object({
  laborCostPerHour: z.number().nonnegative().optional(),
  packagingUnitCost: z.number().nonnegative().optional(),
  defaultMarginPercent: z.number().min(0).max(99).optional(),
  reminderBufferDays: z.number().int().nonnegative().optional(),
});

settingsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await getSettings());
  })
);

settingsRouter.put(
  '/',
  asyncHandler(async (req, res) => {
    const data = settingsSchema.parse(req.body);
    await getSettings(); // garante que a linha existe
    const updated = await prisma.setting.update({ where: { id: 1 }, data });
    res.json(updated);
  })
);
