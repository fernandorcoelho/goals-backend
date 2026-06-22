import { prisma } from '../lib/prisma.js';
import { notFound } from '../errors/http-error.js';

const publicUserSelect = {
  id: true,
  name: true,
  nickname: true,
  photoUrl: true,
  email: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface ProfileUpdate {
  name?: string;
  nickname?: string;
  photoUrl?: string;
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });

  if (!user) {
    throw notFound('Usuário não encontrado.');
  }

  return user;
}

export async function updateProfile(userId: string, data: ProfileUpdate) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: publicUserSelect,
  });
}
