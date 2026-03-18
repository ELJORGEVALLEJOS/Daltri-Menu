'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { resetPassword } from '@/lib/admin-api';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token') || '';
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!token) {
            setStatus('error');
            setMessage('El enlace de recuperación no es válido.');
            return;
        }

        if (password.length < 6) {
            setStatus('error');
            setMessage('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            await resetPassword(token, password);
            setStatus('success');
            setMessage('Contraseña actualizada correctamente. Ya puedes iniciar sesión.');
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            const text =
                error instanceof Error && error.message.trim()
                    ? error.message
                    : 'No se pudo restablecer la contraseña.';
            setStatus('error');
            setMessage(text);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#FDFCFB] px-4 py-12">
            <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl shadow-gray-200/60">
                <h1 className="text-2xl font-bold text-gray-900">Nueva contraseña</h1>
                <p className="mt-3 text-sm text-gray-600">
                    Ingresa una nueva contraseña para tu cuenta.
                </p>

                {message && (
                    <div
                        className={`mt-4 rounded-2xl border p-4 text-sm font-medium ${
                            status === 'success'
                                ? 'border-green-100 bg-green-50 text-green-700'
                                : 'border-red-100 bg-red-50 text-red-600'
                        }`}
                    >
                        {message}
                    </div>
                )}

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-900">
                            Nueva contraseña
                        </label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            minLength={6}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-900">
                            Confirmar contraseña
                        </label>
                        <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            minLength={6}
                            required
                        />
                    </div>

                    <Button type="submit" className="h-11 w-full" disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
                    </Button>
                </form>

                <div className="mt-6">
                    <Link href="/login">
                        <Button variant="outline" className="h-11 w-full">
                            Volver al login
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

function ResetPasswordFallback() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#FDFCFB] px-4 py-12">
            <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-2xl shadow-gray-200/60">
                <h1 className="text-2xl font-bold text-gray-900">Nueva contraseña</h1>
                <p className="mt-4 text-sm text-gray-600">Cargando recuperación...</p>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<ResetPasswordFallback />}>
            <ResetPasswordContent />
        </Suspense>
    );
}
