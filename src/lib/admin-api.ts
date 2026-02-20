const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://server.daltrishop.com';

export type MerchantShippingType = 'free' | 'paid';

export type UpdateMerchantPayload = {
    name?: string;
    slug?: string;
    whatsapp_phone?: string;
    currency?: string;
    address?: string;
    logo_url?: string;
    shipping_type?: MerchantShippingType;
    shipping_cost_cents?: number;
};

function getAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
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
    throw new Error('Failed to update merchant');
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
    throw new Error('Failed to create category');
}

export async function updateCategory(id: string, name: string) {
    const res = await fetch(`${API_URL}/admin/categories/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name }),
    });
    if (res.ok) return res.json();
    throw new Error('Failed to update category');
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
    throw new Error('Failed to create product');
}

export async function updateProduct(id: string, data: { category_id?: string; name?: string; price_cents?: number; original_price_cents?: number; description?: string; image_url?: string; active?: boolean }) {
    const res = await fetch(`${API_URL}/admin/products/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (res.ok) return res.json();
    throw new Error('Failed to update product');
}

export async function deleteProduct(id: string) {
    const res = await fetch(`${API_URL}/admin/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (res.ok) return true;
    throw new Error('Failed to delete product');
}
