import type { Weekday } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { badRequest } from '../errors/http-error.js';

const routineInclude = {
  days: {
    orderBy: { weekday: 'asc' },
    include: { categories: { orderBy: { name: 'asc' } } },
  },
} as const;

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
    data: { userId },
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

/// Remove a configuração de um dia da rotina.
export async function clearDay(userId: string, weekday: Weekday): Promise<void> {
  const routine = await getOrCreateRoutine(userId);
  await prisma.routineDay.deleteMany({
    where: { routineId: routine.id, weekday },
  });
}
