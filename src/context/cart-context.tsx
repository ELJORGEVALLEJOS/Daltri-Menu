'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

type CartItem = {
    id: string; // Item ID + Options hash
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    options: unknown[];
};

type CartContextType = {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'id'>) => void;
    removeItem: (id: string) => void;
    clearCart: () => void;
    total: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = 'daltri-carts-v2';
const LEGACY_KEY = 'daltri-cart';

function readStoredCartMap(): Record<string, CartItem[]> {
    if (typeof window === 'undefined') return {};

    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return {};

        const parsed = JSON.parse(raw) as Record<string, CartItem[]>;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return {};
        }
        return parsed;
    } catch {
        return {};
    }
}

function readLegacyCartItems(): CartItem[] {
    if (typeof window === 'undefined') return [];

    try {
        const raw = localStorage.getItem(LEGACY_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw) as CartItem[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const activeSlug = useMemo(() => {
        const match = (pathname || '').match(/^\/m\/([^/]+)/);
        return match?.[1]?.toLowerCase() || '';
    }, [pathname]);

    const [cartMap, setCartMap] = useState<Record<string, CartItem[]>>(() => {
        const storedMap = readStoredCartMap();
        if (Object.keys(storedMap).length > 0) {
            return storedMap;
        }

        const legacyItems = readLegacyCartItems();
        if (!activeSlug || legacyItems.length === 0) {
            return {};
        }

        return { [activeSlug]: legacyItems };
    });

    const items = activeSlug ? cartMap[activeSlug] || [] : [];

    useEffect(() => {
        if (typeof window === 'undefined') return;
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cartMap));
    }, [cartMap]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(LEGACY_KEY);
    }, []);

    const addItem = (newItem: Omit<CartItem, 'id'>) => {
        if (!activeSlug) return;

        setCartMap((prevMap) => {
            const previousItems = prevMap[activeSlug] || [];
            const id = `${newItem.itemId}-${JSON.stringify(newItem.options || [])}`;
            const existing = previousItems.find((i) => i.id === id);
            const nextItems = existing
                ? previousItems.map((i) =>
                      i.id === id ? { ...i, quantity: i.quantity + newItem.quantity } : i,
                  )
                : [...previousItems, { ...newItem, id }];

            return {
                ...prevMap,
                [activeSlug]: nextItems,
            };
        });
    };

    const removeItem = (id: string) => {
        if (!activeSlug) return;

        setCartMap((prevMap) => {
            const previousItems = prevMap[activeSlug] || [];
            const nextItems = previousItems.filter((i) => i.id !== id);

            if (nextItems.length === 0) {
                const nextMap = { ...prevMap };
                delete nextMap[activeSlug];
                return nextMap;
            }

            return {
                ...prevMap,
                [activeSlug]: nextItems,
            };
        });
    };

    const clearCart = () => {
        if (!activeSlug) return;

        setCartMap((prevMap) => {
            if (!(activeSlug in prevMap)) return prevMap;
            const nextMap = { ...prevMap };
            delete nextMap[activeSlug];
            return nextMap;
        });
    };

    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    return (
        <CartContext.Provider value={{ items, addItem, removeItem, clearCart, total }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};
