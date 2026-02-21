'use client';

import { Sidebar } from "@/components/admin-sidebar";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const merchantId = localStorage.getItem('merchant_id');
        if (!merchantId) {
            router.push('/login');
        } else {
            setAuthorized(true);
        }
    }, [router]);

    if (!authorized) return null;

    return (
        <div className="flex min-h-screen flex-col md:flex-row bg-gray-100">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                {children}
            </main>
        </div>
    );
}
