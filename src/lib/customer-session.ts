const CUSTOMER_SESSION_STORAGE_KEY = 'daltri-customer-session-id';

function generateSessionId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `guest-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

export function getOrCreateCustomerSessionId() {
    if (typeof window === 'undefined') {
        return '';
    }

    const existing = window.localStorage.getItem(CUSTOMER_SESSION_STORAGE_KEY)?.trim();
    if (existing) {
        return existing;
    }

    const nextId = generateSessionId();
    window.localStorage.setItem(CUSTOMER_SESSION_STORAGE_KEY, nextId);
    return nextId;
}
