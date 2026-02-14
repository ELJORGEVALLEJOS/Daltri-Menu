'use client';

import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

type ProductCardProps = {
    item: {
        id: string;
        name: string;
        description?: string;
        price_cents: number;
        imageUrl?: string;
    };
};

export function ProductCard({ item }: ProductCardProps) {
    const { addItem } = useCart();

    const handleAdd = () => {
        addItem({
            itemId: item.id,
            name: item.name,
            price: item.price_cents / 100,
            quantity: 1,
            options: [], // TODO: Handle modifiers
        });
    };

    return (
        <div className="flex justify-between border-b py-4 gap-4">
            <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                {item.description && (
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">{item.description}</p>
                )}
                <div className="mt-2 text-gray-900 font-medium">${(item.price_cents / 100).toFixed(2)}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
                {item.imageUrl && (
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden relative">
                        {/* <Image src={item.imageUrl} alt={item.name} fill className="object-cover" /> */}
                        <div className="w-full h-full bg-gray-200" />
                    </div>
                )}
                <Button size="sm" variant="secondary" onClick={handleAdd}>
                    Añadir <Plus className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
