'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type CartItem = {
    id: string; // Item ID + Options hash
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    options: any[];
};

type CartContextType = {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'id'>) => void;
    removeItem: (id: string) => void;
    clearCart: () => void;
    total: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('daltri-cart');
        if (saved) setItems(JSON.parse(saved));
    }, []);

    useEffect(() => {
        localStorage.setItem('daltri-cart', JSON.stringify(items));
    }, [items]);

    const addItem = (newItem: Omit<CartItem, 'id'>) => {
        setItems((prev) => {
            const id = `${newItem.itemId}-${JSON.stringify(newItem.options)}`;
            const existing = prev.find((i) => i.id === id);
            if (existing) {
                return prev.map((i) =>
                    i.id === id ? { ...i, quantity: i.quantity + newItem.quantity } : i
                );
            }
            return [...prev, { ...newItem, id }];
        });
    };

    const removeItem = (id: string) => {
        setItems((prev) => prev.filter((i) => i.id !== id));
    };

    const clearCart = () => setItems([]);

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
