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

type TaskCompletion = { id: string; completed: boolean };

/// Garante que todas as tarefas informadas existem e pertencem ao usuário.
/// Falha se alguma não for encontrada, evitando atualizações parciais.
async function assertOwnedTasks(userId: string, taskIds: string[]): Promise<void> {
  const owned = await prisma.task.count({
    where: { id: { in: taskIds }, routineDay: { routine: { userId } } },
  });

  if (owned !== taskIds.length) {
    throw notFound('Tarefa não encontrada.');
  }
}

/// Marca/desmarca em lote as tarefas como concluídas. Agrupa pelo valor de
/// `completed` para resolver tudo em duas escritas, dentro de uma transação.
export async function setTasksCompletion(userId: string, completions: TaskCompletion[]) {
  await assertOwnedTasks(userId, completions.map((completion) => completion.id));

  const completedIds = completions
    .filter((completion) => completion.completed)
    .map((completion) => completion.id);
  const uncompletedIds = completions
    .filter((completion) => !completion.completed)
    .map((completion) => completion.id);

  await prisma.$transaction([
    prisma.task.updateMany({
      where: { id: { in: completedIds } },
      data: { completed: true },
    }),
    prisma.task.updateMany({
      where: { id: { in: uncompletedIds } },
      data: { completed: false },
    }),
  ]);

  return prisma.task.findMany({
    where: { id: { in: completions.map((completion) => completion.id) } },
    orderBy: { createdAt: 'asc' },
  });
}
