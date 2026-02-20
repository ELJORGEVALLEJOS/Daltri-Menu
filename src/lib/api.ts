const FALLBACK_API_URL = 'https://server.daltrishop.com';
const API_BASES = Array.from(
    new Set([process.env.NEXT_PUBLIC_API_URL, FALLBACK_API_URL].filter(Boolean)),
).map((url) => String(url).replace(/\/+$/, ''));

type PublicProduct = {
    id: string;
    name: string;
    description?: string;
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

export async function fetchMerchant(slug: string) {
    for (const baseUrl of API_BASES) {
        try {
            const res = await fetch(`${baseUrl}/public/restaurants/${slug}/menu`, {
                next: { revalidate: 60 },
            });

            if (!res.ok) {
                continue;
            }

            const data = (await res.json()) as {
                restaurant?: {
                    id: string;
                    name: string;
                    slug: string;
                    whatsapp_phone: string;
                    currency?: string;
                    shipping_type?: 'free' | 'paid';
                    shipping_cost_cents?: number;
                    social_links?: MerchantSocialLinks;
                };
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

export async function fetchRestaurantMenu(slug: string) {
    for (const baseUrl of API_BASES) {
        try {
            const res = await fetch(`${baseUrl}/public/restaurants/${slug}/menu`, {
                next: { revalidate: 60 },
            });

            if (!res.ok) {
                continue;
            }

            const data = (await res.json()) as { categories?: PublicCategory[] };
            const categories = data.categories || [];

            return categories.map((category) => ({
                ...category,
                items: category.items || category.products || [],
            }));
        } catch {
            continue;
        }
    }

    return [];
}

export async function createOrder(
    slug: string,
    orderData: {
        customer_name: string;
        customer_phone: string;
        delivery: 'pickup' | 'delivery';
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
