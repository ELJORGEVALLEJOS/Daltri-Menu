const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://server.daltrishop.com';
export const AUTH_REQUIRED_ERROR = 'AUTH_REQUIRED';

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
    order_number: string;
    short_code: number;
    created_at: string;
    updated_at: string;
    status: string;
    customer_name: string;
    customer_phone: string;
    delivery: string;
    delivery_address?: string | null;
    notes?: string | null;
    total_cents: number;
    whatsapp_url?: string | null;
    items: Array<{
        id: string;
        product_id: string;
        product_name: string;
        qty: number;
        notes?: string | null;
        unit_price_cents: number;
        line_total_cents: number;
    }>;
};

export type AdminOrderAnalytics = {
    totals: {
        confirmed_orders: number;
        revenue_cents: number;
        items_sold: number;
        average_ticket_cents: number;
    };
    top_products: Array<{
        product_id: string;
        product_name: string;
        total_qty: number;
        total_revenue_cents: number;
        confirmed_orders: number;
    }>;
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

export type MerchantOpeningHoursPayload = {
    monday?: { enabled?: boolean; open?: string; close?: string };
    tuesday?: { enabled?: boolean; open?: string; close?: string };
    wednesday?: { enabled?: boolean; open?: string; close?: string };
    thursday?: { enabled?: boolean; open?: string; close?: string };
    friday?: { enabled?: boolean; open?: string; close?: string };
    saturday?: { enabled?: boolean; open?: string; close?: string };
    sunday?: { enabled?: boolean; open?: string; close?: string };
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
    free_shipping_over_cents?: number | null;
    social_links?: MerchantSocialLinksPayload;
    theme_colors?: MerchantThemeColorsPayload;
    menu_copy?: MerchantMenuCopyPayload;
    opening_hours?: MerchantOpeningHoursPayload;
};

function clearAdminSession() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('merchant_id');
    localStorage.removeItem('merchant_slug');
}

function getRequiredAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
        clearAdminSession();
        throw new Error(AUTH_REQUIRED_ERROR);
    }

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
}

