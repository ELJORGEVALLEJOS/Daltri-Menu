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
        <div className="min-h-screen bg-gray-100 md:grid md:grid-cols-[16rem_minmax(0,1fr)]">
            <Sidebar />
            <main className="min-w-0 p-4 sm:p-6 md:p-8">{children}</main>
        </div>
    );
}
