/**
 * Database Configuration
 * 
 * This file sets up the Prisma client with a PostgreSQL adapter.
 * The connection string is read from DATABASE_URL environment variable.
 * 
 * Usage:
 *   import { prisma } from "@/lib/db";
 *   const users = await prisma.user.findMany();
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/** PostgreSQL adapter for Prisma using the native pg driver */
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

/**
 * Prisma client instance for database operations.
 * This is a singleton - import and use directly.
 */
export const prisma = new PrismaClient({
  adapter,
});