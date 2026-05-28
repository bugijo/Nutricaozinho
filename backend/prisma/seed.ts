// Seed massivo: simula 24 meses de uso da cozinha (20 cães, dezenas de lotes,
// dietas, precificações e alertas espalhados no tempo). Idempotente: limpa e reseed.
import 'dotenv/config';
import { PrismaClient, type IngredientCategory } from '@prisma/client';
import {
  buildDailyRecipe,
  scaleRecipeToBatch,
  pricePerGram,
  type RecipeIngredientInput,
} from '../src/services/nutritionCalculator.js';
import { calculatePricing } from '../src/services/pricingCalculator.js';

const prisma = new PrismaClient();

// Gerador determinístico (mesma execução → mesmos dados; facilita testes).
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}
const rand = rng(42);
const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const between = (a: number, b: number) => a + rand() * (b - a);
const intBetween = (a: number, b: number) => Math.floor(between(a, b + 1));
function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(12, 0, 0, 0);
  return d;
}

const RACAS = [
  'SRD', 'Shiba Inu', 'Golden Retriever', 'Labrador', 'Poodle',
  'Bulldog Francês', 'Yorkshire', 'Maltês', 'Border Collie', 'Pinscher',
  'Pug', 'Chihuahua', 'Beagle', 'Schnauzer', 'Dachshund',
  'Husky Siberiano', 'Pastor Alemão', 'Boxer', 'Cocker Spaniel', 'Lhasa Apso',
];
const CACHORROS = [
  'Bob', 'Mel', 'Thor', 'Luna', 'Bella', 'Max', 'Nina', 'Toby', 'Rex', 'Mia',
  'Pingo', 'Sofia', 'Lucky', 'Amora', 'Buddy', 'Cacau', 'Zeus', 'Lola', 'Spike', 'Pipoca',
];
const DONOS = [
  'Maria Silva', 'João Souza', 'Ana Pereira', 'Carlos Oliveira',
  'Rita Lima', 'José Almeida', 'Lúcia Rocha',
];
const FACTORS = [1.2, 1.4, 1.6, 2.0];

interface IngSpec {
  name: string;
  category: IngredientCategory;
  purchasePrice: number;
  purchaseWeightGrams: number;
  kcalPer100g: number;
  proteinPer100g: number;
  fiberPer100g: number;
  carbPer100g: number;
  fatPer100g: number;
}
const INGREDIENTS: IngSpec[] = [
  { name: 'Frango',         category: 'PROTEIN', purchasePrice: 22, purchaseWeightGrams: 1000, kcalPer100g: 160, proteinPer100g: 27, fiberPer100g: 0, carbPer100g: 0,  fatPer100g: 6  },
  { name: 'Carne moída',    category: 'PROTEIN', purchasePrice: 38, purchaseWeightGrams: 1000, kcalPer100g: 200, proteinPer100g: 25, fiberPer100g: 0, carbPer100g: 0,  fatPer100g: 12 },
  { name: 'Patinho',        category: 'PROTEIN', purchasePrice: 42, purchaseWeightGrams: 1000, kcalPer100g: 170, proteinPer100g: 26, fiberPer100g: 0, carbPer100g: 0,  fatPer100g: 7  },
  { name: 'Salmão',         category: 'PROTEIN', purchasePrice: 80, purchaseWeightGrams: 1000, kcalPer100g: 208, proteinPer100g: 20, fiberPer100g: 0, carbPer100g: 0,  fatPer100g: 13 },
  { name: 'Abóbora',        category: 'FIBER',   purchasePrice: 5,  purchaseWeightGrams: 1000, kcalPer100g: 40,  proteinPer100g: 1,  fiberPer100g: 3, carbPer100g: 8,  fatPer100g: 0  },
  { name: 'Cenoura',        category: 'FIBER',   purchasePrice: 4,  purchaseWeightGrams: 1000, kcalPer100g: 41,  proteinPer100g: 1,  fiberPer100g: 3, carbPer100g: 10, fatPer100g: 0  },
  { name: 'Brócolis',       category: 'FIBER',   purchasePrice: 10, purchaseWeightGrams: 1000, kcalPer100g: 55,  proteinPer100g: 4,  fiberPer100g: 3, carbPer100g: 11, fatPer100g: 1  },
  { name: 'Batata-doce',    category: 'CARB',    purchasePrice: 6,  purchaseWeightGrams: 1000, kcalPer100g: 86,  proteinPer100g: 2,  fiberPer100g: 2, carbPer100g: 20, fatPer100g: 0  },
  { name: 'Arroz integral', category: 'CARB',    purchasePrice: 8,  purchaseWeightGrams: 1000, kcalPer100g: 120, proteinPer100g: 3,  fiberPer100g: 2, carbPer100g: 25, fatPer100g: 1  },
  { name: 'Mandioquinha',   category: 'CARB',    purchasePrice: 9,  purchaseWeightGrams: 1000, kcalPer100g: 107, proteinPer100g: 1,  fiberPer100g: 2, carbPer100g: 24, fatPer100g: 0  },
];

