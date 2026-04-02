type ShippingRules = {
    shipping_type?: 'pickup' | 'free' | 'paid';
    shipping_cost_cents?: number;
    free_shipping_over_cents?: number | null;
};

export function getShippingPreview(
    subtotalAmount: number,
    rules?: ShippingRules | null,
) {
    const subtotalCents = Math.max(0, Math.round((subtotalAmount || 0) * 100));
    const shippingType =
        rules?.shipping_type === 'pickup'
            ? 'pickup'
            : rules?.shipping_type === 'paid'
              ? 'paid'
              : 'free';
    const shippingCostCents =
        shippingType === 'paid' && typeof rules?.shipping_cost_cents === 'number'
            ? Math.max(0, Math.round(rules.shipping_cost_cents))
            : 0;
    const freeShippingOverCents =
        shippingType === 'paid' &&
        typeof rules?.free_shipping_over_cents === 'number' &&
        Number.isFinite(rules.free_shipping_over_cents) &&
        rules.free_shipping_over_cents > 0
            ? Math.max(0, Math.round(rules.free_shipping_over_cents))
            : null;
    const qualifiesForFreeShipping =
        freeShippingOverCents !== null && subtotalCents >= freeShippingOverCents;
    const effectiveShippingCents =
        shippingType === 'paid' && !qualifiesForFreeShipping ? shippingCostCents : 0;
    const remainingForFreeShippingCents =
        freeShippingOverCents !== null && subtotalCents < freeShippingOverCents
            ? freeShippingOverCents - subtotalCents
            : 0;

    return {
        shippingType,
        pickupOnly: shippingType === 'pickup',
        supportsDelivery: shippingType !== 'pickup',
        shippingCost: effectiveShippingCents / 100,
        shippingCostCents: effectiveShippingCents,
        hasFreeShippingThreshold: freeShippingOverCents !== null,
        freeShippingOverAmount:
            freeShippingOverCents !== null ? freeShippingOverCents / 100 : null,
        freeShippingOverCents,
        qualifiesForFreeShipping,
        remainingForFreeShippingAmount: remainingForFreeShippingCents / 100,
        remainingForFreeShippingCents,
    };
}
