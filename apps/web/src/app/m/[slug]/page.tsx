import { fetchMerchant, fetchRestaurantMenu } from "@/lib/api";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { ProductCard } from "@/components/product-card";
import { CategoryList } from "@/components/category-list";
import { IconGrid } from "@/components/icon-grid";
import { SocialLinks, ContactInfo } from "@/components/social-contact";
import { FloatingCart } from "@/components/floating-cart";

export default async function MerchantPage({ params }: { params: { slug: string } }) {
    const { slug } = params;
    const merchant = await fetchMerchant(slug);

    if (!merchant) {
        notFound();
    }

    const menu = await fetchRestaurantMenu(slug);

    return (
        <main className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-[#EEDC82] pt-12 pb-16 px-4 rounded-b-[3rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 -right-24 w-80 h-80 bg-white rounded-full blur-3xl"></div>
                </div>

                <div className="container mx-auto max-w-md text-center relative z-10">
                    <div className="bg-white p-2 rounded-3xl w-44 h-44 mx-auto shadow-2xl mb-8 flex items-center justify-center border-4 border-white/50 ring-1 ring-gold/20">
                        <div className="w-full h-full rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-gold font-serif text-4xl font-bold italic">
                            {merchant.name.charAt(0)}
                        </div>
                    </div>

                    <h1 className="font-serif text-4xl text-gray-900 leading-tight mb-2 tracking-tight">
                        {merchant.name}
                    </h1>
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="h-px w-8 bg-gray-800/20"></span>
                        <span className="text-sm font-sans text-gray-700 uppercase tracking-[0.2em] font-medium">Restaurante</span>
                        <span className="h-px w-8 bg-gray-800/20"></span>
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-md px-4 -mt-6">
                {/* Categories Navigation */}
                <CategoryList categories={menu || []} slug={slug} />

                {/* Icons Grid */}
                <IconGrid />

                {/* Socials & Contact */}
                <SocialLinks />
                <ContactInfo />

                <div className="space-y-8 pb-32">
                    <h2 className="text-2xl font-bold text-gray-900 px-2">Menú Completo</h2>
                    {menu?.map((category: any) => (
                        <section key={category.id} id={`cat-${category.id}`} className="scroll-mt-20">
                            <h3 className="text-xl font-bold mb-4 text-gray-800 px-2">{category.name}</h3>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden px-4">
                                {category.items.map((item: any) => (
                                    <ProductCard key={item.id} item={item} />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </div>

            <FloatingCart slug={slug} />
        </main>
    );
}
