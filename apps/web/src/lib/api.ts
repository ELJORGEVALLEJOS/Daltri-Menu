const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://server.daltrishop.com';

export async function fetchMerchant(slug: string) {
    const url = `${API_URL}/public/restaurants/${slug}/menu`;
    console.log(`[API] Fetching merchant: ${url}`);
    try {
        const res = await fetch(url, {
            next: { revalidate: 60 },
        });

        if (!res.ok) {
            console.error(`[API] Error fetching merchant (${slug}): ${res.status} ${res.statusText}`);
            return null;
        }
        const data = await res.json();
        if (!data.restaurant) {
            console.warn(`[API] Merchant data missing property 'restaurant' for slug: ${slug}`);
        }
        return data.restaurant || null;
    } catch (error) {
        console.error(`[API] Critical error fetching merchant (${slug}):`, error);
        return null;
    }
}

export async function fetchMenu(merchantId: string) {
    // The new backend returns the menu structure included in the merchant response or via a specific public endpoint
    // Assuming for now we fetch via the public module if available, or we adapt.
    // Looking at PublicController: getMenuByRestaurantSlug
    // But we need the slug here, not ID. 
    // Let's refactor to use the slug if possible, or keep using the merchant endpoint if it returns everything.
    return [];
}

export async function fetchRestaurantMenu(slug: string) {
    try {
        const res = await fetch(`${API_URL}/public/restaurants/${slug}/menu`, {
            next: { revalidate: 60 },
        });

        if (!res.ok) {
            console.error(`Error fetching menu: ${res.status} ${res.statusText}`);
            return [];
        }
        const data = await res.json();
        return data.categories || []; // Return categories array
    } catch (error) {
        console.error('Error fetching menu:', error);
        return [];
    }
}

export async function createOrder(slug: string, orderData: any) {
    const res = await fetch(`${API_URL}/public/restaurants/${slug}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
    });

    if (!res.ok) {
        throw new Error('Failed to create order');
    }
    return res.json();
}

export async function registerMerchant(data: { name: string; slug: string; whatsapp_phone: string; address?: string }) {
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
