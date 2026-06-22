import { Prisma, Weekday } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { badRequest } from '../errors/http-error.js';

/// Ordem fixa dos dias da semana, igual para todos os usuários.
const WEEKDAYS = Object.values(Weekday);

const routineInclude = {
  days: {
    orderBy: { weekday: 'asc' },
    include: { categories: { orderBy: { name: 'asc' } } },
  },
} as const;

/// Monta os sete dias da semana (sem categorias) para a rotina inicial de um
/// usuário. Toda rotina nasce com a semana inteira pronta para receber
/// categorias. Usado na criação da conta e sob demanda.
export function initialRoutineDays(): Prisma.RoutineDayCreateNestedManyWithoutRoutineInput {
  return { create: WEEKDAYS.map((weekday) => ({ weekday })) };
}

/// Retorna a rotina do usuário, criando-a sob demanda caso ainda não exista.
/// Há no máximo uma rotina por usuário (relação 1:1).
export async function getOrCreateRoutine(userId: string) {
  const existing = await prisma.routine.findUnique({
    where: { userId },
    include: routineInclude,
  });

  if (existing) {
    return existing;
  }

  return prisma.routine.create({
    data: { userId, days: initialRoutineDays() },
    include: routineInclude,
  });
}

/// Confere que todas as categorias informadas existem e pertencem ao usuário.
async function assertCategoriesBelongToUser(userId: string, categoryIds: string[]): Promise<void> {
  const count = await prisma.category.count({
    where: { userId, id: { in: categoryIds } },
  });

  if (count !== categoryIds.length) {
    throw badRequest('Uma ou mais categorias não existem ou não pertencem ao usuário.');
  }
}

/// Define as categorias atribuídas a um dia da semana. Regra de negócio: cada
/// dia configurado deve ter no mínimo uma categoria.
export async function setDayCategories(userId: string, weekday: Weekday, categoryIds: string[]) {
  if (categoryIds.length === 0) {
    throw badRequest('Cada dia da rotina deve ter no mínimo uma categoria.');
  }

  const uniqueIds = [...new Set(categoryIds)];
  await assertCategoriesBelongToUser(userId, uniqueIds);

  const routine = await getOrCreateRoutine(userId);
  const categoryRefs = uniqueIds.map((id) => ({ id }));

  return prisma.routineDay.upsert({
    where: { routineId_weekday: { routineId: routine.id, weekday } },
    create: { weekday, routineId: routine.id, categories: { connect: categoryRefs } },
    update: { categories: { set: categoryRefs } },
    include: { categories: { orderBy: { name: 'asc' } } },
  });
}

/// Esvazia um dia da rotina, removendo todas as categorias atribuídas a ele.
/// O dia permanece na semana: a rotina sempre mantém os sete dias.
export async function clearDay(userId: string, weekday: Weekday): Promise<void> {
  const routine = await getOrCreateRoutine(userId);
  await prisma.routineDay.update({
    where: { routineId_weekday: { routineId: routine.id, weekday } },
    data: { categories: { set: [] } },
  });
}