async function clearAll() {
  // Ordem importa (relações).
  await prisma.alert.deleteMany();
  await prisma.pricing.deleteMany();
  await prisma.batchItem.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.dietItem.deleteMany();
  await prisma.diet.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.ingredient.deleteMany();
}

async function main() {
  console.log('Limpando dados existentes...');
  await clearAll();

  // Configurações
  await prisma.setting.upsert({
    where: { id: 1 },
    create: { id: 1, laborCostPerHour: 25, packagingUnitCost: 2, defaultMarginPercent: 30, reminderBufferDays: 5 },
    update: { laborCostPerHour: 25, packagingUnitCost: 2, defaultMarginPercent: 30, reminderBufferDays: 5 },
  });

  // Ingredientes
  const ingredients = await Promise.all(
    INGREDIENTS.map((data) => prisma.ingredient.create({ data })),
  );
  const proteins = ingredients.filter((i) => i.category === 'PROTEIN');
  const fibers = ingredients.filter((i) => i.category === 'FIBER');
  const carbs = ingredients.filter((i) => i.category === 'CARB');

  // Clientes (7) com telefones
  const customers = await Promise.all(
    DONOS.map((name, i) =>
      prisma.customer.create({
        data: { name, phone: `(11) 9${String(1000 + i * 137).padStart(4, '0')}-${String(2000 + i * 71).padStart(4, '0')}` },
      }),
    ),
  );

  // 20 cachorros, distribuídos entre os donos, com raça, peso, fator e idade variados (6m a 14 anos)
  const pets = [];
  for (let i = 0; i < 20; i++) {
    const dono = customers[i % customers.length];
    const ageMonths = intBetween(6, 12 * 14);
    const bd = new Date();
    bd.setMonth(bd.getMonth() - ageMonths);
    bd.setDate(1 + intBetween(0, 27));
    const peso = +between(2, 40).toFixed(1);
    pets.push(
      await prisma.pet.create({
        data: {
          name: CACHORROS[i],
          breed: pick(RACAS),
          birthDate: bd,
          weightKg: peso,
          activityFactor: pick(FACTORS),
          customerId: dono.id,
        },
      }),
    );
  }
  console.log(`Criados ${pets.length} cachorros para ${customers.length} clientes.`);

  // Uma dieta por pet (35/30/30 com 1 ingrediente por macro)
  const diets = [];
  for (const pet of pets) {
    const d = await prisma.diet.create({
      data: {
        name: `Dieta do ${pet.name}`,
        petId: pet.id,
        proteinPercent: 35,
        fiberPercent: 30,
        carbPercent: 30,
        items: {
          create: [
            { ingredientId: pick(proteins).id, role: 'PROTEIN' as IngredientCategory },
            { ingredientId: pick(fibers).id, role: 'FIBER' as IngredientCategory },
            { ingredientId: pick(carbs).id, role: 'CARB' as IngredientCategory },
          ],
        },
      },
      include: { items: true },
    });
    diets.push(d);
  }

  // Histórico de lotes espalhados nos últimos 24 meses (3 a 7 por pet)
  const settings = await prisma.setting.findUnique({ where: { id: 1 } });
  let totalBatches = 0;
  let totalPricings = 0;
  let totalAlerts = 0;

  for (const pet of pets) {
    const diet = diets.find((d) => d.petId === pet.id)!;
    const ingMap = new Map(ingredients.map((i) => [i.id, i]));
    const recipeInputs: RecipeIngredientInput[] = diet.items.map((it) => {
      const ing = ingMap.get(it.ingredientId)!;
      return {
        ingredientId: it.ingredientId,
        name: ing.name,
        role: it.role,
        kcalPer100g: Number(ing.kcalPer100g),
        shareWithinGroup: Number(it.shareWithinGroup),
        pricePerGram: pricePerGram(Number(ing.purchasePrice), Number(ing.purchaseWeightGrams)),
      };
    });
    const recipe = buildDailyRecipe(
      Number(pet.weightKg),
      Number(pet.activityFactor),
      { proteinPercent: 35, fiberPercent: 30, carbPercent: 30 },
      recipeInputs,
    );
    const ppgMap = Object.fromEntries(recipeInputs.map((i) => [i.ingredientId, i.pricePerGram]));

    const numBatches = intBetween(3, 7);
    for (let b = 0; b < numBatches; b++) {
      const daysOld = intBetween(15, 24 * 30); // 15 dias a 24 meses atrás
      const plannedDate = daysAgo(daysOld);
      const startConsumptionDate = daysAgo(daysOld - 1);
      const packageCount = intBetween(15, 45);
      const packageWeightGrams = pick([250, 300, 350, 400, 500]);
      const plan = scaleRecipeToBatch(recipe, packageCount, packageWeightGrams, ppgMap);

      const batch = await prisma.batch.create({
        data: {
          dietId: diet.id,
          petId: pet.id,
          packageCount,
          packageWeightGrams,
          status: daysOld > 30 ? 'DELIVERED' : 'DONE',
          plannedDate,
          startConsumptionDate,
          daysOfFood: plan.daysOfFood,
          items: {
            create: plan.ingredients.map((i) => ({
              ingredientId: i.ingredientId,
              gramsTotal: i.gramsTotal,
              costTotal: i.costTotal,
            })),
          },
        },
      });
      totalBatches++;

      // Precificação em ~70% dos lotes
      if (rand() < 0.7) {
        const laborHours = +between(1.5, 4).toFixed(1);
        const margin = pick([25, 30, 35, 40]);
        const pr = calculatePricing({
          ingredientCost: plan.ingredientCostTotal,
          packageCount,
          packagingUnitCost: Number(settings!.packagingUnitCost),
          laborHours,
          laborCostPerHour: Number(settings!.laborCostPerHour),
          marginPercent: margin,
        });
        await prisma.pricing.create({
          data: {
            batchId: batch.id,
            ingredientCost: pr.ingredientCost,
            packagingUnitCost: Number(settings!.packagingUnitCost),
            packagingCost: pr.packagingCost,
            laborHours,
            laborCostPerHour: Number(settings!.laborCostPerHour),
            laborCost: pr.laborCost,
            totalCost: pr.totalCost,
            marginPercent: margin,
            suggestedPrice: pr.suggestedPrice,
            profit: pr.profit,
          },
        });
        totalPricings++;
      }

      // Alerta para lotes recentes (últimos 60 dias): metade pendente, metade recomprou
      if (daysOld <= 60) {
        const remind = new Date(startConsumptionDate);
        remind.setDate(remind.getDate() + Math.max(0, Math.floor(plan.daysOfFood - settings!.reminderBufferDays)));
        await prisma.alert.create({
          data: {
            batchId: batch.id,
            customerId: pet.customerId,
            reminderDate: remind,
            status: rand() < 0.5 ? 'PENDING' : 'REPURCHASED',
            message: `A comida da ${pet.name} está acabando. Oferecer recompra.`,
          },
        });
        totalAlerts++;
      }
    }
  }

  console.log(`Criados ${totalBatches} lotes, ${totalPricings} precificações e ${totalAlerts} alertas.`);
  console.log('Seed concluído.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
