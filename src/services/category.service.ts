import { prisma } from '../lib/prisma.js';
import { notFound } from '../errors/http-error.js';

/// Garante que a categoria existe e pertence ao usuário. Centraliza a checagem
/// de posse usada por todas as operações de categoria e de tarefa.
async function getOwnedCategory(userId: string, categoryId: string) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
  });

  if (!category) {
    throw notFound('Categoria não encontrada.');
  }

  return category;
}

export function listCategories(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    include: { tasks: { orderBy: { createdAt: 'asc' } } },
  });
}

export async function getCategory(userId: string, categoryId: string) {
  await getOwnedCategory(userId, categoryId);
  return prisma.category.findUnique({
    where: { id: categoryId },
    include: { tasks: { orderBy: { createdAt: 'asc' } } },
  });
}

export function createCategory(userId: string, name: string) {
  return prisma.category.create({
    data: { name, userId },
    include: { tasks: true },
  });
}

export async function renameCategory(userId: string, categoryId: string, name: string) {
  await getOwnedCategory(userId, categoryId);
  return prisma.category.update({
    where: { id: categoryId },
    data: { name },
    include: { tasks: { orderBy: { createdAt: 'asc' } } },
  });
}

export async function deleteCategory(userId: string, categoryId: string) {
  await getOwnedCategory(userId, categoryId);
  await prisma.category.delete({ where: { id: categoryId } });
}

export async function addTask(userId: string, categoryId: string, name: string) {
  await getOwnedCategory(userId, categoryId);
  return prisma.categoryTask.create({ data: { name, categoryId } });
}

async function getOwnedTask(userId: string, categoryId: string, taskId: string) {
  await getOwnedCategory(userId, categoryId);
  const task = await prisma.categoryTask.findFirst({
    where: { id: taskId, categoryId },
  });

  if (!task) {
    throw notFound('Tarefa não encontrada.');
  }

  return task;
}

export async function renameTask(
  userId: string,
  categoryId: string,
  taskId: string,
  name: string,
) {
  await getOwnedTask(userId, categoryId, taskId);
  return prisma.categoryTask.update({ where: { id: taskId }, data: { name } });
}

export async function deleteTask(userId: string, categoryId: string, taskId: string) {
  await getOwnedTask(userId, categoryId, taskId);
  await prisma.categoryTask.delete({ where: { id: taskId } });
}

type TaskCompletion = { id: string; completed: boolean };

/// Garante que todas as tarefas informadas existem e pertencem ao usuário.
/// Falha se alguma não for encontrada, evitando atualizações parciais.
async function assertOwnedTasks(userId: string, taskIds: string[]): Promise<void> {
  const owned = await prisma.categoryTask.count({
    where: { id: { in: taskIds }, category: { userId } },
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
    prisma.categoryTask.updateMany({
      where: { id: { in: completedIds } },
      data: { completed: true },
    }),
    prisma.categoryTask.updateMany({
      where: { id: { in: uncompletedIds } },
      data: { completed: false },
    }),
  ]);

  return prisma.categoryTask.findMany({
    where: { id: { in: completions.map((completion) => completion.id) } },
    orderBy: { createdAt: 'asc' },
  });
}
