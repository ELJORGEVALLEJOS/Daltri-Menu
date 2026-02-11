import { fetchMerchant, fetchRestaurantMenu } from "@/lib/api";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { ProductCard } from "@/components/product-card";
import { CategoryList } from "@/components/category-list";
import { IconGrid } from "@/components/icon-grid";
import { SocialLinks, ContactInfo } from "@/components/social-contact";

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
            <div className="bg-[#EEDC82] pt-8 pb-12 px-4 rounded-b-[2rem] shadow-sm">
                <div className="container mx-auto max-w-md text-center">
                    <div className="bg-white p-4 rounded-2xl w-40 h-40 mx-auto shadow-lg mb-6 flex items-center justify-center">

                        <h1 className="font-serif text-3xl text-gray-800 text-center leading-tight">
                            {merchant.name}
                            <span className="block text-xs font-sans text-gray-500 mt-2 uppercase tracking-widest">Restaurante</span>
                        </h1>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Nuestro Menú</h2>
                    <p className="text-gray-800 opacity-80">Explora nuestras deliciosas opciones.</p>
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

                {/* Full Menu List (for scrolling to) */}
                <div className="space-y-8 pb-20">
                    <h2 className="text-2xl font-bold text-gray-900 px-2">Menu Completo</h2>
                    {menu?.map((category: any) => (
                        <section key={category.id} id={`cat-${category.id}`} className="scroll-mt-20">
                            <h3 className="text-xl font-bold mb-4 text-gray-800 px-2">{category.name}</h3>
                            <div className="bg-white rounded-xl shadow-sm border px-4">
                                {category.items.map((item: any) => (
                                    <ProductCard key={item.id} item={item} />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </div>

            {/* Floating Cart Button (Header is now less relevant on scroll, maybe we keep it simple or sticky?) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50">
                <Header merchantName={merchant.name} slug={slug} />
            </div>
        </main>
    );
}
