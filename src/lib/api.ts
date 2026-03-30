import type { MerchantOpeningHours } from '@/lib/opening-hours';
import type { BusinessType } from '@/lib/business-types';

const FALLBACK_API_URL = 'https://server.daltrishop.com';
const API_BASES = Array.from(
    new Set([process.env.NEXT_PUBLIC_API_URL, FALLBACK_API_URL].filter(Boolean)),
).map((url) => String(url).replace(/\/+$/, ''));

type PublicProduct = {
    id: string;
    name: string;
    description?: string;
    sku?: string;
    brand?: string;
    stock_quantity?: number;
    price_cents: number;
    original_price_cents?: number;
    image_url?: string;
    active?: boolean;
};

type PublicCategory = {
    id: string;
    name: string;
    sort_order?: number;
    products?: PublicProduct[];
    items?: PublicProduct[];
};

type MerchantSocialLinks = {
    uber_eats?: string;
    google?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
};

type MerchantThemeColors = {
    primary?: string;
    background?: string;
    surface?: string;
    text?: string;
    button_text?: string;
};

type MerchantMenuCopy = {
    hero_title?: string;
    hero_subtitle?: string;
    hero_badge?: string;
};

type MerchantPaymentMethods = {
    cash_enabled?: boolean;
    transfer_enabled?: boolean;
    transfer_alias?: string;
    transfer_cbu_cvu?: string;
};

export type PublicMerchant = {
    id: string;
    name: string;
    slug: string;
    whatsapp_phone: string;
    currency?: string;
    business_type?: BusinessType;
    logo_url?: string;
    cover_url?: string;
    shipping_type?: 'free' | 'paid';
    shipping_cost_cents?: number;
    free_shipping_over_cents?: number | null;
    social_links?: MerchantSocialLinks;
    payment_methods?: MerchantPaymentMethods;
    max_units_per_order?: number;
    theme_colors?: MerchantThemeColors;
    menu_copy?: MerchantMenuCopy;
    opening_hours?: MerchantOpeningHours;
    preview_mode?: boolean;
};

function appendPreviewKey(url: string, previewKey?: string) {
    if (!previewKey) {
        return url;
    }

    const nextUrl = new URL(url);
    nextUrl.searchParams.set('preview_key', previewKey);
    return nextUrl.toString();
}

export async function fetchMerchant(slug: string, previewKey?: string) {
    for (const baseUrl of API_BASES) {
        try {
            const res = await fetch(
                appendPreviewKey(`${baseUrl}/public/restaurants/${slug}/menu`, previewKey),
                {
                    cache: 'no-store',
                },
            );

            if (!res.ok) {
                continue;
            }

            const data = (await res.json()) as {
                restaurant?: PublicMerchant;
            };

            if (data.restaurant) {
                return data.restaurant;
            }
        } catch {
            continue;
        }
    }

    return null;
}

export async function fetchRestaurantMenu(slug: string, previewKey?: string) {
    for (const baseUrl of API_BASES) {
        try {
            const res = await fetch(
                appendPreviewKey(`${baseUrl}/public/restaurants/${slug}/menu`, previewKey),
                {
                    cache: 'no-store',
                },
            );

            if (!res.ok) {
                continue;
            }

            const data = (await res.json()) as { categories?: PublicCategory[] };
            const categories = data.categories || [];

            return categories.map((category) => ({
                ...category,
                items: (category.items || category.products || []).map((item) => {
                    const rawPrice = item.price_cents ?? 0;
                    const rawOriginalPrice = item.original_price_cents;
                    const priceCents =
                        typeof rawPrice === 'number'
                            ? rawPrice
                            : Number.parseInt(String(rawPrice), 10);
                    const originalPriceCents =
                        rawOriginalPrice === undefined || rawOriginalPrice === null
                            ? undefined
                            : typeof rawOriginalPrice === 'number'
                                ? rawOriginalPrice
                                : Number.parseInt(String(rawOriginalPrice), 10);

                    return {
                        ...item,
                        price_cents: Number.isFinite(priceCents) ? priceCents : 0,
                        original_price_cents:
                            originalPriceCents !== undefined &&
                                Number.isFinite(originalPriceCents)
                                ? originalPriceCents
                                : undefined,
                    };
                }),
            }));
        } catch {
            continue;
        }
    }

    return [];
}

export async function fetchPublicOrder(slug: string, orderId: string) {
    for (const baseUrl of API_BASES) {
        try {
            const res = await fetch(
                `${baseUrl}/public/restaurants/${slug}/orders/${orderId}`,
                { cache: 'no-store' },
            );

            if (!res.ok) {
                continue;
            }

            return res.json();
        } catch {
            continue;
        }
    }

    return null;
}

export async function createOrder(
    slug: string,
    orderData: {
        customer_name: string;
        customer_session_id?: string;
        customer_phone?: string;
        delivery: 'pickup' | 'delivery';
        payment_method: 'cash' | 'transfer';
        delivery_address?: string;
        notes?: string;
        items: Array<{
            product_id: string;
            qty: number;
            notes?: string;
        }>;
    },
) {
    let lastError = 'Failed to create order';

    for (const baseUrl of API_BASES) {
        try {
            const res = await fetch(`${baseUrl}/public/restaurants/${slug}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            if (res.ok) {
                return res.json();
            }

            const errorData = await res.json().catch(() => ({} as Record<string, unknown>));
            const message = errorData?.message;
            if (Array.isArray(message)) {
                lastError = message.join(', ');
            } else if (typeof message === 'string' && message.trim()) {
                lastError = message;
            }
        } catch {
            continue;
        }
    }

    throw new Error(lastError);
}

export async function registerMerchant(data: {
    name: string;
    slug: string;
    whatsapp_phone: string;
    address?: string;
    admin_email: string;
    admin_password: string;
    admin_full_name: string;
    mp_card_token?: string;
    mp_payment_method_id?: string;
    mp_payment_type_id?: string;
    mp_card_last_four?: string;
    mp_cardholder_name?: string;
}) {
    let lastError = 'Failed to register merchant';

    for (const baseUrl of API_BASES) {
        try {
            const res = await fetch(`${baseUrl}/public/merchants/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                return res.json();
            }

            const errorData = await res.json().catch(() => ({} as Record<string, unknown>));
            const message = errorData?.message;
            if (Array.isArray(message)) {
                lastError = message.join(', ');
            } else if (typeof message === 'string' && message.trim()) {
                lastError = message;
            }
        } catch {
            continue;
        }
    }

    throw new Error(lastError);
}

export type PublicSubscriptionOffer = {
    enabled: boolean;
    requires_card: boolean;
    provider?: 'mercadopago';
    plan?: {
        id: string;
        code: string;
        name: string;
        description?: string | null;
        amount_cents: number;
        currency: string;
        trial_days: number;
        interval: {
            count: number;
            unit: string;
        };
    };
};

export async function fetchSubscriptionOffer() {
    for (const baseUrl of API_BASES) {
        try {
            const res = await fetch(`${baseUrl}/public/subscriptions/offer`, {
                cache: 'no-store',
            });

            if (!res.ok) {
                continue;
            }

            return (await res.json()) as PublicSubscriptionOffer;
        } catch {
            continue;
        }
    }

    return {
        enabled: false,
        requires_card: false,
    } satisfies PublicSubscriptionOffer;
}
