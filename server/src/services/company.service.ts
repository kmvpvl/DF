import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { GraphQLContext } from '..';

export class CompanyService {
    static async info(ctx: GraphQLContext) {
        return prisma.company.findFirst({
            where: {
                id: ctx.companyId,
            },
            include: {
                locations: true,
            },
        });
    }
    static async locationManagers(ctx: GraphQLContext) {
        const users = await prisma.userLocationRoles.findMany({
            where: {
                AND: [
                    { locationId: ctx.locationId },
                    {
                        OR: [
                            { role: Role.MANAGER },
                            { role: Role.ADMIN },
                            { role: Role.SUPERVISOR },
                        ],
                    },
                ],
            },
            include: {
                user: true,
            },
        });
        return users;
    }
}
