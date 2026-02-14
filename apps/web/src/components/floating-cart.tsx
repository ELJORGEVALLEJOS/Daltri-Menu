'use client';

import { useCart } from '@/context/cart-context';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

export function FloatingCart({ slug }: { slug: string }) {
    const { items, total } = useCart();
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

    if (itemCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-50">
            <Link href={`/m/${slug}/cart`}>
                <Button
                    className="w-full h-16 bg-gray-900 text-white rounded-2xl shadow-2xl flex items-center justify-between px-6 hover:bg-black transition-all active:scale-95"
                >
                    <div className="flex items-center gap-4">
                        <div className="relative bg-white/20 p-2 rounded-xl">
                            <ShoppingCart className="h-6 w-6" />
                            <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gold text-white text-xs font-bold flex items-center justify-center border-2 border-gray-900">
                                {itemCount}
                            </span>
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-white/60 font-medium uppercase tracking-wider">Tu Carrito</p>
                            <p className="font-bold text-lg leading-tight">Ver pedido</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-serif font-bold text-gold">${total.toFixed(2)}</p>
                    </div>
                </Button>
            </Link>
        </div>
    );
}
