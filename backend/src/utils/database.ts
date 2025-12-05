import { PrismaClient } from '@prisma/client';

// Singleton para Prisma Client
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Helper para transacciones seguras
export async function withTransaction<T>(
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    return callback(tx as PrismaClient);
  });
}

// Helper para manejo de errores de base de datos
export function handleDatabaseError(error: any): string {
  if (error.code === 'P2002') {
    // Unique constraint violation
    return 'Ya existe un registro con estos datos';
  }
  if (error.code === 'P2025') {
    // Record not found
    return 'Registro no encontrado';
  }
  if (error.code === 'P2003') {
    // Foreign key constraint failed
    return 'Referencia inválida';
  }
  
  return error.message || 'Error de base de datos';
}
