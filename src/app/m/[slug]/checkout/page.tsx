'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { fetchMerchant, createOrder } from '@/lib/api';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { formatMoney } from '@/lib/format';

export default function CheckoutPage() {
    const { items, total, clearCart } = useCart();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [note, setNote] = useState('');
    const [merchantPhone, setMerchantPhone] = useState<string | null>(null);
    const [shippingCost, setShippingCost] = useState(0);
    const router = useRouter();
    const params = useParams<{ slug?: string | string[] }>();
    const pathname = usePathname();
    const slugValue = params?.slug;
    const slugFromParams = Array.isArray(slugValue) ? slugValue[0] : slugValue || '';
    const slugFromPath = pathname.match(/^\/m\/([^/]+)/)?.[1] || '';
    const slug = slugFromParams || slugFromPath;
    const cartHref = slug ? `/m/${slug}/cart` : '/';
    const restaurantLink = slug ? `https://menu.daltrishop.com/m/${slug}` : '';

    useEffect(() => {
        if (!slug) return;

        fetchMerchant(slug).then((m) => {
            if (!m) return;
            setMerchantPhone(m.whatsapp_phone);
            const costCents = m.shipping_type === 'paid' ? m.shipping_cost_cents || 0 : 0;
            setShippingCost(costCents / 100);
        });
    }, [slug]);

    useEffect(() => {
        if (items.length === 0 && slug) {
            router.replace(`/m/${slug}`);
        }
    }, [items.length, router, slug]);

    if (items.length === 0) return null;

    const finalTotal = total + shippingCost;
    const formatAmount = (value: number) =>
        formatMoney(value, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    const handleWhatsAppOrder = async () => {
        if (!merchantPhone || !slug) return;

        try {
            const orderData = {
                customer_name: name,
                customer_phone: phone.replace(/\D/g, ''),
                delivery: 'pickup' as const,
                notes: note,
                items: items.map((item) => ({
                    product_id: item.itemId,
                    qty: item.quantity,
                    notes: '',
                })),
            };

            const response = await createOrder(slug, orderData);

            if (response.whatsapp_url) {
                clearCart();
                window.location.href = response.whatsapp_url;
            } else {
                let message = `*Nuevo Pedido de ${name}*\n\n`;
                items.forEach((item) => {
                    message += `${item.quantity}x ${item.name} - ${formatAmount(item.price * item.quantity)}\n`;
                });

                message += `\nSubtotal: ${formatAmount(total)}\n`;
                message += shippingCost > 0 ? `Envio: ${formatAmount(shippingCost)}\n` : 'Envio: GRATIS\n';

                if (note) message += `\n*Nota:* ${note}\n`;
                message += `\n*Total a Pagar: ${formatAmount(finalTotal)}*`;
                if (restaurantLink) {
                    message += `\n\nMenu: ${restaurantLink}`;
                }

                const encodedMessage = encodeURIComponent(message);
                const url = `https://wa.me/${merchantPhone.replace(/\D/g, '')}?text=${encodedMessage}`;
                clearCart();
                window.location.href = url;
            }
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Hubo un error al crear tu pedido. Por favor, intenta de nuevo.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-[#EEDC82] pt-6 pb-12 px-4 rounded-b-[2rem] shadow-sm mb-[-2rem] relative z-0">
                <div className="container mx-auto max-w-md">
                    <div className="flex items-center mb-2">
                        <Link href={cartHref} className="mr-4 bg-white/20 p-2 rounded-full hover:bg-white/40 transition">
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
                        {items.map((i) => (
                            <div key={i.id} className="flex justify-between text-sm">
                                <span className="text-gray-600 font-medium">{i.quantity}x {i.name}</span>
                                <span className="font-bold text-gray-900">{formatAmount(i.price * i.quantity)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-100 pt-3 space-y-2">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>{formatAmount(total)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Envio</span>
                            {shippingCost === 0 ? (
                                <span className="text-green-600 font-bold">GRATIS</span>
                            ) : (
                                <span>{formatAmount(shippingCost)}</span>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-xl text-gray-900 mt-2">
                        <span>Total</span>
                        <span className="text-gold-dark font-serif font-black">{formatAmount(finalTotal)}</span>
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
                            placeholder="Ej: Juan Perez"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold mb-2 text-gray-400 uppercase tracking-[0.2em]">WhatsApp / Telefono</label>
                        <input
                            type="tel"
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:bg-white transition-all text-gray-800 font-medium"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Ej: 5491112345678"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold mb-2 text-gray-400 uppercase tracking-[0.2em]">Instrucciones o notas</label>
                        <textarea
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:bg-white transition-all min-h-[100px] text-gray-800 font-medium"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Alergias, cambio de dinero, etc."
                        />
                    </div>
                </div>

                <Button
                    className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white h-16 text-lg font-bold rounded-2xl shadow-xl shadow-green-900/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale cursor-pointer"
                    onClick={handleWhatsAppOrder}
                    disabled={!name || !phone || !merchantPhone || !slug}
                >
                    <MessageCircle className="w-6 h-6" />
                    Enviar pedido por WhatsApp
                </Button>
            </div>
        </div>
    );
}
