'use client';

import { useCart } from '@/context/cart-context';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { formatMoney } from '@/lib/format';

type FloatingThemeColors = {
    primary?: string;
    button_text?: string;
};

function normalizeHexColor(value: string | undefined, fallback: string) {
    if (!value) return fallback;
    const normalized = value.trim().toLowerCase();
    return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized) ? normalized : fallback;
}

export function FloatingCart({
    slug,
    themeColors,
}: {
    slug: string;
    themeColors?: FloatingThemeColors;
}) {
    const { items, total } = useCart();
    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
    const buttonColor = normalizeHexColor(themeColors?.primary, '#111827');
    const buttonTextColor = normalizeHexColor(themeColors?.button_text, '#ffffff');

    if (itemCount === 0) return null;

    return (
        <div className="fixed bottom-6 right-4 sm:bottom-8 sm:right-6 z-50 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <Link
                href={`/m/${slug}/cart`}
                aria-label={`Ver carrito, ${itemCount} productos, total ${formatMoney(total)}`}
                className="group relative block"
            >
                <span
                    className="absolute right-16 top-1/2 hidden -translate-y-1/2 rounded-full px-3 py-1 text-sm font-bold shadow-lg sm:block"
                    style={{
                        backgroundColor: buttonColor,
                        color: buttonTextColor,
                    }}
                >
                    {formatMoney(total)}
                </span>

                <span
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-transform group-hover:scale-105 active:scale-95"
                    style={{
                        backgroundColor: buttonColor,
                        color: buttonTextColor,
                    }}
                >
                    <ShoppingCart className="h-6 w-6" />
                </span>

                <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1 text-xs font-black text-gray-900 shadow-lg">
                    {itemCount}
                </span>
            </Link>
            <p className="mt-2 text-center text-xs font-bold sm:hidden" style={{ color: buttonColor }}>
                {formatMoney(total)}
            </p>
            <p className="sr-only">
                {itemCount} productos en carrito
            </p>
        </div>
    );
}
