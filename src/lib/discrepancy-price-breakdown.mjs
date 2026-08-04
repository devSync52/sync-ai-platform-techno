export function normalizeCharges(charges = []) {
    return Array.isArray(charges) ? charges.flatMap((charge, index) => {
        const amount = Number(charge?.amount ?? charge?.value ?? charge?.price?.value);
        return Number.isFinite(amount) ? [{
            code: String(charge?.code || ""),
            description: String(charge?.description || charge?.name || charge?.label || `Charge ${index + 1}`),
            amount
        }] : [];
    }) : [];
}

function indexedCharges(charges) {
    const occurrences = new Map();
    return charges.map((charge) => {
        const identity = String(charge.description).trim().toLowerCase();
        const occurrence = occurrences.get(identity) || 0;
        occurrences.set(identity, occurrence + 1);
        return { key: `${identity}\u0000${occurrence}`, charge };
    });
}

export function buildPriceBreakdown(quoted, billed) {
    const result = new Map();
    for (const { key, charge } of indexedCharges(quoted)) {
        result.set(key, { key, label: charge.description || charge.code, quoted: charge, quotedAmount: charge.amount, billedAmount: 0 });
    }
    for (const { key, charge } of indexedCharges(billed)) {
        const current = result.get(key) || { key, label: charge.description || charge.code, quotedAmount: 0 };
        result.set(key, { ...current, billed: charge, billedAmount: charge.amount });
    }
    return [...result.values()];
}
