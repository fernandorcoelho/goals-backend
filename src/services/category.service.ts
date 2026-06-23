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
