const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://server.daltrishop.com';

export type MerchantShippingType = 'free' | 'paid';

export type MerchantSocialLinksPayload = {
    uber_eats?: string;
    google?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
};

export type AdminOrder = {
    id: string;
    created_at: string;
    status: string;
    total_cents: number;
};

export type MerchantThemeColorsPayload = {
    primary?: string;
    background?: string;
    surface?: string;
    text?: string;
    button_text?: string;
};

export type MerchantMenuCopyPayload = {
    hero_title?: string;
    hero_subtitle?: string;
    hero_badge?: string;
};

export type UpdateMerchantPayload = {
    name?: string;
    slug?: string;
    whatsapp_phone?: string;
    currency?: string;
    address?: string;
    logo_url?: string;
    cover_url?: string;
    shipping_type?: MerchantShippingType;
    shipping_cost_cents?: number;
    social_links?: MerchantSocialLinksPayload;
    theme_colors?: MerchantThemeColorsPayload;
    menu_copy?: MerchantMenuCopyPayload;
};

function getAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
}

function isHttpUrl(value: string) {
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

async function parseError(res: Response, fallback: string) {
    const errorData = await res.json().catch(() => ({} as Record<string, unknown>));
    const message = errorData?.message;
    if (Array.isArray(message)) {
        return message.join(', ');
    }
    if (typeof message === 'string' && message.trim()) {
        return message;
    }
    return fallback;
}

export async function loginMerchant(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(error.message || 'Credenciales inválidas');
    }

    const data = await res.json();
    if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('merchant_id', data.user.restaurant_id);
    }
    return data;
}

export async function verifyEmailToken(token: string) {
    const res = await fetch(`${API_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
    });

    if (res.ok) return res.json();
    throw new Error(await parseError(res, 'No se pudo verificar el correo'));
}

export async function resendVerificationEmail(email: string) {
    const res = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });

    if (res.ok) return res.json();
    throw new Error(await parseError(res, 'No se pudo reenviar el correo'));
}

export async function fetchRestaurant() {
    const res = await fetch(`${API_URL}/admin/restaurant`, {
        headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch restaurant');
    return res.json();
}

export async function updateMerchant(data: UpdateMerchantPayload) {
    const res = await fetch(`${API_URL}/admin/restaurant`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });

    if (res.ok) return res.json();

    const firstError = await parseError(res, 'Failed to update merchant');

    if (res.status === 400) {
        const legacyPayload: UpdateMerchantPayload = {
            ...data,
            logo_url:
                typeof data.logo_url === 'string' && isHttpUrl(data.logo_url)
                    ? data.logo_url
                    : undefined,
            cover_url: undefined,
            theme_colors: undefined,
            menu_copy: undefined,
        };

        const legacyRes = await fetch(`${API_URL}/admin/restaurant`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(legacyPayload),
        });

        if (legacyRes.ok) return legacyRes.json();
        throw new Error(await parseError(legacyRes, firstError));
    }

    throw new Error(firstError);
}

export async function fetchMenu() {
    const res = await fetch(`${API_URL}/admin/categories`, {
        headers: getAuthHeaders(),
    });
    if (res.ok) return res.json();
    return [];
}

export async function createCategory(name: string) {
    const res = await fetch(`${API_URL}/admin/categories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name }),
    });
    if (res.ok) return res.json();
    throw new Error(await parseError(res, 'Failed to create category'));
}

export async function updateCategory(id: string, name: string) {
    const res = await fetch(`${API_URL}/admin/categories/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name }),
    });
    if (res.ok) return res.json();
    throw new Error(await parseError(res, 'Failed to update category'));
}

export async function deleteCategory(id: string) {
    const res = await fetch(`${API_URL}/admin/categories/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (res.ok) return true;
    throw new Error('Failed to delete category');
}

export async function createProduct(data: { category_id: string; name: string; price_cents: number; original_price_cents?: number; description?: string; image_url?: string }) {
    const res = await fetch(`${API_URL}/admin/products`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (res.ok) return res.json();
    throw new Error(await parseError(res, 'Failed to create product'));
}

export async function updateProduct(id: string, data: { category_id?: string; name?: string; price_cents?: number; original_price_cents?: number; description?: string; image_url?: string; active?: boolean }) {
    const res = await fetch(`${API_URL}/admin/products/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (res.ok) return res.json();
    throw new Error(await parseError(res, 'Failed to update product'));
}

export async function deleteProduct(id: string) {
    const res = await fetch(`${API_URL}/admin/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (res.ok) return true;
    throw new Error('Failed to delete product');
}

export async function fetchOrders(params?: {
    from?: string;
    to?: string;
    status?: string;
}) {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.status) query.set('status', params.status);
    const queryString = query.toString();
    const url = `${API_URL}/admin/orders${queryString ? `?${queryString}` : ''}`;

    const res = await fetch(url, {
        headers: getAuthHeaders(),
    });
    if (res.ok) return (await res.json()) as AdminOrder[];
    throw new Error(await parseError(res, 'Failed to fetch orders'));
}
