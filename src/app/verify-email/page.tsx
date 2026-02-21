'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { verifyEmailToken } from '@/lib/admin-api';
import { Button } from '@/components/ui/button';

type VerifyStatus = 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token') || '';
    const [status, setStatus] = useState<VerifyStatus>('loading');
    const [message, setMessage] = useState('Verificando tu correo...');

    useEffect(() => {
        let active = true;

        async function runVerification() {
            if (!token) {
                if (!active) return;
                setStatus('error');
                setMessage('Enlace invalido. Falta el token de verificacion.');
                return;
            }

            try {
                await verifyEmailToken(token);
                if (!active) return;
                setStatus('success');
                setMessage('Correo verificado correctamente. Ya puedes iniciar sesion.');
            } catch (error) {
                if (!active) return;
                const text =
                    error instanceof Error && error.message.trim()
                        ? error.message
                        : 'No se pudo verificar el correo.';
                setStatus('error');
                setMessage(text);
            }
        }

        void runVerification();
        return () => {
            active = false;
        };
    }, [token]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#FDFCFB] px-4 py-12">
            <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl shadow-gray-200/60">
                <h1 className="text-2xl font-bold text-gray-900">Verificacion de correo</h1>
                <p
                    className={`mt-4 text-sm ${status === 'success' ? 'text-green-700' : status === 'error' ? 'text-red-600' : 'text-gray-600'
                        }`}
                >
                    {message}
                </p>

                <div className="mt-6 flex flex-col gap-3">
                    <Link href="/login">
                        <Button className="h-11 w-full">Ir a iniciar sesion</Button>
                    </Link>
                    {status === 'error' && (
                        <p className="text-xs text-gray-500">
                            Si el enlace vencio, solicita uno nuevo desde la pantalla de login.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
