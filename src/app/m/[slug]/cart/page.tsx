'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Trash2, ArrowLeft, ArrowRight, Minus } from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { fetchMerchant, type PublicMerchant } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { getShippingPreview } from '@/lib/shipping';

export default function CartPage() {
    const { items, decrementItem, removeItem, total } = useCart();
    const [merchant, setMerchant] = useState<PublicMerchant | null>(null);
    const params = useParams<{ slug?: string | string[] }>();
    const pathname = usePathname();
    const slugValue = params?.slug;
    const slugFromParams = Array.isArray(slugValue) ? slugValue[0] : slugValue || '';
    const slugFromPath = pathname.match(/^\/m\/([^/]+)/)?.[1] || '';
    const slug = slugFromParams || slugFromPath;
    const menuHref = slug ? `/m/${slug}` : '/';
    const checkoutHref = slug ? `/m/${slug}/checkout` : '/';

    useEffect(() => {
        if (!slug) return;

        fetchMerchant(slug).then((m) => {
            if (!m) return;
            setMerchant(m);
        });
    }, [slug]);

    const shippingPreview = getShippingPreview(total, merchant);
    const shippingCost = shippingPreview.shippingCost;
    const finalTotal = total + shippingCost;

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-[2rem] shadow-premium text-center max-w-sm w-full border border-gray-100">
                    <h2 className="text-2xl font-sans font-black mb-2 text-gray-900">Tu carrito esta vacio</h2>
                    <p className="text-gray-500 mb-8 font-medium">Parece que aun no has anadido nada delicioso.</p>
                    <Link href={menuHref}>
                        <Button className="w-full h-14 bg-zinc-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl transition-all">
                            Volver al Menu
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-24 sm:pb-32">
            <div className="bg-[#EEDC83] pt-6 sm:pt-12 pb-12 sm:pb-20 px-4 sm:px-6 rounded-b-[2rem] sm:rounded-b-[4rem] shadow-premium mb-[-2rem] sm:mb-[-3rem] relative z-0">
                <div className="container mx-auto max-w-3xl">
                    <div className="flex items-center mb-4">
                        <Link href={menuHref} className="mr-4 sm:mr-6 bg-white/30 backdrop-blur-md p-2.5 sm:p-3 rounded-full hover:bg-white/50 transition-all border border-white/20">
                            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-900" />
                        </Link>
                        <h1 className="text-3xl sm:text-4xl font-sans font-black text-gray-900 tracking-tighter">Tu Pedido</h1>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 max-w-5xl relative z-10">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.95fr)] lg:items-start lg:gap-8">
                    <div className="bg-white rounded-[2.5rem] shadow-premium border border-gray-100 overflow-hidden">
                        {items.map((item, index) => (
                            <div key={item.id} className={`flex flex-col gap-4 p-4 sm:p-6 ${index !== items.length - 1 ? 'border-b border-gray-50' : ''} sm:flex-row sm:items-center sm:justify-between`}>
                                <div className="min-w-0 space-y-1">
                                    <h3 className="font-black text-lg sm:text-xl text-gray-900 leading-tight truncate">{item.name}</h3>
                                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400 font-bold uppercase tracking-widest">
                                        <span>{formatMoney(item.price)}</span>
                                        <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] tracking-[0.15em] text-gray-500">
                                            Menu
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-3 sm:gap-6 sm:shrink-0">
                                    <span className="font-mono font-bold text-blue-600 text-xl sm:text-2xl tracking-tighter">{formatMoney(item.price * item.quantity)}</span>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => decrementItem(item.id)}
                                            className="h-10 w-10 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                            aria-label={`Quitar una unidad de ${item.name}`}
                                        >
                                            <Minus className="h-5 w-5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeItem(item.id)}
                                            className="h-10 w-10 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            aria-label={`Eliminar ${item.name} del carrito`}
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-5 lg:sticky lg:top-24">
                        <div className="bg-white rounded-3xl shadow-premium border border-gray-100 p-6 sm:p-8 space-y-4">
                            <div className="flex items-center justify-between gap-3 text-sm text-gray-500 font-bold uppercase tracking-[0.15em]">
                                <span>Subtotal</span>
                                <span className="text-gray-900">{formatMoney(total)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-sm text-gray-500 font-bold uppercase tracking-[0.15em]">
                                <span>Envio</span>
                                <span className="text-gray-900">{shippingCost > 0 ? formatMoney(shippingCost) : 'Gratis'}</span>
                            </div>
                            {shippingPreview.hasFreeShippingThreshold && (
                                <p className="text-xs leading-relaxed text-gray-500">
                                    {shippingPreview.qualifiesForFreeShipping
                                        ? `Envio gratis aplicado por compras desde ${formatMoney(shippingPreview.freeShippingOverAmount || 0)}.`
                                        : `Te faltan ${formatMoney(shippingPreview.remainingForFreeShippingAmount)} para obtener envio gratis.`}
                                </p>
                            )}
                            <div className="h-px bg-gray-100" />
                            <div className="flex items-end justify-between gap-4">
                                <span className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">Total estimado</span>
                                <span className="text-3xl sm:text-4xl font-mono font-bold text-gray-900 tracking-tighter text-right">{formatMoney(finalTotal)}</span>
                            </div>
                        </div>

                        <Link href={checkoutHref} className={!slug ? 'pointer-events-none opacity-50' : ''}>
                            <Button
                                className="w-full bg-[#25D366] hover:bg-[#1fa34e] text-white h-14 sm:h-20 text-base sm:text-xl font-black rounded-[1.25rem] sm:rounded-[2rem] shadow-[0_20px_50px_rgba(37,211,102,0.2)] flex items-center justify-center gap-3 sm:gap-4 transition-all active:scale-[0.98] border-b-4 sm:border-b-8 border-[#1a9447]"
                                disabled={!slug}
                            >
                                <ArrowRight className="h-6 w-6 sm:h-8 sm:w-8" />
                                Continuar pedido
                            </Button>
                        </Link>

                        <p className="text-center text-gray-400 text-xs font-bold uppercase tracking-[0.1em] px-2 sm:px-4 leading-relaxed">
                            Completa tus datos para registrar el pedido y enviarlo por WhatsApp.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
