'use client';

import { useCart } from '@/context/cart-context';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import { formatMoney } from '@/lib/format';

export function FloatingCart({ slug }: { slug: string }) {
    const { items, total } = useCart();
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

    if (itemCount === 0) return null;

    return (
        <div className="fixed bottom-10 left-0 right-0 px-6 z-50 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <Link href={`/m/${slug}/cart`}>
                <Button
                    className="w-full h-20 bg-zinc-900 border border-white/10 text-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-between px-8 hover:bg-black transition-all active:scale-[0.98] relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                    <div className="flex items-center gap-6 z-10">
                        <div className="relative bg-white/10 p-4 rounded-2xl border border-white/10">
                            <ShoppingCart className="h-8 w-8 text-gold" />
                            <span className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-gold border-4 border-zinc-900 text-zinc-900 text-sm font-black flex items-center justify-center shadow-lg">
                                {itemCount}
                            </span>
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-white/40 font-black uppercase tracking-[0.2em] mb-0.5">Tu Pedido</p>
                            <p className="font-sans font-black text-2xl tracking-tighter leading-tight">Ver carrito</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 z-10 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-3xl font-mono font-bold text-gold tracking-tighter">{formatMoney(total)}</p>
                        <ArrowRight className="w-6 h-6 text-gold animate-pulse" />
                    </div>
                </Button>
            </Link>
        </div>
    );
}
