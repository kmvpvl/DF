import { prisma } from '../lib/prisma.js';
import { IAddressSuggestion, ICoords, IRouteEstimate } from '@df/types/company';
import { GraphQLContext } from '../index.js';

const GEOAPIFY_TTL_MS = 5 * 60 * 1000;
const ROUTE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;

interface CacheEntry<T> {
    expiresAt: number;
    value?: T;
    pending?: Promise<T>;
}

interface ExternalRouteEstimate {
    distanceMeters: number;
    durationSeconds: number;
}

interface DeliveryLocationConfig {
    id: string;
    city: string | null;
    location: ICoords;
    currencySymbol: string;
    deliveryPricePerKm: number | null;
    deliveryDispatchFee: number | null;
    deliveryMeetingFee: number | null;
}

const addressCache = new Map<string, CacheEntry<IAddressSuggestion[]>>();
const routeCache = new Map<string, CacheEntry<ExternalRouteEstimate>>();

async function getCached<T>(
    cache: Map<string, CacheEntry<T>>,
    key: string,
    ttlMs: number,
    load: () => Promise<T>
): Promise<T> {
    const now = Date.now();
    const entry = cache.get(key);
    if (entry && entry.expiresAt > now) {
        if (entry.value !== undefined) return entry.value;
        if (entry.pending) return entry.pending;
    }

    const pending = load();
    cache.set(key, { expiresAt: now + ttlMs, pending });
    try {
        const value = await pending;
        cache.set(key, { expiresAt: Date.now() + ttlMs, value });
        while (cache.size > MAX_CACHE_ENTRIES) {
            const oldestKey = cache.keys().next().value;
            if (oldestKey === undefined) break;
            cache.delete(oldestKey);
        }
        return value;
    } catch (error) {
        cache.delete(key);
        throw error;
    }
}

function isCoords(value: unknown): value is ICoords {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return false;
    }
    const coords = value as { lat?: unknown; lon?: unknown };
    return (
        typeof coords.lat === 'number' &&
        Number.isFinite(coords.lat) &&
        coords.lat >= -90 &&
        coords.lat <= 90 &&
        typeof coords.lon === 'number' &&
        Number.isFinite(coords.lon) &&
        coords.lon >= -180 &&
        coords.lon <= 180
    );
}

