import { prisma } from '../lib/prisma.js';
import { notFound } from '../errors/http-error.js';

/// Garante que a categoria existe e pertence ao usuário. Centraliza a checagem
/// de posse usada por todas as operações de categoria e de item.
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
    include: { items: { orderBy: { createdAt: 'asc' } } },
  });
}

export async function getCategory(userId: string, categoryId: string) {
  await getOwnedCategory(userId, categoryId);
  return prisma.category.findUnique({
    where: { id: categoryId },
    include: { items: { orderBy: { createdAt: 'asc' } } },
  });
}

export function createCategory(userId: string, name: string) {
  return prisma.category.create({
    data: { name, userId },
    include: { items: true },
  });
}

export async function renameCategory(userId: string, categoryId: string, name: string) {
  await getOwnedCategory(userId, categoryId);
  return prisma.category.update({
    where: { id: categoryId },
    data: { name },
    include: { items: { orderBy: { createdAt: 'asc' } } },
  });
}

export async function deleteCategory(userId: string, categoryId: string) {
  await getOwnedCategory(userId, categoryId);
  await prisma.category.delete({ where: { id: categoryId } });
}

export async function addItem(userId: string, categoryId: string, name: string) {
  await getOwnedCategory(userId, categoryId);
  return prisma.categoryItem.create({ data: { name, categoryId } });
}

async function getOwnedItem(userId: string, categoryId: string, itemId: string) {
  await getOwnedCategory(userId, categoryId);
  const item = await prisma.categoryItem.findFirst({
    where: { id: itemId, categoryId },
  });

  if (!item) {
    throw notFound('Atribuição não encontrada.');
  }

  return item;
}

export async function renameItem(
  userId: string,
  categoryId: string,
  itemId: string,
  name: string,
) {
  await getOwnedItem(userId, categoryId, itemId);
  return prisma.categoryItem.update({ where: { id: itemId }, data: { name } });
}

export async function deleteItem(userId: string, categoryId: string, itemId: string) {
  await getOwnedItem(userId, categoryId, itemId);
  await prisma.categoryItem.delete({ where: { id: itemId } });
}
