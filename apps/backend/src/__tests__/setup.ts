import { PrismaClient } from '@prisma/client';

// Mock Prisma client for tests
export const prismaMock = new PrismaClient();

// Set test timeout
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
  await prismaMock.$disconnect();
});
