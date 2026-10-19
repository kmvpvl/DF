// server/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaAdapter(): PrismaMariaDb {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error('DATABASE_URL is not set');
    }

    let parsedUrl: URL;
    try {
        parsedUrl = new URL(databaseUrl);
    } catch {
        throw new Error('DATABASE_URL is not a valid URL');
    }

    if (!['mysql:', 'mariadb:'].includes(parsedUrl.protocol)) {
        throw new Error(
            `Unsupported database protocol "${parsedUrl.protocol}". Use mysql:// or mariadb://`
        );
    }

    const databaseName = decodeURIComponent(
        parsedUrl.pathname.replace(/^\//, '')
    );
    if (!databaseName) {
        throw new Error('DATABASE_URL must include a database name');
    }

    return new PrismaMariaDb({
        host: parsedUrl.hostname,
        port: parsedUrl.port ? Number.parseInt(parsedUrl.port, 10) : 3306,
        user: decodeURIComponent(parsedUrl.username),
        password: decodeURIComponent(parsedUrl.password),
        database: databaseName,
    });
}

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter: createPrismaAdapter(),
        log: ['query', 'error', 'warn'], // Полезно для отладки
    }).$extends({
        query: {
            async $allOperations({ operation, model, args, query }) {
                const start = performance.now();
                const result = await query(args);
                const end = performance.now();
                // Можно добавить логику: если запрос долгий - писать в лог
                return result;
            },
        },
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
