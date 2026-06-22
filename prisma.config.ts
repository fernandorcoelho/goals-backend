import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// No Prisma 7 a URL de conexão saiu do schema.prisma e passa a ser configurada
// aqui (usada pelas Migrations/CLI). O cliente em runtime usa o driver adapter.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
