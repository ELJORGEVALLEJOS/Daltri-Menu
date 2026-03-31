import { fetchMerchant, fetchRestaurantMenu } from "@/lib/api";
import { notFound } from "next/navigation";
import { MenuView } from "./menu-view";
import { FloatingCart } from "@/components/floating-cart";

export const dynamic = 'force-dynamic';

export default async function MerchantPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ preview_key?: string }>;
}) {
    const { slug } = await params;
    const { preview_key: previewKey } = await searchParams;
    const merchant = await fetchMerchant(slug, previewKey);

    if (!merchant) {
        notFound();
    }

    if (merchant.billing_blocked) {
        return (
            <main className="min-h-screen bg-[#f8f5ef] px-6 py-16 text-[#101828]">
                <div className="mx-auto max-w-xl rounded-3xl border border-[#e6dcc9] bg-white px-6 py-10 text-center shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#b7791f]">
                        Catálogo suspendido
                    </p>
                    <h1 className="mt-4 text-3xl font-bold">Catálogo temporalmente no disponible</h1>
                    <p className="mt-3 text-sm font-medium text-[#475467]">
                        Este negocio está regularizando su facturación. Intenta nuevamente más tarde.
                    </p>
                </div>
            </main>
        );
    }

    const menu = await fetchRestaurantMenu(slug, previewKey);
    const previewMode = Boolean(merchant.preview_mode);

    return (
        <>
            <MenuView merchant={merchant} menu={menu || []} previewMode={previewMode} />
            {!previewMode && <FloatingCart slug={slug} themeColors={merchant.theme_colors} />}
        </>
    );
}
