// server/src/utils/auth.ts
import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';
import { GraphQLContext } from '../types';

export async function authorize(
    ctx: GraphQLContext,
    requiredRoles?: Role | Role[] // Можно передать одну роль или массив
) {
    if (!ctx.userId)
        throw new Error ('NOT_AUTHORIZED: UserId not defined');
    if (ctx.companyId === undefined && ctx.locationId === undefined)
        throw new Error('NOT_AUTHORIZED: CONTEXT_REQUIRED: Company or location must be defined');

    const roles = Array.isArray(requiredRoles)
        ? requiredRoles
        : [requiredRoles];
    
    let userAccessLocation = null;
    if (ctx.locationId) {
        userAccessLocation = await prisma.userLocationRoles.findUnique({
            where: { userId_locationId: { userId: ctx.userId, locationId: ctx.locationId } },
        });
    }

    let userAccessCompany = null;
    if (ctx.companyId) {
        userAccessCompany = await prisma.userCompanyRoles.findUnique({
            where: { userId_companyId: { userId: ctx.userId, companyId: ctx.companyId } },
        });
    }


    if (!userAccessCompany && !userAccessLocation) {
        throw new Error('NOT_AUTHORIZED: User has no access niether company nor location');
    }


    // Администратор имеет доступ ко всему
    if (userAccessCompany?.role === Role.ADMIN || userAccessLocation?.role === Role.ADMIN) return true;

    // Проверка на точное соответствие
    if (!roles.includes(userAccessLocation?.role) && !roles.includes(userAccessCompany?.role)) {
        throw new Error('NOT_AUTHORIZED: Insufficient permissions');
    }

    return true;
}
