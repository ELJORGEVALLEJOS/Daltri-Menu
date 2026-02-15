'use client';

import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ChevronLeft } from 'lucide-react';

export function Header({ merchantName, slug }: { merchantName: string; slug: string }) {
    const { items } = useCart();
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100">
            <div className="container mx-auto flex h-20 items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <Link href={`/m/${slug}`}>
                        <div className="bg-gray-50 p-3 rounded-full border border-gray-100 hover:bg-gray-100 transition-colors">
                            <ChevronLeft className="h-6 w-6 text-gray-900" />
                        </div>
                    </Link>
                    <div className="font-sans font-black text-2xl tracking-tighter text-gray-900 truncate max-w-[180px]">
                        {merchantName}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link href={`/m/${slug}/cart`}>
                        <Button variant="outline" size="icon" className="relative h-14 w-14 rounded-2xl border-gray-200 shadow-sm overflow-visible bg-white">
                            <ShoppingCart className="h-7 w-7 text-gray-900" />
                            {itemCount > 0 && (
                                <span className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-gold border-4 border-white text-gray-900 text-xs font-black flex items-center justify-center shadow-lg">
                                    {itemCount}
                                </span>
                            )}
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}
