const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://server.daltrishop.com';

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

export async function fetchMerchant(slug: string) {
    const url = `${API_URL}/public/restaurants/${slug}/menu`;

    try {
        const res = await fetch(url, {
            next: { revalidate: 60 },
        });

        if (!res.ok) {
            return null;
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
            };
        };

        return data.restaurant || null;
    } catch {
        return null;
    }
}

export async function fetchRestaurantMenu(slug: string) {
    try {
        const res = await fetch(`${API_URL}/public/restaurants/${slug}/menu`, {
            next: { revalidate: 60 },
        });

        if (!res.ok) {
            return [];
        }

        const data = (await res.json()) as { categories?: PublicCategory[] };
        const categories = data.categories || [];

        return categories.map((category) => ({
            ...category,
            items: category.items || category.products || [],
        }));
    } catch {
        return [];
    }
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
    const res = await fetch(`${API_URL}/public/restaurants/${slug}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create order');
    }

    return res.json();
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
    const res = await fetch(`${API_URL}/public/merchants/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to register merchant');
    }

    return res.json();
}
