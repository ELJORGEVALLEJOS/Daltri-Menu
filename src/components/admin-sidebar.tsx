'use client';

import { Settings, LogOut, Menu, BarChart3, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/brand-mark';

const sidebarItems = [
    { icon: Menu, label: 'Catálogo', href: '/dashboard/menu' },
    { icon: BarChart3, label: 'Pedidos y Analíticas', href: '/dashboard/orders' },
    { icon: CreditCard, label: 'Facturación', href: '/dashboard/billing' },
    { icon: Settings, label: 'Configuración', href: '/dashboard/settings' },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sticky top-0 z-40 w-full border-b bg-gray-900 text-white md:fixed md:inset-y-0 md:left-0 md:h-screen md:w-64 md:border-b-0 md:border-r">
            <div className="flex h-full flex-col bg-gray-900">
                <div className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-800 px-4 sm:h-16 sm:px-6">
                    <BrandMark size={24} className="h-6 w-6" />
                    <span className="text-base font-bold sm:text-xl">Daltri Admin</span>
                </div>
                <nav className="flex-1 overflow-x-auto px-2 py-2 sm:px-3 sm:py-4 md:overflow-y-auto md:overflow-x-visible">
                    <div className="flex gap-1 whitespace-nowrap md:block">
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors md:flex',
                                    isActive
                                        ? 'bg-gray-800 text-white'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                )}
                            >
                                <item.icon className="mr-3 h-5 w-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                    </div>
                </nav>
                <div className="shrink-0 border-t border-gray-800 p-2 sm:p-4">
                    <Link
                        href="/login"
                        className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white md:flex"
                        onClick={() => {
                            localStorage.removeItem('access_token');
                            localStorage.removeItem('merchant_id');
                            localStorage.removeItem('merchant_slug');
                        }}
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Cerrar sesión
                    </Link>
                </div>
            </div>
        </aside>
    );
}
