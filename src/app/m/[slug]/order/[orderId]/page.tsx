import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchPublicOrder } from '@/lib/api';

function formatMoney(cents: number, currency: string) {
    const amount = (Number(cents) || 0) / 100;
    const normalizedCurrency = currency?.trim().toUpperCase() || 'USD';

    try {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: normalizedCurrency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        return `${new Intl.NumberFormat('es-MX', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount)} ${normalizedCurrency}`;
    }
}

export default async function PublicOrderPage({
    params,
}: {
    params: Promise<{ slug: string; orderId: string }>;
}) {
    const { slug, orderId } = await params;
    const order = (await fetchPublicOrder(slug, orderId)) as
        | {
              order_number: string;
              status: string;
              created_at: string;
              subtotal_cents: number;
              shipping_cents: number;
              total_cents: number;
              restaurant?: { name?: string; menu_url?: string; currency?: string };
              items?: Array<{
                  id: string;
                  product_name: string;
                  qty: number;
                  line_total_cents: number;
                  notes?: string;
              }>;
          }
        | null;

    if (!order) {
        notFound();
    }

    const items = order.items || [];
    const currency = order.restaurant?.currency || 'USD';
    const menuHref = `/m/${slug}`;

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-8">
            <div className="mx-auto max-w-md space-y-6">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                    <h1 className="text-2xl font-black text-gray-900">Pedido {order.order_number}</h1>
                    <p className="text-sm text-gray-500 mt-1">{order.restaurant?.name || 'Restaurante'}</p>
                    <p className="text-xs uppercase tracking-wider text-gray-400 mt-3">Estado: {order.status}</p>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Productos</h2>
                    <div className="space-y-3">
                        {items.map((item) => (
                            <div key={item.id} className="flex justify-between gap-3 text-sm">
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 truncate">
                                        {item.qty}x {item.product_name}
                                    </p>
                                    {item.notes && (
                                        <p className="text-xs text-gray-500 truncate">{item.notes}</p>
                                    )}
                                </div>
                                <span className="font-bold text-gray-900">
                                    {formatMoney(item.line_total_cents, currency)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-5 border-t border-gray-100 pt-4 space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>{formatMoney(order.subtotal_cents, currency)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Envío</span>
                            <span>
                                {order.shipping_cents > 0
                                    ? formatMoney(order.shipping_cents, currency)
                                    : 'Gratis'}
                            </span>
                        </div>
                        <div className="flex justify-between text-base font-black text-gray-900 pt-1">
                            <span>Total</span>
                            <span>{formatMoney(order.total_cents, currency)}</span>
                        </div>
                    </div>
                </div>

                <Link
                    href={menuHref}
                    className="block text-center bg-zinc-900 hover:bg-black text-white py-3 rounded-2xl font-bold"
                >
                    Volver al menú
                </Link>
            </div>
        </div>
    );
}