function handleUnauthorized(res: Response) {
    if (res.status !== 401) return;
    clearAdminSession();
    throw new Error(AUTH_REQUIRED_ERROR);
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

function shouldRetryLegacyRestaurantUpdate(
    errorMessage: string,
    data: UpdateMerchantPayload,
) {
    const normalizedError = errorMessage.toLowerCase();
    const isThemeCompatibilityIssue =
        (normalizedError.includes('theme_colors') || normalizedError.includes('menu_copy')) &&
        !normalizedError.includes('cover_url') &&
        !normalizedError.includes('logo_url');

    return isThemeCompatibilityIssue && Boolean(data.theme_colors || data.menu_copy);
}

export async function loginMerchant(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Login failed' }));
        const message =
            typeof error?.message === 'string' && error.message.trim()
                ? error.message
                : 'Credenciales inválidas';
        throw new Error(
            message.toLowerCase() === 'invalid credentials'
                ? 'Correo o contraseña incorrectos.'
                : message,
        );
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

export async function requestPasswordReset(email: string) {
    const res = await fetch(`${API_URL}/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });

    if (res.ok) return res.json();
    throw new Error(await parseError(res, 'No se pudo solicitar la recuperación'));
}

export async function resetPassword(token: string, password: string) {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
    });

    if (res.ok) return res.json();
    throw new Error(await parseError(res, 'No se pudo restablecer la contraseña'));
}

export async function fetchRestaurant() {
    const res = await fetch(`${API_URL}/admin/restaurant`, {
        headers: getRequiredAuthHeaders(),
    });
    handleUnauthorized(res);
    if (!res.ok) throw new Error('Failed to fetch restaurant');
    return res.json();
}

export async function updateMerchant(data: UpdateMerchantPayload) {
    const res = await fetch(`${API_URL}/admin/restaurant`, {
        method: 'PUT',
        headers: getRequiredAuthHeaders(),
        body: JSON.stringify(data),
    });

    handleUnauthorized(res);
    if (res.ok) return res.json();

    const firstError = await parseError(res, 'Failed to update merchant');

    if (res.status === 400 && shouldRetryLegacyRestaurantUpdate(firstError, data)) {
        const legacyPayload: UpdateMerchantPayload = {
            ...data,
            theme_colors: undefined,
            menu_copy: undefined,
        };

        const legacyRes = await fetch(`${API_URL}/admin/restaurant`, {
            method: 'PUT',
            headers: getRequiredAuthHeaders(),
            body: JSON.stringify(legacyPayload),
        });

        handleUnauthorized(legacyRes);
        if (legacyRes.ok) return legacyRes.json();
        throw new Error(await parseError(legacyRes, firstError));
    }

    throw new Error(firstError);
}

export async function fetchMenu() {
    const res = await fetch(`${API_URL}/admin/categories`, {
        headers: getRequiredAuthHeaders(),
    });
    handleUnauthorized(res);
    if (res.ok) return res.json();
    return [];
}

export async function createCategory(name: string) {
    const res = await fetch(`${API_URL}/admin/categories`, {
        method: 'POST',
        headers: getRequiredAuthHeaders(),
        body: JSON.stringify({ name }),
    });
    handleUnauthorized(res);
    if (res.ok) return res.json();
    throw new Error(await parseError(res, 'Failed to create category'));
}

export async function updateCategory(id: string, name: string) {
    const res = await fetch(`${API_URL}/admin/categories/${id}`, {
        method: 'PUT',
        headers: getRequiredAuthHeaders(),
        body: JSON.stringify({ name }),
    });
    handleUnauthorized(res);
    if (res.ok) return res.json();
    throw new Error(await parseError(res, 'Failed to update category'));
}

export async function deleteCategory(id: string) {
    const res = await fetch(`${API_URL}/admin/categories/${id}`, {
        method: 'DELETE',
        headers: getRequiredAuthHeaders(),
    });
    handleUnauthorized(res);
    if (res.ok) return true;
    throw new Error('Failed to delete category');
}

export async function createProduct(data: { category_id: string; name: string; price_cents: number; original_price_cents?: number; description?: string; image_url?: string }) {
    const res = await fetch(`${API_URL}/admin/products`, {
        method: 'POST',
        headers: getRequiredAuthHeaders(),
        body: JSON.stringify(data),
    });
    handleUnauthorized(res);
    if (res.ok) return res.json();
    throw new Error(await parseError(res, 'Failed to create product'));
}

export async function updateProduct(id: string, data: { category_id?: string; name?: string; price_cents?: number; original_price_cents?: number; description?: string; image_url?: string; active?: boolean }) {
    const res = await fetch(`${API_URL}/admin/products/${id}`, {
        method: 'PUT',
        headers: getRequiredAuthHeaders(),
        body: JSON.stringify(data),
    });
    handleUnauthorized(res);
    if (res.ok) return res.json();
    throw new Error(await parseError(res, 'Failed to update product'));
}

export async function deleteProduct(id: string) {
    const res = await fetch(`${API_URL}/admin/products/${id}`, {
        method: 'DELETE',
        headers: getRequiredAuthHeaders(),
    });
    handleUnauthorized(res);
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
        headers: getRequiredAuthHeaders(),
    });
    handleUnauthorized(res);
    if (res.ok) return (await res.json()) as AdminOrder[];
    throw new Error(await parseError(res, 'Failed to fetch orders'));
}

export async function updateOrderStatus(
    id: string,
    status: 'COMPLETED' | 'CANCELLED',
) {
    const res = await fetch(`${API_URL}/admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: getRequiredAuthHeaders(),
        body: JSON.stringify({ status }),
    });
    handleUnauthorized(res);
    if (res.ok) return (await res.json()) as AdminOrder;
    throw new Error(await parseError(res, 'Failed to update order status'));
}

export async function fetchOrderAnalytics(params?: {
    from?: string;
    to?: string;
}) {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    const queryString = query.toString();
    const url = `${API_URL}/admin/analytics/orders${queryString ? `?${queryString}` : ''}`;

    const res = await fetch(url, {
        headers: getRequiredAuthHeaders(),
    });
    handleUnauthorized(res);
    if (res.ok) return (await res.json()) as AdminOrderAnalytics;
    throw new Error(await parseError(res, 'Failed to fetch order analytics'));
}

export async function downloadOrderAnalyticsReport(params: {
    period?: 'weekly' | 'monthly' | 'custom';
    from?: string;
    to?: string;
}) {
    const query = new URLSearchParams();
    if (params.period) query.set('period', params.period);
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);
    const queryString = query.toString();

    const res = await fetch(`${API_URL}/admin/analytics/orders/report${queryString ? `?${queryString}` : ''}`, {
        headers: getRequiredAuthHeaders(),
    });

    handleUnauthorized(res);
    if (!res.ok) {
        throw new Error(await parseError(res, 'No se pudo descargar el reporte'));
    }

    const blob = await res.blob();
    const contentDisposition = res.headers.get('content-disposition') || '';
    const fileNameMatch = contentDisposition.match(/filename=\"?([^"]+)\"?/i);

    return {
        blob,
        fileName: fileNameMatch?.[1] || `reporte-${params.period || 'personalizado'}.xlsx`,
    };
}
