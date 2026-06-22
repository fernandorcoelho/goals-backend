import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../config/env.js';

// No Prisma 7 a conexão em runtime é feita por um driver adapter (aqui, o do
// PostgreSQL via `pg`) passado ao construtor do PrismaClient.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: env.databaseUrl });
  return new PrismaClient({ adapter, log: ['warn', 'error'] });
}

// Singleton para evitar múltiplas conexões durante o hot-reload em dev.
export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
