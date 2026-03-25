'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { fetchMerchant, createOrder, type PublicMerchant } from '@/lib/api';
import { ArrowLeft, Check, Copy, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { formatMoney } from '@/lib/format';
import { getShippingPreview } from '@/lib/shipping';
import { getOpeningHoursStatus, normalizeOpeningHours } from '@/lib/opening-hours';

export default function CheckoutPage() {
    const { items, total, clearCart } = useCart();
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
    const [copiedField, setCopiedField] = useState<'alias' | 'cbu' | null>(null);
    const [merchant, setMerchant] = useState<PublicMerchant | null>(null);
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
            setMerchant(m);
        });
    }, [slug]);

    useEffect(() => {
        if (items.length === 0 && slug) {
            router.replace(`/m/${slug}`);
        }
    }, [items.length, router, slug]);

    if (items.length === 0) return null;

    const shippingPreview = getShippingPreview(total, merchant);
    const shippingCost = shippingPreview.shippingCost;
    const finalTotal = total + shippingCost;
    const transferAlias = merchant?.payment_methods?.transfer_alias?.trim() || '';
    const transferCbuCvu = merchant?.payment_methods?.transfer_cbu_cvu?.trim() || '';
    const transferEnabled = Boolean(
        merchant?.payment_methods?.transfer_enabled &&
        (transferAlias || transferCbuCvu),
    );
    const openingStatus = getOpeningHoursStatus(normalizeOpeningHours(merchant?.opening_hours));
    const canReceiveOrders = !openingStatus.hasAnyEnabledDay || openingStatus.isOpenNow;
    const formatAmount = (value: number) =>
        formatMoney(value, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    const handleCopyTransferValue = async (
        field: 'alias' | 'cbu',
        value: string,
    ) => {
        if (!value) return;

        try {
            await navigator.clipboard.writeText(value);
            setCopiedField(field);
            window.setTimeout(() => setCopiedField(null), 1800);
        } catch {
            alert('No se pudo copiar el dato de transferencia.');
        }
    };

    const handleWhatsAppOrder = async () => {
        if (!merchant?.whatsapp_phone || !slug) return;
        const trimmedAddress = address.trim();
        if (!canReceiveOrders) {
            alert('Este negocio está fuera de horario y no recibe pedidos en este momento.');
            return;
        }
        if (paymentMethod === 'transfer' && !transferEnabled) {
            alert('Este negocio no tiene datos de transferencia cargados.');
            return;
        }

        try {
            const orderData = {
                customer_name: name.trim(),
                delivery: 'delivery' as const,
                payment_method: paymentMethod,
                delivery_address: trimmedAddress,
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
                const orderLink = response?.order_id
                    ? `https://menu.daltrishop.com/m/${slug}/order/${response.order_id}`
                    : '';
                let message = `*Nuevo Pedido de ${name}*\n\nProductos solicitados:\n`;
                items.forEach((item) => {
                    message += `- ${item.quantity}x ${item.name} - ${formatAmount(item.price * item.quantity)}\n`;
                });

                message += `\nSubtotal: ${formatAmount(total)}\n`;
                message += shippingCost > 0 ? `Envio: ${formatAmount(shippingCost)}\n` : 'Envio: GRATIS\n';
                message += `Direccion: ${trimmedAddress}\n`;
                message += `Pago: ${paymentMethod === 'transfer' ? 'Transferencia' : 'Efectivo'}\n`;
                if (paymentMethod === 'transfer') {
                    if (transferAlias) {
                        message += `Alias: ${transferAlias}\n`;
                    }
                    if (transferCbuCvu) {
                        message += `CBU/CVU: ${transferCbuCvu}\n`;
                    }
                }
                message += `\n*Total a Pagar: ${formatAmount(finalTotal)}*`;
                if (orderLink) {
                    message += `\nPedido exacto: ${orderLink}`;
                }
                if (restaurantLink) {
                    message += `\n\nMenu: ${restaurantLink}`;
                }

                const encodedMessage = encodeURIComponent(message);
                const url = `https://wa.me/${merchant.whatsapp_phone.replace(/\D/g, '')}?text=${encodedMessage}`;
                clearCart();
                window.location.href = url;
            }
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Hubo un error al crear tu pedido. Por favor, intenta de nuevo.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-16 sm:pb-20">
            <div className="bg-[#EEDC82] pt-4 sm:pt-6 pb-8 sm:pb-12 px-4 rounded-b-[2rem] shadow-sm mb-[-2rem] relative z-0">
                <div className="container mx-auto max-w-4xl">
                    <div className="flex items-center mb-2">
                        <Link href={cartHref} className="mr-3 sm:mr-4 bg-white/20 p-2 rounded-full hover:bg-white/40 transition">
                            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-900" />
                        </Link>
                        <h1 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">Finalizar pedido</h1>
                    </div>
                </div>
            </div>

            <div className="container mx-auto p-4 max-w-5xl relative z-10">
                <div className="grid gap-5 lg:grid-cols-[minmax(18rem,0.82fr)_minmax(0,1.1fr)] lg:items-start lg:gap-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 lg:sticky lg:top-24">
                        <h2 className="text-lg font-bold mb-4 text-gray-800 border-b border-gray-50 pb-2">Resumen del pedido</h2>
                        <div className="space-y-3 mb-4">
                            {items.map((i) => (
                                <div key={i.id} className="flex items-start justify-between text-sm gap-3">
                                    <span className="text-gray-600 font-medium break-words">{i.quantity}x {i.name}</span>
                                    <span className="font-bold text-gray-900 shrink-0">{formatAmount(i.price * i.quantity)}</span>
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
                            {shippingPreview.hasFreeShippingThreshold && (
                                <p className="text-xs leading-relaxed text-gray-500">
                                    {shippingPreview.qualifiesForFreeShipping
                                        ? `Envio gratis aplicado por compras desde ${formatAmount(shippingPreview.freeShippingOverAmount || 0)}.`
                                        : `Te faltan ${formatAmount(shippingPreview.remainingForFreeShippingAmount)} para obtener envio gratis.`}
                                </p>
                            )}
                        </div>

                        <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-xl text-gray-900 mt-2 gap-4">
                            <span>Total</span>
                            <span className="text-gold-dark font-serif font-black text-2xl sm:text-3xl text-right">{formatAmount(finalTotal)}</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-5">
                            {!canReceiveOrders && (
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                                    Este negocio está fuera de horario. Los pedidos se habilitan solo dentro del horario configurado.
                                </div>
                            )}
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
                                <label className="block text-[10px] font-bold mb-2 text-gray-400 uppercase tracking-[0.2em]">Dirección de entrega</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:bg-white transition-all text-gray-800 font-medium"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Ej: Calle 123, depto 4, barrio..."
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                                    ¿Cómo vas a pagar?
                                </label>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('cash')}
                                        className={`rounded-xl border px-4 py-3 text-left transition ${
                                            paymentMethod === 'cash'
                                                ? 'border-[#E0B649] bg-[#FFF8E1] text-gray-900 shadow-sm'
                                                : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <span className="block text-sm font-bold">Efectivo</span>
                                        <span className="mt-1 block text-xs text-gray-500">
                                            Pagarás al recibir el pedido.
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => transferEnabled && setPaymentMethod('transfer')}
                                        disabled={!transferEnabled}
                                        className={`rounded-xl border px-4 py-3 text-left transition ${
                                            paymentMethod === 'transfer'
                                                ? 'border-[#E0B649] bg-[#FFF8E1] text-gray-900 shadow-sm'
                                                : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                                        } ${!transferEnabled ? 'cursor-not-allowed opacity-50' : ''}`}
                                    >
                                        <span className="block text-sm font-bold">Transferencia</span>
                                        <span className="mt-1 block text-xs text-gray-500">
                                            {transferEnabled
                                                ? 'Te mostraremos el alias y el CBU/CVU.'
                                                : 'No disponible en este negocio.'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {paymentMethod === 'transfer' && transferEnabled && (
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                                    <div>
                                        <p className="text-sm font-bold text-emerald-900">
                                            Datos para transferir
                                        </p>
                                        <p className="mt-1 text-xs text-emerald-800">
                                            Realiza la transferencia y envía el comprobante por WhatsApp.
                                        </p>
                                    </div>

                                    {transferAlias && (
                                        <div className="flex flex-col gap-2 rounded-xl bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500">
                                                    Alias
                                                </p>
                                                <p className="truncate text-sm font-semibold text-gray-900">
                                                    {transferAlias}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    void handleCopyTransferValue('alias', transferAlias)
                                                }
                                                className="shrink-0"
                                            >
                                                {copiedField === 'alias' ? (
                                                    <>
                                                        <Check className="mr-2 h-4 w-4" />
                                                        Copiado
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="mr-2 h-4 w-4" />
                                                        Copiar
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}

                                    {transferCbuCvu && (
                                        <div className="flex flex-col gap-2 rounded-xl bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500">
                                                    CBU / CVU
                                                </p>
                                                <p className="truncate text-sm font-semibold text-gray-900">
                                                    {transferCbuCvu}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    void handleCopyTransferValue('cbu', transferCbuCvu)
                                                }
                                                className="shrink-0"
                                            >
                                                {copiedField === 'cbu' ? (
                                                    <>
                                                        <Check className="mr-2 h-4 w-4" />
                                                        Copiado
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="mr-2 h-4 w-4" />
                                                        Copiar
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <Button
                            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white h-14 sm:h-16 text-base sm:text-lg font-bold rounded-2xl shadow-xl shadow-green-900/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale cursor-pointer"
                            onClick={handleWhatsAppOrder}
                            disabled={
                                !canReceiveOrders ||
                                !name.trim() ||
                                !address.trim() ||
                                !merchant?.whatsapp_phone ||
                                !slug ||
                                (paymentMethod === 'transfer' && !transferEnabled)
                            }
                        >
                            <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                            {canReceiveOrders ? 'Enviar pedido por WhatsApp' : 'Fuera de horario'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
