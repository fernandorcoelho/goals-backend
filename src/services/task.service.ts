import { Weekday } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../errors/http-error.js';
import { getOrCreateRoutine } from './routine.service.js';

/// Cria uma tarefa no dia indicado da rotina do usuário. A rotina (e seus sete
/// dias) é criada sob demanda, então o dia sempre existe.
export async function addTask(userId: string, weekday: Weekday, name: string) {
  const routine = await getOrCreateRoutine(userId);
  const day = routine.days.find((routineDay) => routineDay.weekday === weekday);

  if (!day) {
    throw notFound('Dia da rotina não encontrado.');
  }

  return prisma.task.create({ data: { name, routineDayId: day.id } });
}

/// Garante que a tarefa existe e pertence ao usuário (via dia -> rotina).
/// Centraliza a checagem de posse usada por todas as operações de tarefa.
async function getOwnedTask(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, routineDay: { routine: { userId } } },
  });

  if (!task) {
    throw notFound('Tarefa não encontrada.');
  }

  return task;
}

export async function renameTask(userId: string, taskId: string, name: string) {
  await getOwnedTask(userId, taskId);
  return prisma.task.update({ where: { id: taskId }, data: { name } });
}

export async function deleteTask(userId: string, taskId: string) {
  await getOwnedTask(userId, taskId);
  await prisma.task.delete({ where: { id: taskId } });
}
