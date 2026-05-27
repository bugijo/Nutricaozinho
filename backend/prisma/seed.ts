import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.setting.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      laborCostPerHour: 20,
      packagingUnitCost: 1.5,
      defaultMarginPercent: 30,
      reminderBufferDays: 5,
    },
    update: {},
  });
  console.log('Configurações iniciais criadas.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
