'use client';

import { LayoutDashboard, Settings, LogOut, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const sidebarItems = [
    { icon: LayoutDashboard, label: 'Resumen', href: '/dashboard' },
    { icon: Menu, label: 'Gestión del Menú', href: '/dashboard/menu' },
    { icon: Settings, label: 'Ajustes', href: '/dashboard/settings' },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-full md:w-64 md:h-screen border-b md:border-b-0 md:border-r bg-gray-900 text-white">
            <div className="flex h-14 sm:h-16 items-center border-b border-gray-800 px-4 sm:px-6">
                <span className="text-base sm:text-xl font-bold">Daltri Admin</span>
            </div>
            <nav className="px-2 sm:px-3 py-2 sm:py-4 overflow-x-auto md:overflow-visible">
                <div className="flex md:block gap-1 whitespace-nowrap">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'inline-flex md:flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
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
            <div className="border-t border-gray-800 p-2 sm:p-4">
                <Link
                    href="/login"
                    className="inline-flex md:flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white"
                    onClick={() => {
                        localStorage.removeItem('merchant_id');
                        localStorage.removeItem('merchant_slug');
                    }}
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Cerrar sesión
                </Link>
            </div>
        </div>
    );
}
