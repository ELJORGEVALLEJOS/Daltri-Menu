'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { ProductCard } from '@/components/product-card';
import { SocialLinks, type MerchantSocialLinks } from '@/components/social-contact';
import { ChevronLeft } from 'lucide-react';
import {
    getDefaultMenuCopyByBusinessType,
    type BusinessType,
} from '@/lib/business-types';
import {
    OPENING_HOURS_DAYS,
    formatOpeningHoursRange,
    getOpeningHoursStatus,
    normalizeOpeningHours,
    type MerchantOpeningHours,
} from '@/lib/opening-hours';

type MenuItem = {
    id: string;
    name: string;
    description?: string;
    sku?: string;
    brand?: string;
    stock_quantity?: number;
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
    business_type?: BusinessType;
    social_links?: MerchantSocialLinks;
    theme_colors?: MerchantThemeColors;
    menu_copy?: {
        hero_title?: string;
        hero_subtitle?: string;
        hero_badge?: string;
    };
    opening_hours?: MerchantOpeningHours;
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
    const defaultCopy = getDefaultMenuCopyByBusinessType(merchant.business_type || 'generic');
    const heroTitle = merchant.menu_copy?.hero_title?.trim() || defaultCopy.heroTitle;
    const heroSubtitle =
        merchant.menu_copy?.hero_subtitle?.trim() || defaultCopy.heroSubtitle;
    const heroBadge = merchant.menu_copy?.hero_badge?.trim() || defaultCopy.heroBadge;
    const openingHours = useMemo(
        () => normalizeOpeningHours(merchant.opening_hours),
        [merchant.opening_hours],
    );
    const openingStatus = useMemo(
        () => getOpeningHoursStatus(openingHours),
        [openingHours],
    );

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

                <div className="container mx-auto max-w-7xl px-4 sm:px-6 pt-6 sm:pt-10 pb-24 sm:pb-32 uppercase tracking-tighter">
                    <h2 className="text-2xl sm:text-4xl font-sans font-black mb-6 sm:mb-10" style={{ color: theme.text }}>
                        {selectedCategory.name}
                    </h2>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
                className="pt-8 sm:pt-16 pb-12 sm:pb-20 px-4 sm:px-6 rounded-b-[2rem] sm:rounded-b-[4rem] shadow-premium relative overflow-hidden mb-8 sm:mb-12"
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

                <div className="container mx-auto max-w-xl text-center relative z-10">
                    <div
                        className="p-2 sm:p-3 rounded-[1.75rem] sm:rounded-[3rem] w-28 h-28 sm:w-48 sm:h-48 lg:w-56 lg:h-56 mx-auto shadow-premium mb-6 sm:mb-8 flex items-center justify-center border-4 sm:border-8 overflow-hidden group"
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
                                className="w-full h-full rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center font-serif text-4xl sm:text-6xl font-black italic shadow-inner"
                                style={{ color: theme.primary, backgroundColor: withAlpha(theme.surface, 0.92) }}
                            >
                                {merchant.name.charAt(0)}
                            </div>
                        )}
                    </div>

                    <h1
                        className="font-sans font-black text-3xl sm:text-5xl leading-none mb-3 sm:mb-6 tracking-tighter"
                        style={{ color: theme.buttonText }}
                    >
                        {heroTitle}
                    </h1>

                    <p className="text-base sm:text-xl font-medium max-w-[18rem] sm:max-w-[28rem] mx-auto leading-relaxed mb-4" style={{ color: withAlpha(theme.buttonText, 0.9) }}>
                        {heroSubtitle}
                    </p>

                    <div className="flex items-center justify-center gap-3">
                        <span className="h-0.5 w-6" style={{ backgroundColor: withAlpha(theme.buttonText, 0.2) }}></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: withAlpha(theme.buttonText, 0.7) }}>{heroBadge}</span>
                        <span className="h-0.5 w-6" style={{ backgroundColor: withAlpha(theme.buttonText, 0.2) }}></span>
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-6xl px-4 sm:px-6 -mt-6 sm:-mt-10 pb-28 sm:pb-36 relative z-20">
                {openingStatus.hasAnyEnabledDay && (
                    <div className="mb-8 grid gap-4 rounded-[2rem] border p-5 shadow-premium sm:p-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" style={{ backgroundColor: theme.surface, borderColor: withAlpha(theme.text, 0.08) }}>
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <span
                                    className="rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em]"
                                    style={{
                                        backgroundColor: openingStatus.isOpenNow
                                            ? withAlpha(theme.primary, 0.16)
                                            : withAlpha(theme.text, 0.08),
                                        color: openingStatus.isOpenNow ? theme.primary : theme.text,
                                    }}
                                >
                                    {openingStatus.isOpenNow ? 'Abierto ahora' : 'Cerrado ahora'}
                                </span>
                                <span className="text-sm font-medium" style={{ color: withAlpha(theme.text, 0.68) }}>
                                    {openingStatus.todayLabel}: {openingStatus.todayRangeLabel}
                                </span>
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-sans font-black tracking-tight" style={{ color: theme.text }}>
                                    Horarios del negocio
                                </h2>
                                <p className="mt-1 text-sm leading-relaxed" style={{ color: withAlpha(theme.text, 0.7) }}>
                                    Tus clientes pueden ver de inmediato si hoy estás atendiendo y en qué horario.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                            {OPENING_HOURS_DAYS.map((day) => (
                                <div
                                    key={day.key}
                                    className="rounded-2xl border px-3 py-3"
                                    style={{
                                        backgroundColor: withAlpha(theme.background, 0.9),
                                        borderColor: withAlpha(theme.text, 0.08),
                                    }}
                                >
                                    <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: withAlpha(theme.text, 0.45) }}>
                                        {day.shortLabel}
                                    </p>
                                    <p className="mt-2 text-sm font-semibold" style={{ color: theme.text }}>
                                        {formatOpeningHoursRange(openingHours[day.key])}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3 mb-10 sm:mb-12">
                    {menu.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategoryId(category.id)}
                            className="w-full text-left group block rounded-2xl p-4 sm:p-6 shadow-premium border hover:scale-[1.01] transition-all active:scale-[0.99]"
                            style={{ backgroundColor: theme.surface, borderColor: withAlpha(theme.text, 0.08) }}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-lg sm:text-2xl font-sans font-black tracking-tight leading-none" style={{ color: theme.text }}>
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
