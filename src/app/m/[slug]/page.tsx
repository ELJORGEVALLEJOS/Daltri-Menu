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

    const menu = await fetchRestaurantMenu(slug, previewKey);
    const previewMode = Boolean(merchant.preview_mode);

    return (
        <>
            <MenuView merchant={merchant} menu={menu || []} previewMode={previewMode} />
            {!previewMode && <FloatingCart slug={slug} themeColors={merchant.theme_colors} />}
        </>
    );
}
