'use client';

import { useMemo, useState, type CSSProperties } from 'react';
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

type MerchantThemeColors = {
    primary?: string;
    background?: string;
    surface?: string;
    text?: string;
    button_text?: string;
};

type Merchant = {
    name: string;
    logoUrl?: string;
    logo_url?: string;
    cover_url?: string;
    social_links?: MerchantSocialLinks;
    theme_colors?: MerchantThemeColors;
    menu_copy?: {
        hero_title?: string;
        hero_subtitle?: string;
        hero_badge?: string;
    };
};

type ThemePalette = {
    primary: string;
    background: string;
    surface: string;
    text: string;
    buttonText: string;
};

const DEFAULT_THEME: ThemePalette = {
    primary: '#c5a059',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#0f172a',
    buttonText: '#ffffff',
};

function normalizeHexColor(value: string | undefined, fallback: string) {
    if (!value) return fallback;
    const normalized = value.trim().toLowerCase();
    return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized) ? normalized : fallback;
}

function hexToRgb(hex: string) {
    const normalized = hex.replace('#', '');
    const expanded =
        normalized.length === 3
            ? normalized
                  .split('')
                  .map((char) => `${char}${char}`)
                  .join('')
            : normalized;

    const numeric = Number.parseInt(expanded, 16);
    return {
        r: (numeric >> 16) & 255,
        g: (numeric >> 8) & 255,
        b: numeric & 255,
    };
}

function withAlpha(hex: string, alpha: number) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildTheme(themeColors?: MerchantThemeColors): ThemePalette {
    return {
        primary: normalizeHexColor(themeColors?.primary, DEFAULT_THEME.primary),
        background: normalizeHexColor(themeColors?.background, DEFAULT_THEME.background),
        surface: normalizeHexColor(themeColors?.surface, DEFAULT_THEME.surface),
        text: normalizeHexColor(themeColors?.text, DEFAULT_THEME.text),
        buttonText: normalizeHexColor(themeColors?.button_text, DEFAULT_THEME.buttonText),
    };
}

