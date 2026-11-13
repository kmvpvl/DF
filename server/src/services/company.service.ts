import { prisma } from '../lib/prisma';
import { GraphQLContext } from '../types/types';

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
}
