'use client';

import { Sidebar } from "@/components/admin-sidebar";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AUTH_REQUIRED_ERROR, fetchBillingOverview } from "@/lib/admin-api";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const validateAccess = async () => {
            const accessToken = localStorage.getItem('access_token');
            setAuthorized(false);
            if (!accessToken) {
                localStorage.removeItem('merchant_id');
                localStorage.removeItem('merchant_slug');
                router.replace('/login');
                return;
            }

            try {
                const billing = await fetchBillingOverview();
                if (cancelled) {
                    return;
                }

                const onBillingPage = pathname === '/dashboard/billing';
                if (billing.blocked && !onBillingPage) {
                    router.replace('/dashboard/billing');
                    return;
                }

                setAuthorized(true);
            } catch (error) {
                if (cancelled) {
                    return;
                }

                if (error instanceof Error && error.message === AUTH_REQUIRED_ERROR) {
                    localStorage.removeItem('merchant_slug');
                    router.replace('/login');
                    return;
                }

                setAuthorized(true);
            }
        };

        void validateAccess();

        return () => {
            cancelled = true;
        };
    }, [pathname, router]);

    if (!authorized) return null;

    return (
        <div className="min-h-screen bg-gray-100 md:grid md:grid-cols-[16rem_minmax(0,1fr)]">
            <Sidebar />
            <main className="min-w-0 p-3 sm:p-6 md:p-8">{children}</main>
        </div>
    );
}
