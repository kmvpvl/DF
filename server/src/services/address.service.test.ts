/// <reference types="vitest/globals" />
import { AddressService, calculateDeliveryCost } from './address.service';
import type { GraphQLContext } from '..';

vi.mock('../lib/prisma', () => ({ prisma: {} }));

describe('calculateDeliveryCost', () => {
    it('uses the one-way route distance plus the dispatch and meeting fees', () => {
        expect(calculateDeliveryCost(12_300, 2, 10, 5)).toBeCloseTo(39.6);
    });

    describe('estimateForOrder', () => {
        it('reuses the verified saved route when the delivery address is unchanged', async () => {
            const estimate = {
                distanceMeters: 12_300,
                durationSeconds: 900,
                isValidAddress: true,
                deliveryCost: 39.6,
                currencySymbol: 'din',
            };
            vi.spyOn(
                AddressService,
                'getVerifiedDeliveryAddress'
            ).mockResolvedValue({
                address: 'Knez Mihailova 1, Belgrade',
                lat: 44.8176,
                lon: 20.4569,
                ...estimate,
            });
            const routeSpy = vi
                .spyOn(AddressService, 'estimateDelivery')
                .mockRejectedValue(new Error('Unexpected route request'));

            await expect(
                AddressService.estimateForOrder(
                    {} as GraphQLContext,
                    '  Knez Mihailova   1, BELGRADE ',
                    { lat: 44.8176, lon: 20.4569 }
                )
            ).resolves.toEqual(estimate);
            expect(routeSpy).not.toHaveBeenCalled();
        });
    });

    it('does not present a quote until every location tariff is configured', () => {
        expect(calculateDeliveryCost(12_300, 2, 10, null)).toBeNull();
    });

    it('allows an explicitly configured zero-cost tariff', () => {
        expect(calculateDeliveryCost(12_300, 0, 0, 0)).toBe(0);
    });

    it('rejects invalid configured tariff values', () => {
        expect(() => calculateDeliveryCost(12_300, -1, 10, 5)).toThrow(
            'Delivery tariff and distance must be non-negative numbers'
        );
    });
});