export function MenuView({
    merchant,
    menu,
}: {
    merchant: Merchant;
    menu: MenuCategory[];
}) {
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const selectedCategory = menu.find((c) => c.id === selectedCategoryId);
    const theme = useMemo(() => buildTheme(merchant.theme_colors), [merchant.theme_colors]);
    const themeVars = useMemo(
        () =>
            ({
                '--menu-accent': theme.primary,
                '--menu-bg': theme.background,
                '--menu-surface': theme.surface,
                '--menu-text': theme.text,
                '--menu-button-text': theme.buttonText,
            }) as CSSProperties,
        [theme],
    );
    const heroTitle = merchant.menu_copy?.hero_title?.trim() || 'Todo lo seleccionado';
    const heroSubtitle =
        merchant.menu_copy?.hero_subtitle?.trim() || 'Autenticas comidas y bebidas francesas.';
    const heroBadge = merchant.menu_copy?.hero_badge?.trim() || 'Depuis 1978';

    if (selectedCategoryId && selectedCategory) {
        return (
            <div className="min-h-screen" style={{ ...themeVars, backgroundColor: theme.background, color: theme.text }}>
                <header
                    className="sticky top-0 z-50 w-full backdrop-blur-xl border-b"
                    style={{ backgroundColor: withAlpha(theme.surface, 0.94), borderColor: withAlpha(theme.text, 0.1) }}
                >
                    <div className="container mx-auto flex h-16 sm:h-20 items-center px-4 sm:px-6 gap-3 sm:gap-4">
                        <button
                            onClick={() => setSelectedCategoryId(null)}
                            className="p-2.5 sm:p-3 rounded-full border transition-colors"
                            style={{ backgroundColor: withAlpha(theme.text, 0.06), borderColor: withAlpha(theme.text, 0.1) }}
                        >
                            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: theme.text }} />
                        </button>
                        <div className="flex-1 overflow-x-auto no-scrollbar flex gap-4 sm:gap-8">
                            {menu.map((cat) => {
                                const isSelected = selectedCategoryId === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategoryId(cat.id)}
                                        className="whitespace-nowrap pb-2 border-b-4 transition-all font-sans font-bold text-base sm:text-lg"
                                        style={{
                                            borderColor: isSelected ? theme.text : 'transparent',
                                            color: isSelected ? theme.text : withAlpha(theme.text, 0.45),
                                        }}
                                    >
                                        {cat.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </header>

                <div className="container mx-auto max-w-md px-4 sm:px-6 pt-8 sm:pt-12 pb-28 sm:pb-32 uppercase tracking-tighter">
                    <h2 className="text-3xl sm:text-4xl font-sans font-black mb-8 sm:mb-12" style={{ color: theme.text }}>
                        {selectedCategory.name}
                    </h2>
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
        <div className="min-h-screen" style={{ ...themeVars, backgroundColor: theme.background, color: theme.text }}>
            <div
                className="pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 rounded-b-[2.5rem] sm:rounded-b-[4rem] shadow-premium relative overflow-hidden mb-10 sm:mb-12"
                style={{ backgroundColor: theme.primary }}
            >
                {merchant.cover_url && (
                    <>
                        <img
                            src={merchant.cover_url}
                            alt={`Portada de ${merchant.name}`}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div
                            className="absolute inset-0"
                            style={{ background: `linear-gradient(to bottom, ${withAlpha(theme.text, 0.35)}, ${withAlpha(theme.text, 0.2)})` }}
                        />
                    </>
                )}
                <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/40 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 -right-24 w-80 h-80 bg-white/40 rounded-full blur-3xl"></div>
                </div>

                <div className="container mx-auto max-w-md text-center relative z-10">
                    <div
                        className="p-2.5 sm:p-3 rounded-[2rem] sm:rounded-[3rem] w-40 h-40 sm:w-56 sm:h-56 mx-auto shadow-premium mb-8 sm:mb-10 flex items-center justify-center border-4 sm:border-8 overflow-hidden group"
                        style={{ backgroundColor: theme.surface, borderColor: withAlpha(theme.surface, 0.9) }}
                    >
                        {merchant.logoUrl || merchant.logo_url ? (
                            <img
                                src={merchant.logoUrl || merchant.logo_url}
                                alt={merchant.name}
                                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700"
                            />
                        ) : (
                            <div
                                className="w-full h-full rounded-[2rem] flex items-center justify-center font-serif text-6xl font-black italic shadow-inner"
                                style={{ color: theme.primary, backgroundColor: withAlpha(theme.surface, 0.92) }}
                            >
                                {merchant.name.charAt(0)}
                            </div>
                        )}
                    </div>

                    <h1
                        className="font-sans font-black text-4xl sm:text-5xl leading-none mb-4 sm:mb-6 tracking-tighter"
                        style={{ color: theme.buttonText }}
                    >
                        {heroTitle}
                    </h1>

                    <p className="text-lg sm:text-xl font-medium max-w-[280px] mx-auto leading-relaxed mb-4" style={{ color: withAlpha(theme.buttonText, 0.9) }}>
                        {heroSubtitle}
                    </p>

                    <div className="flex items-center justify-center gap-3">
                        <span className="h-0.5 w-6" style={{ backgroundColor: withAlpha(theme.buttonText, 0.2) }}></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: withAlpha(theme.buttonText, 0.7) }}>{heroBadge}</span>
                        <span className="h-0.5 w-6" style={{ backgroundColor: withAlpha(theme.buttonText, 0.2) }}></span>
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-md px-4 sm:px-6 -mt-8 sm:-mt-10 pb-28 sm:pb-36 relative z-20">
                <div className="space-y-3 sm:space-y-4 mb-10 sm:mb-12">
                    {menu.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategoryId(category.id)}
                            className="w-full text-left group block rounded-2xl p-5 sm:p-6 shadow-premium border hover:scale-[1.01] transition-all active:scale-[0.99]"
                            style={{ backgroundColor: theme.surface, borderColor: withAlpha(theme.text, 0.08) }}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xl sm:text-2xl font-sans font-black tracking-tight leading-none" style={{ color: theme.text }}>
                                    {category.name}
                                </span>
                                <div
                                    className="p-2 rounded-full transition-colors"
                                    style={{ backgroundColor: withAlpha(theme.text, 0.06) }}
                                >
                                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 rotate-180" style={{ color: withAlpha(theme.text, 0.4) }} />
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
