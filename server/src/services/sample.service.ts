import { prisma } from '../lib/prisma';
import { getYearRange } from '../utils/common';

export class SampleService {
    static async getNextSampleNumber(date = new Date()): Promise<number> {
        const { start, end } = getYearRange(date);
        const aggregate = await prisma.sample.aggregate({
            where: {
                createdAt: {
                    gte: start,
                    lte: end,
                },
            },
            _max: {
                number: true,
            },
        });

        return (aggregate._max.number ?? 0) + 1;
    }

    static formatSampleNumberString(date: Date, sampleNumber: number): string {
        const shortYear = String(date.getFullYear()).slice(-2);
        return `${shortYear}-${sampleNumber}`;
    }
}
