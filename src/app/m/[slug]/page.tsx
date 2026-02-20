import { fetchMerchant, fetchRestaurantMenu } from "@/lib/api";
import { notFound } from "next/navigation";
import { MenuView } from "./menu-view";
import { FloatingCart } from "@/components/floating-cart";

export default async function MerchantPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const merchant = await fetchMerchant(slug);

    if (!merchant) {
        notFound();
    }

    const menu = await fetchRestaurantMenu(slug);

    return (
        <>
            <MenuView merchant={merchant} menu={menu || []} slug={slug} />
            <FloatingCart slug={slug} />
        </>
    );
}
