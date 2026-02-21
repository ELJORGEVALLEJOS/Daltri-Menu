'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchMenu, fetchOrders, type AdminOrder } from '@/lib/admin-api';

type DashboardStats = {
    totalProducts: number;
    activeCategories: number;
    todayOrders: number;
};

function buildTodayRangeIso() {
    const now = new Date();
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    const to = new Date(now);
    to.setHours(23, 59, 59, 999);
    return {
        from: from.toISOString(),
        to: to.toISOString(),
    };
}

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState<DashboardStats>({
        totalProducts: 0,
        activeCategories: 0,
        todayOrders: 0,
    });

    useEffect(() => {
        let active = true;

        async function loadDashboard() {
            setLoading(true);
            setError('');

            try {
                const { from, to } = buildTodayRangeIso();
                const [categories, orders] = await Promise.all([
                    fetchMenu(),
                    fetchOrders({ from, to }),
                ]);

                if (!active) return;

                const activeCategories = (categories || []).filter(
                    (category: any) => category?.isActive !== false && category?.active !== false,
                );
                const totalProducts = activeCategories.reduce(
                    (acc: number, category: any) =>
                        acc +
                        (category?.items || []).filter(
                            (item: any) => item?.isActive !== false && item?.active !== false,
                        ).length,
                    0,
                );

                setStats({
                    totalProducts,
                    activeCategories: activeCategories.length,
                    todayOrders: (orders as AdminOrder[]).length,
                });
            } catch (error) {
                if (!active) return;
                const message =
                    error instanceof Error && error.message.trim()
                        ? error.message
                        : 'No se pudo cargar el resumen.';
                setError(message);
            } finally {
                if (active) setLoading(false);
            }
        }

        void loadDashboard();
        return () => {
            active = false;
        };
    }, []);

    const cards = useMemo(
        () => [
            { label: 'Productos Totales', value: stats.totalProducts },
            { label: 'Categorías Activas', value: stats.activeCategories },
            { label: 'Pedidos de Hoy', value: stats.todayOrders },
        ],
        [stats],
    );

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Resumen del Panel</h1>
            <p className="mt-2 text-gray-600">Bienvenido al administrador de Daltri Menu.</p>

            {error && (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                {cards.map((card) => (
                    <div key={card.label} className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="text-gray-500 text-sm font-medium">{card.label}</h3>
                        <p className="text-2xl font-bold mt-2">
                            {loading ? '...' : card.value.toLocaleString('es-MX')}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