function normalizeAddress(value: string) {
    return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

export function calculateDeliveryCost(
    distanceMeters: number,
    pricePerKm: number | null,
    dispatchFee: number | null,
    meetingFee: number | null
): number | null {
    if (pricePerKm === null || dispatchFee === null || meetingFee === null) {
        return null;
    }
    if (
        !Number.isFinite(distanceMeters) ||
        distanceMeters < 0 ||
        ![pricePerKm, dispatchFee, meetingFee].every(
            (value) => Number.isFinite(value) && value >= 0
        )
    ) {
        throw new Error(
            'Delivery tariff and distance must be non-negative numbers'
        );
    }

    return (distanceMeters / 1000) * pricePerKm + dispatchFee + meetingFee;
}

export class AddressService {
    private static async getLocation(
        ctx: GraphQLContext
    ): Promise<DeliveryLocationConfig> {
        if (!ctx.locationId) {
            throw new Error('Location ID is missing from request context');
        }
        const location = await prisma.location.findUnique({
            where: { id: ctx.locationId },
            select: {
                id: true,
                city: true,
                location: true,
                currencySymbol: true,
                deliveryPricePerKm: true,
                deliveryDispatchFee: true,
                deliveryMeetingFee: true,
            },
        });
        const origin = location?.location;

        if (!location || !isCoords(origin)) {
            throw new Error(
                `Location id "${ctx.locationId}" must have valid coordinates for route calculation`
            );
        }

        return { ...location, location: origin };
    }

    static async searchAddress(ctx: GraphQLContext, query: string) {
        const normalizedQuery = query.trim().replace(/\s+/g, ' ');
        if (normalizedQuery.length < 3) return [];

        const location = await this.getLocation(ctx);
        const cacheKey = `${location.id}:${normalizedQuery.toLocaleLowerCase()}`;

        return getCached(addressCache, cacheKey, GEOAPIFY_TTL_MS, async () => {
            const apiKey = process.env.GEOAPIFY_KEY;
            if (!apiKey) throw new Error('GEOAPIFY_KEY is not configured');

            const params = new URLSearchParams({
                text: `${normalizedQuery} ${location.city ?? ''}`.trim(),
                filter: 'countrycode:rs',
                lang: 'sr',
                limit: '5',
                apiKey,
            });
            const response = await fetch(
                `https://api.geoapify.com/v1/geocode/search?${params}`
            );
            if (!response.ok) {
                throw new Error(
                    `Address search service failed (HTTP ${response.status})`
                );
            }

            const data = (await response.json()) as {
                features?: {
                    properties?: {
                        formatted?: unknown;
                        lat?: unknown;
                        lon?: unknown;
                        housenumber?: unknown;
                    };
                }[];
            };

            return (data.features ?? []).flatMap((feature) => {
                const properties = feature.properties;
                if (
                    typeof properties?.formatted !== 'string' ||
                    typeof properties.lat !== 'number' ||
                    !Number.isFinite(properties.lat) ||
                    typeof properties.lon !== 'number' ||
                    !Number.isFinite(properties.lon)
                ) {
                    return [];
                }

                return [
                    {
                        formatted: properties.formatted,
                        lat: properties.lat,
                        lon: properties.lon,
                        isExactHouse: Boolean(properties.housenumber),
                    },
                ];
            });
        });
    }

    static async estimateDelivery(ctx: GraphQLContext, dest: ICoords) {
        if (!isCoords(dest)) {
            throw new Error('Destination coordinates are invalid');
        }

        const location = await this.getLocation(ctx);
        const route = await this.estimateRoute(ctx, dest, location);

        const deliveryCost = calculateDeliveryCost(
            route.distanceMeters,
            location.deliveryPricePerKm,
            location.deliveryDispatchFee,
            location.deliveryMeetingFee
        );

        const estimate: IRouteEstimate = {
            ...route,
            isValidAddress: true,
            deliveryCost,
            currencySymbol: location.currencySymbol,
        };
        return estimate;
    }

    static async verifyDeliveryAddress(
        ctx: GraphQLContext,
        address: string,
        dest: ICoords
    ) {
        const formattedAddress = address.trim();
        if (!formattedAddress) {
            throw new Error('Delivery address is required');
        }

        const estimate = await this.estimateDelivery(ctx, dest);
        const userId = ctx.req.session.userId;
        if (userId) {
            await this.saveVerifiedAddress(
                ctx,
                userId,
                formattedAddress,
                dest,
                estimate
            );
        }

        return estimate;
    }

    static async getVerifiedDeliveryAddress(ctx: GraphQLContext) {
        const userId = ctx.req.session.userId;
        if (!userId) return null;

        const user = await prisma.user.findUnique({
            where: { id: userId, blocked: false },
            select: { deliveryAddress: true, location: true },
        });
        const storedLocation = user?.location;
        if (
            !user?.deliveryAddress ||
            typeof storedLocation !== 'object' ||
            storedLocation === null ||
            Array.isArray(storedLocation)
        ) {
            return null;
        }

        const location = storedLocation as Record<string, unknown>;
        if (location.verified !== true || !isCoords(location)) return null;

        const source = await this.getLocation(ctx);
        const routeIsCurrent =
            location.originLat === source.location.lat &&
            location.originLon === source.location.lon &&
            typeof location.distanceMeters === 'number' &&
            Number.isFinite(location.distanceMeters) &&
            location.distanceMeters >= 0 &&
            typeof location.durationSeconds === 'number' &&
            Number.isFinite(location.durationSeconds) &&
            location.durationSeconds >= 0;

        let route: ExternalRouteEstimate;
        if (routeIsCurrent) {
            route = {
                distanceMeters: location.distanceMeters as number,
                durationSeconds: location.durationSeconds as number,
            };
        } else {
            route = await this.estimateRoute(ctx, location, source);
            await this.saveVerifiedAddress(
                ctx,
                userId,
                user.deliveryAddress,
                location,
                {
                    ...route,
                    isValidAddress: true,
                    deliveryCost: null,
                    currencySymbol: source.currencySymbol,
                }
            );
        }

        return {
            address: user.deliveryAddress,
            lat: location.lat,
            lon: location.lon,
            ...route,
            isValidAddress: true,
            deliveryCost: calculateDeliveryCost(
                route.distanceMeters,
                source.deliveryPricePerKm,
                source.deliveryDispatchFee,
                source.deliveryMeetingFee
            ),
            currencySymbol: source.currencySymbol,
        };
    }

    static async estimateForOrder(
        ctx: GraphQLContext,
        address: string,
        dest: ICoords
    ) {
        const saved = await this.getVerifiedDeliveryAddress(ctx);
        if (
            saved &&
            normalizeAddress(saved.address) === normalizeAddress(address) &&
            saved.lat === dest.lat &&
            saved.lon === dest.lon
        ) {
            return {
                distanceMeters: saved.distanceMeters,
                durationSeconds: saved.durationSeconds,
                isValidAddress: saved.isValidAddress,
                deliveryCost: saved.deliveryCost,
                currencySymbol: saved.currencySymbol,
            };
        }
        return this.estimateDelivery(ctx, dest);
    }

    private static async estimateRoute(
        ctx: GraphQLContext,
        dest: ICoords,
        location?: DeliveryLocationConfig
    ): Promise<ExternalRouteEstimate> {
        const source = location ?? (await this.getLocation(ctx));
        const routeCacheKey = [
            source.id,
            source.location.lat.toFixed(6),
            source.location.lon.toFixed(6),
            dest.lat.toFixed(6),
            dest.lon.toFixed(6),
        ].join(':');

        return getCached(routeCache, routeCacheKey, ROUTE_TTL_MS, async () => {
            const apiKey = process.env.ORS_API_KEY;
            if (!apiKey) throw new Error('ORS_API_KEY is not configured');

            const params = new URLSearchParams({
                api_key: apiKey,
                start: `${source.location.lon},${source.location.lat}`,
                end: `${dest.lon},${dest.lat}`,
            });
            const response = await fetch(
                `https://api.heigit.org/openrouteservice/v2/directions/driving-car?${params}`
            );
            if (!response.ok) {
                throw new Error(
                    `Route calculation service failed (HTTP ${response.status})`
                );
            }

            const data = (await response.json()) as {
                features?: {
                    properties?: {
                        summary?: {
                            distance?: unknown;
                            duration?: unknown;
                        };
                    };
                }[];
            };
            const summary = data.features?.[0]?.properties?.summary;
            if (
                typeof summary?.distance !== 'number' ||
                !Number.isFinite(summary.distance) ||
                summary.distance < 0 ||
                typeof summary.duration !== 'number' ||
                !Number.isFinite(summary.duration) ||
                summary.duration < 0
            ) {
                throw new Error('Route calculation service returned no route');
            }

            return {
                distanceMeters: summary.distance,
                durationSeconds: summary.duration,
            };
        });
    }

    private static async saveVerifiedAddress(
        ctx: GraphQLContext,
        userId: string,
        address: string,
        dest: ICoords,
        estimate: IRouteEstimate
    ) {
        const source = await this.getLocation(ctx);
        await prisma.user.update({
            where: { id: userId },
            data: {
                deliveryAddress: address,
                location: {
                    lat: dest.lat,
                    lon: dest.lon,
                    verified: true,
                    distanceMeters: estimate.distanceMeters,
                    durationSeconds: estimate.durationSeconds,
                    originLat: source.location.lat,
                    originLon: source.location.lon,
                },
            },
        });
    }
}
