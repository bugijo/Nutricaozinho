import { prisma } from '../lib/prisma.js';

// Configurações globais ficam numa única linha (id = 1), criada sob demanda.
export async function getSettings() {
  const existing = await prisma.setting.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.setting.create({ data: { id: 1 } });
}
