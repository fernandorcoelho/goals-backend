import 'dotenv/config';
import { PrismaClient, Weekday } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/// Popula um usuário de exemplo com uma rotina simples e tarefas em alguns dias
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
      routine: {
        create: {
          days: {
            create: Object.values(Weekday).map((weekday) => ({ weekday })),
          },
        },
      },
    },
    include: { routine: { include: { days: true } } },
  });

  const monday = user.routine?.days.find((day) => day.weekday === Weekday.MONDAY);

  if (monday) {
    await prisma.task.createMany({
      data: [
        { name: 'Café da manhã', routineDayId: monday.id },
        { name: 'Almoço', routineDayId: monday.id },
        { name: 'Corrida', routineDayId: monday.id },
      ],
    });
  }

  console.log(`Seed concluído. Usuário: ${user.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
