// server/src/utils/auth.ts
import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';
import { GraphQLContext } from '../types';

export async function authorize(
    ctx: GraphQLContext,
    requiredRoles?: Role | Role[] // Можно передать одну роль или массив
) {
    if (ctx.companyId === undefined)
        throw new Error('CONTEXT_REQUIRED: Undefined company');
    if (ctx.locationId === undefined)
        throw new Error('CONTEXT_REQUIRED: Undefined location');

    if (!ctx.userId)
        throw new Error('NOT_AUTHORIZED: Authenticated user required');
    const roles = Array.isArray(requiredRoles)
        ? requiredRoles
        : [requiredRoles];

    const userId = ctx.userId;
    const locationId = ctx.locationId;

    const userAccess = await prisma.userLocationRoles.findUnique({
        where: { userId_locationId: { userId, locationId } },
    });

    if (!userAccess) {
        throw new Error('NOT_AUTHORIZED: Access to location denied');
    }

    // Администратор имеет доступ ко всему
    if (userAccess.role === Role.ADMIN) return true;

    // Проверка на точное соответствие
    if (!roles.includes(userAccess.role)) {
        throw new Error('NOT_AUTHORIZED: Insufficient permissions');
    }

    return true;
}
