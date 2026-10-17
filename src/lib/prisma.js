import { PrismaClient } from '@prisma/client';

// If DATABASE_URL is not set in development, avoid creating a real PrismaClient
// because the client validates the datasource and will throw. Instead export a
// lightweight stub that implements the minimal methods the app expects and
// returns empty results. In production we always create a real client.
const globalForPrisma = globalThis;

function createStub() {
  const empty = async () => [];
  const nullish = async () => null;
  const zero = async () => 0;
  const stubModel = {
    findMany: empty,
    findUnique: nullish,
    findFirst: nullish,
    create: nullish,
    update: nullish,
    delete: nullish,
    count: zero,
  };

  return {
    project: stubModel,
    blog: stubModel,
    video: stubModel,
    skill: stubModel,
    message: stubModel,
    settings: { findFirst: nullish },
  };
}

let prisma;
const PRISMA_STUB = !process.env.DATABASE_URL && process.env.NODE_ENV !== 'production';
if (PRISMA_STUB) {
  // Development without a configured database: return stub to keep app running.
  prisma = createStub();
} else {
  if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
  } else {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient();
    }
    prisma = globalForPrisma.prisma;
  }
}

export { PRISMA_STUB };
export default prisma;
