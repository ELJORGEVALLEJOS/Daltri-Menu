'use client';

import { useState } from 'react';
import { ProductCard } from '@/components/product-card';
import { SocialLinks, type MerchantSocialLinks } from '@/components/social-contact';
import { ChevronLeft } from 'lucide-react';

type MenuItem = {
    id: string;
    name: string;
    description?: string;
    price_cents?: number;
    priceCents?: number;
    original_price_cents?: number;
    originalPriceCents?: number;
    imageUrl?: string;
    image_url?: string;
};

type MenuCategory = {
    id: string;
    name: string;
    items: MenuItem[];
};

type Merchant = {
    name: string;
    logoUrl?: string;
    logo_url?: string;
    social_links?: MerchantSocialLinks;
};

export function MenuView({
    merchant,
    menu,
}: {
    merchant: Merchant;
    menu: MenuCategory[];
}) {
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    const selectedCategory = menu.find((c) => c.id === selectedCategoryId);

    if (selectedCategoryId && selectedCategory) {
        return (
            <div className="min-h-screen bg-white">
                <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b border-gray-100">
                    <div className="container mx-auto flex h-16 sm:h-20 items-center px-4 sm:px-6 gap-3 sm:gap-4">
                        <button
                            onClick={() => setSelectedCategoryId(null)}
                            className="bg-gray-50 p-2.5 sm:p-3 rounded-full border border-gray-100 hover:bg-gray-100 transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-900" />
                        </button>
                        <div className="flex-1 overflow-x-auto no-scrollbar flex gap-4 sm:gap-8">
                            {menu.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategoryId(cat.id)}
                                    className={`whitespace-nowrap pb-2 border-b-4 transition-all font-sans font-bold text-base sm:text-lg ${selectedCategoryId === cat.id
                                        ? 'border-zinc-900 text-zinc-900'
                                        : 'border-transparent text-gray-400'
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                <div className="container mx-auto max-w-md px-4 sm:px-6 pt-8 sm:pt-12 pb-28 sm:pb-32 uppercase tracking-tighter">
                    <h2 className="text-3xl sm:text-4xl font-sans font-black text-gray-900 mb-8 sm:mb-12">{selectedCategory.name}</h2>
                    <div className="space-y-4">
                        {selectedCategory.items.map((item) => {
                            const normalizedItem = {
                                ...item,
                                price_cents: item.price_cents ?? item.priceCents ?? 0,
                                original_price_cents:
                                    item.original_price_cents ?? item.originalPriceCents,
                                imageUrl: item.imageUrl ?? item.image_url,
                            };

                            return <ProductCard key={item.id} item={normalizedItem} />;
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-beige-light/30">
            <div className="bg-beige pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 rounded-b-[2.5rem] sm:rounded-b-[4rem] shadow-premium relative overflow-hidden mb-10 sm:mb-12">
                <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/40 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 -right-24 w-80 h-80 bg-white/40 rounded-full blur-3xl"></div>
                </div>

                <div className="container mx-auto max-w-md text-center relative z-10">
                    <div className="bg-white p-2.5 sm:p-3 rounded-[2rem] sm:rounded-[3rem] w-40 h-40 sm:w-56 sm:h-56 mx-auto shadow-premium mb-8 sm:mb-10 flex items-center justify-center border-4 sm:border-8 border-white ring-1 ring-gold/10 overflow-hidden group">
                        {merchant.logoUrl || merchant.logo_url ? (
                            <img
                                src={merchant.logoUrl || merchant.logo_url}
                                alt={merchant.name}
                                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700"
                            />
                        ) : (
                            <div className="w-full h-full rounded-[2rem] bg-gradient-to-br from-beige-light to-white flex items-center justify-center text-gold font-serif text-6xl font-black italic shadow-inner">
                                {merchant.name.charAt(0)}
                            </div>
                        )}
                    </div>

                    <h1 className="font-sans font-black text-4xl sm:text-5xl text-gray-900 leading-none mb-4 sm:mb-6 tracking-tighter">
                        Todo lo seleccionado
                    </h1>

                    <p className="text-lg sm:text-xl font-medium text-gray-800/80 max-w-[280px] mx-auto leading-relaxed mb-4">
                        Autenticas comidas y bebidas francesas.
                    </p>

                    <div className="flex items-center justify-center gap-3">
                        <span className="h-0.5 w-6 bg-gray-900/10"></span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Depuis 1978</span>
                        <span className="h-0.5 w-6 bg-gray-900/10"></span>
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-md px-4 sm:px-6 -mt-8 sm:-mt-10 pb-28 sm:pb-36 relative z-20">
                <div className="space-y-3 sm:space-y-4 mb-10 sm:mb-12">
                    {menu.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategoryId(category.id)}
                            className="w-full text-left group block bg-white rounded-2xl p-5 sm:p-6 shadow-premium border border-gray-100/50 hover:scale-[1.01] transition-all active:scale-[0.99]"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xl sm:text-2xl font-sans font-black text-gray-900 tracking-tight leading-none">
                                    {category.name}
                                </span>
                                <div className="bg-gray-50 p-2 rounded-full group-hover:bg-gold/10 transition-colors">
                                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300 group-hover:text-gold transition-colors rotate-180" />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <SocialLinks links={merchant.social_links} />
            </div>
        </div>
    );
}
