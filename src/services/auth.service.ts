import type { AuthProvider, User } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export interface OAuthProfile {
  provider: AuthProvider;
  providerAccountId: string;
  name: string;
  email?: string;
  photoUrl?: string;
}

/// Encontra o usuário vinculado a uma conta de provedor OAuth ou cria um novo na
/// primeira vez (não há tela de cadastro: o usuário nasce do login social).
export async function findOrCreateUserFromOAuth(profile: OAuthProfile): Promise<User> {
  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
      },
    },
    include: { user: true },
  });

  if (existingAccount) {
    return existingAccount.user;
  }

  return prisma.user.create({
    data: {
      name: profile.name,
      email: profile.email,
      photoUrl: profile.photoUrl,
      accounts: {
        create: {
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
        },
      },
    },
  });
}
