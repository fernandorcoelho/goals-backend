import { Prisma, Weekday } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

/// Ordem fixa dos dias da semana, igual para todos os usuários.
const WEEKDAYS = Object.values(Weekday);

const routineInclude = {
  days: {
    orderBy: { weekday: 'asc' },
    include: { tasks: { orderBy: { createdAt: 'asc' } } },
  },
} as const;

/// Monta os sete dias da semana (sem tarefas) para a rotina inicial de um
/// usuário. Toda rotina nasce com a semana inteira pronta para receber tarefas.
/// Usado na criação da conta e sob demanda.
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
