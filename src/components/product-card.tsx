'use client';

import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { FallbackImage } from '@/components/ui/fallback-image';
import { Plus } from 'lucide-react';
import { formatMoney } from '@/lib/format';

type ProductCardProps = {
    item: {
        id: string;
        name: string;
        description?: string;
        sku?: string;
        brand?: string;
        stock_quantity?: number;
        price_cents: number;
        original_price_cents?: number;
        imageUrl?: string;
    };
    canOrder?: boolean;
    previewMode?: boolean;
};

export function ProductCard({
    item,
    canOrder = true,
    previewMode = false,
}: ProductCardProps) {
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
    const stockQuantity =
        typeof item.stock_quantity === 'number' && Number.isFinite(item.stock_quantity)
            ? item.stock_quantity
            : null;
    const isOutOfStock = stockQuantity !== null && stockQuantity <= 0;
    const metadataLine = [item.brand, item.sku ? `SKU ${item.sku}` : null]
        .filter(Boolean)
        .join(' • ');

    const isPurchaseBlocked = isOutOfStock || !canOrder || previewMode;

    const handleAdd = () => {
        if (isPurchaseBlocked) {
            return;
        }

        addItem({
            itemId: item.id,
            name: item.name,
            price: item.price_cents / 100,
            quantity: 1,
            options: [],
        });
    };

    return (
        <div className="h-full rounded-2xl p-3 sm:p-4 shadow-premium border flex flex-col gap-3 sm:gap-4 group hover:scale-[1.01] transition-all"
            style={{
                backgroundColor: 'var(--menu-surface, #ffffff)',
                borderColor: 'rgba(148, 163, 184, 0.25)',
            }}
        >
            {item.imageUrl && (
                <div className="w-full aspect-square rounded-xl overflow-hidden relative shadow-inner border border-gray-100">
                    <FallbackImage
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        wrapperClassName="h-full w-full"
                        fallbackLabel={item.name}
                    />
                </div>
            )}

            <div className="space-y-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <h3 className="text-base sm:text-lg font-sans font-black text-gray-900 tracking-tight leading-tight">
                            {item.name}
                        </h3>
                        <p className="text-xs font-medium text-gray-400 italic">
                            {metadataLine || 'Producto'}
                        </p>
                    </div>
                </div>

                {item.description && (
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                        {item.description}
                    </p>
                )}

                <div className="flex items-end justify-between pt-1">
                    <div className="flex flex-col">
                        {hasOffer && (
                            <span className="text-xs font-mono font-bold text-gray-300 line-through -mb-0.5">
                                {formatMoney((originalPriceCents || 0) / 100)}
                            </span>
                        )}
                        <div
                            className="text-2xl sm:text-3xl font-mono font-bold tracking-tighter"
                            style={{ color: 'var(--menu-accent, #2563eb)' }}
                        >
                            {formatMoney(currentPriceCents / 100)}
                        </div>
                    </div>

                    {hasOffer && (
                        <div
                            className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse"
                            style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--menu-accent, #d97706)' }}
                        >
                            Oferta
                        </div>
                    )}
                </div>

                {stockQuantity !== null && (
                    <p className="text-xs font-semibold text-gray-500">
                        {isOutOfStock ? 'Sin stock disponible' : `Stock disponible: ${stockQuantity}`}
                    </p>
                )}

                {previewMode && (
                    <p className="text-xs font-semibold text-sky-700">
                        Vista previa activa. El catálogo aún no recibe pedidos.
                    </p>
                )}

                {!previewMode && !canOrder && (
                    <p className="text-xs font-semibold text-amber-700">
                        Este negocio está fuera de horario y no recibe pedidos ahora.
                    </p>
                )}

                <Button
                    className="w-full rounded-xl h-10 sm:h-11 text-sm font-bold shadow-lg"
                    style={{
                        backgroundColor: 'var(--menu-accent, #111827)',
                        color: 'var(--menu-button-text, #ffffff)',
                    }}
                    onClick={handleAdd}
                    disabled={isPurchaseBlocked}
                >
                    {isOutOfStock
                        ? 'Sin stock'
                        : previewMode
                            ? 'Vista previa'
                            : !canOrder
                                ? 'Fuera de horario'
                                : 'Añadir al carrito'}
                    {!isPurchaseBlocked && <Plus className="ml-2 w-5 h-5" />}
                </Button>
            </div>
        </div>
    );
}
