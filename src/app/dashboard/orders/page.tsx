'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    AUTH_REQUIRED_ERROR,
    fetchOrderAnalytics,
    fetchOrders,
    type AdminOrder,
    type AdminOrderAnalytics,
    updateOrderStatus,
} from '@/lib/admin-api';
import { formatMoney } from '@/lib/format';

function formatMoneyFromCents(value: number) {
    return formatMoney((value || 0) / 100, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat('es-AR', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function getStatusLabel(status: string) {
    switch (status) {
        case 'completed':
            return 'Confirmado';
        case 'cancelled':
            return 'Cancelado';
        case 'sent_to_whatsapp':
            return 'Pendiente de confirmar';
        case 'created':
            return 'Creado';
        default:
            return status;
    }
}

function getStatusClasses(status: string) {
    switch (status) {
        case 'completed':
            return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        case 'cancelled':
            return 'bg-red-50 text-red-700 border-red-100';
        default:
            return 'bg-amber-50 text-amber-700 border-amber-100';
    }
}

export default function OrdersPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [analytics, setAnalytics] = useState<AdminOrderAnalytics | null>(null);
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

    const loadData = useCallback(
        async (showLoading = false) => {
            if (showLoading) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }
            setError('');

            try {
                const [ordersResponse, analyticsResponse] = await Promise.all([
                    fetchOrders(),
                    fetchOrderAnalytics(),
                ]);
                setOrders(ordersResponse);
                setAnalytics(analyticsResponse);
            } catch (loadError) {
                if (
                    loadError instanceof Error &&
                    loadError.message === AUTH_REQUIRED_ERROR
                ) {
                    router.replace('/login');
                    return;
                }
                const message =
                    loadError instanceof Error && loadError.message.trim()
                        ? loadError.message
                        : 'No se pudieron cargar los pedidos.';
                setError(message);
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [router],
    );

    useEffect(() => {
        void loadData(true);
    }, [loadData]);

    const pendingOrders = useMemo(
        () => orders.filter((order) => !['completed', 'cancelled'].includes(order.status)),
        [orders],
    );

    const handleOrderAction = async (
        orderId: string,
        status: 'COMPLETED' | 'CANCELLED',
    ) => {
        setUpdatingOrderId(orderId);
        setError('');

        try {
            await updateOrderStatus(orderId, status);
            await loadData();
        } catch (actionError) {
            if (
                actionError instanceof Error &&
                actionError.message === AUTH_REQUIRED_ERROR
            ) {
                router.replace('/login');
                return;
            }
            const message =
                actionError instanceof Error && actionError.message.trim()
                    ? actionError.message
                    : 'No se pudo actualizar el pedido.';
            setError(message);
        } finally {
            setUpdatingOrderId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#C5A059]" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-8 pb-16">
            <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-gray-900">
                        Pedidos y Analíticas
                    </h1>
                    <p className="text-sm font-medium text-gray-500">
                        Las métricas cuentan solo pedidos confirmados por el restaurante.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => void loadData()}
                    disabled={refreshing}
                    className="h-11 rounded-xl"
                >
                    {refreshing ? 'Actualizando...' : 'Actualizar'}
                </Button>
            </header>

            {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600">
                    {error}
                </div>
            )}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                        Pedidos confirmados
                    </p>
                    <p className="mt-3 text-3xl font-black text-gray-900">
                        {analytics?.totals.confirmed_orders || 0}
                    </p>
                </article>
                <article className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                        Facturación real
                    </p>
                    <p className="mt-3 text-3xl font-black text-gray-900">
                        {formatMoneyFromCents(analytics?.totals.revenue_cents || 0)}
                    </p>
                </article>
                <article className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                        Menús vendidos
                    </p>
                    <p className="mt-3 text-3xl font-black text-gray-900">
                        {analytics?.totals.items_sold || 0}
                    </p>
                </article>
                <article className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                        Ticket promedio
                    </p>
                    <p className="mt-3 text-3xl font-black text-gray-900">
                        {formatMoneyFromCents(analytics?.totals.average_ticket_cents || 0)}
                    </p>
                </article>
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.9fr)]">
                <section className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-serif font-bold text-gray-900">
                                Pedidos pendientes
                            </h2>
                            <p className="text-sm text-gray-500">
                                Confírmalos para que entren en las analíticas reales.
                            </p>
                        </div>
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-amber-700">
                            {pendingOrders.length} pendientes
                        </span>
                    </div>

                    <div className="space-y-4">
                        {pendingOrders.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-10 text-center text-sm font-medium text-gray-500">
                                No hay pedidos pendientes por confirmar.
                            </div>
                        ) : (
                            pendingOrders.map((order) => {
                                const totalItems = order.items.reduce(
                                    (acc, item) => acc + item.qty,
                                    0,
                                );

                                return (
                                    <article
                                        key={order.id}
                                        className="rounded-3xl border border-gray-100 bg-[#FDFCFB] p-5"
                                    >
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="space-y-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-lg font-bold text-gray-900">
                                                        {order.order_number}
                                                    </h3>
                                                    <span
                                                        className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] ${getStatusClasses(order.status)}`}
                                                    >
                                                        {getStatusLabel(order.status)}
                                                    </span>
                                                </div>
                                                <div className="space-y-1 text-sm text-gray-600">
                                                    <p>
                                                        <span className="font-semibold text-gray-900">
                                                            Cliente:
                                                        </span>{' '}
                                                        {order.customer_name}
                                                    </p>
                                                    <p>
                                                        <span className="font-semibold text-gray-900">
                                                            Fecha:
                                                        </span>{' '}
                                                        {formatDate(order.created_at)}
                                                    </p>
                                                    <p>
                                                        <span className="font-semibold text-gray-900">
                                                            Menús:
                                                        </span>{' '}
                                                        {totalItems}
                                                    </p>
                                                    <p>
                                                        <span className="font-semibold text-gray-900">
                                                            Total:
                                                        </span>{' '}
                                                        {formatMoneyFromCents(order.total_cents)}
                                                    </p>
                                                </div>
                                                <ul className="space-y-1 text-sm text-gray-500">
                                                    {order.items.map((item) => (
                                                        <li key={item.id}>
                                                            {item.qty}x {item.product_name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                                                <Button
                                                    type="button"
                                                    onClick={() =>
                                                        void handleOrderAction(
                                                            order.id,
                                                            'COMPLETED',
                                                        )
                                                    }
                                                    disabled={updatingOrderId === order.id}
                                                    className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                                                >
                                                    Confirmar pedido
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        void handleOrderAction(
                                                            order.id,
                                                            'CANCELLED',
                                                        )
                                                    }
                                                    disabled={updatingOrderId === order.id}
                                                    className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                >
                                                    Cancelar
                                                </Button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })
                        )}
                    </div>
                </section>

                <section className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5">
                        <h2 className="text-xl font-serif font-bold text-gray-900">
                            Productos más demandados
                        </h2>
                        <p className="text-sm text-gray-500">
                            Ranking calculado con pedidos confirmados.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {!analytics?.top_products.length ? (
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-10 text-center text-sm font-medium text-gray-500">
                                Aún no hay pedidos confirmados para mostrar analíticas.
                            </div>
                        ) : (
                            analytics.top_products.map((product, index) => (
                                <article
                                    key={product.product_id}
                                    className="rounded-2xl border border-gray-100 bg-[#FDFCFB] p-4"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C5A059]">
                                                Top {index + 1}
                                            </p>
                                            <h3 className="truncate text-base font-bold text-gray-900">
                                                {product.product_name}
                                            </h3>
                                        </div>
                                        <span className="text-right text-sm font-bold text-gray-900">
                                            {product.total_qty} vendidos
                                        </span>
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-gray-600">
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">
                                                Ingresos
                                            </p>
                                            <p className="mt-1 font-semibold text-gray-900">
                                                {formatMoneyFromCents(
                                                    product.total_revenue_cents,
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">
                                                Pedidos
                                            </p>
                                            <p className="mt-1 font-semibold text-gray-900">
                                                {product.confirmed_orders}
                                            </p>
                                        </div>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
