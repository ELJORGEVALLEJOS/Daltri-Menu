'use client';

import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { formatMoney } from '@/lib/format';

type ProductCardProps = {
    item: {
        id: string;
        name: string;
        description?: string;
        price_cents: number;
        original_price_cents?: number;
        imageUrl?: string;
    };
};

export function ProductCard({ item }: ProductCardProps) {
    const { addItem } = useCart();
    const currentPriceCents = Number(item.price_cents || 0);
    const originalPriceCents =
        item.original_price_cents === undefined || item.original_price_cents === null
            ? null
            : Number(item.original_price_cents);
    const hasOffer =
        originalPriceCents !== null &&
        Number.isFinite(originalPriceCents) &&
        originalPriceCents > currentPriceCents;

    const handleAdd = () => {
        addItem({
            itemId: item.id,
            name: item.name,
            price: item.price_cents / 100,
            quantity: 1,
            options: [],
        });
    };

    return (
        <div className="bg-white rounded-[2rem] p-4 sm:p-6 shadow-premium border border-gray-100/50 mb-6 flex flex-col gap-5 sm:gap-6 group hover:scale-[1.01] transition-all">
            {item.imageUrl && (
                <div className="w-full aspect-square rounded-[1.5rem] overflow-hidden relative shadow-inner border border-gray-100">
                    <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                </div>
            )}

            <div className="space-y-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <h3 className="text-xl sm:text-2xl font-sans font-black text-gray-900 tracking-tight leading-tight">
                            {item.name}
                        </h3>
                        <p className="text-sm font-medium text-gray-400 italic">Producto</p>
                    </div>
                </div>

                {item.description && (
                    <p className="text-gray-600 text-base leading-relaxed line-clamp-3">
                        {item.description}
                    </p>
                )}

                <div className="flex items-end justify-between pt-2">
                    <div className="flex flex-col">
                        {hasOffer && (
                            <span className="text-sm font-mono font-bold text-gray-300 line-through -mb-1">
                                {formatMoney((originalPriceCents || 0) / 100)}
                            </span>
                        )}
                        <div className="text-3xl sm:text-4xl font-mono font-bold text-blue-600 tracking-tighter">
                            {formatMoney(currentPriceCents / 100)}
                        </div>
                    </div>

                    {hasOffer && (
                        <div className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                            Oferta
                        </div>
                    )}
                </div>

                <Button
                    className="w-full bg-zinc-900 hover:bg-black text-white rounded-xl h-11 sm:h-12 font-bold shadow-lg"
                    onClick={handleAdd}
                >
                    Añadir al pedido <Plus className="ml-2 w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}
