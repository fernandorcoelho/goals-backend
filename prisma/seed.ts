import 'dotenv/config';
import { PrismaClient, Weekday } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/// Popula um usuário de exemplo com categorias, atribuições e uma rotina simples
/// para facilitar o desenvolvimento local.
async function main() {
  const user = await prisma.user.create({
    data: {
      name: 'Usuário Exemplo',
      nickname: 'exemplo',
      email: 'exemplo@goals.app',
      accounts: {
        create: { provider: 'GOOGLE', providerAccountId: 'seed-google-1' },
      },
    },
  });

  const alimentacao = await prisma.category.create({
    data: {
      name: 'Alimentação',
      userId: user.id,
      tasks: {
        create: [{ name: 'Café da manhã' }, { name: 'Almoço' }, { name: 'Jantar' }],
      },
    },
  });

  const exercicios = await prisma.category.create({
    data: {
      name: 'Exercícios',
      userId: user.id,
      tasks: { create: [{ name: 'Corrida' }, { name: 'Musculação' }] },
    },
  });

  const routine = await prisma.routine.create({ data: { userId: user.id } });

  await prisma.routineDay.create({
    data: {
      weekday: Weekday.MONDAY,
      routineId: routine.id,
      categories: { connect: [{ id: alimentacao.id }, { id: exercicios.id }] },
    },
  });

  console.log(`Seed concluído. Usuário: ${user.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
