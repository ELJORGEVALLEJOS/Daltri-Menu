'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { fetchMerchant, createOrder } from '@/lib/api';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage({ params }: { params: { slug: string } }) {
    const { items, total, clearCart } = useCart();
    const [name, setName] = useState('');
    const [note, setNote] = useState('');
    const [merchantPhone, setMerchantPhone] = useState<string | null>(null);
    const router = useRouter();
    const { slug } = params;

    useEffect(() => {
        fetchMerchant(slug).then((m) => {
            if (m) setMerchantPhone(m.whatsapp_phone);
        });
    }, [slug]);

    if (items.length === 0) {
        router.replace(`/m/${slug}`);
        return null;
    }
    const handleWhatsAppOrder = async () => {
        if (!merchantPhone) return;

        try {
            const orderData = {
                customer_name: name,
                customer_phone: "549" + merchantPhone, // Assuming format for now, or add phone input
                delivery: "pickup", // Hardcoded for MVP
                delivery_address: "",
                notes: note,
                items: items.map(item => ({
                    product_id: item.itemId,
                    qty: item.quantity,
                    notes: "" // Options could go here
                }))
            };

            const response = await createOrder(slug, orderData);

            // The backend returns the whatsapp_url
            if (response.whatsapp_url) {
                clearCart();
                window.location.href = response.whatsapp_url;
            } else {
                // Fallback if backend doesn't return URL
                let message = `*Nuevo Pedido de ${name}*\n\n`;
                items.forEach((item) => {
                    message += `${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}\n`;
                });
                if (note) message += `\n*Nota:* ${note}\n`;
                message += `\n*Total: $${total.toFixed(2)}*`;
                const encodedMessage = encodeURIComponent(message);
                const url = `https://wa.me/${merchantPhone}?text=${encodedMessage}`;
                clearCart();
                window.location.href = url;
            }
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Hubo un error al crear tu pedido. Por favor, inténtalo de nuevo.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-[#EEDC82] pt-6 pb-12 px-4 rounded-b-[2rem] shadow-sm mb-[-2rem] relative z-0">
                <div className="container mx-auto max-w-md">
                    <div className="flex items-center mb-2">
                        <Link href={`/m/${slug}/cart`} className="mr-4 bg-white/20 p-2 rounded-full hover:bg-white/40 transition">
                            <ArrowLeft className="h-6 w-6 text-gray-900" />
                        </Link>
                        <h1 className="text-2xl font-serif font-bold text-gray-900">Finalizar pedido</h1>
                    </div>
                </div>
            </div>

            <div className="container mx-auto p-4 max-w-md relative z-10">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                    <h2 className="font-semibold mb-3 text-gray-800 border-b pb-2">Resumen del pedido</h2>
                    <div className="space-y-2 mb-3">
                        {items.map(i => (
                            <div key={i.id} className="flex justify-between text-sm">
                                <span className="text-gray-600">{i.quantity}x {i.name}</span>
                                <span className="font-medium text-gray-900">${(i.price * i.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold text-lg text-gray-900">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Nombre</label>
                        <input
                            type="text"
                            className="w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Tu Nombre"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">Nota (Opcional)</label>
                        <textarea
                            className="w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 min-h-[80px]"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Alergias, instrucciones adicionales..."
                        />
                    </div>
                </div>

                <Button
                    className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white h-12 text-lg font-medium shadow-lg shadow-green-900/10 flex items-center justify-center gap-2"
                    onClick={handleWhatsAppOrder}
                    disabled={!name || !merchantPhone}
                >
                    <MessageCircle className="w-5 h-5" />
                    Pedir por WhatsApp
                </Button>
            </div>
        </div>
    );
}
