const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://server.daltrishop.com';

export async function loginMerchant(slug: string) {
    // Mock login for now, just checking if merchant exists
    const res = await fetch(`${API_URL}/merchants/${slug}`);
    if (res.ok) {
        const merchant = await res.json();
        return merchant;
    }
    throw new Error('Merchant not found');
}

export async function updateMerchant(id: string, data: any) {
    const res = await fetch(`${API_URL}/merchants/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (res.ok) {
        return res.json();
    }
    throw new Error('Failed to update merchant');
}

export async function fetchMenu(merchantId: string) {
    const res = await fetch(`${API_URL}/menu?merchantId=${merchantId}`);
    if (res.ok) return res.json();
    return [];
}

export async function createCategory(merchantId: string, name: string) {
    const res = await fetch(`${API_URL}/menu/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, name }),
    });
    if (res.ok) return res.json();
    throw new Error('Failed to create category');
}

export async function deleteCategory(id: string) {
    const res = await fetch(`${API_URL}/menu/categories/${id}`, {
        method: 'DELETE',
    });
    if (res.ok) return true;
    throw new Error('Failed to delete category');
}

export async function createItem(merchantId: string, categoryId: string, data: any) {
    const res = await fetch(`${API_URL}/menu/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, merchantId, categoryId }),
    });
    if (res.ok) return res.json();
    throw new Error('Failed to create item');
}

export async function deleteItem(id: string) {
    const res = await fetch(`${API_URL}/menu/items/${id}`, {
        method: 'DELETE',
    });
    if (res.ok) return true;
    throw new Error('Failed to delete item');
}
