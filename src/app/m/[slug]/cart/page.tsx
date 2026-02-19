'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Trash2, ArrowLeft, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { fetchMerchant } from '@/lib/api';

export default function CartPage({ params }: { params: { slug: string } }) {
    const { items, removeItem, total, clearCart } = useCart();
    const [merchantPhone, setMerchantPhone] = useState<string | null>(null);
    const { slug } = params;

    useEffect(() => {
        fetchMerchant(slug).then((m) => {
            if (m) setMerchantPhone(m.whatsapp_phone);
        });
    }, [slug]);

    const handleWhatsAppOrder = () => {
        if (!merchantPhone) return;

        let message = `*Nuevo Pedido*\n\n`;
        items.forEach((item) => {
            message += `${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(0)}\n`;
        });
        message += `\n*Total: $${total.toFixed(0)}*`;

        const encodedMessage = encodeURIComponent(message);
        const url = `https://wa.me/${merchantPhone.replace(/\D/g, '')}?text=${encodedMessage}`;

        // Clear cart after redirecting? 
        // User might want to go back if they made a mistake, 
        // but usually, checkout clears it.
        // clearCart(); 
        window.location.href = url;
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-[2rem] shadow-premium text-center max-w-sm w-full border border-gray-100">
                    <h2 className="text-2xl font-sans font-black mb-2 text-gray-900">Tu carrito está vacío</h2>
                    <p className="text-gray-500 mb-8 font-medium">Parece que aún no has añadido nada delicioso.</p>
                    <Link href={`/m/${slug}`}>
                        <Button className="w-full h-14 bg-zinc-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl transition-all">
                            Volver al Menú
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32">
            {/* Header */}
            <div className="bg-[#EEDC83] pt-12 pb-20 px-6 rounded-b-[4rem] shadow-premium mb-[-3rem] relative z-0">
                <div className="container mx-auto max-w-md">
                    <div className="flex items-center mb-4">
                        <Link href={`/m/${slug}`} className="mr-6 bg-white/30 backdrop-blur-md p-3 rounded-full hover:bg-white/50 transition-all border border-white/20">
                            <ArrowLeft className="h-6 w-6 text-gray-900" />
                        </Link>
                        <h1 className="text-4xl font-sans font-black text-gray-900 tracking-tighter">Tu Pedido</h1>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 max-w-md relative z-10">
                <div className="bg-white rounded-[2.5rem] shadow-premium border border-gray-100 overflow-hidden mb-8">
                    {items.map((item, index) => (
                        <div key={item.id} className={`flex justify-between items-center p-6 ${index !== items.length - 1 ? 'border-b border-gray-50' : ''}`}>
                            <div className="space-y-1">
                                <h3 className="font-black text-xl text-gray-900 leading-tight">{item.name}</h3>
                                <div className="text-sm text-gray-400 font-bold uppercase tracking-widest">
                                    ${item.price.toFixed(0)} × {item.quantity}
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="font-mono font-bold text-blue-600 text-2xl tracking-tighter">${(item.price * item.quantity).toFixed(0)}</span>
                                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-10 w-10 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-3xl shadow-premium border border-gray-100 p-8 mb-10 flex justify-between items-center">
                    <span className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">Total estimado</span>
                    <span className="text-4xl font-mono font-bold text-gray-900 tracking-tighter">${total.toFixed(0)}</span>
                </div>

                <Button
                    className="w-full bg-[#25D366] hover:bg-[#1fa34e] text-white h-20 text-xl font-black rounded-[2rem] shadow-[0_20px_50px_rgba(37,211,102,0.2)] flex items-center justify-center gap-4 transition-all active:scale-[0.98] border-b-8 border-[#1a9447] disabled:opacity-50"
                    onClick={handleWhatsAppOrder}
                    disabled={!merchantPhone}
                >
                    <MessageCircle className="w-8 h-8 fill-white/20" />
                    Pedir por WhatsApp
                </Button>

                <p className="mt-8 text-center text-gray-400 text-xs font-bold uppercase tracking-[0.1em] px-8 leading-relaxed">
                    Al hacer clic, se abrirá WhatsApp con tu pedido listo para enviar.
                </p>
            </div>
        </div>
    );
}
