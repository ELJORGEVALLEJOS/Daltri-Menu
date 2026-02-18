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
    const [phone, setPhone] = useState('');
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

    // Mock shipping logic (since we can't fetch from backend yet)
    // In a real implementation with backend support, this would come from the merchant API
    const SHIPPING_COST = 5000; // $5000 fixed cost
    const FREE_SHIPPING_THRESHOLD = 50000; // Free shipping over $50000

    const shippingCost = total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const finalTotal = total + shippingCost;

    const handleWhatsAppOrder = async () => {
        if (!merchantPhone) return;

        try {
            const orderData = {
                customer_name: name,
                customer_phone: phone.replace(/\D/g, ''),
                delivery: "delivery", // Defaulting to delivery for now as requested
                delivery_address: "", // We might need to add this field if it's delivery
                notes: note,
                items: items.map(item => ({
                    product_id: item.itemId,
                    qty: item.quantity,
                    notes: ""
                }))
            };

            const response = await createOrder(slug, orderData);

            if (response.whatsapp_url) {
                clearCart();
                window.location.href = response.whatsapp_url;
            } else {
                let message = `*Nuevo Pedido de ${name}*\n\n`;
                items.forEach((item) => {
                    message += `${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}\n`;
                });

                message += `\nSubtotal: $${total.toFixed(2)}\n`;

                if (shippingCost === 0) {
                    message += `Envío: GRATIS\n`;
                } else {
                    message += `Envío: $${shippingCost.toFixed(2)}\n`;
                }

                if (note) message += `\n*Nota:* ${note}\n`;
                message += `\n*Total a Pagar: $${finalTotal.toFixed(2)}*`;

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
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                    <h2 className="text-lg font-bold mb-4 text-gray-800 border-b border-gray-50 pb-2">Resumen del pedido</h2>
                    <div className="space-y-3 mb-4">
                        {items.map(i => (
                            <div key={i.id} className="flex justify-between text-sm">
                                <span className="text-gray-600 font-medium">{i.quantity}x {i.name}</span>
                                <span className="font-bold text-gray-900">${(i.price * i.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-100 pt-3 space-y-2">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Envío</span>
                            {shippingCost === 0 ? (
                                <span className="text-green-600 font-bold">GRATIS</span>
                            ) : (
                                <span>${shippingCost.toFixed(2)}</span>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-xl text-gray-900 mt-2">
                        <span>Total</span>
                        <span className="text-gold-dark font-serif font-black">${finalTotal.toFixed(2)}</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 space-y-5">
                    <div>
                        <label className="block text-[10px] font-bold mb-2 text-gray-400 uppercase tracking-[0.2em]">Nombre completo</label>
                        <input
                            type="text"
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:bg-white transition-all text-gray-800 font-medium"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Juan Pérez"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold mb-2 text-gray-400 uppercase tracking-[0.2em]">WhatsApp / Teléfono</label>
                        <input
                            type="tel"
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:bg-white transition-all text-gray-800 font-medium"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Ej: 5491112345678"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold mb-2 text-gray-400 uppercase tracking-[0.2em]">Instrucciones o Notas</label>
                        <textarea
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:bg-white transition-all min-h-[100px] text-gray-800 font-medium"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Alergias, cambio de $1000, etc."
                        />
                    </div>
                </div>

                <Button
                    className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white h-16 text-lg font-bold rounded-2xl shadow-xl shadow-green-900/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale cursor-pointer"
                    onClick={handleWhatsAppOrder}
                    disabled={!name || !phone || !merchantPhone}
                >
                    <MessageCircle className="w-6 h-6" />
                    Enviar pedido por WhatsApp
                </Button>
            </div>
        </div>
    );
}
