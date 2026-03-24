'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    AUTH_REQUIRED_ERROR,
    downloadOrderAnalyticsReport,
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

function formatDateOnly(value: string) {
    return new Intl.DateTimeFormat('es-AR', {
        dateStyle: 'medium',
    }).format(new Date(`${value}T00:00:00`));
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

type CustomRange = {
    from: string;
    to: string;
};

function toApiRange(range: CustomRange | null) {
    if (!range?.from || !range?.to) return undefined;
    return {
        from: `${range.from}T00:00:00.000Z`,
        to: `${range.to}T23:59:59.999Z`,
    };
}

export default function OrdersPage() {
    const router = useRouter();
    const hasLoadedInitially = useRef(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [analytics, setAnalytics] = useState<AdminOrderAnalytics | null>(null);
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
    const [downloadingReport, setDownloadingReport] = useState<'weekly' | 'monthly' | 'custom' | null>(null);
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [activeRange, setActiveRange] = useState<CustomRange | null>(null);

    const activeApiRange = useMemo(() => toApiRange(activeRange), [activeRange]);

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
                    fetchOrders(activeApiRange),
                    fetchOrderAnalytics(activeApiRange),
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
        [activeApiRange, router],
    );

    useEffect(() => {
        if (!hasLoadedInitially.current) {
            hasLoadedInitially.current = true;
            void loadData(true);
            return;
        }

        void loadData();
    }, [loadData]);

    const pendingOrders = useMemo(
        () => orders.filter((order) => !['completed', 'cancelled'].includes(order.status)),
        [orders],
    );

    const topProduct = analytics?.top_products?.[0] || null;
    const totalItemsSold = analytics?.totals.items_sold || 0;
    const soldProductsCount = analytics?.top_products.length || 0;

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

    const getValidatedCustomRange = () => {
        if (!customFrom || !customTo) {
            setError('Selecciona fecha inicial y fecha final para el rango personalizado.');
            return null;
        }

        if (customFrom > customTo) {
            setError('La fecha inicial no puede ser mayor que la fecha final.');
            return null;
        }

        return {
            from: customFrom,
            to: customTo,
        } satisfies CustomRange;
    };

    const handleApplyCustomRange = () => {
        setError('');
        const range = getValidatedCustomRange();
        if (!range) return;
        setActiveRange(range);
    };

    const handleClearCustomRange = () => {
        setError('');
        setCustomFrom('');
        setCustomTo('');
        setActiveRange(null);
    };

    const handleDownloadReport = async (period: 'weekly' | 'monthly' | 'custom') => {
        setDownloadingReport(period);
        setError('');

        try {
            const request =
                period === 'custom'
                    ? (() => {
                        const range = getValidatedCustomRange();
                        if (!range) return null;
                        return downloadOrderAnalyticsReport({
                            period: 'custom',
                            ...toApiRange(range),
                        });
                    })()
                    : downloadOrderAnalyticsReport({ period });

            if (!request) {
                setDownloadingReport(null);
                return;
            }

            const { blob, fileName } = await request;
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (downloadError) {
            if (
                downloadError instanceof Error &&
                downloadError.message === AUTH_REQUIRED_ERROR
            ) {
                router.replace('/login');
                return;
            }
            const message =
                downloadError instanceof Error && downloadError.message.trim()
                    ? downloadError.message
                    : 'No se pudo descargar el reporte.';
            setError(message);
        } finally {
            setDownloadingReport(null);
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
        <div className="mx-auto max-w-6xl space-y-6 pb-16 sm:space-y-8">
            <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-gray-900">
                        Pedidos y Analíticas
                    </h1>
                    <p className="text-sm font-medium text-gray-500">
                        Las métricas cuentan solo pedidos confirmados por el restaurante.
                    </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handleDownloadReport('weekly')}
                        disabled={downloadingReport !== null}
                        className="h-11 rounded-xl border-[#C5A059]/40 text-gray-900 hover:bg-[#F8F1E3]"
                    >
                        {downloadingReport === 'weekly'
                            ? 'Descargando semanal...'
                            : 'Reporte semanal'}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handleDownloadReport('monthly')}
                        disabled={downloadingReport !== null}
                        className="h-11 rounded-xl border-[#0F172A]/20 text-gray-900 hover:bg-gray-100"
                    >
                        {downloadingReport === 'monthly'
                            ? 'Descargando mensual...'
                            : 'Reporte mensual'}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => void loadData()}
                        disabled={refreshing}
                        className="h-11 rounded-xl"
                    >
                        {refreshing ? 'Actualizando...' : 'Actualizar'}
                    </Button>
                </div>
            </header>

            <section className="rounded-[2rem] border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <h2 className="text-xl font-serif font-bold text-gray-900">
                            Periodo personalizado
                        </h2>
                        <p className="text-sm text-gray-500">
                            Filtra el panel y descarga un Excel exacto para el rango que elijas.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(10rem,1fr)_minmax(10rem,1fr)_auto_auto_auto]">
                        <label className="space-y-2 text-sm font-medium text-gray-700">
                            <span>Desde</span>
                            <input
                                type="date"
                                value={customFrom}
                                onChange={(event) => setCustomFrom(event.target.value)}
                                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-gray-900 outline-none transition focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20"
                            />
                        </label>
                        <label className="space-y-2 text-sm font-medium text-gray-700">
                            <span>Hasta</span>
                            <input
                                type="date"
                                value={customTo}
                                onChange={(event) => setCustomTo(event.target.value)}
                                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-gray-900 outline-none transition focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20"
                            />
                        </label>
                        <Button
                            type="button"
                            onClick={handleApplyCustomRange}
                            disabled={refreshing}
                            className="h-11 rounded-xl bg-[#0F172A] text-white hover:bg-[#111f38]"
                        >
                            Aplicar rango
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClearCustomRange}
                            disabled={refreshing}
                            className="h-11 rounded-xl"
                        >
                            Limpiar
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => void handleDownloadReport('custom')}
                            disabled={downloadingReport !== null}
                            className="h-11 rounded-xl border-[#C5A059]/40 text-gray-900 hover:bg-[#F8F1E3]"
                        >
                            {downloadingReport === 'custom'
                                ? 'Descargando personalizado...'
                                : 'Reporte personalizado'}
                        </Button>
                    </div>
                </div>

                <p className="mt-4 text-sm font-medium text-gray-500">
                    {activeRange
                        ? `Periodo activo: ${formatDateOnly(activeRange.from)} al ${formatDateOnly(activeRange.to)}`
                        : 'Periodo activo: historico completo'}
                </p>
            </section>

            {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600">
                    {error}
                </div>
            )}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
                <article className="rounded-3xl border border-[#C5A059]/20 bg-[#FFF9F0] p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A67C2E]">
                        Producto más vendido
                    </p>
                    {topProduct ? (
                        <>
                            <p className="mt-3 truncate text-xl font-black text-gray-900">
                                {topProduct.product_name}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-gray-600">
                                {topProduct.total_qty} vendidos
                            </p>
                            <p className="mt-1 text-sm font-medium text-gray-500">
                                {formatMoneyFromCents(topProduct.total_revenue_cents)} en ventas
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="mt-3 text-xl font-black text-gray-900">
                                Sin datos
                            </p>
                            <p className="mt-2 text-sm font-medium text-gray-500">
                                Aún no hay pedidos confirmados.
                            </p>
                        </>
                    )}
                </article>
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.9fr)]">
                <section className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-xl font-serif font-bold text-gray-900">
                                Pedidos pendientes
                            </h2>
                            <p className="text-sm text-gray-500">
                                Confírmalos para que entren en las analíticas reales.
                            </p>
                        </div>
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-center text-xs font-bold uppercase tracking-[0.15em] text-amber-700">
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
                                                    {order.payment_method && (
                                                        <p>
                                                            <span className="font-semibold text-gray-900">
                                                                Pago:
                                                            </span>{' '}
                                                            {order.payment_method === 'transfer'
                                                                ? 'Transferencia'
                                                                : 'Efectivo'}
                                                        </p>
                                                    )}
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
                                                    className="w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
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
                                                    className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto"
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
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-xl font-serif font-bold text-gray-900">
                                Rendimiento por producto
                            </h2>
                            <p className="text-sm text-gray-500">
                                Cuántos menús vendió cada producto, cuántos pedidos lo incluyeron y cuánto facturó.
                            </p>
                        </div>
                        <span className="rounded-full bg-[#F8F1E3] px-3 py-1 text-center text-xs font-bold uppercase tracking-[0.15em] text-[#A67C2E]">
                            {soldProductsCount} con ventas
                        </span>
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
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C5A059]">
                                                Top {index + 1}
                                            </p>
                                            <h3 className="truncate text-base font-bold text-gray-900">
                                                {product.product_name}
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-500">
                                                Se vendieron {product.total_qty} menús de este producto.
                                            </p>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 sm:text-right">
                                            {product.total_qty} vendidos
                                        </span>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">
                                                Menús vendidos
                                            </p>
                                            <p className="mt-1 font-semibold text-gray-900">
                                                {product.total_qty}
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
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">
                                                Participación
                                            </p>
                                            <p className="mt-1 font-semibold text-gray-900">
                                                {totalItemsSold > 0
                                                    ? `${Math.round((product.total_qty / totalItemsSold) * 100)}%`
                                                    : '0%'}
                                            </p>
                                        </div>
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
