export const vapidKeys = {
  publicKey: process.env.PUBLIC_VAPID_KEY!,
  privateKey: process.env.PRIVATE_VAPID_KEY!
};

export function getYearRange(date: Date): { start: Date; end: Date } {
    const year = date.getFullYear();
    return {
        start: new Date(year, 0, 1, 0, 0, 0, 0),
        end: new Date(year, 11, 31, 23, 59, 59, 999),
    };
}

export function parseCsvBoolean(rawValue: string): boolean {
    const normalized = rawValue.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) {
        return true;
    }

    if (['false', '0', 'no', ''].includes(normalized)) {
        return false;
    }

    throw new Error(`Invalid boolean value "${rawValue}"`);
}

export function parseCsvNumber(rawValue: string): number {
    const normalized = rawValue.trim();
    if (!normalized) {
        throw new Error('Value is required');
    }

    const decimalNormalized = /^-?\d+,\d+$/.test(normalized)
        ? normalized.replace(',', '.')
        : normalized;
    const parsed = Number.parseFloat(decimalNormalized);
    if (!Number.isFinite(parsed)) {
        throw new Error(`Invalid number value "${rawValue}"`);
    }

    return parsed;
}

export function parseCsv(content: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentValue = '';
    let inQuotes = false;

    for (let i = 0; i < content.length; i += 1) {
        const char = content[i];
        const next = content[i + 1];

        if (char === '"') {
            if (inQuotes && next === '"') {
                currentValue += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === ';' && !inQuotes) {
            currentRow.push(currentValue);
            currentValue = '';
            continue;
        }

        if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && next === '\n') {
                i += 1;
            }

            currentRow.push(currentValue);
            const hasNonEmptyValue = currentRow.some(
                (value) => value.trim().length > 0
            );
            if (hasNonEmptyValue) {
                rows.push(currentRow);
            }

            currentRow = [];
            currentValue = '';
            continue;
        }

        currentValue += char;
    }

    if (inQuotes) {
        throw new Error('CSV contains unclosed quoted value');
    }

    if (currentValue.length > 0 || currentRow.length > 0) {
        currentRow.push(currentValue);
        const hasNonEmptyValue = currentRow.some(
            (value) => value.trim().length > 0
        );
        if (hasNonEmptyValue) {
            rows.push(currentRow);
        }
    }

    return rows;
}

export function formatDate(date: Date | string | null | undefined): string {
    if (!date) return '';
    const normalized = new Date(date);
    const day = String(normalized.getDate()).padStart(2, '0');
    const month = String(normalized.getMonth() + 1).padStart(2, '0');
    const year = normalized.getFullYear();
    return `${day}.${month}.${year}`;
}

export function formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return '';
    const normalized = new Date(date);
    const day = String(normalized.getDate()).padStart(2, '0');
    const month = String(normalized.getMonth() + 1).padStart(2, '0');
    const year = normalized.getFullYear();
    const hours = String(normalized.getHours()).padStart(2, '0');
    const minutes = String(normalized.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

export function formatDecimalLike(value: unknown): string {
    if (value === null || value === undefined) {
        return '0';
    }

    if (typeof value === 'number') {
        return value.toString().replace('.', ',');
    }

    if (typeof value === 'string') {
        return value.replace('.', ',');
    }

    if (typeof value === 'object' && value !== null && 'toString' in value) {
        return String(value).replace('.', ',');
    }

    return '0';
}

export function escapeCsvValue(value: string): string {
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
}

export function sanitizeFileNameSegment(value: string): string {
    // Remove characters that are unsafe for Content-Disposition and file systems.
    const normalized = value
        .replace(/[\\/:*?"<>|]+/g, '-')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    return normalized || 'unknown-batch';
}
