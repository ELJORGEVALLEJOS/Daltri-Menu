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
        <main className="min-h-screen bg-beige-light/30">
            {/* Hero Section */}
            <div className="bg-beige pt-20 pb-24 px-6 rounded-b-[4rem] shadow-premium relative overflow-hidden mb-12">
                <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/40 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 -right-24 w-80 h-80 bg-white/40 rounded-full blur-3xl"></div>
                </div>

                <div className="container mx-auto max-w-md text-center relative z-10">
                    <div className="bg-white p-3 rounded-[3rem] w-56 h-56 mx-auto shadow-premium mb-10 flex items-center justify-center border-8 border-white ring-1 ring-gold/10 overflow-hidden group">
                        {merchant.logoUrl ? (
                            <img src={merchant.logoUrl} alt={merchant.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                            <div className="w-full h-full rounded-[2rem] bg-gradient-to-br from-beige-light to-white flex items-center justify-center text-gold font-serif text-6xl font-black italic shadow-inner">
                                {merchant.name.charAt(0)}
                            </div>
                        )}
                    </div>

                    <h1 className="font-sans font-black text-5xl text-gray-900 leading-none mb-6 tracking-tighter">
                        Todo lo seleccionado
                    </h1>

                    <p className="text-xl font-medium text-gray-800/80 max-w-[280px] mx-auto leading-relaxed mb-4">
                        Auténticas comidas y bebidas francesas.
                    </p>

                    <div className="flex items-center justify-center gap-3">
                        <span className="h-0.5 w-6 bg-gray-900/10"></span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Depuis 1978</span>
                        <span className="h-0.5 w-6 bg-gray-900/10"></span>
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
