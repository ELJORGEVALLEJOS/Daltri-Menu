'use client';

import { LayoutDashboard, Store, Settings, LogOut, Package, CreditCard, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const sidebarItems = [
    { icon: LayoutDashboard, label: 'Resumen', href: '/dashboard' },
    { icon: Menu, label: 'Gestión del Menú', href: '/dashboard/menu' },
    { icon: Settings, label: 'Ajustes', href: '/dashboard/settings' },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-64 flex-col border-r bg-gray-900 text-white">
            <div className="flex h-16 items-center border-b border-gray-800 px-6">
                <span className="text-xl font-bold">Daltri Admin</span>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
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
            </nav>
            <div className="border-t border-gray-800 p-4">
                <Link
                    href="/login"
                    className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white"
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
