'use client';

export default function DashboardPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Resumen del Panel</h1>
            <p className="mt-2 text-gray-600">Bienvenido al administrador de Daltri Menu.</p>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-gray-500 text-sm font-medium">Productos Totales</h3>
                    <p className="text-2xl font-bold mt-2">-</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-gray-500 text-sm font-medium">Categorías Activas</h3>
                    <p className="text-2xl font-bold mt-2">-</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-gray-500 text-sm font-medium">Pedidos de Hoy</h3>
                    <p className="text-2xl font-bold mt-2">-</p>
                </div>
            </div>
        </div>
    );
}
